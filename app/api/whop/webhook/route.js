import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function verifyWhopSignature(payload, signature, secret) {
  if (!secret) {
    console.warn('WHOP_WEBHOOK_SECRET not set - skipping signature verification')
    return true
  }

  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(JSON.stringify(payload)).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

async function syncWhopUserToDatabase(whopData) {
  try {
    const email = whopData.email?.toLowerCase()

    if (!email) {
      console.error('No email provided in Whop data')
      return { success: false, error: 'No email provided' }
    }

    // Look up user_id from auth.users by email
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email)

    if (!authUser) {
      console.log(`No auth user found for email: ${email} - subscription will be created when user signs up`)
      return { success: false, error: 'No auth user found for email' }
    }

    const subscriptionData = {
      user_id: authUser.id,
      status: whopData.status || 'active',
      plan_id: whopData.plan?.id || whopData.product?.id || null,
      plan_name: whopData.plan?.name || whopData.product?.name || null,
      provider: 'whop',
      provider_subscription_id: whopData.membership_id || null,
      provider_customer_id: whopData.id || whopData.user_id || null,
      has_app_access: whopData.has_app_access ?? (whopData.valid === true || whopData.status === 'active'),
      current_period_end: whopData.current_period_end || null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (error) throw error

    console.log(`Upserted subscription for user: ${email}`)
    return { success: true, action: 'upserted', data }
  } catch (error) {
    console.error('Error syncing Whop user:', error)
    return { success: false, error: error.message }
  }
}

export async function POST(request) {
  try {
    const signature = request.headers.get('x-whop-signature')
    const body = await request.json()

    if (process.env.WHOP_WEBHOOK_SECRET) {
      const isValid = verifyWhopSignature(body, signature, process.env.WHOP_WEBHOOK_SECRET)

      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const eventType = body.action || body.type || body.event

    console.log(`Received Whop webhook: ${eventType}`)

    switch (eventType) {
      case 'membership.went_valid':
      case 'membership.created':
      case 'payment.succeeded':
        await syncWhopUserToDatabase({
          id: body.data?.user_id || body.data?.user?.id,
          email: body.data?.user?.email || body.data?.email,
          membership_id: body.data?.id,
          status: 'active',
          valid: true,
          has_app_access: true,
          plan: body.data?.plan,
          product: body.data?.product,
          current_period_end: body.data?.renewal_period_end || body.data?.access_expires_at
        })
        break

      case 'membership.updated':
        await syncWhopUserToDatabase({
          id: body.data?.user_id || body.data?.user?.id,
          email: body.data?.user?.email || body.data?.email,
          membership_id: body.data?.id,
          status: body.data?.status || 'active',
          valid: body.data?.valid,
          has_app_access: body.data?.valid === true,
          plan: body.data?.plan,
          product: body.data?.product,
          current_period_end: body.data?.renewal_period_end || body.data?.access_expires_at
        })
        break

      case 'membership.cancelled':
        await syncWhopUserToDatabase({
          id: body.data?.user_id || body.data?.user?.id,
          email: body.data?.user?.email || body.data?.email,
          membership_id: body.data?.id,
          status: 'cancelled',
          valid: false,
          plan: body.data?.plan,
          product: body.data?.product,
          current_period_end: body.data?.renewal_period_end || body.data?.access_expires_at
        })
        break

      case 'membership.went_invalid':
      case 'membership.deleted':
      case 'membership.expired':
        await syncWhopUserToDatabase({
          id: body.data?.user_id || body.data?.user?.id,
          email: body.data?.user?.email || body.data?.email,
          membership_id: body.data?.id,
          status: 'expired',
          valid: false,
          has_app_access: false,
          plan: body.data?.plan,
          product: body.data?.product,
          current_period_end: body.data?.renewal_period_end || body.data?.access_expires_at
        })
        break

      case 'payment.failed':
        await syncWhopUserToDatabase({
          id: body.data?.user_id || body.data?.user?.id,
          email: body.data?.user?.email || body.data?.email,
          membership_id: body.data?.membership_id || body.data?.id,
          status: 'past_due',
          valid: true,
          plan: body.data?.plan,
          product: body.data?.product,
          current_period_end: body.data?.renewal_period_end || body.data?.access_expires_at
        })
        break

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
