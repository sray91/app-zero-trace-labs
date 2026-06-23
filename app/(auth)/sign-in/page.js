'use client'

import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import Logo from '@/components/Logo'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 gap-6">
      <Logo size="xxl" showText={false} />
      <SignIn
        routing="hash"
        forceRedirectUrl="/welcome"
        appearance={{ baseTheme: dark }}
      />
    </div>
  )
}
