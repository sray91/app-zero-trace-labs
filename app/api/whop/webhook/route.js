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

    const customerData = {
      email,
      whop_user_id: whopData.id || whopData.user_id,
      full_name: whopData.name || whopData.username || null,
      plan_name: whopData.plan?.name || whopData.product?.name || null,
      subscription_status: whopData.status || 'active',
      has_app_access: whopData.valid === true || whopData.status === 'active',
      updated_at: new Date().toISOString()
    }

    const { data: existingCustomer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', email)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existingCustomer) {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .update(customerData)
        .eq('id', existingCustomer.id)
        .select()

      if (error) throw error

      console.log(`Updated customer: ${email}`)
      return { success: true, action: 'updated', data }
    } else {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .insert([{ ...customerData, created_at: new Date().toISOString() }])
        .select()

      if (error) throw error

      console.log(`Created customer: ${email}`)
      return { success: true, action: 'created', data }
    }
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
          name: body.data?.user?.name || body.data?.user?.username,
          status: 'active',
          valid: true,
          plan: body.data?.plan,
          product: body.data?.product
        })
        break

      case 'membership.went_invalid':
      case 'membership.deleted':
      case 'payment.failed':
        await syncWhopUserToDatabase({
          id: body.data?.user_id || body.data?.user?.id,
          email: body.data?.user?.email || body.data?.email,
          name: body.data?.user?.name || body.data?.user?.username,
          status: 'cancelled',
          valid: false,
          plan: body.data?.plan,
          product: body.data?.product
        })
        break

      case 'membership.updated':
        await syncWhopUserToDatabase({
          id: body.data?.user_id || body.data?.user?.id,
          email: body.data?.user?.email || body.data?.email,
          name: body.data?.user?.name || body.data?.user?.username,
          status: body.data?.status,
          valid: body.data?.valid,
          plan: body.data?.plan,
          product: body.data?.product
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
