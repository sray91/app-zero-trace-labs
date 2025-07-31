import { NextResponse } from 'next/server'
import { ApifyClient } from 'apify-client'

export async function POST(request) {
  try {
    const requestBody = await request.json()
    console.log('🔍 APIFY Skip Trace API received request:', {
      hasBody: !!requestBody,
      keys: Object.keys(requestBody || {}),
      searchParams: requestBody?.searchParams || requestBody?.search_params
    })

    // Handle both parameter formats for backward compatibility
    const searchParams = requestBody.searchParams || requestBody.search_params

    // Validate required environment variable
    const apiToken = process.env.APIFY_API_TOKEN
    if (!apiToken) {
      console.error('❌ Missing APIFY_API_TOKEN environment variable')
      return NextResponse.json(
        { error: 'APIFY API token not configured' },
        { status: 500 }
      )
    }

    // Validate request parameters
    if (!searchParams) {
      console.error('❌ Missing search parameters in request')
      return NextResponse.json(
        { error: 'Missing required field: searchParams' },
        { status: 400 }
      )
    }

    const { fullName, phone, email, address } = searchParams

    if (!fullName || fullName.trim() === '') {
      console.error('❌ Missing or empty fullName in search parameters')
      return NextResponse.json(
        { error: 'Missing required field: fullName' },
        { status: 400 }
      )
    }

    console.log('🚀 Initiating APIFY Skip Trace search for:', {
      fullName: fullName ? '✅' : '❌',
      phone: phone ? '✅' : '❌',
      email: email ? '✅' : '❌',
      address: address ? '✅' : '❌'
    })

    // Initialize the ApifyClient
    const client = new ApifyClient({
      token: apiToken,
    })

    // Prepare Actor input - format according to APIFY Skip Trace API
    const input = {
      max_results: requestBody.maxResults || 5,
      name: [fullName],
      street_citystatezip: address ? [address] : [],
      phone_number: phone ? [phone] : [],
      email: email ? [email] : []
    }

    console.log('📡 Calling APIFY Skip Trace actor with input:', {
      inputKeys: Object.keys(input),
      maxResults: input.max_results,
      hasName: input.name.length > 0,
      hasAddress: input.street_citystatezip.length > 0,
      hasPhone: input.phone_number.length > 0,
      hasEmail: input.email.length > 0
    })

    // Run the Actor and wait for it to finish
    const run = await client.actor("vmf6h5lxPAkB1W2gT").call(input)

    console.log('📥 APIFY actor run completed:', {
      actorRunId: run.id,
      status: run.status,
      defaultDatasetId: run.defaultDatasetId
    })

    // Fetch results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    console.log('📊 APIFY results retrieved:', {
      itemCount: items.length,
      sampleItem: items[0] ? Object.keys(items[0]) : 'No items'
    })

    // Transform APIFY results to our standard format
    const transformedResults = transformApifyResults(items, fullName, run.id)

    console.log('✅ APIFY Skip Trace search completed:', {
      originalItemCount: items.length,
      transformedDataPoints: transformedResults.data_found.length,
      description: transformedResults.description
    })

    return NextResponse.json({
      success: true,
      source: 'APIFY Skip Trace',
      data_found: transformedResults.data_found,
      description: transformedResults.description,
      details: transformedResults.details,
      raw_results: items, // Include raw APIFY results for debugging
      searched_at: new Date().toISOString(),
      method: 'apify_api',
      confidence: transformedResults.confidence,
      actor_run_id: run.id
    })

  } catch (error) {
    console.error('❌ APIFY Skip Trace API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    return NextResponse.json(
      { 
        error: 'APIFY Skip Trace search failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to format address objects or strings
 */
function formatAddress(address) {
  if (!address) return ''
  
  // If it's already a string, return it
  if (typeof address === 'string') return address
  
  // If it's an object, format it as a readable address
  if (typeof address === 'object' && address !== null) {
    const parts = []
    
    if (address.streetAddress) parts.push(address.streetAddress)
    if (address.addressLocality) parts.push(address.addressLocality)
    if (address.addressRegion) parts.push(address.addressRegion)
    if (address.postalCode) parts.push(address.postalCode)
    
    return parts.join(', ')
  }
  
  return String(address)
}

/**
 * Transform APIFY Skip Trace results to our standard format
 * APIFY returns data with column names like 'First Name', 'Last Name', 'Age', etc.
 */
function transformApifyResults(items, searchedName, runId = null) {
  if (!items || items.length === 0) {
    return {
      data_found: [],
      description: `No records found for ${searchedName} via APIFY Skip Trace`,
      details: {},
      confidence: 'high'
    }
  }

  const dataFound = []
  const details = {
    total_records: items.length,
    records: []
  }

  // Helper function to check if a value exists and is not empty
  const hasValue = (value) => {
    return value !== null && value !== undefined && value !== '' && value !== 'Person Not Found'
  }

  // Process each APIFY result item
  items.forEach((item, index) => {
    const record = {
      record_id: index + 1,
      source: 'APIFY Skip Trace'
    }

    // Extract name information
    const firstName = item['First Name']
    const lastName = item['Last Name']
    if (hasValue(firstName) || hasValue(lastName)) {
      if (!dataFound.includes('Name')) dataFound.push('Name')
      record.first_name = firstName
      record.last_name = lastName
      record.full_name = [firstName, lastName].filter(Boolean).join(' ')
    }

    // Extract age/birth information
    if (hasValue(item['Age'])) {
      if (!dataFound.includes('Age')) dataFound.push('Age')
      record.age = item['Age']
    }

    if (hasValue(item['Born'])) {
      if (!dataFound.includes('Birth Date')) dataFound.push('Birth Date')
      record.birth_date = item['Born']
    }

    // Extract address information
    const streetAddress = item['Street Address']
    const addressLocality = item['Address Locality'] 
    const addressRegion = item['Address Region']
    const postalCode = item['Postal Code']
    const livesIn = item['Lives in']
    
    if (hasValue(streetAddress) || hasValue(addressLocality) || hasValue(livesIn)) {
      if (!dataFound.includes('Address')) dataFound.push('Address')
      record.street_address = streetAddress
      record.city = addressLocality
      record.state = addressRegion
      record.zip_code = postalCode
      record.lives_in = livesIn
      
      // Create formatted address
      const addressParts = [streetAddress, addressLocality, addressRegion, postalCode].filter(Boolean)
      if (addressParts.length > 0) {
        record.formatted_address = addressParts.join(', ')
      }
    }

    if (hasValue(item['County Name'])) {
      if (!dataFound.includes('County')) dataFound.push('County')
      record.county = item['County Name']
    }

    // Extract previous addresses
    if (hasValue(item['Previous Addresses'])) {
      if (!dataFound.includes('Address History')) dataFound.push('Address History')
      
      const prevAddresses = item['Previous Addresses']
      if (Array.isArray(prevAddresses)) {
        // If it's an array of addresses, format each one
        record.previous_addresses = prevAddresses.map(addr => formatAddress(addr))
      } else {
        // If it's a single address (string or object), format it
        record.previous_addresses = [formatAddress(prevAddresses)]
      }
    }

    // Extract email information
    const emails = []
    for (let i = 1; i <= 5; i++) {
      const email = item[`Email-${i}`]
      if (hasValue(email)) {
        emails.push(email)
      }
    }
    if (emails.length > 0) {
      if (!dataFound.includes('Email')) dataFound.push('Email')
      record.emails = emails
      record.primary_email = emails[0]
    }

    // Extract phone information
    const phones = []
    for (let i = 1; i <= 5; i++) {
      const phone = item[`Phone-${i}`]
      const phoneType = item[`Phone-${i} Type`]
      const lastReported = item[`Phone-${i} Last Reported`]
      const firstReported = item[`Phone-${i} First Reported`]
      const provider = item[`Phone-${i} Provider`]
      
      if (hasValue(phone)) {
        phones.push({
          number: phone,
          type: phoneType,
          last_reported: lastReported,
          first_reported: firstReported,
          provider: provider
        })
      }
    }
    if (phones.length > 0) {
      if (!dataFound.includes('Phone')) dataFound.push('Phone')
      record.phones = phones
      record.primary_phone = phones[0].number
    }

    // Extract relatives
    if (hasValue(item['Relatives'])) {
      if (!dataFound.includes('Relatives')) dataFound.push('Relatives')
      record.relatives = item['Relatives']
    }

    // Extract associates
    if (hasValue(item['Associates'])) {
      if (!dataFound.includes('Associates')) dataFound.push('Associates')
      record.associates = item['Associates']
    }

    // Extract person link (profile URL)
    if (hasValue(item['Person Link'])) {
      if (!dataFound.includes('Profile Link')) dataFound.push('Profile Link')
      record.person_link = item['Person Link']
    }

    // Add search metadata
    record.search_option = item['Search Option']
    record.input_given = item['Input Given']

    // Add all original APIFY fields for reference
    record.raw_apify_data = item

    details.records.push(record)
  })

  // Generate description
  const description = dataFound.length > 0 
    ? `APIFY Skip Trace found ${items.length} record(s) with ${dataFound.length} data categories: ${dataFound.join(', ')}`
    : `APIFY Skip Trace searched but found no matching records for ${searchedName}`

  // Flatten the data structure for UI compatibility
  // Take the first record and put its data at the top level for the UI to display
  const primaryRecord = details.records[0] || {}
  const flattenedDetails = {
    // Original structure for reference
    total_records: details.total_records,
    records: details.records,
    
    // Flattened structure for UI display (using first/best record)
    name: primaryRecord.full_name,
    first_name: primaryRecord.first_name,
    last_name: primaryRecord.last_name,
    age: primaryRecord.age,
    birth_date: primaryRecord.birth_date,
    current_address: primaryRecord.formatted_address || primaryRecord.lives_in,
    street_address: primaryRecord.street_address,
    city: primaryRecord.city,
    state: primaryRecord.state,
    zip_code: primaryRecord.zip_code,
    county: primaryRecord.county,
    phones: primaryRecord.phones || [],
    emails: primaryRecord.emails || [],
    relatives: primaryRecord.relatives,
    associates: primaryRecord.associates,
    previous_addresses: primaryRecord.previous_addresses,
    person_link: primaryRecord.person_link,
    
    // Add formatted phone and email for UI
    phone: primaryRecord.primary_phone,
    email: primaryRecord.primary_email,
    
    // Additional metadata
    search_metadata: {
      search_option: primaryRecord.search_option,
      input_given: primaryRecord.input_given,
      actor_run_id: runId
    }
  }

  return {
    data_found: dataFound,
    description,
    details: flattenedDetails,
    confidence: items.length > 0 ? 'high' : 'high' // APIFY is generally high confidence
  }
}