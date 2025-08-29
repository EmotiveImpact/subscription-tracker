"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'

interface StripeCustomer {
  id: string
  email: string
  name?: string
  subscription?: {
    id: string
    status: 'active' | 'canceled' | 'past_due' | 'unpaid'
    currentPeriodEnd: number
    priceId: string
  }
}

export function useStripeCustomer() {
  const { user, isSignedIn } = useAuth()
  const [customer, setCustomer] = useState<StripeCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch customer data from Stripe
  const fetchCustomer = useCallback(async () => {
    if (!isSignedIn || !user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/customer', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch customer data')
      }

      const customerData = await response.json()
      setCustomer(customerData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer')
      console.error('Error fetching customer:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSignedIn, user?.id])

  // Create or get customer
  const createCustomer = useCallback(async () => {
    if (!isSignedIn || !user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create customer')
      }

      const customerData = await response.json()
      setCustomer(customerData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
      console.error('Error creating customer:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSignedIn, user?.id, user?.primaryEmailAddress?.emailAddress, user?.fullName])

  // Update customer
  const updateCustomer = useCallback(async (updates: Partial<StripeCustomer>) => {
    if (!customer?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/billing/customer/${customer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update customer')
      }

      const updatedCustomer = await response.json()
      setCustomer(updatedCustomer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer')
      console.error('Error updating customer:', err)
    } finally {
      setIsLoading(false)
    }
  }, [customer?.id])

  // Fetch customer data when user changes
  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchCustomer()
    } else {
      setCustomer(null)
    }
  }, [isSignedIn, user?.id, fetchCustomer])

  return {
    customer,
    isLoading,
    error,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    hasActiveSubscription: customer?.subscription?.status === 'active',
  }
}
