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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
    loading,
    error,
    
    // Actions
    performSearch,
    saveSearch,
    submitRemovalRequest,
    updateRemovalStatus,
    addDataSource,
    loadSearchHistory,
    loadDataSources,
    loadRemovalRequests,
    initializeDataSources,
    
    // Helper functions
    searchDataSource,
    transformApiResponse,
    
    // Utilities
    clearError: () => setError(null)
  }
}

