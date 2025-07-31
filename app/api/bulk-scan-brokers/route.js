import { NextResponse } from 'next/server'

/**
 * Bulk Scanning API for Public Broker Sites
 * Handles batch processing of multiple data broker searches
 */
export async function POST(request) {
  try {
    const { personalInfo, scanOptions = {} } = await request.json()

    // Validate required fields
    if (!personalInfo || !personalInfo.fullName) {
      return NextResponse.json(
        { error: 'Missing required field: personalInfo.fullName' },
        { status: 400 }
      )
    }

    console.log('🔍 Starting bulk broker scan for:', {
      name: personalInfo.fullName,
      priority: scanOptions.priority || 'all',
      batchSize: scanOptions.batchSize || 5
    })

    // Comprehensive list of public broker sites to scan
    const publicBrokers = [
      // Tier 1: High Priority (most comprehensive data)
      {
        name: 'Spokeo',
        url: 'https://spokeo.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'high',
        priority: 1,
        data_types: ['name', 'age', 'address', 'phone', 'email', 'relatives', 'social_media']
      },
      {
        name: 'MyLife',
        url: 'https://mylife.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'high',
        priority: 1,
        data_types: ['name', 'age', 'address', 'phone', 'email', 'reputation', 'background']
      },
      {
        name: 'FastPeopleSearch',
        url: 'https://fastpeoplesearch.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'high',
        priority: 1,
        data_types: ['name', 'address', 'phone', 'age', 'relatives', 'email']
      },
      {
        name: 'ThatsThem',
        url: 'https://thatsthem.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'high',
        priority: 1,
        data_types: ['name', 'address', 'phone', 'email', 'age', 'relatives', 'neighbors']
      },
      {
        name: 'InstantCheckmate',
        url: 'https://instantcheckmate.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'high',
        priority: 1,
        data_types: ['name', 'criminal_records', 'court_records', 'address_history', 'phone', 'email']
      },
      {
        name: 'CheckPeople',
        url: 'https://checkpeople.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'high',
        priority: 1,
        data_types: ['name', 'address', 'phone', 'email', 'criminal_records', 'social_media']
      },

      // Tier 2: Medium Priority (good coverage, public records)
      {
        name: 'WhitePages',
        url: 'https://whitepages.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'medium',
        priority: 2,
        data_types: ['name', 'phone', 'address', 'address_history', 'relatives']
      },
      {
        name: 'Radaris',
        url: 'https://radaris.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'medium',
        priority: 2,
        data_types: ['name', 'address', 'phone', 'age', 'relatives', 'education']
      },
      {
        name: 'TruePeopleSearch',
        url: 'https://truepeoplesearch.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'medium',
        priority: 2,
        data_types: ['name', 'address', 'phone', 'relatives', 'age_range']
      },
      {
        name: 'PeopleFinders',
        url: 'https://peoplefinders.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'medium',
        priority: 2,
        data_types: ['name', 'address', 'phone', 'relatives', 'criminal_records']
      },
      {
        name: 'USSearch',
        url: 'https://ussearch.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'medium',
        priority: 2,
        data_types: ['name', 'address', 'phone', 'age', 'relatives', 'criminal_records']
      },
      {
        name: 'Addresses',
        url: 'https://addresses.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'medium',
        priority: 2,
        data_types: ['name', 'address', 'phone', 'email', 'relatives', 'neighbors']
      },
      {
        name: 'FamilyTreeNow',
        url: 'https://familytreenow.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'medium',
        priority: 2,
        data_types: ['name', 'relatives', 'birth_info', 'family_tree', 'historical_records']
      },
      {
        name: 'VoterRecords',
        url: 'https://voterrecords.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'medium',
        priority: 2,
        data_types: ['name', 'address', 'age', 'political_affiliation', 'voting_history']
      },

      // Tier 3: Lower Priority (directory services)
      {
        name: 'YellowPages',
        url: 'https://yellowpages.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'low',
        priority: 3,
        data_types: ['name', 'phone', 'address', 'business_info']
      },
      {
        name: 'AnyWho',
        url: 'https://anywho.com',
        endpoint: '/api/scrape-broker',
        risk_level: 'low',
        priority: 3,
        data_types: ['name', 'address', 'phone']
      }
    ]

    // Filter brokers based on scan options
    const maxPriority = scanOptions.priority || 3
    const brokersToScan = publicBrokers.filter(broker => broker.priority <= maxPriority)
    const batchSize = scanOptions.batchSize || 5

    console.log(`Scanning ${brokersToScan.length} brokers in batches of ${batchSize}`)

    const scanResults = []
    const scanStartTime = new Date()

    // Process brokers in batches to avoid overwhelming servers
    for (let i = 0; i < brokersToScan.length; i += batchSize) {
      const batch = brokersToScan.slice(i, i + batchSize)
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(brokersToScan.length / batchSize)}`)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (broker) => {
        try {
          const scanResult = await scanBrokerSite(broker, personalInfo)
          return {
            broker: broker.name,
            url: broker.url,
            risk_level: broker.risk_level,
            priority: broker.priority,
            ...scanResult,
            scan_timestamp: new Date().toISOString()
          }
        } catch (error) {
          console.error(`Error scanning ${broker.name}:`, error)
          return {
            broker: broker.name,
            url: broker.url,
            risk_level: broker.risk_level,
            priority: broker.priority,
            success: false,
            error: error.message,
            data_found: [],
            scan_timestamp: new Date().toISOString()
          }
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      
      // Add fulfilled results to scan results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          scanResults.push(result.value)
        } else {
          const broker = batch[index]
          scanResults.push({
            broker: broker.name,
            url: broker.url,
            risk_level: broker.risk_level,
            priority: broker.priority,
            success: false,
            error: result.reason?.message || 'Unknown error',
            data_found: [],
            scan_timestamp: new Date().toISOString()
          })
        }
      })

      // Delay between batches to be respectful
      if (i + batchSize < brokersToScan.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const scanEndTime = new Date()
    const scanDuration = scanEndTime - scanStartTime

    // Compile scan summary
    const successfulScans = scanResults.filter(r => r.success !== false)
    const brokersWithData = scanResults.filter(r => r.data_found && r.data_found.length > 0)
    const totalDataPoints = scanResults.reduce((sum, r) => sum + (r.data_found?.length || 0), 0)

    const scanSummary = {
      scan_id: `bulk_scan_${Date.now()}`,
      scan_timestamp: scanStartTime.toISOString(),
      scan_duration_ms: scanDuration,
      personal_info: {
        name: personalInfo.fullName,
        phone: personalInfo.phone || null,
        email: personalInfo.email || null,
        address: personalInfo.address || null
      },
      scan_options: scanOptions,
      total_brokers_scanned: brokersToScan.length,
      successful_scans: successfulScans.length,
      brokers_with_data: brokersWithData.length,
      total_data_points: totalDataPoints,
      high_risk_exposures: brokersWithData.filter(r => r.risk_level === 'high').length,
      medium_risk_exposures: brokersWithData.filter(r => r.risk_level === 'medium').length,
      low_risk_exposures: brokersWithData.filter(r => r.risk_level === 'low').length,
      scan_results: scanResults
    }

    console.log('Bulk scan completed:', {
      total_scanned: scanSummary.total_brokers_scanned,
      brokers_with_data: scanSummary.brokers_with_data,
      total_data_points: scanSummary.total_data_points,
      duration: `${scanDuration}ms`
    })

    return NextResponse.json({
      success: true,
      message: `Scanned ${scanSummary.total_brokers_scanned} public broker sites`,
      summary: scanSummary
    })

  } catch (error) {
    console.error('Bulk scan error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Bulk scan failed', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Scan individual broker site
async function scanBrokerSite(broker, personalInfo) {
  try {
    // Use existing scrape-broker endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${broker.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        broker: {
          name: broker.name,
          url: broker.url,
          risk_level: broker.risk_level
        },
        search_params: personalInfo
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        data_found: data.data_found || [],
        description: data.description || 'Scan completed',
        details: data.details || {},
        confidence: data.confidence || 'medium',
        method: data.method || 'web_scraping'
      }
    } else {
      throw new Error(data.error || 'Scan failed')
    }

  } catch (error) {
    console.warn(`Failed to scan ${broker.name}:`, error.message)
    return {
      success: false,
      error: error.message,
      data_found: [],
      description: `Scan failed: ${error.message}`
    }
  }
}