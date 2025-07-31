import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Zero Trace Labs - Data Broker Search & Privacy Protection',
  description: 'Professional data broker monitoring and removal service. Discover where your personal information appears online and take control of your digital privacy with automated removal requests.',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'Zero Trace Labs - Data Privacy Protection',
    description: 'Professional data broker monitoring and removal service',
    images: ['/zero-trace-labs-logo.png'],
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}