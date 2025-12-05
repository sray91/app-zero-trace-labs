import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req) {
  const res = NextResponse.next()

  // Get auth token from cookies
  const token = req.cookies.get('sb-access-token')?.value ||
                req.cookies.get('sb-tdfjmlbzabpjazczbdud-auth-token')?.value

  const isAuthPage = req.nextUrl.pathname.startsWith('/sign-in')
  const isWelcomePage = req.nextUrl.pathname.startsWith('/welcome')
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')

  // Skip middleware for API routes
  if (isApiRoute) {
    return res
  }

  // If no token and not on auth page, redirect to sign-in
  if (!token && !isAuthPage) {
    const redirectUrl = new URL('/sign-in', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If has token, verify session and check welcome completion
  if (token) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // Get session
      const { data: { user } } = await supabase.auth.getUser(token)

      if (!user) {
        // Invalid token, redirect to sign-in
        if (!isAuthPage) {
          const redirectUrl = new URL('/sign-in', req.url)
          return NextResponse.redirect(redirectUrl)
        }
        return res
      }

      // User is authenticated
      if (isAuthPage) {
        // Check if welcome is completed
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('welcome_completed')
          .eq('user_id', user.id)
          .single()

        if (!userData || !userData.welcome_completed) {
          const redirectUrl = new URL('/welcome', req.url)
          return NextResponse.redirect(redirectUrl)
        }

        // Welcome completed, redirect to home
        const redirectUrl = new URL('/', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Not on auth page, check welcome completion
      if (!isWelcomePage) {
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('welcome_completed')
          .eq('user_id', user.id)
          .single()

        if (!userData || !userData.welcome_completed) {
          const redirectUrl = new URL('/welcome', req.url)
          return NextResponse.redirect(redirectUrl)
        }
      }
    } catch (error) {
      console.error('Middleware error:', error)
      // On error, allow request to continue
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (they handle auth separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}
