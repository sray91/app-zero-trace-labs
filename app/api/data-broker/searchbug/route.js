import { NextResponse } from 'next/server'

// Searchbug API endpoints
const SEARCHBUG_ENDPOINTS = {
  PEOPLE_SEARCH: 'https://searchbug.com/api/ppl.aspx',
  BACKGROUND_CHECK: 'https://searchbug.com/api/bkg.aspx',
  CRIMINAL_RECORDS: 'https://searchbug.com/api/crim.aspx',
  PROPERTY_RECORDS: 'https://searchbug.com/api/prop.aspx'
}

export async function POST(request) {
  try {
    const { dataSource, searchParams } = await request.json()

    // Validate required fields
    if (!dataSource || !searchParams) {
      return NextResponse.json(
        { error: 'Missing required fields: dataSource, searchParams' },
        { status: 400 }
      )
    }

    const apiKey = process.env.SEARCHBUG_API_KEY
    if (!apiKey) {
      console.warn('SEARCHBUG_API_KEY not configured, skipping Searchbug API call')
      return NextResponse.json({
        success: false,
        error: 'API key not configured',
        broker: dataSource.name
      })
    }

    console.log('🔍 Calling Searchbug API for:', {
      broker: dataSource.name,
      search: { fullName: searchParams.fullName }
    })

    // Parse full name
    const { firstName, lastName } = parseFullName(searchParams.fullName)

    // Call appropriate Searchbug API based on data source name
    let result
    switch (dataSource.name) {
      case 'Searchbug People Search':
        result = await callSearchbugAPI(SEARCHBUG_ENDPOINTS.PEOPLE_SEARCH, {
          key: apiKey,
          first: firstName,
          last: lastName,
          address: searchParams.address || '',
          city: searchParams.city || '',
          state: searchParams.state || '',
          zip: searchParams.zip || '',
          phone: searchParams.phone || '',
          email: searchParams.email || '',
          format: 'json'
        })
        break
        
      case 'Searchbug Background Check':
        result = await callSearchbugAPI(SEARCHBUG_ENDPOINTS.BACKGROUND_CHECK, {
          key: apiKey,
          first: firstName,
          last: lastName,
          address: searchParams.address || '',
          city: searchParams.city || '',
          state: searchParams.state || '',
          phone: searchParams.phone || '',
          format: 'json'
        })
        break
        
      case 'Searchbug Criminal Records':
        result = await callSearchbugAPI(SEARCHBUG_ENDPOINTS.CRIMINAL_RECORDS, {
          key: apiKey,
          first: firstName,
          last: lastName,
          state: searchParams.state || '',
          format: 'json'
        })
        break
        
      case 'Searchbug Property Records':
        result = await callSearchbugAPI(SEARCHBUG_ENDPOINTS.PROPERTY_RECORDS, {
          key: apiKey,
          address: searchParams.address || '',
          city: searchParams.city || '',
          state: searchParams.state || '',
          zip: searchParams.zip || '',
          format: 'json'
        })
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown Searchbug service: ${dataSource.name}`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      broker: dataSource.name,
      data_found: result.dataFound || [],
      description: result.description || 'Data found via Searchbug API',
      details: result.details || {},
      confidence: result.confidence || 'high',
      method: 'searchbug_api',
      searched_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Searchbug API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Searchbug API call failed', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Helper function to call Searchbug API
async function callSearchbugAPI(endpoint, params) {
  const queryString = new URLSearchParams(params).toString()
  const url = `${endpoint}?${queryString}`

  try {
    const response = await fetch(url, {
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
    return transformSearchbugResponse(data, endpoint)
  } catch (error) {
    console.error('Searchbug API call failed:', error)
    throw error
  }
}

// Transform Searchbug API response to our standard format
function transformSearchbugResponse(apiData, endpoint) {
  if (!apiData || !apiData.results || apiData.results.length === 0) {
    return {
      dataFound: [],
      description: 'No results found in Searchbug database',
      confidence: 'high'
    }
  }

  const result = apiData.results[0]
  const dataFound = []

  // Common data points
  if (result.name) dataFound.push('Name')
  if (result.aliases && result.aliases.length > 0) dataFound.push('Aliases')
  if (result.age || result.dob) dataFound.push('Age')
  if (result.address) dataFound.push('Address')
  if (result.previous_addresses && result.previous_addresses.length > 0) dataFound.push('Address History')
  if (result.phone) dataFound.push('Phone')
  if (result.phones && result.phones.length > 0) dataFound.push('Phone Numbers')
  if (result.email) dataFound.push('Email')
  if (result.relatives && result.relatives.length > 0) dataFound.push('Relatives')

  // Endpoint-specific data points
  if (endpoint.includes('bkg')) {
    if (result.criminal_records && result.criminal_records.length > 0) dataFound.push('Criminal Records')
    if (result.court_records && result.court_records.length > 0) dataFound.push('Court Records')
    if (result.evictions && result.evictions.length > 0) dataFound.push('Evictions')
  }
  
  if (endpoint.includes('crim')) {
    if (result.records && result.records.length > 0) dataFound.push('Criminal Records')
  }
  
  if (endpoint.includes('prop')) {
    if (result.property_value) dataFound.push('Property Value')
    if (result.owner_info) dataFound.push('Property Owner')
  }

  const description = dataFound.length > 0 
    ? `Searchbug found ${dataFound.length} data categories: ${dataFound.join(', ')}`
    : 'No data found in Searchbug database'

  return {
    dataFound,
    description,
    details: {
      ...result,
      api_endpoint: endpoint,
      result_count: apiData.results.length
    },
    confidence: 'high'
  }
}

// Parse full name into first and last components
function parseFullName(fullName) {
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