import { useState, useEffect, useCallback } from 'react'
import { Subscription, SubscriptionStats } from '@/types'
import { storage } from '@/lib/storage'
import { canCreateSubscription } from '@/lib/limits'
import { useToast } from './use-toast'

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load subscriptions
  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Initialize sample data if empty
      await storage.initializeSampleData()
      
      const [subscriptionsData, statsData] = await Promise.all([
        storage.getSubscriptions(),
        storage.getSubscriptionStats(),
      ])
      
      setSubscriptions(subscriptionsData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions')
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Create subscription
  const createSubscription = useCallback(async (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const limit = await canCreateSubscription()
      if (!limit.ok) {
        toast({
          title: 'Upgrade required',
          description: limit.reason || 'Please upgrade to Pro to add more subscriptions.',
          variant: 'destructive',
        })
        throw new Error(limit.reason || 'Plan limit reached')
      }
      const newSubscription = await storage.createSubscription(subscription)
      setSubscriptions(prev => [...prev, newSubscription])
      
      // Refresh stats
      const newStats = await storage.getSubscriptionStats()
      setStats(newStats)
      
      toast({
        title: "Success",
        description: "Subscription created successfully",
        variant: "success",
      })
      
      return newSubscription
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      })
      throw err
    }
  }, [toast])

  // Update subscription
  const updateSubscription = useCallback(async (id: string, updates: Partial<Subscription>) => {
    try {
      const updatedSubscription = await storage.updateSubscription(id, updates)
      if (!updatedSubscription) {
        throw new Error('Subscription not found')
      }
      
      setSubscriptions(prev => 
        prev.map(sub => sub.id === id ? updatedSubscription : sub)
      )
      
      // Refresh stats
      const newStats = await storage.getSubscriptionStats()
      setStats(newStats)
      
      toast({
        title: "Success",
        description: "Subscription updated successfully",
        variant: "success",
      })
      
      return updatedSubscription
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      })
      throw err
    }
  }, [toast])

  // Delete subscription
  const deleteSubscription = useCallback(async (id: string) => {
    try {
      const success = await storage.deleteSubscription(id)
      if (!success) {
        throw new Error('Failed to delete subscription')
      }
      
      setSubscriptions(prev => prev.filter(sub => sub.id !== id))
      
      // Refresh stats
      const newStats = await storage.getSubscriptionStats()
      setStats(newStats)
      
      toast({
        title: "Success",
        description: "Subscription deleted successfully",
        variant: "success",
      })
      
      return success
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      })
      throw err
    }
  }, [toast])

  // Cancel subscription
  const cancelSubscription = useCallback(async (id: string) => {
    return updateSubscription(id, { 
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    })
  }, [updateSubscription])

  // Reactivate subscription
  const reactivateSubscription = useCallback(async (id: string) => {
    return updateSubscription(id, { 
      status: 'active',
      updatedAt: new Date().toISOString(),
    })
  }, [updateSubscription])

  // Get subscription by ID
  const getSubscription = useCallback(async (id: string) => {
    return storage.getSubscription(id)
  }, [])

  // Get active subscriptions
  const getActiveSubscriptions = useCallback(() => {
    return subscriptions.filter(sub => sub.status === 'active')
  }, [subscriptions])

  // Get cancelled subscriptions
  const getCancelledSubscriptions = useCallback(() => {
    return subscriptions.filter(sub => sub.status === 'cancelled')
  }, [subscriptions])

  // Get subscriptions by category
  const getSubscriptionsByCategory = useCallback((category: string) => {
    return subscriptions.filter(sub => sub.category === category)
  }, [subscriptions])

  // Get upcoming bills
  const getUpcomingBills = useCallback(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    return subscriptions
      .filter(sub => sub.status === 'active')
      .filter(sub => sub.nextBillingAt)
      .filter(sub => {
        const nextBilling = new Date(sub.nextBillingAt!)
        return nextBilling >= now && nextBilling <= thirtyDaysFromNow
      })
      .sort((a, b) => new Date(a.nextBillingAt!).getTime() - new Date(b.nextBillingAt!).getTime())
  }, [subscriptions])

  // Refresh data
  const refresh = useCallback(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  // Load subscriptions on mount
  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  return {
    // State
    subscriptions,
    stats,
    loading,
    error,
    
    // Actions
    createSubscription,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
    reactivateSubscription,
    getSubscription,
    
    // Queries
    getActiveSubscriptions,
    getCancelledSubscriptions,
    getSubscriptionsByCategory,
    getUpcomingBills,
    
    // Utilities
    refresh,
    loadSubscriptions,
  }
}
