'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Shield,
  History,
  FileText,
  Settings,
  Loader2,
  ArrowRight,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useDataBroker } from '@/lib/hooks/useDataBroker'
import { useState } from 'react'

export default function Home() {
  const { user, signIn, signUp, loading: authLoading } = useAuth()
  const { searchHistory, removalRequests, dataSources, loadDataSources } = useDataBroker()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authMode, setAuthMode] = useState('signin')

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

  // Initialize data sources when component mounts
  useEffect(() => {
    if (user && dataSources.length === 0) {
      loadDataSources()
    }
  }, [user, dataSources.length, loadDataSources])

  // Listen for auth dialog open events from sidebar
  useEffect(() => {
    const handleOpenAuthDialog = () => {
      setShowAuthDialog(true)
    }

    window.addEventListener('openAuthDialog', handleOpenAuthDialog)
    return () => window.removeEventListener('openAuthDialog', handleOpenAuthDialog)
  }, [])

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Auth Dialog */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
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

        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="mb-6">
            <Image
              src="/zero-trace-labs-logo.png"
              alt="Zero Trace Labs"
              width={100}
              height={100}
              className="mx-auto rounded-xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Zero Trace Labs
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Take control of your digital privacy. Search, monitor, and remove your personal information from data broker websites.
          </p>
        </div>

        {/* Privacy Notice */}
        <Alert className="mb-8 max-w-4xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Your Privacy Matters:</strong> We help you discover and remove your personal information from data brokers.
            All searches are secure, and we never share your data without your consent.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {searchHistory.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Total Searches
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {removalRequests.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Removal Requests
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {dataSources.length || '17+'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Brokers Monitored
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Search Card */}
            <Card className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Search
                </CardTitle>
                <CardDescription>
                  Search for your information across data broker websites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/search">
                    Start Search
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Comprehensive Scan Card */}
            <Card className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-purple-600" />
                  Comprehensive Scan
                  {!user && <Badge variant="secondary" className="ml-2">Pro</Badge>}
                </CardTitle>
                <CardDescription>
                  Deep scan across all {dataSources.length || '17+'} major data broker sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" disabled={!user} variant={user ? "default" : "secondary"}>
                  <Link href="/comprehensive">
                    Start Scan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* History Card */}
            <Card className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2 text-green-600" />
                  Search History
                  {!user && <Badge variant="secondary" className="ml-2">Pro</Badge>}
                </CardTitle>
                <CardDescription>
                  View your previous searches and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" disabled={!user} variant={user ? "default" : "secondary"}>
                  <Link href="/history">
                    View History
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Removal Requests Card */}
            <Card className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Removal Requests
                  {!user && <Badge variant="secondary" className="ml-2">Pro</Badge>}
                </CardTitle>
                <CardDescription>
                  Track your data removal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" disabled={!user} variant={user ? "default" : "secondary"}>
                  <Link href="/requests">
                    View Requests
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Settings Card */}
          {user && (
            <Card className="bg-white dark:bg-gray-800 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-gray-600" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your account and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/settings">
                    Open Settings
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Sign In CTA */}
          {!user && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Sign in to unlock all features
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Get access to comprehensive scanning, search history, and removal request tracking
                  </p>
                  <Button onClick={() => setShowAuthDialog(true)}>
                    Sign In / Sign Up
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
