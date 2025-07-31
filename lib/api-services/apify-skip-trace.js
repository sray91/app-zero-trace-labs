/**
 * APIFY Skip Trace API Integration
 * Professional skip tracing and people search service
 * Documentation: https://console.apify.com/actors/vmf6h5lxPAkB1W2gT
 */

import { ApifyClient } from 'apify-client'

/**
 * Initialize APIFY client with API token
 */
function getApifyClient() {
  const apiToken = process.env.APIFY_API_TOKEN
  if (!apiToken) {
    throw new Error('APIFY_API_TOKEN environment variable is required')
  }

  return new ApifyClient({
    token: apiToken,
  })
}

/**
 * APIFY Skip Trace Search
 * Comprehensive people search with multiple data sources
 */
export async function apifySkipTrace(searchParams) {
  try {
    const client = getApifyClient()
    
    // Prepare input for APIFY Skip Trace actor
    const input = {
      max_results: searchParams.maxResults || 5,
      name: searchParams.fullName ? [searchParams.fullName] : [],
      street_citystatezip: searchParams.address ? [searchParams.address] : [],
      phone_number: searchParams.phone ? [searchParams.phone] : [],
      email: searchParams.email ? [searchParams.email] : []
    }

    console.log('🔍 APIFY Skip Trace search initiated:', {
      hasName: input.name.length > 0,
      hasAddress: input.street_citystatezip.length > 0,
      hasPhone: input.phone_number.length > 0,
      hasEmail: input.email.length > 0,
      maxResults: input.max_results
    })

    // Run the APIFY Skip Trace actor
    const run = await client.actor("vmf6h5lxPAkB1W2gT").call(input)

    // Fetch results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    console.log('📊 APIFY Skip Trace results:', {
      itemCount: items.length,
      runId: run.id,
      status: run.status
    })

    // Transform results to our standard format
    return transformApifyResults(items, searchParams.fullName, run.id)
    
  } catch (error) {
    console.error('❌ APIFY Skip Trace API error:', error)
    throw new Error(`APIFY Skip Trace failed: ${error.message}`)
  }
}

/**
 * Transform APIFY results to our application's standard format
 */
export function transformApifyResults(items, searchedName, runId = null) {
  if (!items || items.length === 0) {
    return {
      dataFound: [],
      description: `No records found for ${searchedName} via APIFY Skip Trace`,
      details: {
        total_records: 0,
        actor_run_id: runId,
        search_method: 'apify_skip_trace'
      },
      confidence: 'high',
      rawData: []
    }
  }

  const dataFound = []
  const details = {
    total_records: items.length,
    actor_run_id: runId,
    search_method: 'apify_skip_trace',
    records: []
  }

  // Analyze all items to determine what data types are available
  const dataTypes = new Set()
  
  items.forEach((item, index) => {
    const record = {
      record_id: index + 1,
      source: 'APIFY Skip Trace',
      confidence_score: item.confidence || 'unknown'
    }

    // Map APIFY fields to our standard format
    const fieldMappings = [
      { apifyField: ['name', 'full_name'], ourField: 'name', dataType: 'Name' },
      { apifyField: ['age'], ourField: 'age', dataType: 'Age' },
      { apifyField: ['address', 'current_address'], ourField: 'address', dataType: 'Address' },
      { apifyField: ['previous_addresses'], ourField: 'previous_addresses', dataType: 'Address History' },
      { apifyField: ['phone', 'phone_number'], ourField: 'phone', dataType: 'Phone' },
      { apifyField: ['phones', 'phone_numbers'], ourField: 'phones', dataType: 'Phone Numbers' },
      { apifyField: ['email', 'email_address'], ourField: 'email', dataType: 'Email' },
      { apifyField: ['emails', 'email_addresses'], ourField: 'emails', dataType: 'Email Addresses' },
      { apifyField: ['relatives'], ourField: 'relatives', dataType: 'Relatives' },
      { apifyField: ['associates'], ourField: 'associates', dataType: 'Associates' },
      { apifyField: ['social_media', 'social_profiles'], ourField: 'social_media', dataType: 'Social Media' },
      { apifyField: ['criminal_records'], ourField: 'criminal_records', dataType: 'Criminal Records' },
      { apifyField: ['court_records'], ourField: 'court_records', dataType: 'Court Records' },
      { apifyField: ['property_records'], ourField: 'property_records', dataType: 'Property Records' },
      { apifyField: ['bankruptcy_records'], ourField: 'bankruptcy_records', dataType: 'Bankruptcy Records' },
      { apifyField: ['education'], ourField: 'education', dataType: 'Education' },
      { apifyField: ['employment', 'work_history'], ourField: 'employment', dataType: 'Employment' },
      { apifyField: ['business_records'], ourField: 'business_records', dataType: 'Business Records' },
      { apifyField: ['professional_licenses'], ourField: 'professional_licenses', dataType: 'Professional Licenses' }
    ]

    fieldMappings.forEach(({ apifyField, ourField, dataType }) => {
      const value = apifyField.find(field => item[field] !== undefined && item[field] !== null && item[field] !== '')
      if (value !== undefined) {
        const fieldValue = item[value]
        if (Array.isArray(fieldValue) ? fieldValue.length > 0 : fieldValue) {
          record[ourField] = fieldValue
          dataTypes.add(dataType)
        }
      }
    })

    // Include any additional fields not mapped above
    Object.keys(item).forEach(key => {
      if (!record[key] && item[key] !== null && item[key] !== undefined && item[key] !== '') {
        record[`additional_${key}`] = item[key]
      }
    })

    details.records.push(record)
  })

  // Convert Set to Array for dataFound
  const dataFoundArray = Array.from(dataTypes)

  // Generate comprehensive description
  const description = dataFoundArray.length > 0 
    ? `APIFY Skip Trace found ${items.length} record(s) with ${dataFoundArray.length} data categories: ${dataFoundArray.join(', ')}`
    : `APIFY Skip Trace completed search but found no matching records for ${searchedName}`

  return {
    dataFound: dataFoundArray,
    description,
    details,
    confidence: 'high', // APIFY is generally high confidence
    rawData: items
  }
}

/**
 * Parse address into components for better search accuracy
 */
export function parseAddress(addressString) {
  if (!addressString) return {}
  
  // Basic address parsing - can be enhanced with a proper address parsing library
  const parts = addressString.split(',').map(part => part.trim())
  
  if (parts.length >= 3) {
    const [street, city, stateZip] = parts
    const stateZipMatch = stateZip.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/)
    
    if (stateZipMatch) {
      return {
        street,
        city,
        state: stateZipMatch[1],
        zip: stateZipMatch[2]
      }
    }
  }
  
  return { full_address: addressString }
}

/**
 * Validate search parameters for APIFY Skip Trace
 */
export function validateSearchParams(searchParams) {
  const errors = []
  
  if (!searchParams.fullName || searchParams.fullName.trim() === '') {
    errors.push('Full name is required for skip trace search')
  }
  
  if (!searchParams.phone && !searchParams.email && !searchParams.address) {
    errors.push('At least one additional search parameter (phone, email, or address) is recommended for better results')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format search parameters for optimal APIFY performance
 */
export function formatSearchParams(rawParams) {
  const formatted = {
    fullName: rawParams.fullName?.trim(),
    phone: formatPhoneNumber(rawParams.phone),
    email: rawParams.email?.toLowerCase().trim(),
    address: rawParams.address?.trim(),
    maxResults: rawParams.maxResults || 5
  }

  // Remove empty values
  Object.keys(formatted).forEach(key => {
    if (!formatted[key] || formatted[key] === '') {
      delete formatted[key]
    }
  })

  return formatted
}

/**
 * Format phone number for better search accuracy
 */
function formatPhoneNumber(phone) {
  if (!phone) return null
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Handle US phone numbers
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `(${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`
  }
  
  return phone // Return original if we can't format it
}

/**
 * Main APIFY Skip Trace integration function
 * This is the primary function called by the data broker hook
 */
export async function callApifySkipTrace(searchParams) {
  // Validate input
  const validation = validateSearchParams(searchParams)
  if (!validation.isValid) {
    throw new Error(`Invalid search parameters: ${validation.errors.join(', ')}`)
  }

  // Format parameters for optimal search
  const formattedParams = formatSearchParams(searchParams)
  
  console.log('🚀 Calling APIFY Skip Trace with formatted params:', {
    hasName: !!formattedParams.fullName,
    hasPhone: !!formattedParams.phone,
    hasEmail: !!formattedParams.email,
    hasAddress: !!formattedParams.address,
    maxResults: formattedParams.maxResults
  })

  // Perform the skip trace search
  return await apifySkipTrace(formattedParams)
}