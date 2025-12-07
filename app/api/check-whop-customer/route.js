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

    // Check if user has Supabase auth account by listing users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    let hasAuthAccount = false
    if (!authError && authData?.users) {
      hasAuthAccount = authData.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
    }

    console.log('Check customer result:', {
      email: email.toLowerCase(),
      hasCustomer: true,
      hasActiveSubscription,
      hasAuthAccount,
      authError: authError?.message,
      totalAuthUsers: authData?.users?.length
    })

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
