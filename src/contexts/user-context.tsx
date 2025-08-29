"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { UserProfile, AppSettings } from '@/types'

interface UserContextType {
  userProfile: UserProfile | null
  settings: AppSettings | null
  isLoading: boolean
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn, isLoaded } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Initialize user profile from Clerk user data
      const profile: UserProfile = {
        id: user.id,
        name: user.fullName || user.primaryEmailAddress?.emailAddress || 'Unknown User',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: {
          email: true,
          push: true,
          reminderDays: 3,
        },
        createdAt: new Date(user.createdAt || Date.now()),
        updatedAt: new Date(),
      }
      
      setUserProfile(profile)
      
      // Initialize default settings
      const defaultSettings: AppSettings = {
        notifications: {
          billing: true,
          trial: true,
          priceChanges: true,
          cancellation: true,
          email: true,
          push: true,
          sms: false,
        },
        integrations: {
          gmail: { connected: false, email: '' },
          outlook: { connected: false, email: '' },
          calendar: { connected: false, email: '' },
        },
        privacy: {
          dataRetention: '1_year',
          analyticsSharing: false,
          thirdPartySharing: false,
        },
        cancellation: {
          autoReminders: true,
          difficultyFilter: 'all',
          instructions: true,
        },
        plan: 'free',
      }
      
      setSettings(defaultSettings)
      setIsLoading(false)
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false)
    }
  }, [isLoaded, isSignedIn, user])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return
    
    const updatedProfile = { ...userProfile, ...updates, updatedAt: new Date() }
    setUserProfile(updatedProfile)
    
    // TODO: Save to database
    console.log('Profile updated:', updatedProfile)
  }

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings) return
    
    const updatedSettings = { ...settings, ...updates }
    setSettings(updatedSettings)
    
    // TODO: Save to database
    console.log('Settings updated:', updatedSettings)
  }

  const value: UserContextType = {
    userProfile,
    settings,
    isLoading,
    updateProfile,
    updateSettings,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
