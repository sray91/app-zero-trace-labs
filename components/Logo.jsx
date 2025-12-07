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
    xl: 'h-20 w-20',
    xxl: 'h-32 w-32'
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
    xl: 'h-20 w-20',
    xxl: 'h-32 w-32'
  }

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
    xl: 'text-4xl',
    xxl: 'text-5xl'
  }

  const sizePx = {
    small: 32,
    medium: 48,
    large: 64,
    xl: 80,
    xxl: 128
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className={cn(
        'relative flex items-center justify-center rounded-xl overflow-hidden',
        sizeClasses[size],
        animate && 'hover:scale-105 transition-transform duration-200'
      )}>
        <Image
          src="/zero-trace-labs-logo-dark.png"
          alt="0TraceLabs"
          width={sizePx[size]}
          height={sizePx[size]}
          className="rounded-xl"
          priority
        />
      </div>
      
      {showText && (
        <div className="ml-3">
          <h1 className={cn(
            'font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 bg-clip-text text-transparent',
            'dark:from-white dark:via-blue-200 dark:to-indigo-300',
            textSizeClasses[size]
          )}>
            0TraceLabs
          </h1>
        </div>
      )}
    </div>
  )
}