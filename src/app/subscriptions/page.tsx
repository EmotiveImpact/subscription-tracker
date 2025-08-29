"use client"

import { useState, useMemo } from 'react'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loading, LoadingScreen } from '@/components/ui/loading'
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { Subscription } from '@/types'

export default function SubscriptionsPage() {
  const { 
    subscriptions, 
    loading, 
    error, 
    cancelSubscription, 
    reactivateSubscription,
    deleteSubscription 
  } = useSubscriptions()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('nextBillingAt')

  // Filter and sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(sub => sub.category === categoryFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'merchantName':
          return a.merchantName.localeCompare(b.merchantName)
        case 'amount':
          return b.amount - a.amount
        case 'nextBillingAt':
          if (!a.nextBillingAt && !b.nextBillingAt) return 0
          if (!a.nextBillingAt) return 1
          if (!b.nextBillingAt) return -1
          return new Date(a.nextBillingAt).getTime() - new Date(b.nextBillingAt).getTime()
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [subscriptions, searchTerm, statusFilter, categoryFilter, sortBy])

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      subscriptions.map(sub => sub.category ?? '').filter(Boolean)
    )
    return Array.from(uniqueCategories).sort()
  }, [subscriptions])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get days until billing
  const getDaysUntilBilling = (dateString: string) => {
    const today = new Date()
    const billingDate = new Date(dateString)
    const diffTime = billingDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get status icon and color
  const getStatusInfo = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' }
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' }
      case 'paused':
        return { icon: Pause, color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' }
    }
  }

  if (loading) {
    return <LoadingScreen text="Loading subscriptions..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load subscriptions</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage and track your recurring subscriptions
          </p>
        </div>
        <Link href="/subscriptions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
          <CardDescription>
            Find and organize your subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nextBillingAt">Next Billing</SelectItem>
                <SelectItem value="merchantName">Merchant Name</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="createdAt">Date Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {filteredSubscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first subscription'}
              </p>
              <Link href="/subscriptions/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredSubscriptions.map((subscription) => {
            const statusInfo = getStatusInfo(subscription.status)
            const StatusIcon = statusInfo.icon
            const daysUntil = subscription.nextBillingAt ? getDaysUntilBilling(subscription.nextBillingAt) : null
            const isUrgent = daysUntil !== null && daysUntil <= 3 && subscription.status === 'active'

            return (
              <Card key={subscription.id} className={isUrgent ? 'border-destructive/50 bg-destructive/5' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{subscription.merchantName}</h3>
                          {subscription.category && (
                            <span className="px-2 py-1 text-xs bg-muted rounded-full">
                              {subscription.category}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{formatCurrency(subscription.amount)}</span>
                            <span className="text-xs">/{subscription.cycle}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Next: {subscription.nextBillingAt ? formatDate(subscription.nextBillingAt) : 'Not set'}</span>
                            {subscription.status === 'active' && daysUntil !== null && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                isUrgent ? 'bg-destructive text-destructive-foreground' : 'bg-muted'
                              }`}>
                                {daysUntil === 0 ? 'Today' : 
                                 daysUntil === 1 ? 'Tomorrow' : 
                                 `${daysUntil} days`}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {subscription.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{subscription.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {subscription.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelSubscription(subscription.id)}
                          >
                            Cancel
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </>
                      )}
                      
                      {subscription.status === 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reactivateSubscription(subscription.id)}
                        >
                          Reactivate
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSubscription(subscription.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Results Summary */}
      {filteredSubscriptions.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
        </div>
      )}
    </div>
  )
}
