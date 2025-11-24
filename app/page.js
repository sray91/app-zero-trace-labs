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
  const {
    user,
    signIn,
    signUp,
    loading: authLoading,
    planLabel,
    isPaidPlan,
    planLoading
  } = useAuth()
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
      <div className="min-h-screen bg-deep-void flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 animate-pulse">
            <Image
              src="/zero-trace-labs-logo-dark.png"
              alt="0TraceLabs"
              width={120}
              height={120}
              className="mx-auto rounded-xl"
            />
          </div>
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-nuclear-blue" />
          <p className="text-muted-gray font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Auth Dialog */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle className="font-outfit text-2xl">
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

              <Button type="submit" className="w-full btn-nuclear" disabled={authLoading}>
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
                  className="text-sm text-nuclear-blue hover:underline"
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
        <div className="mb-8 text-center scan-lines py-6">
          <div className="mb-4">
            <Image
              src="/zero-trace-labs-logo-dark.png"
              alt="0TraceLabs"
              width={100}
              height={100}
              className="mx-auto rounded-xl"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-outfit text-foreground">
            Welcome to 0TraceLabs
          </h1>
        </div>

        {/* Privacy Notice */}
        <Alert className="mb-8 max-w-4xl mx-auto border-nuclear-blue/30 bg-nuclear-blue/10">
          <AlertTriangle className="h-4 w-4 text-nuclear-blue" />
          <AlertDescription className="text-foreground">
            <strong>Your Privacy Matters:</strong> We help you discover and remove your personal information from data brokers.
            All searches are secure, and we never share your data without your consent.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <Card className="glass-card border-nuclear-blue/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold font-outfit text-nuclear-blue mb-2">
                    {searchHistory.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Searches
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-warning-yellow/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold font-outfit text-warning-yellow mb-2">
                    {removalRequests.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Removal Requests
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-success-green/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold font-outfit text-success-green mb-2">
                    {dataSources.length || '17+'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Brokers Monitored
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plan Indicator */}
        {user && (
          <div className="max-w-4xl mx-auto mb-6 text-center">
            <Badge variant={isPaidPlan ? 'default' : 'secondary'}>
              {planLoading ? 'Checking plan…' : `Current Plan: ${planLabel}`}
            </Badge>
          </div>
        )}

        {/* Quick Actions */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold font-outfit text-foreground mb-6 text-center">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Search Card (Free tier only) */}
            {!isPaidPlan && (
              <Card className="glass-card hover:shadow-lg hover:shadow-nuclear-blue/20 transition-all border-nuclear-blue/20">
                <CardHeader>
                  <CardTitle className="flex items-center font-outfit">
                    <Search className="h-5 w-5 mr-2 text-nuclear-blue" />
                    Quick Search
                    <Badge variant="secondary" className="ml-2">Free</Badge>
                  </CardTitle>
                  <CardDescription>
                    Search for your information across data broker websites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full btn-nuclear">
                    <Link href="/search">
                      Start Search
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Comprehensive Scan Card */}
            <Card className="glass-card hover:shadow-lg hover:shadow-nuclear-blue/20 transition-all border-nuclear-blue/20">
              <CardHeader>
                <CardTitle className="flex items-center font-outfit">
                  <Shield className="h-5 w-5 mr-2 text-nuclear-blue" />
                  Comprehensive Scan
                  {!isPaidPlan && <Badge variant="secondary" className="ml-2">Whop Upgrade</Badge>}
                </CardTitle>
                <CardDescription>
                  Deep scan across all {dataSources.length || '17+'} major data broker sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && isPaidPlan ? (
                  <Button asChild className="w-full btn-nuclear">
                    <Link href="/comprehensive">
                      Start Scan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full btn-nuclear" disabled variant="secondary">
                    {user ? 'Requires Paid Plan' : 'Sign in to continue'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {!isPaidPlan && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Unlock comprehensive scanning with a Whop membership.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* History Card */}
            <Card className="glass-card hover:shadow-lg hover:shadow-success-green/20 transition-all border-success-green/20">
              <CardHeader>
                <CardTitle className="flex items-center font-outfit">
                  <History className="h-5 w-5 mr-2 text-success-green" />
                  Search History
                  {!isPaidPlan && <Badge variant="secondary" className="ml-2">Whop Upgrade</Badge>}
                </CardTitle>
                <CardDescription>
                  View your previous searches and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && isPaidPlan ? (
                  <Button asChild className="w-full">
                    <Link href="/history">
                      View History
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" disabled variant="secondary">
                    {user ? 'Requires Paid Plan' : 'Sign in to continue'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {!isPaidPlan && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Sign in with a paid plan to save and view search history.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Removal Requests Card */}
            <Card className="glass-card hover:shadow-lg hover:shadow-warning-yellow/20 transition-all border-warning-yellow/20">
              <CardHeader>
                <CardTitle className="flex items-center font-outfit">
                  <FileText className="h-5 w-5 mr-2 text-warning-yellow" />
                  Removal Requests
                  {!isPaidPlan && <Badge variant="secondary" className="ml-2">Whop Upgrade</Badge>}
                </CardTitle>
                <CardDescription>
                  Track your data removal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && isPaidPlan ? (
                  <Button asChild className="w-full btn-detonate">
                    <Link href="/requests">
                      View Requests
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full btn-detonate" disabled variant="secondary">
                    {user ? 'Requires Paid Plan' : 'Sign in to continue'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {!isPaidPlan && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Upgrade on Whop to submit and track removal requests.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings Card */}
          {user && (
            <Card className="glass-card border-muted-gray/20 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center font-outfit">
                  <Settings className="h-5 w-5 mr-2 text-muted-gray" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your account and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full border-muted-gray/30 hover:bg-muted-gray/10">
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
            <Card className="glass-card border-nuclear-blue/30 bg-nuclear-blue/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold font-outfit text-foreground mb-2">
                    Sign in to unlock all features
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Get access to comprehensive scanning, search history, and removal request tracking
                  </p>
                  <Button onClick={() => setShowAuthDialog(true)} className="btn-nuclear">
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
