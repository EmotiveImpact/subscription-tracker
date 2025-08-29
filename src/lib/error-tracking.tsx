import React from 'react'

export interface ErrorEvent {
  id: string
  message: string
  error: Error
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  ipAddress?: string
  tags: Record<string, string>
  extra: Record<string, any>
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  ipAddress?: string
  tags?: Record<string, string>
  extra?: Record<string, any>
}

export class ErrorTracker {
  private static instance: ErrorTracker
  private errors: ErrorEvent[] = []
  private isSentryEnabled = false
  private sentryDsn?: string
  private environment = process.env.NODE_ENV || 'development'

  private constructor() {
    this.initializeSentry()
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  /**
   * Initialize Sentry if available
   */
  private async initializeSentry(): Promise<void> {
    try {
      // Dynamic import to avoid bundling Sentry in client
      if (typeof window === 'undefined') {
        const Sentry = await import('@sentry/nextjs')
        
        if (process.env.SENTRY_DSN) {
          this.sentryDsn = process.env.SENTRY_DSN
          Sentry.init({
            dsn: this.sentryDsn,
            environment: this.environment,
            tracesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
            debug: this.environment === 'development',
            beforeSend(event) {
              // Filter out certain errors in development
              if (this.environment === 'development' && event.exception) {
                const errorMessage = event.exception.values?.[0]?.value || ''
                if (errorMessage.includes('ResizeObserver loop limit exceeded')) {
                  return null // Filter out common development errors
                }
              }
              return event
            }
          })
          this.isSentryEnabled = true
          console.log('[ERROR_TRACKING] Sentry initialized successfully')
        }
      }
    } catch (error) {
      console.warn('[ERROR_TRACKING] Failed to initialize Sentry:', error)
    }
  }

  /**
   * Capture and track an error
   */
  async captureError(
    error: Error,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      message: error.message,
      error,
      userId: context.userId,
      sessionId: context.sessionId,
      url: context.url,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      tags: context.tags || {},
      extra: context.extra || {},
      timestamp: new Date(),
      severity
    }

    // Store locally
    this.errors.push(errorEvent)

    // Send to Sentry if enabled
    if (this.isSentryEnabled) {
      await this.sendToSentry(errorEvent)
    }

    // Log to console
    this.logError(errorEvent)

    // For critical errors, you might want to send alerts
    if (severity === 'critical') {
      await this.sendCriticalAlert(errorEvent)
    }

    return errorEvent.id
  }

  /**
   * Capture an error with automatic context detection
   */
  async captureErrorWithContext(
    error: Error,
    request?: Request,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    const context: ErrorContext = {}

    if (request) {
      context.url = request.url
      context.userAgent = request.headers.get('user-agent') || undefined
      context.ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || undefined
      context.userId = request.headers.get('x-user-id') || undefined
      context.sessionId = request.headers.get('x-session-id') || undefined
    }

    return this.captureError(error, context, severity)
  }

  /**
   * Capture a message (non-error)
   */
  async captureMessage(
    message: string,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<string> {
    const error = new Error(message)
    return this.captureError(error, context, severity)
  }

  /**
   * Set user context for error tracking
   */
  async setUserContext(userId: string, userData: Record<string, any> = {}): Promise<void> {
    if (this.isSentryEnabled) {
      try {
        const Sentry = await import('@sentry/nextjs')
        Sentry.setUser({
          id: userId,
          ...userData
        })
      } catch (error) {
        console.warn('[ERROR_TRACKING] Failed to set Sentry user context:', error)
      }
    }
  }

  /**
   * Set tags for error tracking
   */
  async setTags(tags: Record<string, string>): Promise<void> {
    if (this.isSentryEnabled) {
      try {
        const Sentry = await import('@sentry/nextjs')
        Sentry.setTags(tags)
      } catch (error) {
        console.warn('[ERROR_TRACKING] Failed to set Sentry tags:', error)
      }
    }
  }

  /**
   * Set extra context for error tracking
   */
  async setExtra(key: string, value: any): Promise<void> {
    if (this.isSentryEnabled) {
      try {
        const Sentry = await import('@sentry/nextjs')
        Sentry.setExtra(key, value)
      } catch (error) {
        console.warn('[ERROR_TRACKING] Failed to set Sentry extra:', error)
      }
    }
  }

  /**
   * Get error by ID
   */
  async getError(errorId: string): Promise<ErrorEvent | null> {
    return this.errors.find(error => error.id === errorId) || null
  }

  /**
   * Get errors for a user
   */
  async getUserErrors(userId: string, limit: number = 100): Promise<ErrorEvent[]> {
    return this.errors
      .filter(error => error.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get errors by severity
   */
  async getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical', limit: number = 100): Promise<ErrorEvent[]> {
    return this.errors
      .filter(error => error.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Search errors
   */
  async searchErrors(query: string, limit: number = 100): Promise<ErrorEvent[]> {
    const searchTerm = query.toLowerCase()
    
    return this.errors
      .filter(error => 
        error.message.toLowerCase().includes(searchTerm) ||
        error.error.stack?.toLowerCase().includes(searchTerm) ||
        error.url?.toLowerCase().includes(searchTerm) ||
        Object.values(error.tags).some(tag => tag.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get error statistics
   */
  async getErrorStats(): Promise<{
    totalErrors: number
    errorsBySeverity: Record<string, number>
    errorsByHour: Record<string, number>
    topErrorMessages: Array<{ message: string; count: number }>
  }> {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recentErrors = this.errors.filter(error => error.timestamp > oneDayAgo)
    
    // Count by severity
    const errorsBySeverity: Record<string, number> = {}
    recentErrors.forEach(error => {
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1
    })

    // Count by hour
    const errorsByHour: Record<string, number> = {}
    recentErrors.forEach(error => {
      const hour = error.timestamp.getHours().toString().padStart(2, '0')
      errorsByHour[hour] = (errorsByHour[hour] || 0) + 1
    })

    // Top error messages
    const messageCounts: Record<string, number> = {}
    recentErrors.forEach(error => {
      messageCounts[error.message] = (messageCounts[error.message] || 0) + 1
    })

    const topErrorMessages = Object.entries(messageCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalErrors: recentErrors.length,
      errorsBySeverity,
      errorsByHour,
      topErrorMessages
    }
  }

  /**
   * Clean up old errors
   */
  async cleanupOldErrors(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const initialCount = this.errors.length
    
    this.errors = this.errors.filter(error => error.timestamp > cutoffDate)
    
    const removedCount = initialCount - this.errors.length
    console.log(`[ERROR_TRACKING] Cleaned up ${removedCount} old errors`)
    
    return removedCount
  }

  /**
   * Export errors for analysis
   */
  async exportErrors(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): Promise<string> {
    const filteredErrors = this.errors.filter(error => 
      error.timestamp >= startDate && error.timestamp <= endDate
    )

    if (format === 'csv') {
      return this.toCSV(filteredErrors)
    }

    return JSON.stringify(filteredErrors, null, 2)
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async sendToSentry(errorEvent: ErrorEvent): Promise<void> {
    try {
      const Sentry = await import('@sentry/nextjs')
      
      // Set context
      if (errorEvent.userId) {
        Sentry.setUser({ id: errorEvent.userId })
      }
      
      if (errorEvent.sessionId) {
        Sentry.setTag('session_id', errorEvent.sessionId)
      }
      
      if (errorEvent.url) {
        Sentry.setTag('url', errorEvent.url)
      }
      
      if (errorEvent.ipAddress) {
        Sentry.setTag('ip_address', errorEvent.ipAddress)
      }

      // Set tags
      Sentry.setTags(errorEvent.tags)
      
      // Set extra data
      Sentry.setExtra('user_agent', errorEvent.userAgent)
      Sentry.setExtra('session_data', errorEvent.extra)

      // Capture the error
      Sentry.captureException(errorEvent.error, {
        level: this.mapSeverityToSentryLevel(errorEvent.severity),
        tags: errorEvent.tags,
        extra: errorEvent.extra
      })
    } catch (error) {
      console.warn('[ERROR_TRACKING] Failed to send to Sentry:', error)
    }
  }

  private mapSeverityToSentryLevel(severity: string): 'fatal' | 'error' | 'warning' | 'info' | 'debug' {
    switch (severity) {
      case 'critical': return 'fatal'
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'error'
    }
  }

  private logError(errorEvent: ErrorEvent): void {
    const timestamp = errorEvent.timestamp.toISOString()
    const severity = errorEvent.severity.toUpperCase()
    const message = errorEvent.message
    const userId = errorEvent.userId || 'unknown'
    const url = errorEvent.url || 'unknown'
    
    console.error(`[${timestamp}] [${severity}] ${message} | User: ${userId} | URL: ${url}`)
    
    if (errorEvent.error.stack) {
      console.error(errorEvent.error.stack)
    }
  }

  private async sendCriticalAlert(errorEvent: ErrorEvent): Promise<void> {
    // In production, you'd send this to your alerting system
    console.error(`🚨 CRITICAL ERROR: ${errorEvent.message} at ${errorEvent.timestamp}`)
    
    // You could send to Slack, email, PagerDuty, etc.
    // await sendSlackAlert(errorEvent)
    // await sendEmailAlert(errorEvent)
  }

  private toCSV(errors: ErrorEvent[]): string {
    const headers = ['ID', 'Message', 'Severity', 'User ID', 'URL', 'Timestamp', 'Tags', 'Extra']
    const rows = errors.map(error => [
      error.id,
      error.message,
      error.severity,
      error.userId || '',
      error.url || '',
      error.timestamp.toISOString(),
      JSON.stringify(error.tags),
      JSON.stringify(error.extra)
    ])

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance()

// Convenience functions for common error tracking
export const track = {
  error: (error: Error, context?: ErrorContext, severity?: 'low' | 'medium' | 'high' | 'critical') =>
    errorTracker.captureError(error, context, severity),
  
  message: (message: string, context?: ErrorContext, severity?: 'low' | 'medium' | 'high' | 'critical') =>
    errorTracker.captureMessage(message, context, severity),
  
  withContext: (error: Error, request?: Request, severity?: 'low' | 'medium' | 'high' | 'critical') =>
    errorTracker.captureErrorWithContext(error, request, severity)
}

export const context = {
  user: (userId: string, userData?: Record<string, any>) =>
    errorTracker.setUserContext(userId, userData),
  
  tags: (tags: Record<string, string>) =>
    errorTracker.setTags(tags),
  
  extra: (key: string, value: any) =>
    errorTracker.setExtra(key, value)
}

// Error boundary component for React
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track the error
    track.error(error, {
      extra: { errorInfo }
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} />
      }
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We&apos;ve been notified and are working to fix this issue.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
