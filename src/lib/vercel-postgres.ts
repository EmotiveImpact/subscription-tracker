import { sql } from '@vercel/postgres'

// Database table names
export const TABLES = {
  SUBSCRIPTIONS: 'subscriptions',
  MERCHANTS: 'merchants',
  DISCOVERIES: 'discoveries',
  USER_SETTINGS: 'user_settings',
  USER_PROFILES: 'user_profiles',
} as const

// Database types
export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string
          user_id: string
          merchant_name: string
          amount: number
          currency: string
          cycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly'
          status: 'active' | 'cancelled' | 'paused'
          category: string | null
          next_billing_at: string | null
          description: string | null
          website: string | null
          notes: string | null
          auto_renew: boolean
          difficulty: 'easy' | 'medium' | 'hard'
          cancellation_url: string | null
          cancellation_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          merchant_name: string
          amount: number
          currency: string
          cycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly'
          status?: 'active' | 'cancelled' | 'paused'
          category?: string | null
          next_billing_at?: string | null
          description?: string | null
          website?: string | null
          notes?: string | null
          auto_renew?: boolean
          difficulty?: 'easy' | 'medium' | 'hard'
          cancellation_url?: string | null
          cancellation_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          merchant_name?: string
          amount?: number
          currency?: string
          cycle?: 'monthly' | 'yearly' | 'weekly' | 'quarterly'
          status?: 'active' | 'cancelled' | 'paused'
          category?: string | null
          next_billing_at?: string | null
          description?: string | null
          website?: string | null
          notes?: string | null
          auto_renew?: boolean
          difficulty?: 'easy' | 'medium' | 'hard'
          cancellation_url?: string | null
          cancellation_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      merchants: {
        Row: {
          id: string
          name: string
          website: string | null
          category: string | null
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          website?: string | null
          category?: string | null
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          website?: string | null
          category?: string | null
          logo_url?: string | null
          created_at?: string
        }
      }
      discoveries: {
        Row: {
          id: string
          user_id: string
          source: 'gmail' | 'outlook' | 'manual' | 'receipt_scan'
          merchant_name: string
          amount: number
          currency: string
          cycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | null
          next_billing_at: string | null
          category: string | null
          confidence: 'high' | 'medium' | 'low'
          status: 'pending' | 'confirmed' | 'ignored' | 'converted'
          raw_data: any
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source: 'gmail' | 'outlook' | 'manual' | 'receipt_scan'
          merchant_name: string
          amount: number
          currency: string
          cycle?: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | null
          next_billing_at?: string | null
          category?: string | null
          confidence?: 'high' | 'medium' | 'low'
          status?: 'pending' | 'confirmed' | 'ignored' | 'converted'
          raw_data?: any
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: 'gmail' | 'outlook' | 'manual' | 'receipt_scan'
          merchant_name?: string
          amount?: number
          currency?: string
          cycle?: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | null
          next_billing_at?: string | null
          category?: string | null
          confidence?: 'high' | 'medium' | 'low'
          status?: 'pending' | 'confirmed' | 'ignored' | 'converted'
          raw_data?: any
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          notifications: any
          integrations: any
          privacy: any
          cancellation: any
          plan: 'free' | 'pro'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notifications?: any
          integrations?: any
          privacy?: any
          cancellation?: any
          plan?: 'free' | 'pro'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notifications?: any
          integrations?: any
          privacy?: any
          cancellation?: any
          plan?: 'free' | 'pro'
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          phone: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export { sql }
