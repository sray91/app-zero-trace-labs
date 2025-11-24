'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, authOperations } from '../supabase'

const AuthContext = createContext({})

const FREE_PLAN_LABEL = 'Free Plan'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [plan, setPlan] = useState('free')
  const [planLabel, setPlanLabel] = useState(FREE_PLAN_LABEL)
  const [planLoading, setPlanLoading] = useState(false)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    setLoading(true)
    try {
      const result = await authOperations.signUp(email, password)
      return result
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const result = await authOperations.signIn(email, password)
      return result
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const result = await authOperations.signOut()
      setPlan('free')
      setPlanLabel(FREE_PLAN_LABEL)
      return result
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const syncPlanFromWhop = async () => {
      if (!user?.email) {
        if (isMounted) {
          setPlan('free')
          setPlanLabel(FREE_PLAN_LABEL)
          setPlanLoading(false)
        }
        return
      }

      setPlanLoading(true)

      try {
        const response = await fetch('/api/whop/plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: user.email })
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load Whop plan')
        }

        if (isMounted) {
          setPlan(payload?.plan || 'paid')
          setPlanLabel(payload?.planLabel || payload?.label || 'Paid Plan')
        }
      } catch (error) {
        console.error('Error syncing Whop plan:', error)
        if (isMounted) {
          setPlan('free')
          setPlanLabel(FREE_PLAN_LABEL)
        }
      } finally {
        if (isMounted) {
          setPlanLoading(false)
        }
      }
    }

    syncPlanFromWhop()

    return () => {
      isMounted = false
    }
  }, [user?.email])

  const value = {
    user,
    session,
    loading,
    plan,
    planLabel,
    planLoading,
    isPaidPlan: plan !== 'free',
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

