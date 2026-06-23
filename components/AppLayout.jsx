'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import { Sidebar } from '@/components/Sidebar'

export function AppLayout({ children }) {
  const router = useRouter()
  // `undefined` = loading, `null` = no profile yet, object = profile exists.
  const profile = useQuery(api.users.getProfile)

  const needsWelcome = profile === null || profile?.welcomeCompleted === false

  useEffect(() => {
    if (needsWelcome) {
      router.replace('/welcome')
    }
  }, [needsWelcome, router])

  if (profile === undefined || needsWelcome) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden h-16" /> {/* Spacer for mobile menu button */}
        {children}
      </main>
    </div>
  )
}
