'use client'

import { useState, useEffect } from 'react'
import { useDataBroker } from '../lib/hooks/useDataBroker'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import Logo from './Logo'

export default function DataBrokerDashboard() {
  const {
    // State
    searchHistory,
    dataSources,
    removalRequests,
    reports,
    monitoringJobs,
    loading,
    error,
    operationProgress,
    
    // Core actions
    performSearch,
    initializeDataSources,
    
    // Enhanced email automation
    sendDataRequestEmails,
    sendDeletionRequestEmails,
    
    // Report generation
    generatePrivacyReport,
    
    // Progress monitoring
    setupMonitoring,
    runMonitoringJob,
    
    // Enhanced data sources
    loadExpandedBrokerList,
    
    // Data export
    exportData,
    
    // Utilities
    clearError
  } = useDataBroker()

  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  })

  const [activeTab, setActiveTab] = useState('search')

  // Initialize data sources on mount
  useEffect(() => {
    initializeDataSources()
  }, [])

  const handleSearch = async () => {
    const result = await performSearch(personalInfo)
    if (result.success) {
      console.log('Search completed:', result.results)
    }
  }

  const handleSendDataRequests = async () => {
    const result = await sendDataRequestEmails(personalInfo)
    if (result.success) {
      alert(`Data requests sent to ${result.results.filter(r => r.success).length} brokers`)
    }
  }

  const handleSendDeletionRequests = async () => {
    const result = await sendDeletionRequestEmails(personalInfo)
    if (result.success) {
      alert(`Deletion requests sent to ${result.results.filter(r => r.success).length} brokers`)
    }
  }

  const handleGenerateReport = async () => {
    const result = await generatePrivacyReport('all')
    if (result.success) {
      console.log('Privacy report generated:', result.report)
    }
  }

  const handleSetupMonitoring = async () => {
    const result = await setupMonitoring(personalInfo, 'monthly')
    if (result.success) {
      alert('Monitoring setup complete!')
    }
  }

  const handleLoadExpandedBrokers = async () => {
    const result = await loadExpandedBrokerList()
    if (result.success) {
      alert(`Added ${result.added} new data brokers`)
    }
  }

  const handleExportData = () => {
    const data = exportData('json', 'all')
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `privacy-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Logo size="large" animate={true} />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-indigo-300 mb-2">
          Enhanced Data Broker Monitor
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          JustVanish-style functionality with automated email campaigns, comprehensive reporting, and progress monitoring
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress indicator */}
      {loading && operationProgress.total > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{operationProgress.message}</span>
                <span>{operationProgress.current}/{operationProgress.total}</span>
              </div>
              <Progress value={(operationProgress.current / operationProgress.total) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Enter your details for data broker searches and removal requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Full Name"
              value={personalInfo.fullName}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, fullName: e.target.value }))}
            />
            <Input
              placeholder="Email Address"
              type="email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Phone Number"
              value={personalInfo.phone}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              placeholder="Address (Optional)"
              value={personalInfo.address}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search & Scan</TabsTrigger>
          <TabsTrigger value="automation">Email Automation</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Search & Scan Tab */}
        <TabsContent value="search" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleSearch} disabled={loading || !personalInfo.fullName}>
              {loading ? 'Searching...' : 'Search Data Brokers'}
            </Button>
            <Button onClick={handleLoadExpandedBrokers} disabled={loading}>
              Load Expanded Broker List
            </Button>
            <Button onClick={handleExportData}>
              Export All Data
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Data Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataSources.length}</div>
                <p className="text-xs text-gray-600">Active brokers monitored</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Search History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchHistory.length}</div>
                <p className="text-xs text-gray-600">Previous searches</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Removal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{removalRequests.length}</div>
                <p className="text-xs text-gray-600">Requests submitted</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Search Results */}
          {searchHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchHistory.slice(0, 3).map((search, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-semibold">{search.full_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(search.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {search.results?.filter(r => r.dataFound?.length > 0).map((result, idx) => (
                          <Badge key={idx} variant={result.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                            {result.source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Email Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Access Requests</CardTitle>
                <CardDescription>
                  Send CCPA/GDPR data access requests to all brokers (JustVanish-style)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSendDataRequests} 
                  disabled={loading || !personalInfo.fullName || !personalInfo.email}
                  className="w-full"
                >
                  Send Data Requests
                </Button>
                <p className="text-xs text-gray-600 mt-2">
                  This will send formal data access requests to {dataSources.length} data brokers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deletion Requests</CardTitle>
                <CardDescription>
                  Send deletion requests to remove your data from all brokers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSendDeletionRequests} 
                  disabled={loading || !personalInfo.fullName || !personalInfo.email}
                  className="w-full"
                >
                  Send Deletion Requests
                </Button>
                <p className="text-xs text-gray-600 mt-2">
                  This will send formal deletion requests to {dataSources.length} data brokers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Email Campaign History */}
          <Card>
            <CardHeader>
              <CardTitle>Email Campaign Status</CardTitle>
              <CardDescription>Track your automated email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-4">
                Email campaign history will appear here after sending requests
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports & Analytics Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleGenerateReport} disabled={loading}>
              Generate Privacy Report
            </Button>
            <Button onClick={handleExportData}>
              Export Data (CSV/JSON)
            </Button>
          </div>

          {/* Recent Reports */}
          {reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.slice(0, 3).map((report, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Privacy Report</p>
                          <p className="text-sm text-gray-600">
                            Generated {new Date(report.generated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          report.summary.privacy_score >= 80 ? 'default' :
                          report.summary.privacy_score >= 60 ? 'secondary' : 'destructive'
                        }>
                          Score: {report.summary.privacy_score}/100
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Brokers Found</p>
                          <p className="font-semibold">{report.summary.total_brokers_found}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Data Points</p>
                          <p className="font-semibold">{report.summary.total_data_points}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Removals</p>
                          <p className="font-semibold">{report.summary.completed_removals}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Monitoring</CardTitle>
              <CardDescription>
                Set up regular scans to monitor for new data exposures and track removal progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSetupMonitoring} 
                disabled={loading || !personalInfo.fullName}
                className="w-full"
              >
                Setup Monthly Monitoring
              </Button>
            </CardContent>
          </Card>

          {/* Active Monitoring Jobs */}
          {monitoringJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Monitoring Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monitoringJobs.map((job, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Monthly Scan</p>
                          <p className="text-sm text-gray-600">
                            Next run: {new Date(job.next_run).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={job.is_active ? 'default' : 'secondary'}>
                          {job.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => runMonitoringJob(job.id)}
                        disabled={loading}
                        className="mt-2"
                      >
                        Run Now
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}