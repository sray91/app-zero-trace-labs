import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function syncWhopUserToSupabase(whopUserData) {
  try {
    const email = whopUserData.email?.toLowerCase()

    if (!email) {
      throw new Error('Email is required for syncing')
    }

    // Look up user_id from auth.users by email
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email)

    if (!authUser) {
      console.log(`No auth user found for email: ${email} - subscription will be created when user signs up`)
      return {
        success: false,
        error: 'No auth user found for email'
      }
    }

    const subscriptionData = {
      user_id: authUser.id,
      status: whopUserData.status || 'active',
      plan_id: whopUserData.plan?.id || whopUserData.product?.id || null,
      plan_name: whopUserData.plan?.name || whopUserData.product?.name || null,
      provider: 'whop',
      provider_subscription_id: whopUserData.membership_id || null,
      provider_customer_id: whopUserData.id || whopUserData.user_id || null,
      has_app_access: whopUserData.has_app_access ?? (whopUserData.valid === true || whopUserData.status === 'active'),
      current_period_end: whopUserData.current_period_end || null,
      updated_at: new Date().toISOString()
    }

    const { data: subscriptionRecord, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      subscription: subscriptionRecord,
      hasAuthAccount: true
    }
  } catch (error) {
    console.error('Error syncing Whop user to Supabase:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function createSupabaseAuthAccountForWhopUser(email, temporaryPassword = null) {
  try {
    const password = temporaryPassword || generateTemporaryPassword()

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      return {
        success: true,
        user: existingUser,
        alreadyExists: true
      }
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true
    })

    if (error) throw error

    return {
      success: true,
      user: data.user,
      temporaryPassword: password,
      alreadyExists: false
    }
  } catch (error) {
    console.error('Error creating Supabase auth account:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function linkWhopSubscriptionToAuthUser(email, authUserId) {
  try {
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', authUserId)
      .single()

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      throw subscriptionError
    }

    // If subscription exists, it's already linked by user_id
    if (subscription) {
      return {
        success: true,
        subscription,
        linked: true,
        alreadyLinked: true
      }
    }

    // Subscription should be created by webhook or sync function
    console.log(`No subscription found for user ${authUserId}, it will be created when webhook fires`)

    return {
      success: true,
      linked: false,
      message: 'Subscription will be created by webhook'
    }
  } catch (error) {
    console.error('Error linking subscription to auth user:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getWhopMembershipStatus(email) {
  try {
    if (!process.env.WHOP_API_KEY) {
      throw new Error('WHOP_API_KEY not configured')
    }

    const baseUrl = process.env.WHOP_API_BASE_URL || 'https://api.whop.com/api/v2'
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/memberships`)
    url.searchParams.set('email', email.toLowerCase())

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Whop API error: ${response.status}`)
    }

    const payload = await response.json()
    const memberships = Array.isArray(payload?.data) ? payload.data : []

    const activeMemberships = memberships.filter(m =>
      ['active', 'trialing', 'past_due'].includes(m.status?.toLowerCase())
    )

    return {
      success: true,
      hasActiveMembership: activeMemberships.length > 0,
      memberships: activeMemberships,
      totalMemberships: memberships.length
    }
  } catch (error) {
    console.error('Error fetching Whop membership status:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

function generateTemporaryPassword() {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}
