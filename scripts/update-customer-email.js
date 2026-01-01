// Script to update user email in Supabase auth
// Run with: node scripts/update-customer-email.js
// Note: This updates the auth.users email, which is used by the subscriptions table

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateUserEmail() {
  const oldEmail = 'swanaganray@gmail.com'
  const newEmail = 'rayswanagan@gmail.com'

  console.log(`Updating user email from ${oldEmail} to ${newEmail}...`)

  // Find the user by old email
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const user = authUsers?.users?.find(u => u.email?.toLowerCase() === oldEmail.toLowerCase())

  if (!user) {
    console.log('No user found with email:', oldEmail)
    return
  }

  // Update the user's email
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { email: newEmail }
  )

  if (error) {
    console.error('Error updating user email:', error)
    return
  }

  console.log('Successfully updated user email:', data.user)

  // Check if user has a subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (subscription) {
    console.log('User has subscription:', subscription)
  } else {
    console.log('User has no subscription record')
  }
}

updateUserEmail()
