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

  // Mock search function (to be replaced with real API calls)
  const performSearch = async (searchParams) => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock results based on search parameters
      const mockResults = [
        {
          id: 1,
          source: 'Spokeo',
          url: 'https://spokeo.com',
          dataFound: ['Name', 'Age', 'Address', 'Phone'],
          riskLevel: 'high',
          description: 'Comprehensive profile with personal details'
        },
        {
          id: 2,
          source: 'White Pages',
          url: 'https://whitepages.com',
          dataFound: ['Name', 'Phone', 'Address History'],
          riskLevel: 'medium',
          description: 'Contact information and address history'
        },
        {
          id: 3,
          source: 'BeenVerified',
          url: 'https://beenverified.com',
          dataFound: ['Name', 'Email', 'Social Media'],
          riskLevel: 'medium',
          description: 'Social media profiles and contact info'
        },
        {
          id: 4,
          source: 'PeopleFinder',
          url: 'https://peoplefinder.com',
          dataFound: ['Name', 'Relatives', 'Associates'],
          riskLevel: 'low',
          description: 'Basic information and connections'
        }
      ]
      
      // Save search to history if user is authenticated
      if (user) {
        await saveSearch({
          full_name: searchParams.fullName,
          phone: searchParams.phone,
          email: searchParams.email,
          results: mockResults
        })
      }
      
      return { success: true, results: mockResults }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
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
    
    // Utilities
    clearError: () => setError(null)
  }
}

