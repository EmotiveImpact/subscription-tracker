import { useState, useEffect, useCallback } from 'react'
import { AppSettings, EmailIntegration } from '@/types'
import { storage } from '@/lib/storage'
import { useToast } from './use-toast'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const loadedSettings = await storage.getSettings()
      setSettings(loadedSettings)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      toast({ title: "Error", description: "Failed to load settings.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const updateNotificationSettings = useCallback(async (updates: Partial<AppSettings['notifications']>) => {
    try {
      if (!settings) throw new Error('Settings not loaded')
      const updatedSettings = await storage.updateSettings({
        ...settings,
        notifications: { ...settings.notifications, ...updates },
      })
      setSettings(updatedSettings)
      toast({ title: "Success", description: "Notification settings updated.", variant: "success" })
      return updatedSettings
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification settings'
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      throw err
    }
  }, [settings, toast])

  const updateIntegrationSettings = useCallback(async (provider: 'gmail' | 'outlook', updates: Partial<AppSettings['integrations']['gmail']>) => {
    try {
      if (!settings) throw new Error('Settings not loaded')
      const updatedSettings = await storage.updateSettings({
        ...settings,
        integrations: {
          ...settings.integrations,
          [provider]: { ...settings.integrations[provider], ...updates },
        },
      })
      setSettings(updatedSettings)
      toast({ title: "Success", description: "Integration settings updated.", variant: "success" })
      return updatedSettings
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update integration settings'
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      throw err
    }
  }, [settings, toast])

  const updatePrivacySettings = useCallback(async (updates: Partial<AppSettings['privacy']>) => {
    try {
      if (!settings) throw new Error('Settings not loaded')
      const updatedSettings = await storage.updateSettings({
        ...settings,
        privacy: { ...settings.privacy, ...updates },
      })
      setSettings(updatedSettings)
      toast({ title: "Success", description: "Privacy settings updated.", variant: "success" })
      return updatedSettings
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update privacy settings'
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      throw err
    }
  }, [settings, toast])

  const updateCancellationSettings = useCallback(async (updates: Partial<AppSettings['cancellation']>) => {
    try {
      if (!settings) throw new Error('Settings not loaded')
      const updatedSettings = await storage.updateSettings({
        ...settings,
        cancellation: { ...settings.cancellation, ...updates },
      })
      setSettings(updatedSettings)
      toast({ title: "Success", description: "Cancellation settings updated.", variant: "success" })
      return updatedSettings
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cancellation settings'
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      throw err
    }
  }, [settings, toast])

  const connectGmail = useCallback(async () => {
    await updateIntegrationSettings('gmail', { connected: true, email: 'user@gmail.com' })
  }, [updateIntegrationSettings])

  const disconnectGmail = useCallback(async () => {
    await updateIntegrationSettings('gmail', { connected: false, email: '' })
  }, [updateIntegrationSettings])

  const connectOutlook = useCallback(async () => {
    await updateIntegrationSettings('outlook', { connected: true, email: 'user@outlook.com' })
  }, [updateIntegrationSettings])

  const disconnectOutlook = useCallback(async () => {
    await updateIntegrationSettings('outlook', { connected: false, email: '' })
  }, [updateIntegrationSettings])

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      if (!settings) throw new Error('Settings not loaded')
      const updatedSettings = await storage.updateSettings({
        ...settings,
        ...updates,
      })
      setSettings(updatedSettings)
      toast({ title: "Success", description: "Settings updated.", variant: "success" })
      return updatedSettings
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings'
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      throw err
    }
  }, [settings, toast])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    connectGmail,
    disconnectGmail,
    connectOutlook,
    disconnectOutlook,
    updateNotificationSettings,
    updatePrivacySettings,
    updateCancellationSettings,
    updateSettings,
  }
}
