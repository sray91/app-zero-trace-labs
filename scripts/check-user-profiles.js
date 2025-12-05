// Script to check user_profiles table structure
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkUserProfiles() {
  console.log('Checking user_profiles table structure...\n')

  // Try to get one row to see all columns
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Sample row found!')
    console.log('Columns:', Object.keys(data[0]).join(', '))
    console.log('\nFull structure:')
    console.log(JSON.stringify(data[0], null, 2))
  } else {
    console.log('No rows in user_profiles table yet.')
    console.log('\nTrying to see what columns are expected by inserting empty record...')

    // Try insert with minimal data to see error message
    const testUserId = '00000000-0000-0000-0000-000000000000'
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert([{ user_id: testUserId }])

    if (insertError) {
      console.log('\nInsert attempt shows:', insertError.message)
    }

    // Try selecting with * to force column list
    const { error: selectError } = await supabase
      .from('user_profiles')
      .select('*')

    console.log('\nTable exists but is empty. Assuming standard columns from schema.')
  }
}

checkUserProfiles()
