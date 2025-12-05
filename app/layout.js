import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-outfit',
})

export const metadata = {
  title: '0TraceLabs - Data Broker Search & Privacy Protection',
  description: 'Professional data broker monitoring and removal service. Discover where your personal information appears online and take control of your digital privacy with automated removal requests.',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: '0TraceLabs - Data Privacy Protection',
    description: 'Professional data broker monitoring and removal service',
    images: ['/zero-trace-labs-logo-dark.png'],
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}