import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if customer exists with active subscription
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (customerError) {
      // No customer found
      return NextResponse.json({
        hasCustomer: false,
        hasActiveSubscription: false,
        customer: null
      })
    }

    // Check subscription status
    const hasActiveSubscription =
      customer.subscription_status === 'active' ||
      customer.subscription_status === 'trialing' ||
      customer.has_app_access === true

    // Check if user has Supabase auth account
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    let hasAuthAccount = false
    if (!authError && authUsers?.users) {
      hasAuthAccount = authUsers.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
    }

    return NextResponse.json({
      hasCustomer: true,
      hasActiveSubscription,
      hasAuthAccount,
      customer: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        plan_name: customer.plan_name,
        subscription_status: customer.subscription_status,
        has_app_access: customer.has_app_access
      }
    })
  } catch (error) {
    console.error('Error checking Whop customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
