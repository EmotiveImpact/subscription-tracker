"use client"

import { Toaster } from '@/components/ui/toaster'
import { UserProvider } from '@/contexts/user-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      {children}
      <Toaster />
    </UserProvider>
  )
}
