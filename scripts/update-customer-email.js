// Script to update customer email in Supabase
// Run with: node scripts/update-customer-email.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateCustomerEmail() {
  const oldEmail = 'swanaganray@gmail.com'
  const newEmail = 'rayswanagan@gmail.com'

  console.log(`Updating customer email from ${oldEmail} to ${newEmail}...`)

  // Update the customer record
  const { data, error } = await supabaseAdmin
    .from('customers')
    .update({ email: newEmail })
    .eq('email', oldEmail)
    .select()

  if (error) {
    console.error('Error updating customer:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Successfully updated customer:', data[0])
  } else {
    console.log('No customer found with email:', oldEmail)
  }
}

updateCustomerEmail()
