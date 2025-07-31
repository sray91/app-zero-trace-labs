#!/usr/bin/env node

/**
 * Script to seed data broker sources into Supabase
 * Run with: node scripts/seed-data-sources.js
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Data sources to seed
const dataSources = [
  {
    name: 'Spokeo',
    url: 'https://spokeo.com',
    api_endpoint: process.env.NEXT_PUBLIC_SPOKEO_API_ENDPOINT || 'https://api.spokeo.com/v1/search',
    risk_level: 'high',
    description: 'Comprehensive people search with detailed personal information',
    data_types: ['name', 'age', 'address', 'phone', 'email', 'relatives', 'social_media'],
    is_active: true
  },
  {
    name: 'WhitePages',
    url: 'https://whitepages.com',
    api_endpoint: process.env.NEXT_PUBLIC_WHITEPAGES_API_ENDPOINT || 'https://api.whitepages.com/v2/person',
    risk_level: 'medium',
    description: 'Contact information and address history lookup',
    data_types: ['name', 'phone', 'address', 'address_history'],
    is_active: true
  },
  {
    name: 'BeenVerified',
    url: 'https://beenverified.com',
    api_endpoint: process.env.NEXT_PUBLIC_BEENVERIFIED_API_ENDPOINT || 'https://api.beenverified.com/v1/people',
    risk_level: 'medium',
    description: 'Background checks and social media profiles',
    data_types: ['name', 'email', 'social_media', 'criminal_records', 'education'],
    is_active: true
  },
  {
    name: 'TruePeopleSearch',
    url: 'https://truepeoplesearch.com',
    api_endpoint: process.env.NEXT_PUBLIC_TRUEPEOPLESEARCH_API_ENDPOINT || 'https://api.truepeoplesearch.com/v1/search',
    risk_level: 'low',
    description: 'Basic public records and contact information',
    data_types: ['name', 'address', 'phone', 'relatives'],
    is_active: true
  },
  {
    name: 'Intelius',
    url: 'https://intelius.com',
    api_endpoint: process.env.NEXT_PUBLIC_INTELIUS_API_ENDPOINT || 'https://api.intelius.com/v1/person',
    risk_level: 'high',
    description: 'Deep background searches and public records',
    data_types: ['name', 'address', 'phone', 'criminal_records', 'court_records', 'property_records'],
    is_active: true
  },
  {
    name: 'MyLife',
    url: 'https://mylife.com',
    api_endpoint: null,
    risk_level: 'high',
    description: 'Detailed personal profiles with reputation scores',
    data_types: ['name', 'age', 'address', 'phone', 'email', 'reputation', 'background'],
    is_active: true
  },
  {
    name: 'PeopleFinders',
    url: 'https://peoplefinders.com',
    api_endpoint: null,
    risk_level: 'medium',
    description: 'Public records and contact information',
    data_types: ['name', 'address', 'phone', 'relatives', 'criminal_records'],
    is_active: true
  },
  {
    name: 'InstantCheckmate',
    url: 'https://instantcheckmate.com',
    api_endpoint: null,
    risk_level: 'high',
    description: 'Background check service with comprehensive reports',
    data_types: ['name', 'criminal_records', 'court_records', 'address_history', 'phone', 'email'],
    is_active: true
  },
  {
    name: 'Pipl',
    url: 'https://pipl.com',
    api_endpoint: null,
    risk_level: 'high',
    description: 'Professional people search engine',
    data_types: ['name', 'email', 'phone', 'social_media', 'professional_info'],
    is_active: true
  },
  {
    name: 'Radaris',
    url: 'https://radaris.com',
    api_endpoint: null,
    risk_level: 'medium',
    description: 'Public records aggregator',
    data_types: ['name', 'address', 'phone', 'age', 'relatives'],
    is_active: true
  }
]

async function seedDataSources() {
  console.log('🌱 Starting data source seeding...')
  
  try {
    // Check existing data sources
    console.log('📋 Checking existing data sources...')
    const { data: existingData, error: fetchError } = await supabase
      .from('data_sources')
      .select('name')
    
    if (fetchError) {
      console.error('❌ Error fetching existing data sources:', fetchError)
      throw fetchError
    }
    
    const existingNames = existingData?.map(ds => ds.name) || []
    console.log(`📊 Found ${existingNames.length} existing data sources:`, existingNames)
    
    // Filter out existing sources
    const newDataSources = dataSources.filter(ds => !existingNames.includes(ds.name))
    
    if (newDataSources.length === 0) {
      console.log('✅ All data sources already exist! No seeding needed.')
      console.log(`📈 Total data sources in database: ${existingNames.length}`)
      return
    }
    
    console.log(`🚀 Adding ${newDataSources.length} new data sources...`)
    newDataSources.forEach(ds => console.log(`  - ${ds.name} (${ds.risk_level} risk)`))
    
    // Insert new data sources
    const { data, error } = await supabase
      .from('data_sources')
      .insert(newDataSources)
      .select()
    
    if (error) {
      console.error('❌ Error inserting data sources:', error)
      throw error
    }
    
    console.log(`✅ Successfully added ${data.length} new data sources!`)
    console.log(`📈 Total data sources in database: ${existingNames.length + data.length}`)
    
    // Show summary
    const riskSummary = dataSources.reduce((acc, ds) => {
      acc[ds.risk_level] = (acc[ds.risk_level] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📊 Data Sources Summary:')
    console.log(`  High Risk: ${riskSummary.high || 0}`)
    console.log(`  Medium Risk: ${riskSummary.medium || 0}`)
    console.log(`  Low Risk: ${riskSummary.low || 0}`)
    console.log(`  Total: ${dataSources.length}`)
    
  } catch (error) {
    console.error('💥 Failed to seed data sources:', error.message)
    process.exit(1)
  }
}

// Run the seeding
seedDataSources()
  .then(() => {
    console.log('\n🎉 Data source seeding completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error)
    process.exit(1)
  })