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

export class AnalyticsTracker {
  private static instance: AnalyticsTracker
  private events: AnalyticsEvent[] = []
  private pageViews: PageView[] = []
  private userJourneys: Map<string, UserJourney> = new Map()
  private isEnabled = true
  private maxEvents = 50000 // Keep last 50k events
  private maxPageViews = 10000 // Keep last 10k page views

  private constructor() {
    this.initializeTracking()
  }

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker()
    }
    return AnalyticsTracker.instance
  }

  /**
   * Initialize analytics tracking
   */
  private initializeTracking(): void {
    if (typeof window !== 'undefined') {
      // Track page views automatically
      this.trackPageView()
      
      // Track user interactions
      this.setupEventListeners()
      
      // Track performance metrics
      this.trackPerformanceMetrics()
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    properties: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): string {
    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      userId,
      sessionId,
      event,
      category,
      action,
      label,
      value,
      properties,
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      ipAddress: undefined // Would be set by server
    }

    this.events.push(analyticsEvent)

    // Update user journey
    if (userId && sessionId) {
      this.updateUserJourney(userId, sessionId, analyticsEvent)
    }

    // Clean up old events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Send to external analytics if configured
    this.sendToExternalAnalytics(analyticsEvent)

    return analyticsEvent.id
  }

  /**
   * Track page view
   */
  trackPageView(
    title?: string,
    userId?: string,
    sessionId?: string
  ): string {
    const pageView: PageView = {
      id: this.generatePageViewId(),
      userId,
      sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      title: title || (typeof window !== 'undefined' ? document.title : ''),
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      ipAddress: undefined
    }

    this.pageViews.push(pageView)

    // Update user journey
    if (userId && sessionId) {
      this.updateUserJourney(userId, sessionId, undefined, pageView)
    }

    // Clean up old page views
    if (this.pageViews.length > this.maxPageViews) {
      this.pageViews = this.pageViews.slice(-this.maxPageViews)
    }

    // Send to external analytics
    this.sendPageViewToExternalAnalytics(pageView)

    return pageView.id
  }

  /**
   * Track user engagement
   */
  trackEngagement(
    type: 'click' | 'scroll' | 'form_submit' | 'download' | 'video_play' | 'video_pause',
    element: string,
    properties: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): string {
    return this.trackEvent(
      'engagement',
      'user_interaction',
      type,
      element,
      undefined,
      properties,
      userId,
      sessionId
    )
  }

  /**
   * Track subscription events
   */
  trackSubscriptionEvent(
    action: 'created' | 'updated' | 'deleted' | 'renewed' | 'cancelled',
    subscriptionId: string,
    plan: string,
    amount: number,
    userId?: string,
    sessionId?: string
  ): string {
    return this.trackEvent(
      'subscription',
      'billing',
      action,
      subscriptionId,
      amount,
      { plan, subscriptionId },
      userId,
      sessionId
    )
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(
    feature: string,
    action: string,
    properties: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): string {
    return this.trackEvent(
      'feature_usage',
      'product',
      action,
      feature,
      undefined,
      properties,
      userId,
      sessionId
    )
  }

  /**
   * Track conversion events
   */
  trackConversion(
    goal: string,
    value: number,
    properties: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): string {
    return this.trackEvent(
      'conversion',
      'business',
      'completed',
      goal,
      value,
      properties,
      userId,
      sessionId
    )
  }

  /**
   * Track error events
   */
  trackError(
    error: string,
    errorType: string,
    properties: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): string {
    return this.trackEvent(
      'error',
      'system',
      errorType,
      error,
      undefined,
      properties,
      userId,
      sessionId
    )
  }

  /**
   * Track performance metrics
   */
  private trackPerformanceMetrics(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Track Core Web Vitals
      this.trackWebVitals()
      
      // Track resource loading
      this.trackResourceLoading()
      
      // Track navigation timing
      this.trackNavigationTiming()
    }
  }

  /**
   * Track Web Vitals
   */
  private async trackWebVitals(): Promise<void> {
    try {
      const { onCLS, onFCP, onLCP, onTTFB } = await import('web-vitals')
      
      onCLS((metric) => {
        this.trackEvent('web_vital', 'performance', 'CLS', undefined, metric.value, {
          rating: metric.rating,
          navigationType: metric.navigationType
        })
      })

      // Note: FID is deprecated, using INP instead

      onFCP((metric) => {
        this.trackEvent('web_vital', 'performance', 'FCP', undefined, metric.value, {
          rating: metric.rating,
          navigationType: metric.navigationType
        })
      })

      onLCP((metric) => {
        this.trackEvent('web_vital', 'performance', 'LCP', undefined, metric.value, {
          rating: metric.rating,
          navigationType: metric.navigationType
        })
      })

      onTTFB((metric) => {
        this.trackEvent('web_vital', 'performance', 'TTFB', undefined, metric.value, {
          rating: metric.rating,
          navigationType: metric.navigationType
        })
      })
    } catch (error) {
      console.warn('[ANALYTICS] Failed to track Web Vitals:', error)
    }
  }

  /**
   * Track resource loading
   */
  private trackResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            this.trackEvent('resource_load', 'performance', 'completed', resourceEntry.name, resourceEntry.duration, {
              initiatorType: resourceEntry.initiatorType,
              size: resourceEntry.transferSize
            })
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
    }
  }

  /**
   * Track navigation timing
   */
  private trackNavigationTiming(): void {
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.trackEvent('page_load', 'performance', 'completed', undefined, navEntry.loadEventEnd - navEntry.loadEventStart, {
              dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
              tcpConnection: navEntry.connectEnd - navEntry.connectStart,
              domProcessing: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
            })
          }
        }
      })
      navigationObserver.observe({ entryTypes: ['navigation'] })
    }
  }

  /**
   * Set up event listeners for automatic tracking
   */
  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      // Track clicks
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        if (target) {
          const element = target.tagName.toLowerCase()
          const text = target.textContent?.trim().substring(0, 50)
          this.trackEngagement('click', element, { text })
        }
      })

      // Track form submissions
      document.addEventListener('submit', (event) => {
        const form = event.target as HTMLFormElement
        if (form) {
          this.trackEngagement('form_submit', 'form', { 
            action: form.action,
            method: form.method 
          })
        }
      })

      // Track scroll depth
      let maxScrollDepth = 0
      window.addEventListener('scroll', () => {
        const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth
          if (maxScrollDepth % 25 === 0) { // Track every 25%
            this.trackEvent('scroll_depth', 'engagement', 'reached', undefined, maxScrollDepth)
          }
        }
      })
    }
  }

  /**
   * Update user journey with new event or page view
   */
  private updateUserJourney(
    userId: string,
    sessionId: string,
    event?: AnalyticsEvent,
    pageView?: PageView
  ): void {
    const journeyKey = `${userId}_${sessionId}`
    let journey = this.userJourneys.get(journeyKey)

    if (!journey) {
      journey = {
        userId,
        sessionId,
        events: [],
        pageViews: [],
        startTime: new Date()
      }
      this.userJourneys.set(journeyKey, journey)
    }

    if (event) {
      journey.events.push(event)
    }

    if (pageView) {
      journey.pageViews.push(pageView)
    }

    journey.endTime = new Date()
    journey.duration = journey.endTime.getTime() - journey.startTime.getTime()
  }

  /**
   * Send event to external analytics
   */
  private sendToExternalAnalytics(event: AnalyticsEvent): void {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.properties
      })
    }

    // Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event.event, {
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        ...event.properties
      })
    }

    // Amplitude
    if (typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.getInstance().logEvent(event.event, {
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        ...event.properties
      })
    }
  }

  /**
   * Send page view to external analytics
   */
  private sendPageViewToExternalAnalytics(pageView: PageView): void {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: pageView.title,
        page_location: pageView.url,
        page_referrer: pageView.referrer
      })
    }

    // Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track('Page View', {
        url: pageView.url,
        title: pageView.title,
        referrer: pageView.referrer
      })
    }
  }

  /**
   * Get analytics for a user
   */
  getUserAnalytics(userId: string, days: number = 30): {
    events: AnalyticsEvent[]
    pageViews: PageView[]
    journey: UserJourney | null
  } {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const events = this.events.filter(event => 
      event.userId === userId && event.timestamp > cutoffDate
    )
    
    const pageViews = this.pageViews.filter(pageView => 
      pageView.userId === userId && pageView.timestamp > cutoffDate
    )
    
    const journey = Array.from(this.userJourneys.values())
      .find(j => j.userId === userId) || null

    return { events, pageViews, journey }
  }

  /**
   * Get analytics statistics
   */
  getAnalyticsStats(): {
    totalEvents: number
    totalPageViews: number
    totalUsers: number
    eventsByCategory: Record<string, number>
    eventsByAction: Record<string, number>
    topPages: Array<{ url: string; views: number }>
  } {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recentEvents = this.events.filter(event => event.timestamp > oneDayAgo)
    const recentPageViews = this.pageViews.filter(pageView => pageView.timestamp > oneDayAgo)
    
    // Count events by category
    const eventsByCategory: Record<string, number> = {}
    recentEvents.forEach(event => {
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1
    })

    // Count events by action
    const eventsByAction: Record<string, number> = {}
    recentEvents.forEach(event => {
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1
    })

    // Count page views by URL
    const pageViewsByUrl: Record<string, number> = {}
    recentPageViews.forEach(pageView => {
      pageViewsByUrl[pageView.url] = (pageViewsByUrl[pageView.url] || 0) + 1
    })

    const topPages = Object.entries(pageViewsByUrl)
      .map(([url, views]) => ({ url, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    return {
      totalEvents: this.events.length,
      totalPageViews: this.pageViews.length,
      totalUsers: new Set(this.events.map(e => e.userId).filter(Boolean)).size,
      eventsByCategory,
      eventsByAction,
      topPages
    }
  }

  /**
   * Export analytics data
   */
  exportAnalytics(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): string {
    const filteredEvents = this.events.filter(event => 
      event.timestamp >= startDate && event.timestamp <= endDate
    )

    const filteredPageViews = this.pageViews.filter(pageView => 
      pageView.timestamp >= startDate && pageView.timestamp <= endDate
    )

    const data = {
      events: filteredEvents,
      pageViews: filteredPageViews,
      exportDate: new Date().toISOString(),
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() }
    }

    if (format === 'csv') {
      return this.toCSV(data)
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Clean up old analytics data
   */
  cleanupOldData(retentionDays: number = 90): number {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    const initialEventsCount = this.events.length
    const initialPageViewsCount = this.pageViews.length
    
    this.events = this.events.filter(event => event.timestamp > cutoffDate)
    this.pageViews = this.pageViews.filter(pageView => pageView.timestamp > cutoffDate)
    
    const removedEvents = initialEventsCount - this.events.length
    const removedPageViews = initialPageViewsCount - this.pageViews.length
    
    console.log(`[ANALYTICS] Cleaned up ${removedEvents} old events and ${removedPageViews} old page views`)
    
    return removedEvents + removedPageViews
  }

  /**
   * Enable/disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`[ANALYTICS] Analytics tracking ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Check if tracking is enabled
   */
  isTrackingEnabled(): boolean {
    return this.isEnabled
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generatePageViewId(): string {
    return `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private toCSV(data: any): string {
    // Implementation for CSV export
    return JSON.stringify(data)
  }
}

// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance()

// Convenience functions for common analytics tracking
export const analytics = {
  event: (event: string, category: string, action: string, label?: string, value?: number, properties?: Record<string, any>) =>
    analyticsTracker.trackEvent(event, category, action, label, value, properties),
  
  pageView: (title?: string) => analyticsTracker.trackPageView(title),
  
  engagement: (type: 'click' | 'scroll' | 'form_submit' | 'download' | 'video_play' | 'video_pause', element: string, properties?: Record<string, any>) =>
    analyticsTracker.trackEngagement(type, element, properties),
  
  subscription: (action: 'created' | 'updated' | 'deleted' | 'renewed' | 'cancelled', subscriptionId: string, plan: string, amount: number) =>
    analyticsTracker.trackSubscriptionEvent(action, subscriptionId, plan, amount),
  
  feature: (feature: string, action: string, properties?: Record<string, any>) =>
    analyticsTracker.trackFeatureUsage(feature, action, properties),
  
  conversion: (goal: string, value: number, properties?: Record<string, any>) =>
    analyticsTracker.trackConversion(goal, value, properties),
  
  error: (error: string, errorType: string, properties?: Record<string, any>) =>
    analyticsTracker.trackError(error, errorType, properties),
  
  stats: () => analyticsTracker.getAnalyticsStats(),
  
  export: (startDate: Date, endDate: Date, format?: 'json' | 'csv') =>
    analyticsTracker.exportAnalytics(startDate, endDate, format)
}
