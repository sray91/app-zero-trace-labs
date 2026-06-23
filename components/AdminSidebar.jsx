'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/contexts/AuthContext'
import {
  Users,
  Database,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Users', href: '/admin', icon: Users, exact: true },
  { name: 'Broker Catalog', href: '/admin/brokers', icon: Database },
  { name: 'User Dashboard', href: '/', icon: LayoutDashboard }
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const getInitials = (email) => (email ? email.substring(0, 2).toUpperCase() : 'A')

  const Content = () => (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Image
            src="/zero-trace-labs-logo-dark.png"
            alt="0TraceLabs"
            width={collapsed ? 40 : 44}
            height={collapsed ? 40 : 44}
            className="rounded-lg"
          />
          {!collapsed && (
            <span className="text-sm font-semibold font-outfit text-warning-yellow">
              Admin
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="lg:hidden">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-warning-yellow/10',
                isActive && 'bg-warning-yellow/10 text-warning-yellow border border-warning-yellow/20',
                !isActive && 'text-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className={cn('flex items-center space-x-3', collapsed && 'flex-col space-x-0 space-y-2')}>
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-warning-yellow text-black text-sm font-outfit">
              {getInitials(user?.email)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          )}
          <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} onClick={() => signOut()} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-card shadow-md border border-border"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-card border-r border-border transition-transform duration-300 lg:hidden w-64 flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Content />
      </aside>

      <aside
        className={cn(
          'hidden lg:flex lg:flex-col h-screen bg-card border-r border-border transition-all duration-300 sticky top-0',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <Content />
      </aside>
    </>
  )
}
