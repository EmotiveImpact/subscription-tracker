import { Subscription, Discovery } from '@/types'
import React from 'react' // Added for React hook

export interface SpendingPattern {
  monthly: number
  yearly: number
  total: number
  averagePerMonth: number
  projectedAnnual: number
}

export interface CategoryBreakdown {
  category: string
  count: number
  totalSpending: number
  percentage: number
}

export interface SubscriptionInsights {
  totalSubscriptions: number
  activeSubscriptions: number
  cancelledSubscriptions: number
  totalSpending: SpendingPattern
  categoryBreakdown: CategoryBreakdown[]
  monthlyTrends: MonthlyTrend[]
  savingsOpportunities: SavingsOpportunity[]
  renewalSchedule: RenewalEvent[]
}

export interface MonthlyTrend {
  month: string
  spending: number
  subscriptionCount: number
  change: number
}

export interface SavingsOpportunity {
  type: 'annual_discount' | 'unused_subscription' | 'duplicate_service' | 'price_increase'
  description: string
  potentialSavings: number
  action: string
  priority: 'high' | 'medium' | 'low'
}

export interface RenewalEvent {
  subscriptionId: string
  merchantName: string
  amount: number
  renewalDate: Date
  daysUntilRenewal: number
  autoRenew?: boolean
}

export interface AnalyticsEvent {
  id: string
  userId?: string
  sessionId?: string
  event: string
  category: string
  action: string
  label?: string
  value?: number
  properties: Record<string, any>
  timestamp: Date
  url: string
  userAgent?: string
  ipAddress?: string
}

export interface PageView {
  id: string
  userId?: string
  sessionId?: string
  url: string
  title: string
  referrer?: string
  timestamp: Date
  duration?: number
  userAgent?: string
  ipAddress?: string
}

export interface UserJourney {
  userId: string
  sessionId: string
  events: AnalyticsEvent[]
  pageViews: PageView[]
  startTime: Date
  endTime?: Date
  duration?: number
}

export class AnalyticsService {
  // Calculate total spending patterns
  static calculateSpendingPattern(subscriptions: Subscription[]): SpendingPattern {
    const activeSubs = subscriptions.filter(sub => sub.status === 'active')
    
    let monthly = 0
    let yearly = 0
    
    activeSubs.forEach(sub => {
      if (sub.cycle === 'monthly') {
        monthly += sub.amount
      } else if (sub.cycle === 'yearly') {
        yearly += sub.amount
      } else if (sub.cycle === 'weekly') {
        monthly += sub.amount * 4.33 // Average weeks per month
      } else if (sub.cycle === 'quarterly') {
        monthly += sub.amount / 3
      }
    })
    
    const total = monthly + yearly
    const averagePerMonth = monthly + (yearly / 12)
    const projectedAnnual = averagePerMonth * 12
    
    return {
      monthly,
      yearly,
      total,
      averagePerMonth,
      projectedAnnual
    }
  }

  // Analyze spending by category
  static analyzeCategoryBreakdown(subscriptions: Subscription[]): CategoryBreakdown[] {
    const activeSubs = subscriptions.filter(sub => sub.status === 'active')
    const categoryMap = new Map<string, { count: number; spending: number }>()
    
    activeSubs.forEach(sub => {
      const category = sub.category || 'Uncategorized'
      const existing = categoryMap.get(category) || { count: 0, spending: 0 }
      
      let monthlyAmount = sub.amount
      if (sub.cycle === 'yearly') monthlyAmount = sub.amount / 12
      else if (sub.cycle === 'weekly') monthlyAmount = sub.amount * 4.33
      else if (sub.cycle === 'quarterly') monthlyAmount = sub.amount / 3
      
      categoryMap.set(category, {
        count: existing.count + 1,
        spending: existing.spending + monthlyAmount
      })
    })
    
    const totalSpending = Array.from(categoryMap.values())
      .reduce((sum, item) => sum + item.spending, 0)
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        totalSpending: data.spending,
        percentage: (data.spending / totalSpending) * 100
      }))
      .sort((a, b) => b.totalSpending - a.totalSpending)
  }

  // Calculate monthly spending trends
  static calculateMonthlyTrends(subscriptions: Subscription[]): MonthlyTrend[] {
    const activeSubs = subscriptions.filter(sub => sub.status === 'active')
    const monthlyData = new Map<string, { spending: number; count: number }>()
    
    // Get last 12 months
    const months: string[] = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
      months.push(monthKey)
      monthlyData.set(monthKey, { spending: 0, count: 0 })
    }
    
    activeSubs.forEach(sub => {
      let monthlyAmount = sub.amount
      if (sub.cycle === 'yearly') monthlyAmount = sub.amount / 12
      else if (sub.cycle === 'weekly') monthlyAmount = sub.amount * 4.33
      else if (sub.cycle === 'quarterly') monthlyAmount = sub.amount / 3
      
      months.forEach(month => {
        const data = monthlyData.get(month)!
        data.spending += monthlyAmount
        data.count += 1
      })
    })
    
    return months.map((month, index) => {
      const data = monthlyData.get(month)!
      const prevMonth = months[index - 1]
      const prevData = prevMonth ? monthlyData.get(prevMonth) : null
      const change = prevData ? ((data.spending - prevData.spending) / prevData.spending) * 100 : 0
      
      return {
        month,
        spending: Math.round(data.spending * 100) / 100,
        subscriptionCount: data.count,
        change: Math.round(change * 100) / 100
      }
    })
  }

  // Identify savings opportunities
  static identifySavingsOpportunities(subscriptions: Subscription[]): SavingsOpportunity[] {
    const opportunities: SavingsOpportunity[] = []
    const activeSubs = subscriptions.filter(sub => sub.status === 'active')
    
    // Check for annual discount opportunities
    const monthlySubs = activeSubs.filter(sub => sub.cycle === 'monthly')
    monthlySubs.forEach(sub => {
      const annualCost = sub.amount * 12
      const potentialSavings = annualCost * 0.2 // Assume 20% annual discount
      if (potentialSavings > 10) { // Only suggest if savings > $10
        opportunities.push({
          type: 'annual_discount',
          description: `Switch ${sub.merchantName} to annual billing`,
          potentialSavings,
          action: 'Contact merchant for annual pricing',
          priority: 'medium'
        })
      }
    })
    
    // Check for unused subscriptions (no activity in 3+ months)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    activeSubs.forEach(sub => {
      if (sub.createdAt && new Date(sub.createdAt) < threeMonthsAgo) {
        const monthlyAmount = sub.cycle === 'monthly' ? sub.amount : 
                            sub.cycle === 'yearly' ? sub.amount / 12 :
                            sub.cycle === 'weekly' ? sub.amount * 4.33 :
                            sub.amount / 3
        
        opportunities.push({
          type: 'unused_subscription',
          description: `${sub.merchantName} may be unused`,
          potentialSavings: monthlyAmount * 12,
          action: 'Review usage and consider cancellation',
          priority: 'high'
        })
      }
    })
    
    // Check for duplicate services
    const categories = new Map<string, Subscription[]>()
    activeSubs.forEach(sub => {
      const category = sub.category || 'Uncategorized'
      if (!categories.has(category)) categories.set(category, [])
      categories.get(category)!.push(sub)
    })
    
    categories.forEach((subs, category) => {
      if (subs.length > 1) {
        const totalSpending = subs.reduce((sum, sub) => {
          let monthlyAmount = sub.amount
          if (sub.cycle === 'yearly') monthlyAmount = sub.amount / 12
          else if (sub.cycle === 'weekly') monthlyAmount = sub.amount * 4.33
          else if (sub.cycle === 'quarterly') monthlyAmount = sub.amount / 3
          return sum + monthlyAmount
        }, 0)
        
        opportunities.push({
          type: 'duplicate_service',
          description: `Multiple ${category} services (${subs.length})`,
          potentialSavings: totalSpending * 0.5, // Assume 50% savings from consolidation
          action: 'Review and consolidate similar services',
          priority: 'high'
        })
      }
    })
    
    return opportunities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Generate renewal schedule
  static generateRenewalSchedule(subscriptions: Subscription[]): RenewalEvent[] {
    const activeSubs = subscriptions.filter(sub => sub.status === 'active')
    const now = new Date()
    
    return activeSubs
      .map(sub => {
        let nextRenewal = new Date()
        
        if (sub.nextBillingAt) {
          nextRenewal = new Date(sub.nextBillingAt)
        } else {
          // Estimate next renewal based on cycle
          if (sub.cycle === 'monthly') nextRenewal.setMonth(nextRenewal.getMonth() + 1)
          else if (sub.cycle === 'yearly') nextRenewal.setFullYear(nextRenewal.getFullYear() + 1)
          else if (sub.cycle === 'weekly') nextRenewal.setDate(nextRenewal.getDate() + 7)
          else if (sub.cycle === 'quarterly') nextRenewal.setMonth(nextRenewal.getMonth() + 3)
        }
        
        const daysUntilRenewal = Math.ceil((nextRenewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          subscriptionId: sub.id,
          merchantName: sub.merchantName,
          amount: sub.amount,
          renewalDate: nextRenewal,
          daysUntilRenewal
        }
      })
      .filter(event => event.daysUntilRenewal >= 0) // Only future renewals
      .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal)
  }

  // Calculate ROI for business subscriptions
  static calculateBusinessROI(subscriptions: Subscription[], revenue: number): {
    totalCost: number
    roi: number
    costPerDollar: number
    recommendations: string[]
  } {
    const businessSubs = subscriptions.filter(sub => 
      sub.category === 'Business' || 
      sub.category === 'Productivity' || 
      sub.category === 'Marketing' ||
      sub.category === 'Analytics'
    )
    
    const totalCost = businessSubs.reduce((sum, sub) => {
      let monthlyAmount = sub.amount
      if (sub.cycle === 'yearly') monthlyAmount = sub.amount / 12
      else if (sub.cycle === 'weekly') monthlyAmount = sub.amount * 4.33
      else if (sub.cycle === 'quarterly') monthlyAmount = sub.amount / 3
      return sum + monthlyAmount
    }, 0) * 12 // Annual cost
    
    const roi = revenue > 0 ? ((revenue - totalCost) / totalCost) * 100 : 0
    const costPerDollar = revenue > 0 ? totalCost / revenue : 0
    
    const recommendations: string[] = []
    
    if (roi < 100) {
      recommendations.push('Consider reviewing business tool subscriptions for ROI')
    }
    if (costPerDollar > 0.1) {
      recommendations.push('Business tools cost more than 10% of revenue - review necessity')
    }
    if (businessSubs.length > 10) {
      recommendations.push('Many business tools - consider consolidation opportunities')
    }
    
    return {
      totalCost,
      roi: Math.round(roi * 100) / 100,
      costPerDollar: Math.round(costPerDollar * 1000) / 1000,
      recommendations
    }
  }

  // Generate comprehensive insights
  static generateInsights(subscriptions: Subscription[], discoveries: Discovery[]): SubscriptionInsights {
    const spendingPattern = this.calculateSpendingPattern(subscriptions)
    const categoryBreakdown = this.analyzeCategoryBreakdown(subscriptions)
    const monthlyTrends = this.calculateMonthlyTrends(subscriptions)
    const savingsOpportunities = this.identifySavingsOpportunities(subscriptions)
    const renewalSchedule = this.generateRenewalSchedule(subscriptions)
    
    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length,
      cancelledSubscriptions: subscriptions.filter(sub => sub.status === 'cancelled').length,
      totalSpending: spendingPattern,
      categoryBreakdown,
      monthlyTrends,
      savingsOpportunities,
      renewalSchedule
    }
  }
}

// Analytics hook for React components
export function useAnalytics(userId?: string, sessionId?: string) {
  const trackEvent = React.useCallback((
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    properties?: Record<string, any>
  ) => {
    // This part needs to be adapted to use the new analyticsTracker
    // For now, it's a placeholder. The actual tracking will happen via the analyticsTracker singleton.
    // The original file had a placeholder for analyticsTracker, but it was not defined.
    // Assuming analyticsTracker is defined elsewhere or will be added.
    // For now, we'll just log to console.
    console.log(`Tracking event: ${event}, Category: ${category}, Action: ${action}, Label: ${label}, Value: ${value}, Properties:`, properties);
  }, [userId, sessionId])

  const trackEngagement = React.useCallback((
    type: 'click' | 'scroll' | 'form_submit' | 'download' | 'video_play' | 'video_pause',
    element: string,
    properties?: Record<string, any>
  ) => {
    // This part needs to be adapted to use the new analyticsTracker
    // For now, it's a placeholder. The actual tracking will happen via the analyticsTracker singleton.
    // The original file had a placeholder for analyticsTracker, but it was not defined.
    // Assuming analyticsTracker is defined elsewhere or will be added.
    // For now, we'll just log to console.
    console.log(`Tracking engagement: ${type}, Element: ${element}, Properties:`, properties);
  }, [userId, sessionId])

  const trackFeature = React.useCallback((
    feature: string,
    action: string,
    properties?: Record<string, any>
  ) => {
    // This part needs to be adapted to use the new analyticsTracker
    // For now, it's a placeholder. The actual tracking will happen via the analyticsTracker singleton.
    // The original file had a placeholder for analyticsTracker, but it was not defined.
    // Assuming analyticsTracker is defined elsewhere or will be added.
    // For now, we'll just log to console.
    console.log(`Tracking feature usage: ${feature}, Action: ${action}, Properties:`, properties);
  }, [userId, sessionId])

  return {
    trackEvent,
    trackEngagement,
    trackFeature
  }
}
