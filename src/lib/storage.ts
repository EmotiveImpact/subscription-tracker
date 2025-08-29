import { Subscription, Merchant, AppSettings } from '@/types'

// In-memory storage for development
class InMemoryStorage {
  private subscriptions: Map<string, Subscription> = new Map()
  private merchants: Map<string, Merchant> = new Map()
  private settings: AppSettings = this.getDefaultSettings()

  // Subscription Management
  async getSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values())
  }

  async getSubscription(id: string): Promise<Subscription | null> {
    return this.subscriptions.get(id) || null
  }

  async createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const newSubscription: Subscription = {
      ...subscription,
      id,
      createdAt: now,
      updatedAt: now,
    }
    this.subscriptions.set(id, newSubscription)
    return newSubscription
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    const subscription = this.subscriptions.get(id)
    if (!subscription) return null

    const updatedSubscription: Subscription = {
      ...subscription,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.subscriptions.set(id, updatedSubscription)
    return updatedSubscription
  }

  async deleteSubscription(id: string): Promise<boolean> {
    return this.subscriptions.delete(id)
  }

  // Merchant Management
  async getMerchants(): Promise<Merchant[]> {
    return Array.from(this.merchants.values())
  }

  async getMerchant(id: string): Promise<Merchant | null> {
    return this.merchants.get(id) || null
  }

  async createMerchant(merchant: Omit<Merchant, 'id'>): Promise<Merchant> {
    const id = crypto.randomUUID()
    const newMerchant: Merchant = { ...merchant, id }
    this.merchants.set(id, newMerchant)
    return newMerchant
  }

  // Settings Management
  async getSettings(): Promise<AppSettings> {
    return this.settings
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    this.settings = { ...this.settings, ...updates }
    return this.settings
  }

  // Analytics
  async getSubscriptionStats() {
    const subscriptions = await this.getSubscriptions()
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active')
    
    const monthlyTotal = activeSubscriptions
      .filter(sub => sub.cycle === 'monthly')
      .reduce((sum, sub) => sum + sub.amount, 0)
    
    const yearlyTotal = activeSubscriptions
      .filter(sub => sub.cycle === 'yearly')
      .reduce((sum, sub) => sum + sub.amount, 0)
    
    const weeklyTotal = activeSubscriptions
      .filter(sub => sub.cycle === 'weekly')
      .reduce((sum, sub) => sum + sub.amount, 0)
    
    const quarterlyTotal = activeSubscriptions
      .filter(sub => sub.cycle === 'quarterly')
      .reduce((sum, sub) => sum + sub.amount, 0)

    const totalMonthly = monthlyTotal + (yearlyTotal / 12) + (weeklyTotal * 4.33) + (quarterlyTotal / 3)
    const totalYearly = totalMonthly * 12

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      cancelledSubscriptions: subscriptions.filter(sub => sub.status === 'cancelled').length,
      monthlyTotal: Math.round(totalMonthly * 100) / 100,
      yearlyTotal: Math.round(totalYearly * 100) / 100,
      categoryBreakdown: this.getCategoryBreakdown(activeSubscriptions),
      upcomingBills: this.getUpcomingBills(activeSubscriptions),
    }
  }

  private getCategoryBreakdown(subscriptions: Subscription[]) {
    const breakdown = new Map<string, { count: number; total: number }>()
    
    subscriptions.forEach(sub => {
      const category = sub.category || 'Uncategorized'
      const current = breakdown.get(category) || { count: 0, total: 0 }
      breakdown.set(category, {
        count: current.count + 1,
        total: current.total + sub.amount,
      })
    })

    return Array.from(breakdown.entries()).map(([category, data]) => ({
      category,
      ...data,
    }))
  }

  private getUpcomingBills(subscriptions: Subscription[]) {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    return subscriptions
      .filter(sub => sub.nextBillingAt)
      .filter(sub => {
        const nextBilling = new Date(sub.nextBillingAt!)
        return nextBilling >= now && nextBilling <= thirtyDaysFromNow
      })
      .sort((a, b) => new Date(a.nextBillingAt!).getTime() - new Date(b.nextBillingAt!).getTime())
      .slice(0, 10)
  }

  private getDefaultSettings(): AppSettings {
    return {
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
  }

  // Initialize with sample data (disabled for production; kept for reference)
  async initializeSampleData() {
    // Only initialize if no subscriptions exist
    if (this.subscriptions.size === 0) {
      const sampleSubscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: 'sample-user',
        merchantName: 'Netflix',
        amount: 15.99,
        currency: 'USD',
        cycle: 'monthly',
        status: 'active',
        category: 'Entertainment',
        nextBillingAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Streaming service subscription',
        website: 'https://netflix.com',
        notes: 'Premium plan with 4K streaming',
        autoRenew: true,
        difficulty: 'easy',
        cancellationUrl: 'https://netflix.com/account',
        cancellationInstructions: 'Go to Account > Cancel Membership',
      }
      
      await this.createSubscription(sampleSubscription)
    }
  }
}

export const storage = new InMemoryStorage()
