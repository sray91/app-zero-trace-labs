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
    description: 'Search and monitor your data'
  },
  {
    name: 'Search',
    href: '/search',
    icon: Search,
    description: 'Quick data broker search'
  },
  {
    name: 'Comprehensive Scan',
    href: '/comprehensive',
    icon: Shield,
    description: 'Deep scan across all brokers',
    requiresAuth: true
  },
  {
    name: 'History',
    href: '/history',
    icon: History,
    description: 'View search history',
    requiresAuth: true
  },
  {
    name: 'Removal Requests',
    href: '/requests',
    icon: FileText,
    description: 'Track removal requests',
    requiresAuth: true
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account settings',
    requiresAuth: true
  }
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

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
        "flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800",
        collapsed ? "flex-col space-y-2" : ""
      )}>
        <div className={cn(
          "flex items-center space-x-3",
          collapsed && "flex-col space-x-0 space-y-2"
        )}>
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src="/zero-trace-labs-logo.png"
              alt="Zero Trace Labs"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                Zero Trace
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Privacy Protection
              </span>
            </div>
          )}
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
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const isDisabled = item.requiresAuth && !user

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
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                isActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                !isActive && "text-gray-700 dark:text-gray-300",
                isDisabled && "opacity-50 cursor-not-allowed",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : item.description}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive && "text-blue-600 dark:text-blue-400"
              )} />
              {!collapsed && (
                <span className="flex-1">{item.name}</span>
              )}
              {!collapsed && isDisabled && (
                <span className="text-xs text-gray-400">Sign in</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className={cn(
        "border-t border-gray-200 dark:border-gray-800 p-4",
        collapsed ? "space-y-2" : ""
      )}>
        {user ? (
          <div className={cn(
            "flex items-center space-x-3",
            collapsed && "flex-col space-x-0 space-y-2"
          )}>
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {getInitials(user.email)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Free Plan
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
              "text-sm text-gray-600 dark:text-gray-400 mb-2",
              collapsed && "hidden"
            )}>
              Sign in to access all features
            </p>
            <Button
              variant="default"
              size="sm"
              className="w-full"
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
        className="fixed top-4 left-4 z-40 lg:hidden bg-white dark:bg-gray-900 shadow-md"
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
          "fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 lg:hidden",
          "w-64 flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 sticky top-0",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
