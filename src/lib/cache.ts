import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'

// Cache configuration
const CACHE_CONFIG = {
  // Default TTL values (in seconds)
  TTL: {
    SUBSCRIPTIONS: 300,      // 5 minutes
    DISCOVERIES: 180,        // 3 minutes
    SETTINGS: 600,           // 10 minutes
    ANALYTICS: 900,          // 15 minutes
    USER_PROFILE: 1800,      // 30 minutes
    OAUTH_TOKENS: 3600,      // 1 hour
    MERCHANTS: 7200,         // 2 hours
    STATIC_DATA: 86400,      // 24 hours
  },
  
  // Cache key prefixes
  PREFIXES: {
    SUBSCRIPTIONS: 'sub:',
    DISCOVERIES: 'disc:',
    SETTINGS: 'settings:',
    ANALYTICS: 'analytics:',
    USER_PROFILE: 'user:',
    OAUTH_TOKENS: 'oauth:',
    MERCHANTS: 'merchant:',
    STATIC_DATA: 'static:',
  }
} as const

// Cache interface
export interface CacheOptions {
  ttl?: number
  tags?: string[]
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags?: string[]
}

// Cache service class
export class CacheService {
  private redis: Redis | null = null
  private isEnabled: boolean = false
  private localCache: Map<string, CacheEntry<any>> = new Map()
  private localCacheSize: number = 1000 // Maximum local cache entries

  constructor() {
    this.initializeRedis()
  }

  // Initialize Redis connection
  private async initializeRedis() {
    try {
      if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
        this.redis = new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        })
        
        // Test connection
        await this.redis.ping()
        this.isEnabled = true
        console.log('Redis cache enabled')
      } else {
        console.log('Redis not configured, using local cache only')
      }
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
      this.isEnabled = false
    }
  }

  // Generate cache key
  private generateKey(prefix: string, identifier: string): string {
    return `${prefix}${identifier}`
  }

  // Get value from cache
  async get<T>(key: string, prefix: string = ''): Promise<T | null> {
    const fullKey = this.generateKey(prefix, key)
    
    try {
      // Try local cache first
      const localEntry = this.localCache.get(fullKey)
      if (localEntry && this.isLocalCacheValid(localEntry)) {
        return localEntry.data
      }

      // Try Redis cache
      if (this.redis && this.isEnabled) {
        const redisEntry = await this.redis.get<CacheEntry<T>>(fullKey)
        if (redisEntry && this.isRedisCacheValid(redisEntry)) {
          // Update local cache
          this.setLocalCache(fullKey, redisEntry)
          return redisEntry.data
        }
      }

      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // Set value in cache
  async set<T>(
    key: string, 
    data: T, 
    prefix: string = '', 
    options: CacheOptions = {}
  ): Promise<void> {
    const fullKey = this.generateKey(prefix, key)
    const ttl = options.ttl || CACHE_CONFIG.TTL.STATIC_DATA
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      tags: options.tags
    }

    try {
      // Set in local cache
      this.setLocalCache(fullKey, entry)

      // Set in Redis cache
      if (this.redis && this.isEnabled) {
        await this.redis.setex(fullKey, ttl, entry)
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Delete value from cache
  async delete(key: string, prefix: string = ''): Promise<void> {
    const fullKey = this.generateKey(prefix, key)
    
    try {
      // Remove from local cache
      this.localCache.delete(fullKey)

      // Remove from Redis cache
      if (this.redis && this.isEnabled) {
        await this.redis.del(fullKey)
      }
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  // Invalidate cache by tags
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      if (this.redis && this.isEnabled) {
        // Get all keys with matching tags
        const keys = await this.redis.keys('*')
        const keysToDelete: string[] = []

        for (const key of keys) {
          try {
            const entry = await this.redis.get<CacheEntry<any>>(key)
            if (entry?.tags && entry.tags.some(tag => tags.includes(tag))) {
              keysToDelete.push(key)
            }
          } catch (e) {
            // Skip invalid entries
          }
        }

        // Delete matching keys
        if (keysToDelete.length > 0) {
          await this.redis.del(...keysToDelete)
        }
      }

      // Clear local cache entries with matching tags
      this.localCache.forEach((entry, key) => {
        if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
          this.localCache.delete(key)
        }
      })
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      // Clear local cache
      this.localCache.clear()

      // Clear Redis cache
      if (this.redis && this.isEnabled) {
        await this.redis.flushdb()
      }
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    localCacheSize: number
    localCacheKeys: string[]
    redisEnabled: boolean
    redisKeys?: number
  }> {
    const stats: {
      localCacheSize: number
      localCacheKeys: string[]
      redisEnabled: boolean
      redisKeys?: number
    } = {
      localCacheSize: this.localCache.size,
      localCacheKeys: Array.from(this.localCache.keys()),
      redisEnabled: this.isEnabled,
    }

    try {
      if (this.redis && this.isEnabled) {
        stats.redisKeys = await this.redis.dbsize()
      }
    } catch (error) {
      console.error('Failed to get Redis stats:', error)
    }

    return stats
  }

  // Check if local cache entry is valid
  private isLocalCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  // Check if Redis cache entry is valid
  private isRedisCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  // Set local cache with size management
  private setLocalCache<T>(key: string, entry: CacheEntry<T>): void {
    // Remove oldest entries if cache is full
    if (this.localCache.size >= this.localCacheSize) {
      const oldestKey = this.localCache.keys().next().value
      if (oldestKey) {
        this.localCache.delete(oldestKey)
      }
    }

    this.localCache.set(key, entry)
  }

  // Cache decorator for methods
  static cache<T>(
    prefix: string,
    keyGenerator: (...args: any[]) => string,
    options: CacheOptions = {}
  ) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const cacheService = new CacheService()
        const cacheKey = keyGenerator(...args)
        
        // Try to get from cache
        const cached = await cacheService.get<T>(cacheKey, prefix)
        if (cached !== null) {
          return cached
        }

        // Execute method and cache result
        const result = await method.apply(this, args)
        await cacheService.set(cacheKey, result, prefix, options)
        
        return result
      }
    }
  }
}

// Convenience methods for common cache operations
export class SubscriptionCache {
  private static cacheService = new CacheService()

  // Cache subscriptions for a user
  static async getSubscriptions(userId: string) {
    return this.cacheService.get(`subscriptions:${userId}`, CACHE_CONFIG.PREFIXES.SUBSCRIPTIONS)
  }

  static async setSubscriptions(userId: string, subscriptions: any[]) {
    await this.cacheService.set(
      `subscriptions:${userId}`, 
      subscriptions, 
      CACHE_CONFIG.PREFIXES.SUBSCRIPTIONS,
      { ttl: CACHE_CONFIG.TTL.SUBSCRIPTIONS, tags: [`user:${userId}`, 'subscriptions'] }
    )
  }

  static async invalidateUserSubscriptions(userId: string) {
    await this.cacheService.invalidateByTags([`user:${userId}`, 'subscriptions'])
  }
}

export class AnalyticsCache {
  private static cacheService = new CacheService()

  // Cache analytics data
  static async getAnalytics(userId: string, type: string) {
    return this.cacheService.get(`analytics:${userId}:${type}`, CACHE_CONFIG.PREFIXES.ANALYTICS)
  }

  static async setAnalytics(userId: string, type: string, data: any) {
    await this.cacheService.set(
      `analytics:${userId}:${type}`, 
      data, 
      CACHE_CONFIG.PREFIXES.ANALYTICS,
      { ttl: CACHE_CONFIG.TTL.ANALYTICS, tags: [`user:${userId}`, 'analytics'] }
    )
  }

  static async invalidateUserAnalytics(userId: string) {
    await this.cacheService.invalidateByTags([`user:${userId}`, 'analytics'])
  }
}

export class SettingsCache {
  private static cacheService = new CacheService()

  // Cache user settings
  static async getSettings(userId: string) {
    return this.cacheService.get(`settings:${userId}`, CACHE_CONFIG.PREFIXES.SETTINGS)
  }

  static async setSettings(userId: string, settings: any) {
    await this.cacheService.set(
      `settings:${userId}`, 
      settings, 
      CACHE_CONFIG.PREFIXES.SETTINGS,
      { ttl: CACHE_CONFIG.TTL.SETTINGS, tags: [`user:${userId}`, 'settings'] }
    )
  }

  static async invalidateUserSettings(userId: string) {
    await this.cacheService.invalidateByTags([`user:${userId}`, 'settings'])
  }
}

// Export cache service instance
export const cacheService = new CacheService()

// Export cache configuration
export { CACHE_CONFIG }
