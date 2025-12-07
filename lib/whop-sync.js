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

    const customerData = {
      email,
      whop_user_id: whopUserData.id || whopUserData.user_id,
      full_name: whopUserData.name || whopUserData.username || null,
      plan_name: whopUserData.plan?.name || whopUserData.product?.name || null,
      subscription_status: whopUserData.status || 'active',
      has_app_access: whopUserData.valid === true || whopUserData.status === 'active',
      updated_at: new Date().toISOString()
    }

    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', email)
      .single()

    let customerRecord

    if (existingCustomer) {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .update(customerData)
        .eq('id', existingCustomer.id)
        .select()
        .single()

      if (error) throw error
      customerRecord = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .insert([{ ...customerData, created_at: new Date().toISOString() }])
        .select()
        .single()

      if (error) throw error
      customerRecord = data
    }

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email)

    if (existingAuthUser && customerRecord) {
      await supabaseAdmin
        .from('customers')
        .update({ user_id: existingAuthUser.id })
        .eq('id', customerRecord.id)

      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', existingAuthUser.id)
        .single()

      if (!profile) {
        await supabaseAdmin
          .from('user_profiles')
          .insert([{
            user_id: existingAuthUser.id,
            customer_id: customerRecord.id
          }])
      } else if (!profile.customer_id) {
        await supabaseAdmin
          .from('user_profiles')
          .update({ customer_id: customerRecord.id })
          .eq('user_id', existingAuthUser.id)
      }
    }

    return {
      success: true,
      customer: customerRecord,
      hasAuthAccount: !!existingAuthUser
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

export async function linkWhopCustomerToAuthUser(customerEmail, authUserId) {
  try {
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', customerEmail.toLowerCase())
      .single()

    if (customerError) throw customerError

    await supabaseAdmin
      .from('customers')
      .update({ user_id: authUserId })
      .eq('id', customer.id)

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', authUserId)
      .single()

    if (!profile) {
      await supabaseAdmin
        .from('user_profiles')
        .insert([{
          user_id: authUserId,
          customer_id: customer.id
        }])
    } else {
      await supabaseAdmin
        .from('user_profiles')
        .update({ customer_id: customer.id })
        .eq('user_id', authUserId)
    }

    return {
      success: true,
      customer,
      linked: true
    }
  } catch (error) {
    console.error('Error linking customer to auth user:', error)
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
