'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import { AdminSidebar } from '@/components/AdminSidebar'

export default function AdminGroupLayout({ children }) {
  const router = useRouter()
  // Server-truth admin check. `undefined` = loading, boolean = resolved.
  const isAdmin = useQuery(api.users.isAdmin)

  useEffect(() => {
    if (isAdmin === false) router.replace('/')
  }, [isAdmin, router])

  if (isAdmin !== true) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden h-16" />
        {children}
      </main>
    </div>
  )
}
