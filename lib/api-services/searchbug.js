/**
 * Searchbug API Integration
 * Real data broker API service for people search, background checks, etc.
 * Documentation: https://searchbug.com/api/
 */

// Searchbug API endpoints
const SEARCHBUG_ENDPOINTS = {
  PEOPLE_SEARCH: 'https://searchbug.com/api/ppl.aspx',
  BACKGROUND_CHECK: 'https://searchbug.com/api/bkg.aspx',
  CRIMINAL_RECORDS: 'https://searchbug.com/api/crim.aspx',
  PROPERTY_RECORDS: 'https://searchbug.com/api/prop.aspx',
  PHONE_VALIDATION: 'https://searchbug.com/api/phone.aspx'
}

/**
 * Searchbug People Search API
 * Cost: $0.30 - $0.77 per hit (volume dependent)
 */
export async function searchbugPeopleSearch(searchParams) {
  const apiKey = process.env.SEARCHBUG_API_KEY
  if (!apiKey) {
    throw new Error('SEARCHBUG_API_KEY environment variable is required')
  }

  const params = new URLSearchParams({
    key: apiKey,
    first: searchParams.firstName || '',
    last: searchParams.lastName || '',
    address: searchParams.address || '',
    city: searchParams.city || '',
    state: searchParams.state || '',
    zip: searchParams.zip || '',
    phone: searchParams.phone || '',
    email: searchParams.email || '',
    format: 'json'
  })

  try {
    const response = await fetch(`${SEARCHBUG_ENDPOINTS.PEOPLE_SEARCH}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ZeroTraceLabs/1.0',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Searchbug API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return transformSearchbugPeopleResponse(data)
  } catch (error) {
    console.error('Searchbug People Search API error:', error)
    throw error
  }
}

/**
 * Searchbug Background Check API
 * Comprehensive background check including criminal records
 */
export async function searchbugBackgroundCheck(searchParams) {
  const apiKey = process.env.SEARCHBUG_API_KEY
  if (!apiKey) {
    throw new Error('SEARCHBUG_API_KEY environment variable is required')
  }

  const params = new URLSearchParams({
    key: apiKey,
    first: searchParams.firstName || '',
    last: searchParams.lastName || '',
    address: searchParams.address || '',
    city: searchParams.city || '',
    state: searchParams.state || '',
    phone: searchParams.phone || '',
    format: 'json'
  })

  try {
    const response = await fetch(`${SEARCHBUG_ENDPOINTS.BACKGROUND_CHECK}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ZeroTraceLabs/1.0',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Searchbug Background API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return transformSearchbugBackgroundResponse(data)
  } catch (error) {
    console.error('Searchbug Background Check API error:', error)
    throw error
  }
}

/**
 * Searchbug Criminal Records API
 */
export async function searchbugCriminalRecords(searchParams) {
  const apiKey = process.env.SEARCHBUG_API_KEY
  if (!apiKey) {
    throw new Error('SEARCHBUG_API_KEY environment variable is required')
  }

  const params = new URLSearchParams({
    key: apiKey,
    first: searchParams.firstName || '',
    last: searchParams.lastName || '',
    state: searchParams.state || '',
    format: 'json'
  })

  try {
    const response = await fetch(`${SEARCHBUG_ENDPOINTS.CRIMINAL_RECORDS}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ZeroTraceLabs/1.0',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Searchbug Criminal API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return transformSearchbugCriminalResponse(data)
  } catch (error) {
    console.error('Searchbug Criminal Records API error:', error)
    throw error
  }
}

/**
 * Transform Searchbug People Search API response
 */
function transformSearchbugPeopleResponse(apiData) {
  if (!apiData || !apiData.results || apiData.results.length === 0) {
    return null
  }

  const result = apiData.results[0]
  const dataFound = []

  // Check what data is available
  if (result.name) dataFound.push('Name')
  if (result.aliases && result.aliases.length > 0) dataFound.push('Aliases')
  if (result.age || result.dob) dataFound.push('Age')
  if (result.address) dataFound.push('Address')
  if (result.previous_addresses && result.previous_addresses.length > 0) dataFound.push('Address History')
  if (result.phone) dataFound.push('Phone')
  if (result.phones && result.phones.length > 0) dataFound.push('Phone Numbers')
  if (result.email) dataFound.push('Email')
  if (result.relatives && result.relatives.length > 0) dataFound.push('Relatives')
  if (result.bankruptcies && result.bankruptcies.length > 0) dataFound.push('Bankruptcy Records')

  const description = `Searchbug found comprehensive profile with ${dataFound.length} data categories: ${dataFound.join(', ')}`

  return {
    dataFound,
    description,
    details: {
      name: result.name,
      aliases: result.aliases || [],
      age: result.age,
      dob: result.dob,
      current_address: result.address,
      previous_addresses: result.previous_addresses || [],
      phones: result.phones || [],
      emails: result.emails || [],
      relatives: result.relatives || [],
      bankruptcies: result.bankruptcies || []
    },
    confidence: result.confidence || 'medium',
    rawData: apiData
  }
}

/**
 * Transform Searchbug Background Check API response
 */
function transformSearchbugBackgroundResponse(apiData) {
  if (!apiData || !apiData.results || apiData.results.length === 0) {
    return null
  }

  const result = apiData.results[0]
  const dataFound = []

  if (result.name) dataFound.push('Name')
  if (result.address) dataFound.push('Address')
  if (result.phone) dataFound.push('Phone')
  if (result.criminal_records && result.criminal_records.length > 0) dataFound.push('Criminal Records')
  if (result.court_records && result.court_records.length > 0) dataFound.push('Court Records')
  if (result.evictions && result.evictions.length > 0) dataFound.push('Evictions')
  if (result.liens && result.liens.length > 0) dataFound.push('Liens')

  const description = `Background check found ${dataFound.length} categories: ${dataFound.join(', ')}`

  return {
    dataFound,
    description,
    details: {
      name: result.name,
      address: result.address,
      phone: result.phone,
      criminal_records: result.criminal_records || [],
      court_records: result.court_records || [],
      evictions: result.evictions || [],
      liens: result.liens || []
    },
    confidence: result.confidence || 'high',
    rawData: apiData
  }
}

/**
 * Transform Searchbug Criminal Records API response
 */
function transformSearchbugCriminalResponse(apiData) {
  if (!apiData || !apiData.results || apiData.results.length === 0) {
    return null
  }

  const result = apiData.results[0]
  const dataFound = []

  if (result.name) dataFound.push('Name')
  if (result.records && result.records.length > 0) {
    dataFound.push('Criminal Records')
    result.records.forEach(record => {
      if (record.offense) dataFound.push('Offense Details')
      if (record.jurisdiction) dataFound.push('Jurisdiction')
      if (record.disposition) dataFound.push('Case Disposition')
    })
  }

  const description = `Criminal search found ${result.records?.length || 0} records with ${dataFound.length} data points`

  return {
    dataFound,
    description,
    details: {
      name: result.name,
      total_records: result.records?.length || 0,
      records: result.records || []
    },
    confidence: 'high',
    rawData: apiData
  }
}

/**
 * Parse full name into first and last name components
 */
export function parseFullName(fullName) {
  if (!fullName) return { firstName: '', lastName: '' }
  
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  }
}

/**
 * Main Searchbug API integration function
 * Routes to appropriate API based on data source name
 */
export async function callSearchbugAPI(dataSource, searchParams) {
  const { firstName, lastName } = parseFullName(searchParams.fullName)
  
  const apiParams = {
    firstName,
    lastName,
    phone: searchParams.phone,
    email: searchParams.email,
    address: searchParams.address,
    city: searchParams.city,
    state: searchParams.state,
    zip: searchParams.zip
  }

  switch (dataSource.name) {
    case 'Searchbug People Search':
      return await searchbugPeopleSearch(apiParams)
    case 'Searchbug Background Check':
      return await searchbugBackgroundCheck(apiParams)
    case 'Searchbug Criminal Records':
      return await searchbugCriminalRecords(apiParams)
    default:
      throw new Error(`Unknown Searchbug API endpoint: ${dataSource.name}`)
  }
}