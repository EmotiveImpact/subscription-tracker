import { type LucideIcon } from "lucide-react"

// Component Props
export interface BaseProps {
  className?: string
  children?: React.ReactNode
}

export interface NavItem {
  title: string
  href: string
  icon?: LucideIcon
  badge?: string | number
  disabled?: boolean
  external?: boolean
}

export interface SidebarNavItem extends NavItem {
  items?: SidebarNavItem[]
}

// Core Data Types
export interface Subscription {
  id: string
  userId: string
  merchantName: string
  amount: number
  currency: string
  cycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly'
  nextBillingAt?: string
  status: 'active' | 'cancelled' | 'paused'
  source?: 'gmail' | 'manual' | 'outlook'
  category?: string
  description?: string
  notes?: string
  website?: string
  autoRenew?: boolean
  difficulty?: 'easy' | 'medium' | 'hard'
  cancellationUrl?: string
  cancellationInstructions?: string
  createdAt: string
  updatedAt: string
}

export interface Discovery {
  id: string;
  userId: string;
  source: 'gmail' | 'outlook' | 'manual' | 'receipt_scan';
  merchantName: string;
  amount: number;
  currency: string;
  cycle?: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  nextBillingAt?: string;
  category?: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'pending' | 'confirmed' | 'ignored' | 'converted';
  rawData: any;
  metadata: {
    emailId?: string;
    receiptUrl?: string;
    scannedText?: string;
    detectedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  id: string
  name: string
  website?: string
  category?: string
  logoUrl?: string
  createdAt?: string
}

export interface AppSettings {
  notifications: NotificationSettings
  integrations: IntegrationSettings
  privacy: PrivacySettings
  cancellation: CancellationSettings
  plan?: Plan
}

export interface NotificationSettings {
  billing: boolean
  trial: boolean
  priceChanges: boolean
  cancellation: boolean
  email: boolean
  push: boolean
  sms: boolean
}

export interface IntegrationSettings {
  gmail: EmailIntegration
  outlook: EmailIntegration
  calendar: EmailIntegration
}

export interface EmailIntegration {
  connected: boolean
  email: string
}

export interface PrivacySettings {
  dataRetention: '30_days' | '6_months' | '1_year' | 'forever'
  analyticsSharing: boolean
  thirdPartySharing: boolean
}

export interface CancellationSettings {
  autoReminders: boolean
  difficultyFilter: 'all' | 'easy' | 'easy_medium'
  instructions: boolean
}

export type Plan = 'free' | 'pro'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  currency: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    reminderDays: number
  }
  createdAt: Date
  updatedAt: Date
}

// Analytics Types
export interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  cancelledSubscriptions: number
  monthlyTotal: number
  yearlyTotal: number
  categoryBreakdown: CategoryBreakdown[]
  upcomingBills: Subscription[]
}

export interface CategoryBreakdown {
  category: string
  count: number
  total: number
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form Types
export interface FormFieldProps {
  name: string
  label?: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

// State Types
export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive" | "success" | "warning"
  duration?: number
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Theme Types
export type Theme = "light" | "dark" | "system"

// Sort and Filter Types
export interface SortConfig {
  key: string
  direction: "asc" | "desc"
}

export interface FilterConfig {
  search?: string
  category?: string
  status?: "active" | "inactive" | "all"
  dateRange?: {
    from: Date
    to: Date
  }
}

// Dashboard Analytics Types
export interface AnalyticsData {
  totalCost: number
  monthlyTotal: number
  yearlyTotal: number
  activeSubscriptions: number
  upcomingRenewals: number
  costTrend: Array<{
    month: string
    amount: number
  }>
  categoryBreakdown: Array<{
    category: string
    amount: number
    count: number
  }>
}

// Export commonly used types for convenience
export type { LucideIcon }
