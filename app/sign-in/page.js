'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'
import Logo from '@/components/Logo'

export default function SignInPage() {
  const router = useRouter()
  const [step, setStep] = useState('email') // 'email', 'password', 'create-password'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasWhopSubscription, setHasWhopSubscription] = useState(false)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Check if customer exists with Whop subscription
      const response = await fetch(`/api/check-whop-customer?email=${encodeURIComponent(email)}`)
      const customerData = await response.json()

      if (customerData.error) {
        setError('An error occurred. Please try again.')
        setLoading(false)
        return
      }

      // If user has auth account, show password field
      if (customerData.hasAuthAccount) {
        setStep('password')
      }
      // If user has Whop subscription but no auth account, show password creation
      else if (customerData.hasCustomer && customerData.hasActiveSubscription) {
        setHasWhopSubscription(true)
        setStep('create-password')
      }
      // No account and no subscription - redirect to pricing
      else {
        window.location.href = 'https://0tracelabs.com/pricing'
        return
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Check if user has completed welcome flow
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('welcome_completed')
        .eq('user_id', data.user.id)
        .single()

      if (!userData || !userData.welcome_completed) {
        router.push('/welcome')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
      setLoading(false)
    }
  }

  const handlePasswordCreation = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      // Create Supabase auth account for Whop customer
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
          data: {
            is_whop_customer: true
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        setError('')
        alert('Please check your email to confirm your account, then sign in with your password.')
        setStep('email')
      } else if (data?.session) {
        // Auto-signed in, redirect to welcome
        router.push('/welcome')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">
              {step === 'email' && 'Welcome to 0Trace'}
              {step === 'password' && 'Sign In'}
              {step === 'create-password' && 'Set Up Your Password'}
            </CardTitle>
            <CardDescription>
              {step === 'email' && 'Enter your email to get started'}
              {step === 'password' && 'Enter your password to continue'}
              {step === 'create-password' && 'Create a password for your account'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
              <div className="text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <a
                  href="https://0tracelabs.com/pricing"
                  className="text-blue-600 hover:underline font-medium"
                >
                  View Plans
                </a>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-display">Email</Label>
                <Input
                  id="email-display"
                  type="email"
                  value={email}
                  disabled
                  className="bg-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('email')
                    setPassword('')
                    setError('')
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
              <div className="text-center text-sm">
                <a href="/auth/forgot-password" className="text-blue-600 hover:underline">
                  Forgot password?
                </a>
              </div>
            </form>
          )}

          {step === 'create-password' && (
            <form onSubmit={handlePasswordCreation} className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  We found your Whop subscription! Set up a password to access your account.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="email-display">Email</Label>
                <Input
                  id="email-display"
                  type="email"
                  value={email}
                  disabled
                  className="bg-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Create a password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('email')
                    setPassword('')
                    setConfirmPassword('')
                    setError('')
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Create Password'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
