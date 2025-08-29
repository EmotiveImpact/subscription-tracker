import { sql, TABLES } from './vercel-postgres'
import { Subscription, Merchant, AppSettings, Discovery, UserProfile } from '@/types'
import { Database } from './vercel-postgres'

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']
type MerchantRow = Database['public']['Tables']['merchants']['Row']
type DiscoveryRow = Database['public']['Tables']['discoveries']['Row']
type UserSettingsRow = Database['public']['Tables']['user_settings']['Row']
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']

export class DatabaseStorage {
  // Subscription Management
  async getSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const { rows } = await sql`
        SELECT * FROM subscriptions
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `

      return (rows as any[])?.map(this.mapSubscriptionRowToSubscription) || []
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      return []
    }
  }

  async getSubscription(id: string): Promise<Subscription | null> {
    try {
      const { rows } = await sql`
        SELECT * FROM subscriptions
        WHERE id = ${id}
      `

      if (rows.length === 0) return null
      return this.mapSubscriptionRowToSubscription(rows[0] as any)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      return null
    }
  }

  async createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    try {
      const now = new Date().toISOString()
      const { rows } = await sql`
        INSERT INTO subscriptions (
          user_id, merchant_name, amount, currency, cycle, status, category,
          next_billing_at, description, website, notes, auto_renew, difficulty,
          cancellation_url, cancellation_instructions, created_at, updated_at
        ) VALUES (
          ${subscription.userId}, ${subscription.merchantName}, ${subscription.amount},
          ${subscription.currency}, ${subscription.cycle}, ${subscription.status},
          ${subscription.category || null}, ${subscription.nextBillingAt || null}, ${subscription.description || null},
          ${subscription.website || null}, ${subscription.notes || null}, ${subscription.autoRenew || true},
          ${subscription.difficulty || 'medium'}, ${subscription.cancellationUrl || null},
          ${subscription.cancellationInstructions || null}, ${now}, ${now}
        )
        RETURNING *
      `

      return this.mapSubscriptionRowToSubscription(rows[0] as any)
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    try {
      const now = new Date().toISOString()
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      // Build dynamic update query
      if (updates.merchantName !== undefined) {
        updateFields.push(`merchant_name = $${paramIndex++}`)
        values.push(updates.merchantName)
      }
      if (updates.amount !== undefined) {
        updateFields.push(`amount = $${paramIndex++}`)
        values.push(updates.amount)
      }
      if (updates.currency !== undefined) {
        updateFields.push(`currency = $${paramIndex++}`)
        values.push(updates.currency)
      }
      if (updates.cycle !== undefined) {
        updateFields.push(`cycle = $${paramIndex++}`)
        values.push(updates.cycle)
      }
      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`)
        values.push(updates.status)
      }
      if (updates.category !== undefined) {
        updateFields.push(`category = $${paramIndex++}`)
        values.push(updates.category)
      }
      if (updates.nextBillingAt !== undefined) {
        updateFields.push(`next_billing_at = $${paramIndex++}`)
        values.push(updates.nextBillingAt)
      }
      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`)
        values.push(updates.description)
      }
      if (updates.website !== undefined) {
        updateFields.push(`website = $${paramIndex++}`)
        values.push(updates.website)
      }
      if (updates.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`)
        values.push(updates.notes)
      }
      if (updates.autoRenew !== undefined) {
        updateFields.push(`auto_renew = $${paramIndex++}`)
        values.push(updates.autoRenew)
      }
      if (updates.difficulty !== undefined) {
        updateFields.push(`difficulty = $${paramIndex++}`)
        values.push(updates.difficulty)
      }
      if (updates.cancellationUrl !== undefined) {
        updateFields.push(`cancellation_url = $${paramIndex++}`)
        values.push(updates.cancellationUrl)
      }
      if (updates.cancellationInstructions !== undefined) {
        updateFields.push(`cancellation_instructions = $${paramIndex++}`)
        values.push(updates.cancellationInstructions)
      }

      // Always update the updated_at timestamp
      updateFields.push(`updated_at = $${paramIndex++}`)
      values.push(now)

      if (updateFields.length === 0) {
        return this.getSubscription(id)
      }

      const { rows } = await sql`
        UPDATE subscriptions
        SET ${updateFields.join(', ')}
        WHERE id = ${id}
        RETURNING *
      `

      if (rows.length === 0) return null
      return this.mapSubscriptionRowToSubscription(rows[0] as any)
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }

  async deleteSubscription(id: string): Promise<boolean> {
    try {
      const { rowCount } = await sql`
        DELETE FROM subscriptions
        WHERE id = ${id}
      `

      return (rowCount || 0) > 0
    } catch (error) {
      console.error('Error deleting subscription:', error)
      return false
    }
  }

  // Merchant Management
  async getMerchants(): Promise<Merchant[]> {
    try {
      const { rows } = await sql`
        SELECT * FROM merchants
        ORDER BY name ASC
      `

      return (rows as any[])?.map(this.mapMerchantRowToMerchant) || []
    } catch (error) {
      console.error('Error fetching merchants:', error)
      return []
    }
  }

  async createMerchant(merchant: Omit<Merchant, 'id'>): Promise<Merchant> {
    try {
      const { rows } = await sql`
        INSERT INTO merchants (
          name, website, category, logo_url, created_at
        ) VALUES (
          ${merchant.name}, ${merchant.website}, ${merchant.category},
          ${merchant.logoUrl}, ${new Date().toISOString()}
        )
        RETURNING *
      `

      return this.mapMerchantRowToMerchant(rows[0] as any)
    } catch (error) {
      console.error('Error creating merchant:', error)
      throw error
    }
  }

  // Settings Management
  async getSettings(userId: string): Promise<AppSettings> {
    try {
      const { rows } = await sql`
        SELECT * FROM user_settings
        WHERE user_id = ${userId}
      `

      if (rows.length > 0) {
        return {
                  notifications: (rows[0] as any).notifications,
        integrations: (rows[0] as any).integrations,
        privacy: (rows[0] as any).privacy,
        cancellation: (rows[0] as any).cancellation,
        plan: (rows[0] as any).plan,
        }
      }

      // Return default settings if none exist
      return this.getDefaultSettings()
    } catch (error) {
      console.error('Error fetching settings:', error)
      return this.getDefaultSettings()
    }
  }

  async updateSettings(userId: string, updates: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const now = new Date().toISOString()
      const settingsData = {
        user_id: userId,
        notifications: updates.notifications,
        integrations: updates.integrations,
        privacy: updates.privacy,
        cancellation: updates.cancellation,
        plan: updates.plan,
        updated_at: now,
      }

      // Try to update existing settings
      const { rowCount } = await sql`
        UPDATE user_settings
        SET 
          notifications = ${JSON.stringify(settingsData.notifications)},
          integrations = ${JSON.stringify(settingsData.integrations)},
          privacy = ${JSON.stringify(settingsData.privacy)},
          cancellation = ${JSON.stringify(settingsData.cancellation)},
          plan = ${settingsData.plan},
          updated_at = ${settingsData.updated_at}
        WHERE user_id = ${userId}
      `

      if (rowCount === 0) {
        // Settings don't exist, create new ones
        const { rows } = await sql`
          INSERT INTO user_settings (
            user_id, notifications, integrations, privacy, cancellation, plan, created_at, updated_at
          ) VALUES (
            ${settingsData.user_id}, ${JSON.stringify(settingsData.notifications)}, ${JSON.stringify(settingsData.integrations)},
            ${JSON.stringify(settingsData.privacy)}, ${JSON.stringify(settingsData.cancellation)}, ${settingsData.plan},
            ${now}, ${now}
          )
          RETURNING *
        `

        return this.mapSettingsRowToAppSettings(rows[0] as any)
      }

      // Return updated settings
      return await this.getSettings(userId)
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  // Discovery Management
  async getDiscoveries(userId: string): Promise<Discovery[]> {
    try {
      const { rows } = await sql`
        SELECT * FROM discoveries
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `

      return (rows as any[])?.map(this.mapDiscoveryRowToDiscovery) || []
    } catch (error) {
      console.error('Error fetching discoveries:', error)
      return []
    }
  }

  async createDiscovery(discovery: Omit<Discovery, 'id' | 'createdAt' | 'updatedAt'>): Promise<Discovery> {
    try {
      const now = new Date().toISOString()
      const { rows } = await sql`
        INSERT INTO discoveries (
          user_id, source, merchant_name, amount, currency, cycle, next_billing_at,
          category, confidence, status, raw_data, metadata, created_at, updated_at
        ) VALUES (
          ${discovery.userId}, ${discovery.source}, ${discovery.merchantName},
          ${discovery.amount}, ${discovery.currency}, ${discovery.cycle},
          ${discovery.nextBillingAt}, ${discovery.category}, ${discovery.confidence},
          ${discovery.status}, ${JSON.stringify(discovery.rawData)}, ${JSON.stringify(discovery.metadata)}, ${now}, ${now}
        )
        RETURNING *
      `

      return this.mapDiscoveryRowToDiscovery(rows[0] as any)
    } catch (error) {
      console.error('Error creating discovery:', error)
      throw error
    }
  }

  async updateDiscovery(id: string, updates: Partial<Discovery>): Promise<Discovery | null> {
    try {
      const now = new Date().toISOString()
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`)
        values.push(updates.status)
      }
      if (updates.confidence !== undefined) {
        updateFields.push(`confidence = $${paramIndex++}`)
        values.push(updates.confidence)
      }
      if (updates.category !== undefined) {
        updateFields.push(`category = $${paramIndex++}`)
        values.push(updates.category)
      }

      // Always update the updated_at timestamp
      updateFields.push(`updated_at = $${paramIndex++}`)
      values.push(now)

      if (updateFields.length === 0) {
        return this.getDiscovery(id)
      }

      const { rows } = await sql`
        UPDATE discoveries
        SET ${updateFields.join(', ')}
        WHERE id = ${id}
        RETURNING *
      `

      if (rows.length === 0) return null
      return this.mapDiscoveryRowToDiscovery(rows[0] as any)
    } catch (error) {
      console.error('Error updating discovery:', error)
      throw error
    }
  }

  async getDiscovery(id: string): Promise<Discovery | null> {
    try {
      const { rows } = await sql`
        SELECT * FROM discoveries
        WHERE id = ${id}
      `

      if (rows.length === 0) return null
      return this.mapDiscoveryRowToDiscovery(rows[0] as any)
    } catch (error) {
      console.error('Error fetching discovery:', error)
      return null
    }
  }

  // Analytics
  async getSubscriptionStats(userId: string) {
    try {
      const subscriptions = await this.getSubscriptions(userId)
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
    } catch (error) {
      console.error('Error getting subscription stats:', error)
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
  }

  // Helper methods
  private mapSubscriptionRowToSubscription(row: SubscriptionRow): Subscription {
    return {
      id: row.id,
      userId: row.user_id,
      merchantName: row.merchant_name,
      amount: row.amount,
      currency: row.currency,
      cycle: row.cycle,
      status: row.status,
      category: row.category || undefined,
      nextBillingAt: row.next_billing_at || undefined,
      description: row.description || undefined,
      website: row.website || undefined,
      notes: row.notes || undefined,
      autoRenew: row.auto_renew,
      difficulty: row.difficulty || undefined,
      cancellationUrl: row.cancellation_url || undefined,
      cancellationInstructions: row.cancellation_instructions || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapMerchantRowToMerchant(row: MerchantRow): Merchant {
    return {
      id: row.id,
      name: row.name,
      website: row.website || undefined,
      category: row.category || undefined,
      logoUrl: row.logo_url || undefined,
      createdAt: row.created_at,
    }
  }

  private mapDiscoveryRowToDiscovery(row: DiscoveryRow): Discovery {
    return {
      id: row.id,
      userId: row.user_id,
      source: row.source,
      merchantName: row.merchant_name,
      amount: row.amount,
      currency: row.currency,
      cycle: row.cycle || undefined,
      nextBillingAt: row.next_billing_at || undefined,
      category: row.category || undefined,
      confidence: row.confidence,
      status: row.status,
      rawData: row.raw_data,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapSettingsRowToAppSettings(row: UserSettingsRow): AppSettings {
    return {
      notifications: row.notifications,
      integrations: row.integrations,
      privacy: row.privacy,
      cancellation: row.cancellation,
      plan: row.plan,
    }
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
      .filter(sub => {
        if (!sub.nextBillingAt) return false
        const nextBilling = new Date(sub.nextBillingAt)
        return nextBilling >= now && nextBilling <= thirtyDaysFromNow
      })
      .sort((a, b) => {
        if (!a.nextBillingAt || !b.nextBillingAt) return 0
        return new Date(a.nextBillingAt).getTime() - new Date(b.nextBillingAt).getTime()
      })
      .slice(0, 10)
  }

  // Initialize with sample data (for development)
  async initializeSampleData(userId: string) {
    try {
      const existingSubscriptions = await this.getSubscriptions(userId)
      if (existingSubscriptions.length === 0) {
        const sampleSubscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> = {
          userId,
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
    } catch (error) {
      console.error('Error initializing sample data:', error)
    }
  }
}

export const databaseStorage = new DatabaseStorage()
