// Script to check current Supabase database schema
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkSchema() {
  console.log('Checking Supabase database schema...\n')

  // Query to get all tables in the public schema
  const { data, error } = await supabase.rpc('get_tables_info', {}, {
    method: 'POST',
    body: {
      query: `
        SELECT
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `
    }
  })

  if (error) {
    console.error('Error fetching schema:', error)
    // Try alternative approach - query each known table
    await checkKnownTables()
    return
  }

  console.log('Schema:', data)
}

async function checkKnownTables() {
  console.log('\nChecking known tables...\n')

  const tables = ['data_sources', 'search_history', 'removal_requests', 'user_profiles']

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ Table "${table}" - ${error.message}`)
    } else {
      console.log(`✓ Table "${table}" exists (${count || 0} rows)`)

      // Get first row to see structure
      const { data: sampleData } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (sampleData && sampleData.length > 0) {
        console.log(`  Columns: ${Object.keys(sampleData[0]).join(', ')}`)
      }
    }
  }
}

checkSchema()
