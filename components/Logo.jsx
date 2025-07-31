'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Logo skeleton loading component
function LogoSkeleton({ size, showText }) {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
    xl: 'h-20 w-20'
  }

  return (
    <div className="flex items-center">
      <div className={cn(
        'rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse',
        sizeClasses[size]
      )} />
      {showText && (
        <div className="ml-3 space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
        </div>
      )}
    </div>
  )
}

export default function Logo({ 
  size = 'medium', 
  showText = true, 
  className = '',
  animate = false 
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
    xl: 'h-20 w-20'
  }

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
    xl: 'text-4xl'
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className={cn(
        'relative flex items-center justify-center rounded-xl overflow-hidden',
        'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900',
        'border border-gray-200/50 dark:border-gray-700/50 shadow-sm',
        sizeClasses[size],
        animate && 'hover:scale-105 transition-transform duration-200'
      )}>
        {/* Always show SVG logo for reliability */}
        <div className={cn(
          'flex items-center justify-center text-blue-600 dark:text-blue-400',
          size === 'small' ? 'text-sm' : 
          size === 'medium' ? 'text-lg' : 
          size === 'large' ? 'text-xl' : 'text-2xl'
        )}>
          <svg 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className={cn(
              'w-full h-full p-1.5',
              size === 'small' ? 'max-w-6' : 
              size === 'medium' ? 'max-w-8' : 
              size === 'large' ? 'max-w-10' : 'max-w-12'
            )}
          >
            {/* Shield icon representing security/privacy */}
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
      </div>
      
      {showText && (
        <div className="ml-3">
          <h1 className={cn(
            'font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 bg-clip-text text-transparent',
            'dark:from-white dark:via-blue-200 dark:to-indigo-300',
            textSizeClasses[size]
          )}>
            Zero Trace Labs
          </h1>
          <p className={cn(
            'text-gray-600 dark:text-gray-400 font-medium tracking-wide',
            size === 'small' ? 'text-xs' : 
            size === 'medium' ? 'text-sm' : 
            size === 'large' ? 'text-base' : 'text-lg'
          )}>
            Data Privacy Protection
          </p>
        </div>
      )}
    </div>
  )
}