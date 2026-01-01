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

    // Check if user has Supabase auth account by listing users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    let hasAuthAccount = false
    let authUser = null
    let authUserEmails = []

    if (!authError && authData?.users) {
      authUserEmails = authData.users.map(u => u.email?.toLowerCase() || '')
      authUser = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      hasAuthAccount = !!authUser
    }

    // Check if subscription exists for this user
    let subscription = null
    let hasSubscription = false

    if (authUser) {
      const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      if (!subscriptionError && subscriptionData) {
        subscription = subscriptionData
        hasSubscription = true
      }
    }

    // Check subscription status
    const hasActiveSubscription = subscription && (
      subscription.status === 'active' ||
      subscription.status === 'trialing' ||
      subscription.has_app_access === true
    )

    console.log('Check subscription result:', {
      email: email.toLowerCase(),
      hasSubscription,
      hasActiveSubscription,
      hasAuthAccount,
      authError: authError?.message,
      totalAuthUsers: authData?.users?.length,
      authUserEmails: authUserEmails
    })

    return NextResponse.json({
      hasSubscription,
      hasActiveSubscription,
      hasAuthAccount,
      subscription: subscription ? {
        id: subscription.id,
        user_id: subscription.user_id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        plan_name: subscription.plan_name,
        has_app_access: subscription.has_app_access,
        current_period_end: subscription.current_period_end
      } : null
    })
  } catch (error) {
    console.error('Error checking Whop subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
