"use client"

import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'
import { UserProvider } from '@/contexts/user-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <UserProvider>
        {children}
        <Toaster />
      </UserProvider>
    </ClerkProvider>
  )
}
