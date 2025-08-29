

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: Date
  userId?: string
  sessionId?: string
  url?: string
  tags: Record<string, string>
  metadata: Record<string, any>
}

export interface PerformanceMark {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

export interface PerformanceObserver {
  name: string
  callback: (metric: PerformanceMetric) => void
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private marks: Map<string, PerformanceMark> = new Map()
  private observers: PerformanceObserver[] = []
  private isEnabled = true
  private maxMetrics = 10000 // Keep last 10k metrics

  private constructor() {
    this.initializeWebVitals()
    this.setupPerformanceObserver()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private async initializeWebVitals(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const { onCLS, onFCP, onLCP, onTTFB } = await import('web-vitals')
        
        // Cumulative Layout Shift (CLS)
        onCLS((metric) => {
          this.recordMetric('CLS', metric.value, 'score', {
            rating: metric.rating,
            navigationType: metric.navigationType
          })
        })

        // First Input Delay (FID)
        // Note: FID is deprecated, using INP instead

        // First Contentful Paint (FCP)
        onFCP((metric) => {
          this.recordMetric('FCP', metric.value, 'ms', {
            rating: metric.rating,
            navigationType: metric.navigationType
          })
        })

        // Largest Contentful Paint (LCP)
        onLCP((metric) => {
          this.recordMetric('LCP', metric.value, 'ms', {
            rating: metric.rating,
            navigationType: metric.navigationType
          })
        })

        // Time to First Byte (TTFB)
        onTTFB((metric) => {
          this.recordMetric('TTFB', metric.value, 'ms', {
            rating: metric.rating,
            navigationType: metric.navigationType
          })
        })
      }
    } catch (error) {
      console.warn('[PERFORMANCE] Failed to initialize Web Vitals:', error)
    }
  }

  /**
   * Set up performance observer for navigation timing
   */
  private setupPerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Observe navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              this.recordNavigationMetrics(navEntry)
            }
          }
        })
        navigationObserver.observe({ entryTypes: ['navigation'] })

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming
              this.recordResourceMetrics(resourceEntry)
            }
          }
        })
        resourceObserver.observe({ entryTypes: ['resource'] })

        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              const paintEntry = entry as PerformancePaintTiming
              this.recordPaintMetrics(paintEntry)
            }
          }
        })
        paintObserver.observe({ entryTypes: ['paint'] })
      } catch (error) {
        console.warn('[PERFORMANCE] Failed to setup PerformanceObserver:', error)
      }
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    metadata: Record<string, any> = {},
    userId?: string,
    sessionId?: string,
    url?: string
  ): string {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      name,
      value,
      unit,
      timestamp: new Date(),
      userId,
      sessionId,
      url: url || (typeof window !== 'undefined' ? window.location.href : undefined),
      tags: {},
      metadata
    }

    this.metrics.push(metric)

    // Notify observers
    this.notifyObservers(metric)

    // Clean up old metrics if we exceed the limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    return metric.id
  }

  /**
   * Start a performance mark
   */
  startMark(name: string, metadata?: Record<string, any>): void {
    const startTime = performance.now()
    
    this.marks.set(name, {
      name,
      startTime,
      metadata
    })
  }

  /**
   * End a performance mark and record the duration
   */
  endMark(name: string, additionalMetadata?: Record<string, any>): number | null {
    const mark = this.marks.get(name)
    if (!mark) {
      console.warn(`[PERFORMANCE] Mark '${name}' not found`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - mark.startTime

    mark.endTime = endTime
    mark.duration = duration

    // Record the metric
    this.recordMetric(
      `mark_${name}`,
      duration,
      'ms',
      {
        ...mark.metadata,
        ...additionalMetadata,
        startTime: mark.startTime,
        endTime: mark.endTime
      }
    )

    // Remove the mark
    this.marks.delete(name)

    return duration
  }

  /**
   * Measure time for an async operation
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMark(name, metadata)
    
    try {
      const result = await operation()
      this.endMark(name, { success: true })
      return result
    } catch (error) {
      this.endMark(name, { success: false, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Measure time for a sync operation
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    this.startMark(name, metadata)
    
    try {
      const result = operation()
      this.endMark(name, { success: true })
      return result
    } catch (error) {
      this.endMark(name, { success: false, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Record navigation timing metrics
   */
  private recordNavigationMetrics(navEntry: PerformanceNavigationTiming): void {
    const metrics = [
      { name: 'DNS_Lookup', value: navEntry.domainLookupEnd - navEntry.domainLookupStart },
      { name: 'TCP_Connection', value: navEntry.connectEnd - navEntry.connectStart },
      { name: 'Request_Response', value: navEntry.responseEnd - navEntry.requestStart },
      { name: 'DOM_Processing', value: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart },
      { name: 'Load_Complete', value: navEntry.loadEventEnd - navEntry.loadEventStart }
    ]

    metrics.forEach(({ name, value }) => {
      if (value > 0) {
        this.recordMetric(name, value, 'ms', {
          entryType: 'navigation',
          url: navEntry.name
        })
      }
    })
  }

  /**
   * Record resource timing metrics
   */
  private recordResourceMetrics(resourceEntry: PerformanceResourceTiming): void {
    const duration = resourceEntry.duration
    const size = resourceEntry.transferSize || 0

    this.recordMetric('Resource_Load_Time', duration, 'ms', {
      entryType: 'resource',
      url: resourceEntry.name,
      initiatorType: resourceEntry.initiatorType,
      size
    })

    if (size > 0) {
      this.recordMetric('Resource_Size', size, 'bytes', {
        entryType: 'resource',
        url: resourceEntry.name,
        initiatorType: resourceEntry.initiatorType
      })
    }
  }

  /**
   * Record paint timing metrics
   */
  private recordPaintMetrics(paintEntry: PerformancePaintTiming): void {
    this.recordMetric(`Paint_${paintEntry.name}`, paintEntry.startTime, 'ms', {
      entryType: 'paint',
      paintName: paintEntry.name
    })
  }

  /**
   * Add a performance observer
   */
  addObserver(observer: PerformanceObserver): void {
    this.observers.push(observer)
  }

  /**
   * Remove a performance observer
   */
  removeObserver(name: string): void {
    this.observers = this.observers.filter(obs => obs.name !== name)
  }

  /**
   * Notify all observers of a new metric
   */
  private notifyObservers(metric: PerformanceMetric): void {
    this.observers.forEach(observer => {
      try {
        observer.callback(metric)
      } catch (error) {
        console.warn(`[PERFORMANCE] Observer '${observer.name}' failed:`, error)
      }
    })
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string, limit: number = 100): PerformanceMetric[] {
    return this.metrics
      .filter(metric => metric.name === name)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get metrics for a user
   */
  getUserMetrics(userId: string, limit: number = 100): PerformanceMetric[] {
    return this.metrics
      .filter(metric => metric.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalMetrics: number
    metricsByName: Record<string, { count: number; avgValue: number; minValue: number; maxValue: number }>
    recentMetrics: PerformanceMetric[]
  } {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const recentMetrics = this.metrics.filter(metric => metric.timestamp > oneHourAgo)
    
    // Group metrics by name and calculate statistics
    const metricsByName: Record<string, { count: number; avgValue: number; minValue: number; maxValue: number }> = {}
    
    recentMetrics.forEach(metric => {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = { count: 0, avgValue: 0, minValue: Infinity, maxValue: -Infinity }
      }
      
      const stats = metricsByName[metric.name]
      stats.count++
      stats.avgValue = (stats.avgValue * (stats.count - 1) + metric.value) / stats.count
      stats.minValue = Math.min(stats.minValue, metric.value)
      stats.maxValue = Math.max(stats.maxValue, metric.value)
    })

    return {
      totalMetrics: this.metrics.length,
      metricsByName,
      recentMetrics: recentMetrics.slice(-100) // Last 100 metrics
    }
  }

  /**
   * Export performance data
   */
  exportMetrics(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): string {
    const filteredMetrics = this.metrics.filter(metric => 
      metric.timestamp >= startDate && metric.timestamp <= endDate
    )

    if (format === 'csv') {
      return this.toCSV(filteredMetrics)
    }

    return JSON.stringify(filteredMetrics, null, 2)
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics(retentionDays: number = 7): number {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const initialCount = this.metrics.length
    
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffDate)
    
    const removedCount = initialCount - this.metrics.length
    console.log(`[PERFORMANCE] Cleaned up ${removedCount} old metrics`)
    
    return removedCount
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`[PERFORMANCE] Performance monitoring ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Check if monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled
  }

  private generateMetricId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private toCSV(metrics: PerformanceMetric[]): string {
    const headers = ['ID', 'Name', 'Value', 'Unit', 'Timestamp', 'User ID', 'URL', 'Tags', 'Metadata']
    const rows = metrics.map(metric => [
      metric.id,
      metric.name,
      metric.value,
      metric.unit,
      metric.timestamp.toISOString(),
      metric.userId || '',
      metric.url || '',
      JSON.stringify(metric.tags),
      JSON.stringify(metric.metadata)
    ])

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Convenience functions for common performance monitoring
export const perf = {
  mark: {
    start: (name: string, metadata?: Record<string, any>) => 
      performanceMonitor.startMark(name, metadata),
    end: (name: string, additionalMetadata?: Record<string, any>) => 
      performanceMonitor.endMark(name, additionalMetadata)
  },
  
  measure: {
    async: <T>(name: string, operation: () => Promise<T>, metadata?: Record<string, any>) =>
      performanceMonitor.measureAsync(name, operation, metadata),
    sync: <T>(name: string, operation: () => T, metadata?: Record<string, any>) =>
      performanceMonitor.measureSync(name, operation, metadata)
  },
  
  record: (name: string, value: number, unit: string, metadata?: Record<string, any>) =>
    performanceMonitor.recordMetric(name, value, unit, metadata),
  
  stats: () => performanceMonitor.getPerformanceStats(),
  export: (startDate: Date, endDate: Date, format?: 'json' | 'csv') =>
    performanceMonitor.exportMetrics(startDate, endDate, format)
}

// Performance monitoring decorator for methods
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const metricName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return perf.measure.async(metricName, () => originalMethod.apply(this, args))
    }

    return descriptor
  }
}

