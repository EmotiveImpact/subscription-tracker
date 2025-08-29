"use client"

import { useAuth } from '@/hooks/use-auth'
import { LoadingScreen } from '@/components/ui/loading'
import { redirect } from 'next/navigation'

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthWrapper({ children, requireAuth = true }: AuthWrapperProps) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen />
  }

  if (requireAuth && !isSignedIn) {
    redirect('/sign-in')
  }

  if (!requireAuth && isSignedIn) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
