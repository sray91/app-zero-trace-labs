import { createClient } from '@supabase/supabase-js'

// Environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema for our application
export const createTables = async () => {
  // This would be run once to set up the database schema
  // In a real application, this would be done via Supabase dashboard or migrations
  
  const searchHistoryTable = `
    CREATE TABLE IF NOT EXISTS search_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      results JSONB,
      user_id UUID REFERENCES auth.users(id)
    );
  `
  
  const dataSourcesTable = `
    CREATE TABLE IF NOT EXISTS data_sources (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      name TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      api_endpoint TEXT,
      risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
      description TEXT,
      data_types TEXT[],
      is_active BOOLEAN DEFAULT true
    );
  `
  
  const removalRequestsTable = `
    CREATE TABLE IF NOT EXISTS removal_requests (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_id UUID REFERENCES auth.users(id),
      data_source_id UUID REFERENCES data_sources(id),
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      status TEXT CHECK (status IN ('pending', 'submitted', 'completed', 'failed')) DEFAULT 'pending',
      notes TEXT
    );
  `
  
  console.log('Database schema defined. In production, these would be created via Supabase dashboard.')
  return { searchHistoryTable, dataSourcesTable, removalRequestsTable }
}

// Helper functions for database operations
export const searchOperations = {
  // Save search results to database
  saveSearch: async (searchData) => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .insert([searchData])
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error saving search:', error)
      return { data: null, error }
    }
  },
  
  // Get user's search history
  getSearchHistory: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching search history:', error)
      return { data: null, error }
    }
  }
}

export const dataSourceOperations = {
  // Get all active data sources
  getDataSources: async () => {
    try {
      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching data sources:', error)
      return { data: null, error }
    }
  },
  
  // Add a new data source
  addDataSource: async (sourceData) => {
    try {
      const { data, error } = await supabase
        .from('data_sources')
        .insert([sourceData])
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error adding data source:', error)
      return { data: null, error }
    }
  },

  // Seed initial data sources (run once to populate database)
  seedDataSources: async () => {
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
      }
    ]

    try {
      // Check if data sources already exist
      const { data: existingData } = await supabase
        .from('data_sources')
        .select('name')
      
      const existingNames = existingData?.map(ds => ds.name) || []
      const newDataSources = dataSources.filter(ds => !existingNames.includes(ds.name))
      
      if (newDataSources.length === 0) {
        return { data: existingData, error: null, message: 'Data sources already seeded' }
      }

      const { data, error } = await supabase
        .from('data_sources')
        .insert(newDataSources)
        .select()
      
      if (error) throw error
      return { data, error: null, message: `Added ${newDataSources.length} new data sources` }
    } catch (error) {
      console.error('Error seeding data sources:', error)
      return { data: null, error }
    }
  }
}

export const removalOperations = {
  // Submit a removal request
  submitRemovalRequest: async (requestData) => {
    try {
      const { data, error } = await supabase
        .from('removal_requests')
        .insert([requestData])
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error submitting removal request:', error)
      return { data: null, error }
    }
  },
  
  // Get user's removal requests
  getRemovalRequests: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('removal_requests')
        .select(`
          *,
          data_sources (
            name,
            url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching removal requests:', error)
      return { data: null, error }
    }
  },
  
  // Update removal request status
  updateRemovalStatus: async (requestId, status, notes = null) => {
    try {
      const updateData = { 
        status, 
        updated_at: new Date().toISOString() 
      }
      if (notes) updateData.notes = notes
      
      const { data, error } = await supabase
        .from('removal_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating removal request:', error)
      return { data: null, error }
    }
  }
}

// Authentication helpers
export const authOperations = {
  // Sign up a new user
  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      console.error('Error signing up:', error)
      return { data: null, error }
    }
  },
  
  // Sign in user
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      console.error('Error signing in:', error)
      return { data: null, error }
    }
  },
  
  // Sign out user
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error }
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error }
    } catch (error) {
      console.error('Error getting user:', error)
      return { user: null, error }
    }
  }
}

