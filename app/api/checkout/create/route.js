import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key to bypass RLS for user validation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Whop checkout base URL
const WHOP_CHECKOUT_BASE_URL = 'https://whop.com/checkout'

export async function POST(request) {
  try {
    const body = await request.json()
    const { plan_id, user_id, email, full_name, source } = body

    // Validate required fields
    if (!plan_id) {
      return NextResponse.json(
        { error: 'Missing required field: plan_id' },
        { status: 400 }
      )
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Optional: Validate user exists in Supabase
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user_id)
    if (!authData?.user) {
      console.warn(`Checkout requested for non-existent user: ${user_id}`)
      // We still allow the checkout to proceed - user might be created after
    }

    // Generate a session ID for tracking
    const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Build the Whop checkout URL
    const checkoutUrl = new URL(`${WHOP_CHECKOUT_BASE_URL}/${plan_id}`)
    
    // Pre-fill user information
    checkoutUrl.searchParams.set('prefilled_email', email.toLowerCase())
    
    // Add metadata that Whop can pass back via webhook
    if (user_id) {
      checkoutUrl.searchParams.set('metadata[user_id]', user_id)
    }
    if (source) {
      checkoutUrl.searchParams.set('metadata[source]', source)
    }
    if (sessionId) {
      checkoutUrl.searchParams.set('metadata[session_id]', sessionId)
    }

    // Log the checkout creation for debugging
    console.log('Checkout session created:', {
      session_id: sessionId,
      plan_id,
      user_id,
      email: email.toLowerCase(),
      source: source || 'unknown',
      checkout_url: checkoutUrl.toString()
    })

    // Optionally store the checkout session in database for tracking
    try {
      await supabaseAdmin
        .from('checkout_sessions')
        .insert([{
          session_id: sessionId,
          plan_id,
          user_id,
          email: email.toLowerCase(),
          full_name: full_name || null,
          source: source || 'unknown',
          status: 'created',
          created_at: new Date().toISOString()
        }])
    } catch (dbError) {
      // Don't fail the request if logging fails - table might not exist
      console.warn('Could not log checkout session to database:', dbError.message)
    }

    return NextResponse.json({
      checkout_url: checkoutUrl.toString(),
      session_id: sessionId
    })

  } catch (error) {
    console.error('Checkout creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/checkout/create',
    method: 'POST',
    required_fields: ['plan_id', 'user_id', 'email'],
    optional_fields: ['full_name', 'source']
  })
}
