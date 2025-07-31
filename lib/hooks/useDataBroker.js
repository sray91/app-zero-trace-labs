'use client'

import { useState, useEffect } from 'react'
import { 
  searchOperations, 
  dataSourceOperations, 
  removalOperations 
} from '../supabase'
import { useAuth } from '../contexts/AuthContext'

export const useDataBroker = () => {
  const { user } = useAuth()
  const [searchHistory, setSearchHistory] = useState([])
  const [dataSources, setDataSources] = useState([])
  const [removalRequests, setRemovalRequests] = useState([])
  const [emailCampaigns, setEmailCampaigns] = useState([])
  const [reports, setReports] = useState([])
  const [monitoringJobs, setMonitoringJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [operationProgress, setOperationProgress] = useState({ current: 0, total: 0, message: '' })

  // Load user's search history
  const loadSearchHistory = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await searchOperations.getSearchHistory(user.id)
      if (error) throw error
      setSearchHistory(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading search history:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load available data sources
  const loadDataSources = async () => {
    setLoading(true)
    try {
      const { data, error } = await dataSourceOperations.getDataSources()
      if (error) throw error
      setDataSources(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading data sources:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load user's removal requests
  const loadRemovalRequests = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await removalOperations.getRemovalRequests(user.id)
      if (error) throw error
      setRemovalRequests(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading removal requests:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save a search to history
  const saveSearch = async (searchData) => {
    if (!user) {
      // For non-authenticated users, just return success without saving
      return { success: true, message: 'Search completed (not saved - please sign in to save history)' }
    }

    try {
      const searchRecord = {
        ...searchData,
        user_id: user.id
      }
      
      const { data, error } = await searchOperations.saveSearch(searchRecord)
      if (error) throw error
      
      // Update local state
      setSearchHistory(prev => [data[0], ...prev])
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      console.error('Error saving search:', err)
      return { success: false, error: err.message }
    }
  }

  // Submit a removal request
  const submitRemovalRequest = async (requestData) => {
    if (!user) {
      return { success: false, error: 'Please sign in to submit removal requests' }
    }

    try {
      const removalRecord = {
        ...requestData,
        user_id: user.id
      }
      
      const { data, error } = await removalOperations.submitRemovalRequest(removalRecord)
      if (error) throw error
      
      // Update local state
      setRemovalRequests(prev => [data[0], ...prev])
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      console.error('Error submitting removal request:', err)
      return { success: false, error: err.message }
    }
  }

  // Update removal request status
  const updateRemovalStatus = async (requestId, status, notes) => {
    try {
      const { data, error } = await removalOperations.updateRemovalStatus(requestId, status, notes)
      if (error) throw error
      
      // Update local state
      setRemovalRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, ...data[0] } : req)
      )
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      console.error('Error updating removal status:', err)
      return { success: false, error: err.message }
    }
  }

  // Add a new data source
  const addDataSource = async (sourceData) => {
    try {
      const { data, error } = await dataSourceOperations.addDataSource(sourceData)
      if (error) throw error
      
      // Update local state
      setDataSources(prev => [...prev, data[0]])
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      console.error('Error adding data source:', err)
      return { success: false, error: err.message }
    }
  }

  // Real API search function
  const performSearch = async (searchParams) => {
    setLoading(true)
    setError(null)
    
    try {
      // Get active data sources from database
      if (dataSources.length === 0) {
        await loadDataSources()
      }
      
      const searchResults = []
      const searchPromises = []
      
      // Perform searches across all active data sources
      for (const dataSource of dataSources) {
        if (dataSource.api_endpoint) {
          searchPromises.push(searchDataSource(dataSource, searchParams))
        }
      }
      
      // Execute all searches in parallel
      const results = await Promise.allSettled(searchPromises)
      
      // Process results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          searchResults.push({
            ...result.value,
            id: searchResults.length + 1,
            source: dataSources[index].name,
            url: dataSources[index].url,
            riskLevel: dataSources[index].risk_level || 'medium'
          })
        }
      })
      
      // If no API results, return a message indicating no data found
      if (searchResults.length === 0) {
        searchResults.push({
          id: 1,
          source: 'Search Complete',
          url: '#',
          dataFound: [],
          riskLevel: 'low',
          description: 'No personal information found across monitored data sources.'
        })
      }
      
      // Save search to history if user is authenticated
      if (user) {
        await saveSearch({
          full_name: searchParams.fullName,
          phone: searchParams.phone,
          email: searchParams.email,
          results: searchResults
        })
      }
      
      return { success: true, results: searchResults }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Search a specific data source
  const searchDataSource = async (dataSource, searchParams) => {
    try {
      const requestBody = {
        query: {
          full_name: searchParams.fullName,
          phone: searchParams.phone,
          email: searchParams.email
        }
      }

      const response = await fetch(dataSource.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
          // Add any data source specific headers here
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        console.warn(`API call failed for ${dataSource.name}:`, response.statusText)
        return null
      }

      const data = await response.json()
      
      // Transform API response to our standard format
      return transformApiResponse(data, dataSource)
    } catch (error) {
      console.warn(`Error searching ${dataSource.name}:`, error)
      return null
    }
  }

  // Transform API responses to standardized format
  const transformApiResponse = (apiData, dataSource) => {
    // This function should be customized based on each API's response format
    const dataFound = []
    let description = 'Data found'

    // API-specific transformations
    switch (dataSource.name) {
      case 'Spokeo':
        return transformSpokeoResponse(apiData)
      case 'WhitePages':
        return transformWhitePagesResponse(apiData)
      case 'BeenVerified':
        return transformBeenVerifiedResponse(apiData)
      case 'TruePeopleSearch':
        return transformTruePeopleSearchResponse(apiData)
      case 'Intelius':
        return transformInteliusResponse(apiData)
      default:
        return transformGenericResponse(apiData)
    }
  }

  // Spokeo API response transformer
  const transformSpokeoResponse = (apiData) => {
    const dataFound = []
    if (apiData.name) dataFound.push('Name')
    if (apiData.age) dataFound.push('Age')
    if (apiData.addresses) dataFound.push('Address')
    if (apiData.phones) dataFound.push('Phone')
    if (apiData.emails) dataFound.push('Email')
    if (apiData.relatives) dataFound.push('Relatives')
    if (apiData.social_profiles) dataFound.push('Social Media')

    return dataFound.length > 0 ? {
      dataFound,
      description: `Spokeo found ${dataFound.length} data categories`,
      rawData: apiData
    } : null
  }

  // WhitePages API response transformer
  const transformWhitePagesResponse = (apiData) => {
    const dataFound = []
    if (apiData.name) dataFound.push('Name')
    if (apiData.phone_number) dataFound.push('Phone')
    if (apiData.current_address) dataFound.push('Address')
    if (apiData.historical_addresses) dataFound.push('Address History')

    return dataFound.length > 0 ? {
      dataFound,
      description: `WhitePages found ${dataFound.length} data categories`,
      rawData: apiData
    } : null
  }

  // BeenVerified API response transformer
  const transformBeenVerifiedResponse = (apiData) => {
    const dataFound = []
    if (apiData.personal_info?.name) dataFound.push('Name')
    if (apiData.contact_info?.email) dataFound.push('Email')
    if (apiData.social_media) dataFound.push('Social Media')
    if (apiData.criminal_records) dataFound.push('Criminal Records')
    if (apiData.education) dataFound.push('Education')

    return dataFound.length > 0 ? {
      dataFound,
      description: `BeenVerified found ${dataFound.length} data categories`,
      rawData: apiData
    } : null
  }

  // TruePeopleSearch API response transformer
  const transformTruePeopleSearchResponse = (apiData) => {
    const dataFound = []
    if (apiData.name) dataFound.push('Name')
    if (apiData.address) dataFound.push('Address')
    if (apiData.phone) dataFound.push('Phone')
    if (apiData.possible_relatives) dataFound.push('Relatives')

    return dataFound.length > 0 ? {
      dataFound,
      description: `TruePeopleSearch found ${dataFound.length} data categories`,
      rawData: apiData
    } : null
  }

  // Intelius API response transformer
  const transformInteliusResponse = (apiData) => {
    const dataFound = []
    if (apiData.person?.name) dataFound.push('Name')
    if (apiData.addresses) dataFound.push('Address')
    if (apiData.phones) dataFound.push('Phone')
    if (apiData.criminal_records) dataFound.push('Criminal Records')
    if (apiData.court_records) dataFound.push('Court Records')
    if (apiData.property_records) dataFound.push('Property Records')

    return dataFound.length > 0 ? {
      dataFound,
      description: `Intelius found ${dataFound.length} data categories`,
      rawData: apiData
    } : null
  }

  // Generic response transformer for unknown APIs
  const transformGenericResponse = (apiData) => {
    const dataFound = []
    let description = 'Data found'

    // Generic transformation - customize based on actual API responses
    if (apiData.personal_info) {
      if (apiData.personal_info.name) dataFound.push('Name')
      if (apiData.personal_info.age) dataFound.push('Age')
      if (apiData.personal_info.address) dataFound.push('Address')
      if (apiData.personal_info.phone) dataFound.push('Phone')
      if (apiData.personal_info.email) dataFound.push('Email')
    }

    if (apiData.social_profiles) dataFound.push('Social Media')
    if (apiData.relatives) dataFound.push('Relatives')
    if (apiData.criminal_records) dataFound.push('Criminal Records')

    if (dataFound.length > 0) {
      description = `Found ${dataFound.length} data categories`
    } else {
      return null // No data found
    }

    return {
      dataFound,
      description,
      rawData: apiData // Store original response for detailed view
    }
  }

  // Initialize data sources (seed the database)
  const initializeDataSources = async () => {
    try {
      const result = await dataSourceOperations.seedDataSources()
      if (result.error) {
        setError(result.error.message)
        return { success: false, error: result.error.message }
      }
      
      // Reload data sources after seeding
      await loadDataSources()
      return { success: true, message: result.message }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // ========= ENHANCED FUNCTIONALITY: EMAIL AUTOMATION (JustVanish-style) =========
  
  // Send data request emails to brokers
  const sendDataRequestEmails = async (personalInfo, brokerList = null) => {
    if (!user) {
      return { success: false, error: 'Please sign in to send data requests' }
    }

    try {
      setLoading(true)
      setOperationProgress({ current: 0, total: 0, message: 'Preparing email campaign...' })
      
      const brokersToContact = brokerList || dataSources.filter(ds => ds.is_active)
      setOperationProgress({ current: 0, total: brokersToContact.length, message: 'Sending data request emails...' })
      
      const emailResults = []
      
      for (let i = 0; i < brokersToContact.length; i++) {
        const broker = brokersToContact[i]
        setOperationProgress({ 
          current: i + 1, 
          total: brokersToContact.length, 
          message: `Sending request to ${broker.name}...` 
        })
        
        const emailResult = await sendDataRequestEmail(broker, personalInfo)
        emailResults.push(emailResult)
        
        // Delay between emails to avoid being flagged as spam
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      // Save campaign to database
      const campaign = {
        user_id: user.id,
        campaign_type: 'data_request',
        personal_info: personalInfo,
        brokers_contacted: brokersToContact.map(b => b.id),
        email_results: emailResults,
        created_at: new Date().toISOString()
      }
      
      setEmailCampaigns(prev => [campaign, ...prev])
      
      return { 
        success: true, 
        results: emailResults,
        message: `Sent data requests to ${emailResults.filter(r => r.success).length} brokers`
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setOperationProgress({ current: 0, total: 0, message: '' })
    }
  }

  // Send deletion request emails to brokers
  const sendDeletionRequestEmails = async (personalInfo, brokerList = null) => {
    if (!user) {
      return { success: false, error: 'Please sign in to send deletion requests' }
    }

    try {
      setLoading(true)
      const brokersToContact = brokerList || dataSources.filter(ds => ds.is_active)
      setOperationProgress({ current: 0, total: brokersToContact.length, message: 'Sending deletion requests...' })
      
      const emailResults = []
      
      for (let i = 0; i < brokersToContact.length; i++) {
        const broker = brokersToContact[i]
        setOperationProgress({ 
          current: i + 1, 
          total: brokersToContact.length, 
          message: `Sending deletion request to ${broker.name}...` 
        })
        
        const emailResult = await sendDeletionRequestEmail(broker, personalInfo)
        emailResults.push(emailResult)
        
        // Create removal request record
        await submitRemovalRequest({
          data_source_id: broker.id,
          full_name: personalInfo.fullName,
          phone: personalInfo.phone,
          email: personalInfo.email,
          status: 'submitted',
          notes: `Automated deletion request sent via email`
        })
        
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      return { 
        success: true, 
        results: emailResults,
        message: `Sent deletion requests to ${emailResults.filter(r => r.success).length} brokers`
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setOperationProgress({ current: 0, total: 0, message: '' })
    }
  }

  // Send individual data request email
  const sendDataRequestEmail = async (broker, personalInfo) => {
    try {
      const emailTemplate = generateDataRequestEmail(broker, personalInfo)
      
      // In a real application, you'd use a service like SendGrid, Nodemailer, or similar
      // For now, we'll simulate the email sending and return a preview
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: broker.contact_email || `privacy@${new URL(broker.url).hostname}`,
          subject: emailTemplate.subject,
          body: emailTemplate.body,
          type: 'data_request'
        })
      })
      
      if (response.ok) {
        return {
          broker: broker.name,
          success: true,
          email: emailTemplate,
          sent_at: new Date().toISOString()
        }
      } else {
        return {
          broker: broker.name,
          success: false,
          error: 'Failed to send email',
          email: emailTemplate
        }
      }
    } catch (error) {
      return {
        broker: broker.name,
        success: false,
        error: error.message,
        email: null
      }
    }
  }

  // Send individual deletion request email
  const sendDeletionRequestEmail = async (broker, personalInfo) => {
    try {
      const emailTemplate = generateDeletionRequestEmail(broker, personalInfo)
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: broker.contact_email || `privacy@${new URL(broker.url).hostname}`,
          subject: emailTemplate.subject,
          body: emailTemplate.body,
          type: 'deletion_request'
        })
      })
      
      if (response.ok) {
        return {
          broker: broker.name,
          success: true,
          email: emailTemplate,
          sent_at: new Date().toISOString()
        }
      } else {
        return {
          broker: broker.name,
          success: false,
          error: 'Failed to send email',
          email: emailTemplate
        }
      }
    } catch (error) {
      return {
        broker: broker.name,
        success: false,
        error: error.message,
        email: null
      }
    }
  }

  // Generate data request email template
  const generateDataRequestEmail = (broker, personalInfo) => {
    return {
      subject: `Data Access Request - ${personalInfo.fullName}`,
      body: `
Dear ${broker.name} Privacy Team,

I am writing to request access to any personal data you may have collected about me under the California Consumer Privacy Act (CCPA) and/or the General Data Protection Regulation (GDPR).

Personal Information:
- Full Name: ${personalInfo.fullName}
- Email: ${personalInfo.email}
${personalInfo.phone ? `- Phone: ${personalInfo.phone}` : ''}
${personalInfo.address ? `- Address: ${personalInfo.address}` : ''}

Please provide me with:
1. Confirmation of whether you process my personal data
2. A copy of all personal data you have about me
3. Information about the categories of data you collect
4. The sources from which you obtained my data
5. The purposes for which you use my data
6. Any third parties with whom you share my data

I would like to receive this information in a commonly used electronic format. Please respond within 45 days as required by law.

If you need any additional information to verify my identity, please let me know.

Thank you for your prompt attention to this matter.

Sincerely,
${personalInfo.fullName}
${personalInfo.email}

Reference: Data Access Request - ${new Date().toISOString().split('T')[0]}
      `.trim()
    }
  }

  // Generate deletion request email template
  const generateDeletionRequestEmail = (broker, personalInfo) => {
    return {
      subject: `Data Deletion Request - ${personalInfo.fullName}`,
      body: `
Dear ${broker.name} Privacy Team,

I am writing to request the deletion of all personal data you have collected about me under the California Consumer Privacy Act (CCPA) and/or the General Data Protection Regulation (GDPR).

Personal Information:
- Full Name: ${personalInfo.fullName}
- Email: ${personalInfo.email}
${personalInfo.phone ? `- Phone: ${personalInfo.phone}` : ''}
${personalInfo.address ? `- Address: ${personalInfo.address}` : ''}

I request that you:
1. Delete all personal data you have about me
2. Cease all data collection activities related to my information
3. Notify any third parties with whom you have shared my data to also delete it
4. Confirm in writing that my data has been deleted

Please process this deletion request within 45 days as required by law and send me confirmation once completed.

If you need any additional information to verify my identity, please let me know.

Thank you for your prompt attention to this matter.

Sincerely,
${personalInfo.fullName}
${personalInfo.email}

Reference: Data Deletion Request - ${new Date().toISOString().split('T')[0]}
      `.trim()
    }
  }

  // ========= ENHANCED FUNCTIONALITY: REPORT GENERATION =========
  
  // Generate comprehensive privacy report
  const generatePrivacyReport = async (timeframe = 'all') => {
    if (!user) {
      return { success: false, error: 'Please sign in to generate reports' }
    }

    try {
      setLoading(true)
      setOperationProgress({ current: 0, total: 4, message: 'Generating privacy report...' })
      
      // Gather all data
      setOperationProgress({ current: 1, total: 4, message: 'Collecting search history...' })
      const searchData = await getFilteredSearchHistory(timeframe)
      
      setOperationProgress({ current: 2, total: 4, message: 'Analyzing data exposure...' })
      const exposureAnalysis = analyzeDataExposure(searchData)
      
      setOperationProgress({ current: 3, total: 4, message: 'Compiling removal status...' })
      const removalStatus = analyzeRemovalStatus()
      
      setOperationProgress({ current: 4, total: 4, message: 'Finalizing report...' })
      
      const report = {
        id: `report_${Date.now()}`,
        user_id: user.id,
        generated_at: new Date().toISOString(),
        timeframe,
        summary: {
          total_searches: searchData.length,
          total_brokers_found: exposureAnalysis.brokers_with_data.length,
          total_data_points: exposureAnalysis.total_data_points,
          removal_requests: removalStatus.total_requests,
          completed_removals: removalStatus.completed,
          privacy_score: calculatePrivacyScore(exposureAnalysis, removalStatus)
        },
        data_exposure: exposureAnalysis,
        removal_status: removalStatus,
        recommendations: generateRecommendations(exposureAnalysis, removalStatus),
        raw_data: {
          searches: searchData,
          removal_requests: removalRequests
        }
      }
      
      setReports(prev => [report, ...prev])
      
      return { success: true, report }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setOperationProgress({ current: 0, total: 0, message: '' })
    }
  }

  // Analyze data exposure across brokers
  const analyzeDataExposure = (searchData) => {
    const brokerData = {}
    const dataTypesCounts = {}
    let totalDataPoints = 0
    
    searchData.forEach(search => {
      if (search.results) {
        search.results.forEach(result => {
          if (result.dataFound && result.dataFound.length > 0) {
            // Track by broker
            if (!brokerData[result.source]) {
              brokerData[result.source] = {
                name: result.source,
                url: result.url,
                data_types: new Set(),
                risk_level: result.riskLevel,
                first_seen: search.created_at,
                last_seen: search.created_at
              }
            }
            
            // Update data types for this broker
            result.dataFound.forEach(dataType => {
              brokerData[result.source].data_types.add(dataType)
              dataTypesCounts[dataType] = (dataTypesCounts[dataType] || 0) + 1
              totalDataPoints++
            })
            
            // Update last seen
            if (new Date(search.created_at) > new Date(brokerData[result.source].last_seen)) {
              brokerData[result.source].last_seen = search.created_at
            }
          }
        })
      }
    })
    
    // Convert sets to arrays for serialization
    Object.values(brokerData).forEach(broker => {
      broker.data_types = Array.from(broker.data_types)
    })
    
    return {
      brokers_with_data: Object.values(brokerData),
      data_types_distribution: dataTypesCounts,
      total_data_points: totalDataPoints,
      risk_assessment: calculateRiskAssessment(Object.values(brokerData))
    }
  }

  // Analyze removal request status
  const analyzeRemovalStatus = () => {
    const statusCounts = removalRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1
      return acc
    }, {})
    
    return {
      total_requests: removalRequests.length,
      pending: statusCounts.pending || 0,
      submitted: statusCounts.submitted || 0,
      completed: statusCounts.completed || 0,
      failed: statusCounts.failed || 0,
      completion_rate: removalRequests.length > 0 ? 
        ((statusCounts.completed || 0) / removalRequests.length * 100).toFixed(1) : 0
    }
  }

  // Calculate privacy score (0-100)
  const calculatePrivacyScore = (exposureAnalysis, removalStatus) => {
    let score = 100
    
    // Deduct points for data exposure
    const dataPoints = exposureAnalysis.total_data_points
    score -= Math.min(dataPoints * 2, 40) // Max 40 points deduction for exposure
    
    // Add points for removal actions
    if (removalStatus.total_requests > 0) {
      const removalPoints = (removalStatus.completed / removalStatus.total_requests) * 20
      score += removalPoints
    }
    
    // Risk level adjustments
    const highRiskBrokers = exposureAnalysis.brokers_with_data.filter(b => b.risk_level === 'high').length
    score -= highRiskBrokers * 5
    
    return Math.max(Math.round(score), 0)
  }

  // Generate privacy recommendations
  const generateRecommendations = (exposureAnalysis, removalStatus) => {
    const recommendations = []
    
    if (exposureAnalysis.brokers_with_data.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'data_removal',
        title: 'Request Data Removal',
        description: `You have data exposed on ${exposureAnalysis.brokers_with_data.length} data broker sites. Consider sending deletion requests.`,
        action: 'send_deletion_requests',
        brokers: exposureAnalysis.brokers_with_data.map(b => b.name)
      })
    }
    
    const highRiskBrokers = exposureAnalysis.brokers_with_data.filter(b => b.risk_level === 'high')
    if (highRiskBrokers.length > 0) {
      recommendations.push({
        priority: 'urgent',
        category: 'high_risk',
        title: 'Address High-Risk Exposures',
        description: `Prioritize removal from ${highRiskBrokers.length} high-risk data brokers.`,
        action: 'prioritize_removal',
        brokers: highRiskBrokers.map(b => b.name)
      })
    }
    
    const failedRemovals = removalStatus.failed
    if (failedRemovals > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'follow_up',
        title: 'Follow Up on Failed Removals',
        description: `${failedRemovals} removal requests failed. Consider retrying or contacting brokers directly.`,
        action: 'retry_failed_removals'
      })
    }
    
    recommendations.push({
      priority: 'low',
      category: 'monitoring',
      title: 'Set Up Regular Monitoring',
      description: 'Schedule monthly scans to monitor for new data exposures.',
      action: 'setup_monitoring'
    })
    
    return recommendations
  }

  // ========= ENHANCED FUNCTIONALITY: PROGRESS MONITORING =========
  
  // Setup automated monitoring
  const setupMonitoring = async (personalInfo, frequency = 'monthly') => {
    if (!user) {
      return { success: false, error: 'Please sign in to setup monitoring' }
    }

    try {
      const monitoringJob = {
        id: `monitor_${Date.now()}`,
        user_id: user.id,
        personal_info: personalInfo,
        frequency,
        created_at: new Date().toISOString(),
        last_run: null,
        next_run: calculateNextRun(frequency),
        is_active: true,
        results_history: []
      }
      
      setMonitoringJobs(prev => [monitoringJob, ...prev])
      
      return { success: true, job: monitoringJob }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Run monitoring job
  const runMonitoringJob = async (jobId) => {
    const job = monitoringJobs.find(j => j.id === jobId)
    if (!job) return { success: false, error: 'Job not found' }
    
    try {
      setLoading(true)
      setOperationProgress({ current: 0, total: 3, message: 'Starting monitoring scan...' })
      
      // Perform search
      setOperationProgress({ current: 1, total: 3, message: 'Scanning data brokers...' })
      const searchResult = await performSearch(job.personal_info)
      
      // Compare with previous results
      setOperationProgress({ current: 2, total: 3, message: 'Analyzing changes...' })
      const changes = compareWithPreviousResults(job, searchResult.results)
      
      // Update job with results
      setOperationProgress({ current: 3, total: 3, message: 'Updating monitoring data...' })
      const updatedJob = {
        ...job,
        last_run: new Date().toISOString(),
        next_run: calculateNextRun(job.frequency),
        results_history: [
          {
            run_date: new Date().toISOString(),
            results: searchResult.results,
            changes: changes
          },
          ...job.results_history.slice(0, 4) // Keep last 5 results
        ]
      }
      
      setMonitoringJobs(prev => 
        prev.map(j => j.id === jobId ? updatedJob : j)
      )
      
      return { success: true, changes, results: searchResult.results }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setOperationProgress({ current: 0, total: 0, message: '' })
    }
  }

  // Compare monitoring results with previous run
  const compareWithPreviousResults = (job, currentResults) => {
    if (job.results_history.length === 0) {
      return {
        new_exposures: currentResults.filter(r => r.dataFound && r.dataFound.length > 0),
        removed_exposures: [],
        changed_data: [],
        summary: 'First scan - establishing baseline'
      }
    }
    
    const previousResults = job.results_history[0].results
    const changes = {
      new_exposures: [],
      removed_exposures: [],
      changed_data: [],
      summary: ''
    }
    
    // Find new exposures
    currentResults.forEach(current => {
      const previous = previousResults.find(p => p.source === current.source)
      if (!previous && current.dataFound && current.dataFound.length > 0) {
        changes.new_exposures.push(current)
      } else if (previous && current.dataFound) {
        const newDataTypes = current.dataFound.filter(d => !previous.dataFound?.includes(d))
        if (newDataTypes.length > 0) {
          changes.changed_data.push({
            source: current.source,
            new_data_types: newDataTypes
          })
        }
      }
    })
    
    // Find removed exposures
    previousResults.forEach(previous => {
      const current = currentResults.find(c => c.source === previous.source)
      if (previous.dataFound && previous.dataFound.length > 0 && 
          (!current || !current.dataFound || current.dataFound.length === 0)) {
        changes.removed_exposures.push(previous)
      }
    })
    
    // Generate summary
    const totalChanges = changes.new_exposures.length + changes.removed_exposures.length + changes.changed_data.length
    if (totalChanges === 0) {
      changes.summary = 'No changes detected since last scan'
    } else {
      changes.summary = `${totalChanges} changes detected: ${changes.new_exposures.length} new, ${changes.removed_exposures.length} removed, ${changes.changed_data.length} modified`
    }
    
    return changes
  }

  // Calculate next monitoring run time
  const calculateNextRun = (frequency) => {
    const now = new Date()
    switch (frequency) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).toISOString()
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default to monthly
    }
  }

  // ========= ENHANCED FUNCTIONALITY: WEB SCRAPING & BROKER LIST EXPANSION =========
  
  // Load expanded broker list from Big-Ass-Data-Broker-Opt-Out-List
  const loadExpandedBrokerList = async () => {
    try {
      setLoading(true)
      setOperationProgress({ current: 0, total: 3, message: 'Loading expanded broker list...' })
      
      // In a real application, you'd fetch this from the GitHub repo or your own database
      const expandedBrokers = [
        // Adding more brokers from the Big-Ass-Data-Broker-Opt-Out-List
        {
          name: 'MyLife',
          url: 'https://mylife.com',
          risk_level: 'high',
          description: 'Detailed personal profiles with reputation scores',
          data_types: ['name', 'age', 'address', 'phone', 'email', 'reputation', 'background'],
          opt_out_url: 'https://www.mylife.com/opt-out/',
          contact_email: 'privacy@mylife.com'
        },
        {
          name: 'PeopleFinders',
          url: 'https://peoplefinders.com',
          risk_level: 'medium',
          description: 'Public records and contact information',
          data_types: ['name', 'address', 'phone', 'relatives', 'criminal_records'],
          opt_out_url: 'https://www.peoplefinders.com/opt-out',
          contact_email: 'privacy@peoplefinders.com'
        },
        {
          name: 'InstantCheckmate',
          url: 'https://instantcheckmate.com',
          risk_level: 'high',
          description: 'Background check service with comprehensive reports',
          data_types: ['name', 'criminal_records', 'court_records', 'address_history', 'phone', 'email'],
          opt_out_url: 'https://www.instantcheckmate.com/opt-out/',
          contact_email: 'privacy@instantcheckmate.com'
        },
        {
          name: 'Pipl',
          url: 'https://pipl.com',
          risk_level: 'high',
          description: 'Professional people search engine',
          data_types: ['name', 'email', 'phone', 'social_media', 'professional_info'],
          opt_out_url: 'https://pipl.com/personal-information-removal-request',
          contact_email: 'privacy@pipl.com'
        },
        {
          name: 'Radaris',
          url: 'https://radaris.com',
          risk_level: 'medium',
          description: 'Public records aggregator',
          data_types: ['name', 'address', 'phone', 'age', 'relatives'],
          opt_out_url: 'https://radaris.com/page/how-to-remove',
          contact_email: 'privacy@radaris.com'
        }
      ]
      
      setOperationProgress({ current: 1, total: 3, message: 'Processing broker data...' })
      
      // Add these to the database if they don't exist
      for (const broker of expandedBrokers) {
        try {
          await addDataSource({
            ...broker,
            is_active: true,
            created_at: new Date().toISOString()
          })
        } catch (err) {
          console.warn(`Failed to add broker ${broker.name}:`, err)
        }
      }
      
      setOperationProgress({ current: 2, total: 3, message: 'Refreshing data sources...' })
      await loadDataSources()
      
      setOperationProgress({ current: 3, total: 3, message: 'Complete!' })
      
      return { success: true, added: expandedBrokers.length }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setOperationProgress({ current: 0, total: 0, message: '' })
    }
  }

  // Scrape data broker sites (for non-API sources)
  const scrapeDataBroker = async (broker, personalInfo) => {
    try {
      // This would typically be done server-side to avoid CORS issues
      const response = await fetch('/api/scrape-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: broker,
          search_params: personalInfo
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          source: broker.name,
          url: broker.url,
          dataFound: data.data_found || [],
          riskLevel: broker.risk_level,
          description: data.description || 'Data found via web scraping',
          scraped: true,
          timestamp: new Date().toISOString()
        }
      }
      
      return null
    } catch (error) {
      console.warn(`Scraping failed for ${broker.name}:`, error)
      return null
    }
  }

  // ========= HELPER FUNCTIONS =========
  
  // Get filtered search history based on timeframe
  const getFilteredSearchHistory = (timeframe) => {
    const now = new Date()
    let cutoffDate
    
    switch (timeframe) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case 'quarter':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case 'year':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        return searchHistory
    }
    
    return searchHistory.filter(search => new Date(search.created_at) >= cutoffDate)
  }

  // Calculate risk assessment
  const calculateRiskAssessment = (brokersWithData) => {
    const riskCounts = { low: 0, medium: 0, high: 0 }
    
    brokersWithData.forEach(broker => {
      riskCounts[broker.risk_level] = (riskCounts[broker.risk_level] || 0) + 1
    })
    
    const totalBrokers = brokersWithData.length
    const highRiskPercentage = totalBrokers > 0 ? (riskCounts.high / totalBrokers * 100).toFixed(1) : 0
    
    let overallRisk = 'low'
    if (highRiskPercentage > 30) {
      overallRisk = 'high'
    } else if (highRiskPercentage > 10 || riskCounts.medium > 2) {
      overallRisk = 'medium'
    }
    
    return {
      overall_risk: overallRisk,
      risk_distribution: riskCounts,
      high_risk_percentage: highRiskPercentage,
      total_brokers: totalBrokers
    }
  }

  // Export data for CSV/JSON download
  const exportData = (format = 'json', dataType = 'all') => {
    let exportData = {}
    
    switch (dataType) {
      case 'searches':
        exportData = { searches: searchHistory }
        break
      case 'removals':
        exportData = { removal_requests: removalRequests }
        break
      case 'reports':
        exportData = { reports: reports }
        break
      case 'monitoring':
        exportData = { monitoring_jobs: monitoringJobs }
        break
      default:
        exportData = {
          searches: searchHistory,
          removal_requests: removalRequests,
          reports: reports,
          monitoring_jobs: monitoringJobs,
          data_sources: dataSources
        }
    }
    
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      return convertToCSV(exportData)
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  // Simple CSV converter
  const convertToCSV = (data) => {
    if (data.searches) {
      const headers = ['Date', 'Name', 'Phone', 'Email', 'Brokers Found', 'Data Points']
      const rows = data.searches.map(search => [
        new Date(search.created_at).toLocaleDateString(),
        search.full_name,
        search.phone || '',
        search.email || '',
        search.results ? search.results.filter(r => r.dataFound?.length > 0).length : 0,
        search.results ? search.results.reduce((sum, r) => sum + (r.dataFound?.length || 0), 0) : 0
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return JSON.stringify(data, null, 2) // Fallback to JSON
  }

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadSearchHistory()
      loadRemovalRequests()
    } else {
      setSearchHistory([])
      setRemovalRequests([])
    }
  }, [user])

  // Load data sources on mount
  useEffect(() => {
    loadDataSources()
  }, [])

  return {
    // State
    searchHistory,
    dataSources,
    removalRequests,
    emailCampaigns,
    reports,
    monitoringJobs,
    loading,
    error,
    operationProgress,
    
    // Core Actions
    performSearch,
    saveSearch,
    submitRemovalRequest,
    updateRemovalStatus,
    addDataSource,
    loadSearchHistory,
    loadDataSources,
    loadRemovalRequests,
    initializeDataSources,
    
    // Enhanced Email Automation (JustVanish-style)
    sendDataRequestEmails,
    sendDeletionRequestEmails,
    sendDataRequestEmail,
    sendDeletionRequestEmail,
    generateDataRequestEmail,
    generateDeletionRequestEmail,
    
    // Report Generation
    generatePrivacyReport,
    analyzeDataExposure,
    analyzeRemovalStatus,
    calculatePrivacyScore,
    generateRecommendations,
    
    // Progress Monitoring
    setupMonitoring,
    runMonitoringJob,
    compareWithPreviousResults,
    calculateNextRun,
    
    // Enhanced Data Sources & Web Scraping
    loadExpandedBrokerList,
    scrapeDataBroker,
    
    // Helper Functions
    searchDataSource,
    transformApiResponse,
    getFilteredSearchHistory,
    calculateRiskAssessment,
    
    // Data Export
    exportData,
    convertToCSV,
    
    // Utilities
    clearError: () => setError(null)
  }
}

