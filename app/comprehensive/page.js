'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Loader2,
  ExternalLink
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

export default function ComprehensivePage() {
  const { user } = useAuth()
  const { scanPublicBrokerSites, submitRemovalRequest, dataSources } = useDataBroker()

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  })
  const [searchResults, setSearchResults] = useState([])
  const [isComprehensiveScanning, setIsComprehensiveScanning] = useState(false)
  const [comprehensiveScanResults, setComprehensiveScanResults] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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

    setIsComprehensiveScanning(true)

    try {
      const scanOptions = {
        priority: 2,
        batchSize: 5
      }

      const result = await scanPublicBrokerSites(formData, scanOptions)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Comprehensive Scan
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
            Deep scan across all major data broker and people-search sites.
          </p>
        </div>

        <Alert className="mb-8">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Comprehensive Public Broker Scanning:</strong> This feature automatically searches across
            {dataSources.length || '17+'} major public-facing data broker and people-search sites including
            Spokeo, WhitePages, Radaris, MyLife, and many others.
          </AlertDescription>
        </Alert>

        {/* Scan Configuration */}
        <Card className="mb-8 bg-white dark:bg-gray-800 shadow-sm">
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
          <Card className="mb-8">
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

        {/* Results */}
        {searchResults.length > 0 && (
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
        )}
      </div>
    </div>
  )
}
