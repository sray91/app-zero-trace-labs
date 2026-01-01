import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fetchAllWhopMemberships() {
  if (!process.env.WHOP_API_KEY) {
    throw new Error('WHOP_API_KEY environment variable is required')
  }

  const baseUrl = process.env.WHOP_API_BASE_URL || 'https://api.whop.com/api/v2'
  const memberships = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/memberships`)
    url.searchParams.set('page', page)
    url.searchParams.set('per', '100')

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
      throw new Error(`Whop API error: ${response.status} ${response.statusText}`)
    }

    const payload = await response.json()
    const data = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []

    memberships.push(...data)

    hasMore = data.length === 100 && payload?.pagination?.has_more !== false
    page++
  }

  return memberships
}

async function syncMembershipToDatabase(membership) {
  try {
    const email = membership.user?.email?.toLowerCase() || membership.email?.toLowerCase()

    if (!email) {
      return { success: false, error: 'No email found', membership }
    }

    console.log('Processing membership:', { email, status: membership.status, product: membership.product?.name })

    // Look up user_id from auth.users by email
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email)

    if (!authUser) {
      console.log(`No auth user found for email: ${email} - skipping`)
      return { success: false, error: 'No auth user found', email }
    }

    const rawStatus = membership.status?.toLowerCase() || 'active'
    // Map Whop statuses to database-allowed values
    const statusMap = {
      'canceled': 'cancelled',
      'cancelled': 'cancelled',
      'active': 'active',
      'trialing': 'trialing',
      'past_due': 'past_due'
    }
    const status = statusMap[rawStatus] || 'cancelled'

    const isActive = ['active', 'trialing', 'past_due'].includes(status)

    const subscriptionData = {
      user_id: authUser.id,
      status,
      plan_id: membership.plan_id || membership.product?.id || null,
      plan_name: membership.product?.name || membership.plan?.name || null,
      provider: 'whop',
      provider_subscription_id: membership.id || null,
      provider_customer_id: membership.user?.id || membership.user_id || null,
      has_app_access: isActive,
      current_period_end: membership.renewal_period_end || membership.access_expires_at || null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (error) throw error

    return { success: true, action: 'upserted', email }
  } catch (error) {
    return { success: false, error: error.message, email: membership.user?.email || membership.email }
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedAuth = process.env.SYNC_API_SECRET || 'change-me-in-production'

    if (authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting Whop user sync...')

    const memberships = await fetchAllWhopMemberships()
    console.log(`Found ${memberships.length} memberships to sync`)

    // Group memberships by email and keep only the most relevant one per user
    const membershipsByEmail = new Map()
    for (const membership of memberships) {
      const email = membership.user?.email?.toLowerCase() || membership.email?.toLowerCase()
      if (!email) continue

      const existing = membershipsByEmail.get(email)
      if (!existing) {
        membershipsByEmail.set(email, membership)
        continue
      }

      // Prefer active memberships over cancelled ones
      const currentStatus = membership.status?.toLowerCase()
      const existingStatus = existing.status?.toLowerCase()
      const activeStatuses = ['active', 'trialing', 'past_due']

      if (activeStatuses.includes(currentStatus) && !activeStatuses.includes(existingStatus)) {
        membershipsByEmail.set(email, membership)
      }
    }

    const uniqueMemberships = Array.from(membershipsByEmail.values())
    console.log(`Reduced ${memberships.length} memberships to ${uniqueMemberships.length} unique users`)

    const results = await Promise.all(
      uniqueMemberships.map(membership => syncMembershipToDatabase(membership))
    )

    const upserted = results.filter(r => r.success && r.action === 'upserted').length
    const failed = results.filter(r => !r.success)

    console.log(`Sync complete: ${upserted} upserted, ${failed.length} failed`)

    return NextResponse.json({
      success: true,
      total: memberships.length,
      upserted,
      failed: failed.length,
      errors: failed.length > 0 ? failed : undefined
    })
  } catch (error) {
    console.error('Sync failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedAuth = process.env.SYNC_API_SECRET || 'change-me-in-production'

    if (authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: subscriptions.length,
      subscriptions
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
