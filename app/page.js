'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, 
  Shield, 
  AlertTriangle, 
  ExternalLink, 
  Loader2, 
  User, 
  LogIn, 
  LogOut,
  History,
  Settings
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useDataBroker } from '@/lib/hooks/useDataBroker'
import Image from 'next/image'

// Helper function to format address objects or strings
const formatAddress = (address) => {
  if (!address) return ''
  
  // If it's already a string, return it
  if (typeof address === 'string') return address
  
  // If it's an object, format it as a readable address
  if (typeof address === 'object') {
    const parts = []
    
    if (address.streetAddress) parts.push(address.streetAddress)
    if (address.addressLocality) parts.push(address.addressLocality)
    if (address.addressRegion) parts.push(address.addressRegion)
    if (address.postalCode) parts.push(address.postalCode)
    
    return parts.join(', ')
  }
  
  return String(address)
}

export default function Home() {
  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth()
  const { 
    performSearch, 
    submitRemovalRequest, 
    searchHistory, 
    removalRequests,
    scanPublicBrokerSites,
    loadExpandedBrokerList,
    dataSources,
    loading: dataLoading 
  } = useDataBroker()
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  })
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authMode, setAuthMode] = useState('signin') // 'signin' or 'signup'
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isComprehensiveScanning, setIsComprehensiveScanning] = useState(false)
  const [comprehensiveScanResults, setComprehensiveScanResults] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target
    setAuthForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    
    try {
      let result
      if (authMode === 'signin') {
        result = await signIn(authForm.email, authForm.password)
      } else {
        result = await signUp(authForm.email, authForm.password)
      }
      
      if (result.error) {
        alert(`Authentication failed: ${result.error.message}`)
      } else {
        setShowAuthDialog(false)
        setAuthForm({ email: '', password: '' })
        if (authMode === 'signup') {
          alert('Please check your email to confirm your account.')
        }
      }
    } catch (error) {
      alert(`Authentication error: ${error.message}`)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      alert(`Sign out error: ${error.message}`)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!formData.fullName.trim()) {
      alert('Please enter a full name to search')
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    
    try {
      const result = await performSearch(formData)
      if (result.success) {
        setSearchResults(result.results)
      } else {
        alert(`Search failed: ${result.error}`)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleComprehensiveScan = async (e) => {
    e.preventDefault()
    
    if (!formData.fullName.trim()) {
      alert('Please enter a full name to perform comprehensive scanning')
      return
    }

    if (!user) {
      alert('Please sign in to perform comprehensive scanning')
      return
    }

    console.log('🚀 Starting comprehensive scan with data:', {
      formData: formData,
      dataSources: dataSources.length,
      user: !!user
    })

    setIsComprehensiveScanning(true)
    setHasSearched(true)
    
    try {
      const scanOptions = {
        priority: 2, // Scan high and medium priority brokers
        batchSize: 5
      }
      
      console.log('🔧 Calling scanPublicBrokerSites with options:', scanOptions)
      const result = await scanPublicBrokerSites(formData, scanOptions)
      console.log('📊 Scan result:', result)
      if (result.success) {
        setComprehensiveScanResults(result)
        const mappedResults = result.results.map(r => ({
          id: r.broker_id || Date.now() + Math.random(),
          source: r.broker_name,
          url: r.url || '#',
          dataFound: r.dataFound || [],
          details: r.details || {},
          riskLevel: dataSources.find(ds => ds.name === r.broker_name)?.risk_level || 'medium',
          description: r.description || 'Comprehensive scan completed',
          scanMethod: r.scan_method,
          scanTimestamp: r.scan_timestamp
        }))
        
        console.log('🎯 Final mapped search results:', mappedResults.map(r => ({
          source: r.source,
          hasDetails: !!r.details && Object.keys(r.details).length > 0,
          detailsKeys: Object.keys(r.details || {}),
          detailsPreview: r.details
        })))
        
        setSearchResults(mappedResults)
      } else {
        alert(`Comprehensive scan failed: ${result.error}`)
        setSearchResults([])
        setComprehensiveScanResults(null)
      }
    } catch (error) {
      console.error('Comprehensive scan failed:', error)
      setSearchResults([])
      setComprehensiveScanResults(null)
      alert('Comprehensive scan failed. Please try again.')
    } finally {
      setIsComprehensiveScanning(false)
    }
  }

  const handleLoadBrokers = async () => {
    console.log('🔄 Loading brokers manually...')
    const result = await loadExpandedBrokerList()
    console.log('📋 Load brokers result:', result)
    if (result.success) {
      alert(`Successfully loaded ${result.added} brokers!`)
    } else {
      alert(`Failed to load brokers: ${result.error}`)
    }
  }

  const handleRemovalRequest = async (result) => {
    if (!user) {
      alert('Please sign in to submit removal requests')
      return
    }

    try {
      const requestData = {
        data_source_id: result.id, // In a real app, this would be the actual data source ID
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email
      }
      
      const response = await submitRemovalRequest(requestData)
      if (response.success) {
        alert('Removal request submitted successfully!')
      } else {
        alert(`Failed to submit removal request: ${response.error}`)
      }
    } catch (error) {
      alert('Failed to submit removal request. Please try again.')
    }
  }

  // Initialize data sources when component mounts
  useEffect(() => {
    if (user && dataSources.length === 0) {
      console.log('🔄 Auto-loading data sources...')
      loadExpandedBrokerList().then(result => {
        console.log('📋 Auto-load result:', result)
      })
    }
  }, [user, dataSources.length, loadExpandedBrokerList])

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-500 hover:bg-red-600'
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600'
      case 'low': return 'bg-green-500 hover:bg-green-600'
      default: return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 animate-pulse">
            <Image
              src="/zero-trace-labs-logo.png"
              alt="Zero Trace Labs"
              width={120}
              height={120}
              className="mx-auto rounded-xl"
            />
          </div>
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/zero-trace-labs-logo.png"
              alt="Zero Trace Labs"
              width={120}
              height={120}
              className="rounded-xl hover:scale-105 transition-transform duration-200"
            />
          </div>
          
          {/* Auth Section */}
          <div className="flex items-center justify-center space-x-4 mb-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                      </DialogTitle>
                      <DialogDescription>
                        {authMode === 'signin' 
                          ? 'Sign in to save your search history and manage removal requests.'
                          : 'Create an account to save your search history and manage removal requests.'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div>
                        <Label htmlFor="auth-email">Email</Label>
                        <Input
                          id="auth-email"
                          name="email"
                          type="email"
                          value={authForm.email}
                          onChange={handleAuthInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="auth-password">Password</Label>
                        <Input
                          id="auth-password"
                          name="password"
                          type="password"
                          value={authForm.password}
                          onChange={handleAuthInputChange}
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={authLoading}>
                        {authLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {authMode === 'signin' ? 'Signing In...' : 'Signing Up...'}
                          </>
                        ) : (
                          authMode === 'signin' ? 'Sign In' : 'Sign Up'
                        )}
                      </Button>
                      
                      <div className="text-center">
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:underline"
                          onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                        >
                          {authMode === 'signin' 
                            ? "Don't have an account? Sign up" 
                            : "Already have an account? Sign in"
                          }
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
          </div>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover where your personal information appears online across data broker websites. 
            Take control of your digital privacy.
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="comprehensive" className="flex items-center" disabled={!user}>
              <Shield className="h-4 w-4 mr-2" />
              Comprehensive Scan
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center" disabled={!user}>
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center" disabled={!user}>
              <Settings className="h-4 w-4 mr-2" />
              Requests
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search">
            {/* Privacy Notice */}
            <Alert className="mb-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy Notice:</strong> This tool searches public data sources to help you understand your online presence. 
                We do not store your personal information. All searches are performed in real-time and results are not saved unless you sign in.
              </AlertDescription>
            </Alert>

            {/* Search Form */}
            <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Search Your Information
                </CardTitle>
                <CardDescription>
                  Enter your details to see where your information appears online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address (Optional)</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSearching || isComprehensiveScanning}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Quick Search
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button"
                      onClick={handleComprehensiveScan}
                      variant="outline"
                      className="w-full" 
                      disabled={isSearching || isComprehensiveScanning || !user}
                    >
                      {isComprehensiveScanning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Comprehensive Scan
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Debug section - remove in production */}
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Debug: {dataSources.length} brokers loaded
                    </div>
                    <Button 
                      type="button"
                      onClick={handleLoadBrokers}
                      variant="secondary"
                      size="sm"
                      disabled={!user}
                    >
                      Load Brokers ({dataSources.length})
                    </Button>
                  </div>
                  
                  {!user && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                      Sign in to access comprehensive scanning across {dataSources.length || '17+'} public broker sites
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Search Results */}
            {hasSearched && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {comprehensiveScanResults ? 'Comprehensive Scan Results' : 'Search Results'}
                  </h2>
                  {comprehensiveScanResults && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Scanned {comprehensiveScanResults.total_scanned} sites • 
                      Found data on {comprehensiveScanResults.brokers_with_data} brokers • 
                      {comprehensiveScanResults.total_data_points} data points
                    </div>
                  )}
                </div>
                
                {(isSearching || isComprehensiveScanning) ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">
                      {isComprehensiveScanning ? 
                        'Scanning public broker websites comprehensively...' : 
                        'Searching data broker websites...'
                      }
                    </p>
                    {isComprehensiveScanning && (
                      <p className="text-sm text-gray-500 mt-2">
                        This may take a few minutes as we search across multiple sites
                      </p>
                    )}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid gap-4">
                    {searchResults.map((result) => (
                      <Card key={result.id} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {result.source}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 mb-3">
                                {result.description}
                              </p>
                            </div>
                            <Badge className={getRiskBadgeColor(result.riskLevel)}>
                              {result.riskLevel.toUpperCase()} RISK
                            </Badge>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              Data Found:
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {result.dataFound.map((data, index) => (
                                <Badge key={index} variant="secondary">
                                  {data}
                                </Badge>
                              ))}
                            </div>
                            
                            {/* Display actual data values if available */}
                            {result.details && Object.keys(result.details).length > 0 && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Found Information:
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  {result.details.name && (
                                    <div>
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                                      <span className="ml-2 text-gray-900 dark:text-white">{result.details.name}</span>
                                    </div>
                                  )}
                                  {result.details.age && (
                                    <div>
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Age:</span>
                                      <span className="ml-2 text-gray-900 dark:text-white">{result.details.age}</span>
                                    </div>
                                  )}
                                  {result.details.current_address && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Address:</span>
                                      <span className="ml-2 text-gray-900 dark:text-white">{formatAddress(result.details.current_address)}</span>
                                    </div>
                                  )}
                                  {result.details.birth_date && (
                                    <div>
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Born:</span>
                                      <span className="ml-2 text-gray-900 dark:text-white">{result.details.birth_date}</span>
                                    </div>
                                  )}
                                  {result.details.county && (
                                    <div>
                                      <span className="font-medium text-gray-600 dark:text-gray-400">County:</span>
                                      <span className="ml-2 text-gray-900 dark:text-white">{result.details.county}</span>
                                    </div>
                                  )}
                                  {result.details.phones && result.details.phones.length > 0 && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span>
                                      <div className="ml-2 text-gray-900 dark:text-white">
                                        {result.details.phones.slice(0, 2).map((phone, idx) => (
                                          <div key={idx} className="text-sm">
                                            {typeof phone === 'string' ? phone : (
                                              <span>
                                                {phone.number}
                                                {phone.type && <span className="text-gray-500 ml-1">({phone.type})</span>}
                                                {phone.provider && <span className="text-gray-500 ml-1">- {phone.provider}</span>}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                        {result.details.phones.length > 2 && (
                                          <span className="text-gray-500 text-xs">+{result.details.phones.length - 2} more</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {result.details.emails && result.details.emails.length > 0 && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>
                                      <div className="ml-2 text-gray-900 dark:text-white">
                                        {result.details.emails.slice(0, 2).map((email, idx) => (
                                          <div key={idx} className="text-sm">{email}</div>
                                        ))}
                                        {result.details.emails.length > 2 && (
                                          <span className="text-gray-500 text-xs">+{result.details.emails.length - 2} more</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {result.details.relatives && result.details.relatives.length > 0 && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Relatives:</span>
                                      <span className="ml-2 text-gray-900 dark:text-white">
                                        {typeof result.details.relatives === 'string' 
                                          ? result.details.relatives
                                          : result.details.relatives.slice(0, 3).join(', ')
                                        }
                                        {Array.isArray(result.details.relatives) && result.details.relatives.length > 3 && ` (+${result.details.relatives.length - 3} more)`}
                                      </span>
                                    </div>
                                  )}
                                  {result.details.associates && result.details.associates.length > 0 && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Associates:</span>
                                      <span className="ml-2 text-gray-900 dark:text-white">
                                        {typeof result.details.associates === 'string' 
                                          ? result.details.associates
                                          : result.details.associates.slice(0, 3).join(', ')
                                        }
                                        {Array.isArray(result.details.associates) && result.details.associates.length > 3 && ` (+${result.details.associates.length - 3} more)`}
                                      </span>
                                    </div>
                                  )}
                                  {result.details.previous_addresses && result.details.previous_addresses.length > 0 && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Previous Address:</span>
                                      <span className="ml-2 text-gray-900 dark:text-white">
                                        {typeof result.details.previous_addresses === 'string' 
                                          ? result.details.previous_addresses
                                          : formatAddress(result.details.previous_addresses[0])
                                        }
                                      </span>
                                      {Array.isArray(result.details.previous_addresses) && result.details.previous_addresses.length > 1 && (
                                        <span className="text-gray-500"> (+{result.details.previous_addresses.length - 1} more)</span>
                                      )}
                                    </div>
                                  )}
                                  {result.details.person_link && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Profile:</span>
                                      <a href={result.details.person_link} target="_blank" rel="noopener noreferrer" 
                                         className="ml-2 text-blue-600 dark:text-blue-400 hover:underline text-sm">
                                        View Full Profile
                                      </a>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Data Sources Section */}
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h.01a1 1 0 100-2H5zm3 0a1 1 0 000 2h3a1 1 0 100-2H8z" clipRule="evenodd" />
                                    </svg>
                                    Data Sources & Verification
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Search Engine:</span>
                                        <Badge variant="outline" className="text-xs">APIFY Skip Trace</Badge>
                                      </div>
                                      <div className="text-gray-600 dark:text-gray-400">
                                        Professional-grade data aggregation service
                                      </div>
                                    </div>
                                    
                                    {result.details.search_metadata?.search_option && (
                                      <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-gray-700 dark:text-gray-300">Search Method:</span>
                                          <Badge variant="secondary" className="text-xs">{result.details.search_metadata.search_option}</Badge>
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400">
                                          Input: "{result.details.search_metadata.input_given}"
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Records Found:</span>
                                        <Badge variant="default" className="text-xs">{result.details.total_records || 1}</Badge>
                                      </div>
                                      <div className="text-gray-600 dark:text-gray-400">
                                        Aggregated from multiple public data sources
                                      </div>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Confidence:</span>
                                        <Badge variant={result.confidence === 'high' ? 'default' : 'secondary'} className="text-xs">
                                          {result.confidence?.toUpperCase() || 'HIGH'}
                                        </Badge>
                                      </div>
                                      <div className="text-gray-600 dark:text-gray-400">
                                        Based on data verification algorithms
                                      </div>
                                    </div>
                                    
                                    {result.details.search_metadata?.actor_run_id && (
                                      <div className="md:col-span-2 bg-white dark:bg-gray-800 p-2 rounded border">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-gray-700 dark:text-gray-300">Trace ID:</span>
                                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                            {result.details.search_metadata.actor_run_id}
                                          </span>
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400">
                                          Unique identifier for this search operation
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Data Sources Disclaimer */}
                                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-start">
                                      <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      <div>
                                        <h6 className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Data Sources</h6>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                          Information aggregated from public records, voter registrations, property records, 
                                          court documents, and other publicly available sources. Data accuracy may vary.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                                                      <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a 
                                  href={result.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center"
                                >
                                  Visit Site
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </Button>
                              {result.scanMethod && (
                                <Badge variant="secondary" className="text-xs">
                                  {result.scanMethod === 'api' ? 'API' : 'Scraped'}
                                </Badge>
                              )}
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRemovalRequest(result)}
                            >
                              Request Removal
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <CardContent className="text-center py-8">
                      <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No Results Found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Great news! We couldn't find your information on any of the searched data broker sites.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Comprehensive Scan Tab */}
          <TabsContent value="comprehensive">
            <Alert className="mb-8">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Comprehensive Public Broker Scanning:</strong> This feature automatically searches across 
                {dataSources.length || '17+'} major public-facing data broker and people-search sites including 
                Spokeo, WhitePages, Radaris, MyLife, and many others. The system performs automated searches 
                using your provided data to see if your profile appears on hundreds of these sites.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6">
              {/* Scan Configuration */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Public Broker Site Scanning
                  </CardTitle>
                  <CardDescription>
                    Automated scanning across major data broker and people-search websites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleComprehensiveScan} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="scan-fullName">Full Name *</Label>
                        <Input
                          id="scan-fullName"
                          name="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="scan-phone">Phone Number</Label>
                        <Input
                          id="scan-phone"
                          name="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="scan-email">Email Address</Label>
                        <Input
                          id="scan-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="scan-address">Address (Optional)</Label>
                        <Input
                          id="scan-address"
                          name="address"
                          type="text"
                          placeholder="Enter your address"
                          value={formData.address || ''}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Scanning Scope
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-red-600">High Priority</div>
                          <div className="text-gray-600 dark:text-gray-300">
                            Comprehensive sites with detailed profiles<br/>
                            (Spokeo, MyLife, InstantCheckmate, etc.)
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-yellow-600">Medium Priority</div>
                          <div className="text-gray-600 dark:text-gray-300">
                            Public record aggregators<br/>
                            (WhitePages, Radaris, PeopleFinders, etc.)
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">Directory Services</div>
                          <div className="text-gray-600 dark:text-gray-300">
                            Basic directory listings<br/>
                            (YellowPages, AnyWho, etc.)
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isComprehensiveScanning || !user}
                      size="lg"
                    >
                      {isComprehensiveScanning ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Scanning {dataSources.length || '17+'} Public Broker Sites...
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5 mr-2" />
                          Start Comprehensive Scan
                        </>
                      )}
                    </Button>
                    
                    {!user && (
                      <Alert>
                        <AlertDescription>
                          Please sign in to access comprehensive scanning features. This will allow you to 
                          save your scan results and track removal requests across all discovered data brokers.
                        </AlertDescription>
                      </Alert>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Scan Results Summary */}
              {comprehensiveScanResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Scan Summary</CardTitle>
                    <CardDescription>
                      Comprehensive scan completed on {new Date().toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {comprehensiveScanResults.total_scanned}
                        </div>
                        <div className="text-sm text-gray-600">Sites Scanned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {comprehensiveScanResults.brokers_with_data}
                        </div>
                        <div className="text-sm text-gray-600">Found Data</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {comprehensiveScanResults.total_data_points}
                        </div>
                        <div className="text-sm text-gray-600">Data Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.max(0, comprehensiveScanResults.total_scanned - comprehensiveScanResults.brokers_with_data)}
                        </div>
                        <div className="text-sm text-gray-600">Clean Sites</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle>Search History</CardTitle>
                <CardDescription>
                  Your previous searches and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchHistory.length > 0 ? (
                  <div className="space-y-4">
                    {searchHistory.map((search) => (
                      <div key={search.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{search.full_name}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(search.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {search.phone && `Phone: ${search.phone}`}
                          {search.phone && search.email && ' • '}
                          {search.email && `Email: ${search.email}`}
                        </p>
                        <p className="text-sm">
                          Found on {search.results?.length || 0} data broker sites
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No search history yet. Perform a search to see your history here.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle>Removal Requests</CardTitle>
                <CardDescription>
                  Track your data removal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {removalRequests.length > 0 ? (
                  <div className="space-y-4">
                    {removalRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{request.full_name}</h4>
                          <Badge variant={
                            request.status === 'completed' ? 'default' :
                            request.status === 'pending' ? 'secondary' :
                            request.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {request.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Data Source: {request.data_sources?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                        {request.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            Notes: {request.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No removal requests yet. Submit a removal request from search results to track them here.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}