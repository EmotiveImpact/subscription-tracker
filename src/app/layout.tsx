import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { ErrorBoundary } from '@/components/error-boundary'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SubTracker - Subscription Management',
  description: 'Professional subscription management application',
  keywords: ['subscription', 'management', 'tracking', 'billing', 'SaaS'],
  authors: [{ name: 'SubTracker Team' }],
  creator: 'SubTracker',
  publisher: 'SubTracker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <div className="flex h-screen bg-background">
              <Navigation />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
