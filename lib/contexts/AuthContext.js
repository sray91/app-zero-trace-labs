'use client'

// Backed by Clerk (identity) + Convex (entitlement). Kept at this path and with the
// same return shape so existing consumers don't need import changes.
import { useMemo } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

const FREE_PLAN_LABEL = 'Free Plan'

export const useAuth = () => {
  const { user: clerkUser, isLoaded } = useUser()
  const clerk = useClerk()
  const entitlement = useQuery(
    api.subscriptions.getEntitlement,
    isLoaded && clerkUser ? {} : 'skip'
  )

  // Memoize so the returned `user` keeps a stable identity across renders.
  // Consumers depend on `user` in effects/useCallback (useDataBroker,
  // useExposureTracker); a fresh object each render makes those effects refire
  // every render -> setState -> re-render -> infinite loop (freezes the app).
  const id = clerkUser?.id ?? null
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null
  const firstName = clerkUser?.firstName ?? null
  const lastName = clerkUser?.lastName ?? null
  const imageUrl = clerkUser?.imageUrl ?? null

  const user = useMemo(
    () => (id ? { id, email, firstName, lastName, imageUrl } : null),
    [id, email, firstName, lastName, imageUrl]
  )

  const plan = entitlement?.plan ?? 'free'

  // Admin is driven by Clerk publicMetadata.role (set in the Clerk dashboard).
  // Instant client-side gate; Convex mutations enforce it server-side as well.
  const isAdmin = clerkUser?.publicMetadata?.role === 'admin'

  return {
    user,
    loading: !isLoaded,
    plan,
    planLabel: entitlement?.planLabel ?? FREE_PLAN_LABEL,
    planLoading: Boolean(clerkUser) && entitlement === undefined,
    isPaidPlan: entitlement?.isPaid ?? false,
    isAdmin,
    signOut: () => clerk.signOut(),
  }
}
