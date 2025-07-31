'use client'

import { useState } from 'react'
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

export default function Home() {
  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth()
  const { 
    performSearch, 
    submitRemovalRequest, 
    searchHistory, 
    removalRequests,
    loading: dataLoading 
  } = useDataBroker()
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: ''
  })
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authMode, setAuthMode] = useState('signin') // 'signin' or 'signup'
  const [showAuthDialog, setShowAuthDialog] = useState(false)

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Search
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
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search Data Brokers
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Search Results */}
            {hasSearched && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Search Results
                </h2>
                
                {isSearching ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">
                      Searching data broker websites...
                    </p>
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
                            <div className="flex flex-wrap gap-2">
                              {result.dataFound.map((data, index) => (
                                <Badge key={index} variant="secondary">
                                  {data}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
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