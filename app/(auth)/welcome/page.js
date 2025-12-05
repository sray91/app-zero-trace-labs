'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  User,
  Shield,
  Sparkles,
  Trophy,
  Search,
  FileText,
  BarChart,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import Logo from '@/components/Logo'

export default function WelcomePage() {
  const router = useRouter()
  const { user, loading: authLoading, plan, planLabel } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')

  // Step 2: Feature tour (just viewing)
  const [tourCompleted, setTourCompleted] = useState(false)

  // Step 3: Privacy consent
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  useEffect(() => {
    // Load existing profile data if any
    const loadProfile = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setDateOfBirth(data.date_of_birth || '')
        setPhoneNumber(data.phone_number || '')
        setAddressLine1(data.address_line1 || '')
        setAddressLine2(data.address_line2 || '')
        setCity(data.city || '')
        setState(data.state || '')
        setZipCode(data.zip_code || '')
        setPrivacyConsent(data.privacy_consent_given || false)
        setTermsAccepted(data.terms_accepted || false)

        // If already completed, redirect to app
        if (data.welcome_completed) {
          router.push('/')
        }
      }
    }

    loadProfile()
  }, [user, router])

  const savePersonalInfo = async () => {
    if (!user) return false

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth || null,
          phone_number: phoneNumber || null,
          address_line1: addressLine1,
          address_line2: addressLine2 || null,
          city: city,
          state: state,
          zip_code: zipCode,
          welcome_step: 1
        })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return false
      }

      return true
    } catch (err) {
      console.error('Error saving personal info:', err)
      setError('Failed to save information')
      setLoading(false)
      return false
    }
  }

  const completeWelcome = async () => {
    if (!user) return false

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          privacy_consent_given: privacyConsent,
          privacy_consent_date: privacyConsent ? new Date().toISOString() : null,
          terms_accepted: termsAccepted,
          terms_accepted_date: termsAccepted ? new Date().toISOString() : null,
          tour_completed: true,
          welcome_completed: true,
          welcome_step: 4
        })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return false
      }

      return true
    } catch (err) {
      console.error('Error completing welcome:', err)
      setError('Failed to complete setup')
      setLoading(false)
      return false
    }
  }

  const handleNext = async () => {
    setError('')

    // Validate current step
    if (currentStep === 1) {
      if (!firstName || !lastName || !addressLine1 || !city || !state || !zipCode) {
        setError('Please fill in all required fields')
        return
      }

      const saved = await savePersonalInfo()
      if (!saved) return
    }

    if (currentStep === 3) {
      if (!privacyConsent || !termsAccepted) {
        setError('Please accept the privacy policy and terms of service to continue')
        return
      }
    }

    if (currentStep === 4) {
      const completed = await completeWelcome()
      if (completed) {
        router.push('/')
      }
      return
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    setLoading(false)
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                {currentStep === 1 && 'Welcome! Let\'s Get Started'}
                {currentStep === 2 && 'Feature Tour'}
                {currentStep === 3 && 'Privacy & Consent'}
                {currentStep === 4 && 'You\'re All Set!'}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <CardDescription>
              {currentStep === 1 && 'Tell us about yourself to help us protect your privacy'}
              {currentStep === 2 && 'Discover what you can do with 0Trace'}
              {currentStep === 3 && 'Review and accept our privacy policy'}
              {currentStep === 4 && `You're on the ${planLabel} plan. Start protecting your privacy!`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>This information helps us find and remove your data from data brokers</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="CA"
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="12345"
                  maxLength={10}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Feature Tour */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <Search className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Quick Search</h3>
                    <p className="text-sm text-muted-foreground">
                      Instantly search across major data brokers to see where your information appears.
                      Get a quick overview of your digital footprint.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <BarChart className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Comprehensive Scan</h3>
                    <p className="text-sm text-muted-foreground">
                      Run a deep scan across hundreds of data brokers. Track exactly where your data
                      is being sold and build a complete removal strategy.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Removal Requests</h3>
                    <p className="text-sm text-muted-foreground">
                      Submit automated removal requests to data brokers. Track the status of each
                      request and get notified when your data is removed.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <Shield className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Ongoing Monitoring</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up continuous monitoring to alert you when your information reappears on
                      data broker sites, so you can take action immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Privacy & Consent */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your privacy is our top priority. We use your information solely to help you remove
                  your data from data brokers. We never sell or share your information.
                </AlertDescription>
              </Alert>

              <div className="space-y-4 border rounded-lg p-6">
                <h3 className="font-semibold text-lg">Privacy Policy & Terms</h3>

                <div className="space-y-3 text-sm text-muted-foreground max-h-64 overflow-y-auto">
                  <p>
                    <strong>What we collect:</strong> We collect the personal information you provide
                    (name, address, phone, email, DOB) to search for and remove your data from data
                    broker databases.
                  </p>
                  <p>
                    <strong>How we use it:</strong> Your information is used exclusively to:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Search data broker databases for your information</li>
                    <li>Submit removal requests on your behalf</li>
                    <li>Monitor for re-appearance of your data</li>
                    <li>Provide you with reports and updates</li>
                  </ul>
                  <p>
                    <strong>Data security:</strong> We use industry-standard encryption and security
                    measures to protect your information. Your data is stored securely and never shared
                    with third parties except as necessary to fulfill removal requests.
                  </p>
                  <p>
                    <strong>Your rights:</strong> You can request to view, update, or delete your
                    information at any time through your account settings or by contacting support.
                  </p>
                  <p>
                    <strong>CCPA & GDPR Compliance:</strong> We comply with CCPA, GDPR, and other
                    privacy regulations. You have the right to opt-out of data collection and request
                    deletion of your information.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="privacy"
                      checked={privacyConsent}
                      onCheckedChange={setPrivacyConsent}
                    />
                    <label
                      htmlFor="privacy"
                      className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I have read and agree to the Privacy Policy. I understand how my data will be
                      used to help remove my information from data brokers.
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={setTermsAccepted}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the Terms of Service and acknowledge that 0Trace will act on my
                      behalf to submit data removal requests.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Plan Summary & Completion */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">Welcome to 0Trace!</h3>
                <p className="text-muted-foreground">
                  Your account is ready. Let's take a look at what you can do.
                </p>
              </div>

              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Your Plan</h4>
                    <p className="text-2xl font-bold text-blue-600">{planLabel}</p>
                  </div>
                  <Trophy className="h-12 w-12 text-yellow-500" />
                </div>

                <div className="space-y-2 text-sm">
                  {plan !== 'free' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Unlimited comprehensive scans</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Automated removal requests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Search history & tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Ongoing monitoring & alerts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Priority support</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Quick search across major brokers</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        <span>Upgrade for comprehensive scans & removal</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Pro tip: Start with a comprehensive scan to see exactly where your data appears,
                  then submit removal requests in bulk to protect your privacy faster.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  Get Started
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
