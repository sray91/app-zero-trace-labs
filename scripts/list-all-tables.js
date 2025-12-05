// Script to list all available tables
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function listAllTables() {
  console.log('Attempting to list all tables...\n')

  const tablesToCheck = [
    'data_sources',
    'search_history',
    'removal_requests',
    'user_profiles',
    'customer_analytics',
    'profiles',
    'users'
  ]

  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)

    if (!error) {
      console.log(`✓ Table "${table}" exists`)
      if (data && data.length > 0) {
        console.log(`  Sample columns: ${Object.keys(data[0]).join(', ')}`)
      }
    } else if (error.code === 'PGRST204' || error.code === 'PGRST205') {
      console.log(`✗ Table "${table}" does not exist`)
    } else {
      console.log(`? Table "${table}" - ${error.message}`)
    }
  }
}

listAllTables()
