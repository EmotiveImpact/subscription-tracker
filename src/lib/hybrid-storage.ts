import { storage as inMemoryStorage } from './storage'
import { databaseStorage } from './database-storage'
import { Subscription, Merchant, AppSettings, Discovery, UserProfile } from '@/types'

class HybridStorage {
  private useDatabase: boolean = false

  constructor() {
    // Check if Vercel Postgres environment variables are configured
    this.useDatabase = !!(process.env.POSTGRES_URL || process.env.POSTGRES_HOST)
    
    if (this.useDatabase) {
      console.log('Using Vercel Postgres database storage')
    } else {
      console.log('Using in-memory storage (database not configured)')
    }
  }

  // Subscription Management
  async getSubscriptions(userId: string): Promise<Subscription[]> {
    if (this.useDatabase) {
      return databaseStorage.getSubscriptions(userId)
    }
    return inMemoryStorage.getSubscriptions()
  }

  async getSubscription(id: string): Promise<Subscription | null> {
    if (this.useDatabase) {
      return databaseStorage.getSubscription(id)
    }
    return inMemoryStorage.getSubscription(id)
  }

  async createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    if (this.useDatabase) {
      return databaseStorage.createSubscription(subscription)
    }
    return inMemoryStorage.createSubscription(subscription)
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    if (this.useDatabase) {
      return databaseStorage.updateSubscription(id, updates)
    }
    return inMemoryStorage.updateSubscription(id, updates)
  }

  async deleteSubscription(id: string): Promise<boolean> {
    if (this.useDatabase) {
      return databaseStorage.deleteSubscription(id)
    }
    return inMemoryStorage.deleteSubscription(id)
  }

  // Merchant Management
  async getMerchants(): Promise<Merchant[]> {
    if (this.useDatabase) {
      return databaseStorage.getMerchants()
    }
    return inMemoryStorage.getMerchants()
  }

  async getMerchant(id: string): Promise<Merchant | null> {
    if (this.useDatabase) {
      // Note: Database storage doesn't have getMerchant by ID, so we'll filter
      const merchants = await databaseStorage.getMerchants()
      return merchants.find(m => m.id === id) || null
    }
    return inMemoryStorage.getMerchant(id)
  }

  async createMerchant(merchant: Omit<Merchant, 'id'>): Promise<Merchant> {
    if (this.useDatabase) {
      return databaseStorage.createMerchant(merchant)
    }
    return inMemoryStorage.createMerchant(merchant)
  }

  // Settings Management
  async getSettings(): Promise<AppSettings> {
    if (this.useDatabase) {
      // For now, return default settings since we need userId
      // This will be updated when we have user context
      return this.getDefaultSettings()
    }
    return inMemoryStorage.getSettings()
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    if (this.useDatabase) {
      // For now, return default settings since we need userId
      // This will be updated when we have user context
      return this.getDefaultSettings()
    }
    return inMemoryStorage.updateSettings(updates)
  }

  // Discovery Management
  async getDiscoveries(): Promise<Discovery[]> {
    if (this.useDatabase) {
      // For now, return empty array since we need userId
      // This will be updated when we have user context
      return []
    }
    // In-memory storage doesn't have discoveries, so return empty array
    return []
  }

  async createDiscovery(discovery: Omit<Discovery, 'id' | 'createdAt' | 'updatedAt'>): Promise<Discovery> {
    if (this.useDatabase) {
      return databaseStorage.createDiscovery(discovery)
    }
    // For in-memory storage, we'll create a mock discovery
    const mockDiscovery: Discovery = {
      id: `discovery_${Date.now()}`,
      ...discovery,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return mockDiscovery
  }

  async updateDiscovery(id: string, updates: Partial<Discovery>): Promise<Discovery | null> {
    if (this.useDatabase) {
      return databaseStorage.updateDiscovery(id, updates)
    }
    // For in-memory storage, we can't really update discoveries
    return null
  }

  // Analytics
  async getSubscriptionStats() {
    if (this.useDatabase) {
      // For now, return default stats since we need userId
      // This will be updated when we have user context
      return this.getDefaultStats()
    }
    return inMemoryStorage.getSubscriptionStats()
  }

  // Initialize with sample data
  async initializeSampleData() {
    if (this.useDatabase) {
      // For now, skip since we need userId
      // This will be updated when we have user context
      return
    }
    return inMemoryStorage.initializeSampleData()
  }

  // Helper methods
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

  private getDefaultStats() {
    return {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      cancelledSubscriptions: 0,
      monthlyTotal: 0,
      yearlyTotal: 0,
      categoryBreakdown: [],
      upcomingBills: [],
    }
  }

  // Method to get storage type
  getStorageType(): 'database' | 'memory' {
    return this.useDatabase ? 'database' : 'memory'
  }

  // Method to check if database is available
  isDatabaseAvailable(): boolean {
    return this.useDatabase
  }
}

export const hybridStorage = new HybridStorage()
