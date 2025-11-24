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
  Search,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  FileText,
  Home,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Search and monitor your data',
    planVisibility: 'all'
  },
  {
    name: 'Search',
    href: '/search',
    icon: Search,
    description: 'Quick data broker search',
    planVisibility: 'freeOnly'
  },
  {
    name: 'Comprehensive Scan',
    href: '/comprehensive',
    icon: Shield,
    description: 'Deep scan across all brokers',
    requiresAuth: true,
    requiresPaidPlan: true,
    planVisibility: 'all'
  },
  {
    name: 'History',
    href: '/history',
    icon: History,
    description: 'View search history',
    requiresAuth: true,
    requiresPaidPlan: true,
    planVisibility: 'all'
  },
  {
    name: 'Removal Requests',
    href: '/requests',
    icon: FileText,
    description: 'Track removal requests',
    requiresAuth: true,
    requiresPaidPlan: true,
    planVisibility: 'all'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account settings',
    requiresAuth: true,
    requiresPaidPlan: true,
    planVisibility: 'all'
  }
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut, planLabel, isPaidPlan } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getInitials = (email) => {
    if (!email) return 'U'
    return email.substring(0, 2).toUpperCase()
  }

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-border",
        collapsed ? "flex-col space-y-2" : ""
      )}>
        <div className={cn(
          "flex items-center justify-center",
          !collapsed && "w-full"
        )}>
          <div className={cn(
            "relative flex-shrink-0",
            collapsed ? "w-12 h-12" : "w-32 h-32"
          )}>
            <Image
              src="/zero-trace-labs-logo-dark.png"
              alt="0TraceLabs"
              width={collapsed ? 48 : 128}
              height={collapsed ? 48 : 128}
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => {
          const isHidden =
            (item.planVisibility === 'freeOnly' && isPaidPlan) ||
            (item.planVisibility === 'paidOnly' && !isPaidPlan)
          if (isHidden) {
            return null
          }

          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const lacksAuth = item.requiresAuth && !user
          const planRestricted = item.requiresPaidPlan && !isPaidPlan
          const isDisabled = lacksAuth || planRestricted

          return (
            <Link
              key={item.name}
              href={isDisabled ? '#' : item.href}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault()
                  return
                }
                setMobileOpen(false)
              }}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "hover:bg-nuclear-blue/10",
                isActive && "bg-nuclear-blue/10 text-nuclear-blue border border-nuclear-blue/20",
                !isActive && "text-foreground",
                isDisabled && "opacity-50 cursor-not-allowed",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : item.description}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive && "text-nuclear-blue"
              )} />
              {!collapsed && (
                <span className="flex-1">{item.name}</span>
              )}
              {!collapsed && isDisabled && (
                <span className="text-xs text-muted-foreground">
                  {planRestricted ? 'Upgrade' : 'Sign in'}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className={cn(
        "border-t border-border p-4",
        collapsed ? "space-y-2" : ""
      )}>
        {user ? (
          <div className={cn(
            "flex items-center space-x-3",
            collapsed && "flex-col space-x-0 space-y-2"
          )}>
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-nuclear-blue text-white text-sm font-outfit">
                {getInitials(user.email)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {planLabel}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "sm"}
              onClick={handleSignOut}
              className={cn(
                "flex-shrink-0",
                collapsed ? "w-full" : ""
              )}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        ) : (
          <div className={cn(
            "text-center",
            collapsed && "flex flex-col items-center"
          )}>
            <p className={cn(
              "text-sm text-muted-foreground mb-2",
              collapsed && "hidden"
            )}>
              Sign in to access all features
            </p>
            <Button
              variant="default"
              size="sm"
              className="w-full btn-nuclear"
              onClick={() => {
                // Trigger custom event that the page can listen to
                window.dispatchEvent(new CustomEvent('openAuthDialog'))
              }}
            >
              {collapsed ? (
                <LogOut className="h-4 w-4 rotate-180" />
              ) : (
                'Sign In'
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-card shadow-md border border-border"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-card border-r border-border transition-transform duration-300 lg:hidden",
          "w-64 flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col h-screen bg-card border-r border-border transition-all duration-300 sticky top-0",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
