'use client'

// Backed by Clerk (identity) + Convex (entitlement). Kept at this path and with the
// same return shape so existing consumers don't need import changes.
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

  const user = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
        firstName: clerkUser.firstName ?? null,
        lastName: clerkUser.lastName ?? null,
        imageUrl: clerkUser.imageUrl ?? null,
      }
    : null

  const plan = entitlement?.plan ?? 'free'

  return {
    user,
    loading: !isLoaded,
    plan,
    planLabel: entitlement?.planLabel ?? FREE_PLAN_LABEL,
    planLoading: Boolean(clerkUser) && entitlement === undefined,
    isPaidPlan: entitlement?.isPaid ?? false,
    signOut: () => clerk.signOut(),
  }
}
