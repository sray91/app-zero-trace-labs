'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Shield,
  AlertTriangle,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useDataBroker } from '@/lib/hooks/useDataBroker'

// Helper function to format address objects or strings
const formatAddress = (address) => {
  if (!address) return ''

  if (typeof address === 'string') return address

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

export default function SearchPage() {
  const { user, isPaidPlan } = useAuth()
  const { performSearch, submitRemovalRequest, dataSources } = useDataBroker()

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  })
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
        data_source_id: result.id,
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

  if (user && isPaidPlan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quick Search Unavailable
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
              Your Whop membership unlocks comprehensive scanning. Please use the comprehensive scan experience instead of the quick search.
            </p>
          </div>

          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="py-10 text-center space-y-4">
              <Shield className="h-10 w-10 mx-auto text-nuclear-blue" />
              <p className="text-lg text-gray-700 dark:text-gray-200">
                Paid plans route all searches through the comprehensive scanner for deeper coverage.
              </p>
              <Button asChild className="btn-nuclear">
                <Link href="/comprehensive" className="inline-flex items-center justify-center">
                  Go to Comprehensive Scan
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quick Search
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
            Search for your personal information across data broker websites.
          </p>
        </div>

        {/* Privacy Notice */}
        <Alert className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> This tool searches public data sources to help you understand your online presence.
            We do not store your personal information. All searches are performed in real-time and results are not saved unless you sign in.
          </AlertDescription>
        </Alert>

        {/* Search Form */}
        <Card className="mb-8 bg-white dark:bg-gray-800 shadow-sm">
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
                    Quick Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Search Results
              </h2>
            </div>

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
                  <Card key={result.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
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
              <Card className="bg-white dark:bg-gray-800">
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
      </div>
    </div>
  )
}
