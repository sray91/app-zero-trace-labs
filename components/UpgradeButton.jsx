'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Purchases } from '@revenuecat/purchases-js'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const WEB_BILLING_KEY = process.env.NEXT_PUBLIC_REVENUECAT_WEB_BILLING_KEY

// Configure the RevenueCat Web Billing SDK once per app_user_id (the Clerk id),
// so iOS and web resolve to the same entitlement.
function getPurchases(appUserId) {
  try {
    const existing = Purchases.getSharedInstance()
    if (existing && existing.getAppUserId?.() === appUserId) return existing
  } catch {
    // Not configured yet — fall through to configure below.
  }
  return Purchases.configure(WEB_BILLING_KEY, appUserId)
}

export function UpgradeButton({
  children = 'Upgrade',
  className,
  variant,
  size,
}) {
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!isLoaded || !user) {
      toast.error('Please sign in to upgrade.')
      return
    }
    if (!WEB_BILLING_KEY) {
      toast.error('Billing is not configured. Please contact support.')
      return
    }

    setLoading(true)
    try {
      const purchases = getPurchases(user.id)
      const offerings = await purchases.getOfferings()
      const pkg =
        offerings.current?.availablePackages?.[0] ??
        Object.values(offerings.all ?? {})[0]?.availablePackages?.[0]

      if (!pkg) {
        toast.error('No subscription plans are available right now.')
        return
      }

      await purchases.purchase({ rcPackage: pkg })
      // Entitlement is granted via the RevenueCat webhook -> Convex; the reactive
      // `getEntitlement` query flips the UI to paid once it lands.
      toast.success('Thanks for upgrading! Unlocking your plan…')
    } catch (err) {
      if (err?.errorCode === 'UserCancelledError' || err?.userCancelled) {
        // User closed the purchase sheet — no error to show.
        return
      }
      console.error('RevenueCat purchase failed:', err)
      toast.error(err?.message || 'Something went wrong starting checkout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      className={className}
      variant={variant}
      size={size}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {children}
    </Button>
  )
}
