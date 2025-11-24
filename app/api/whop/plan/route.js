import { NextResponse } from 'next/server'

const ACTIVE_MEMBERSHIP_STATUSES = new Set(['active', 'trialing', 'past_due'])
const DEFAULT_PLAN_RESPONSE = {
  plan: 'free',
  planLabel: 'Free Plan',
  isPaid: false,
  membership: null
}

const slugify = (value) => {
  if (!value || typeof value !== 'string') {
    return ''
  }
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const resolvePlanFromMemberships = (memberships = []) => {
  if (!Array.isArray(memberships) || memberships.length === 0) {
    return DEFAULT_PLAN_RESPONSE
  }

  const activeMemberships = memberships.filter((membership) => {
    const status = membership?.status?.toLowerCase()
    return status && ACTIVE_MEMBERSHIP_STATUSES.has(status)
  })

  if (activeMemberships.length === 0) {
    return DEFAULT_PLAN_RESPONSE
  }

  activeMemberships.sort((a, b) => {
    const aDate = new Date(a.updated_at || a.created_at || 0).getTime()
    const bDate = new Date(b.updated_at || b.created_at || 0).getTime()
    return bDate - aDate
  })

  const membership = activeMemberships[0]
  const productName = membership?.product?.name || membership?.product?.handle || 'Paid Plan'
  const slugSource =
    membership?.product?.handle ||
    membership?.product?.name ||
    membership?.product?.product_id ||
    membership?.id ||
    'paid'

  return {
    plan: slugify(slugSource) || 'paid',
    planLabel: productName,
    isPaid: true,
    membership: {
      id: membership?.id ?? null,
      status: membership?.status ?? null,
      product: {
        id: membership?.product?.id ?? membership?.product_id ?? null,
        name: productName
      },
      renews_at: membership?.renews_at ?? null,
      expires_at: membership?.expires_at ?? null
    }
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const email = body?.email?.trim()?.toLowerCase()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required to look up Whop membership', ...DEFAULT_PLAN_RESPONSE },
        { status: 400 }
      )
    }

    if (!process.env.WHOP_API_KEY) {
      return NextResponse.json(
        { error: 'Missing WHOP_API_KEY environment variable', ...DEFAULT_PLAN_RESPONSE },
        { status: 500 }
      )
    }

    const baseUrl = process.env.WHOP_API_BASE_URL || 'https://api.whop.com/api/v2'
    const membershipUrl = new URL(`${baseUrl.replace(/\/$/, '')}/memberships`)
    membershipUrl.searchParams.set('email', email)

    const response = await fetch(membershipUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      cache: 'no-store'
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message = payload?.error || payload?.message || 'Unable to fetch Whop memberships'
      throw new Error(message)
    }

    const memberships = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
    const planResult = resolvePlanFromMemberships(memberships)

    return NextResponse.json(planResult)
  } catch (error) {
    console.error('Failed to resolve Whop plan:', error)
    return NextResponse.json(
      { error: error.message || 'Unknown error', ...DEFAULT_PLAN_RESPONSE },
      { status: 500 }
    )
  }
}

