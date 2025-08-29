export interface UptimeCheck {
  id: string
  name: string
  url: string
  status: 'up' | 'down' | 'degraded'
  responseTime: number
  statusCode: number
  lastCheck: Date
  lastUp: Date
  lastDown: Date
  uptimePercentage: number
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  consecutiveFailures: number
  consecutiveSuccesses: number
  errorMessage?: string
  metadata: Record<string, any>
}

export interface UptimeAlert {
  id: string
  checkId: string
  type: 'down' | 'up' | 'degraded'
  message: string
  timestamp: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
}

export interface UptimeConfig {
  checkInterval: number // milliseconds
  timeout: number // milliseconds
  retries: number
  alertThreshold: number // consecutive failures before alert
  degradedThreshold: number // response time threshold for degraded status
}

export class UptimeMonitor {
  private static instance: UptimeMonitor
  private checks: Map<string, UptimeCheck> = new Map()
  private alerts: UptimeAlert[] = []
  private isEnabled = true
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map()
  private config: UptimeConfig = {
    checkInterval: 60000, // 1 minute
    timeout: 10000, // 10 seconds
    retries: 3,
    alertThreshold: 3,
    degradedThreshold: 5000 // 5 seconds
  }

  private constructor() {
    this.initializeDefaultChecks()
  }

  static getInstance(): UptimeMonitor {
    if (!UptimeMonitor.instance) {
      UptimeMonitor.instance = new UptimeMonitor()
    }
    return UptimeMonitor.instance
  }

  /**
   * Initialize default uptime checks
   */
  private initializeDefaultChecks(): void {
    // Add default checks for the application
    this.addCheck('app-health', '/api/health', 'Application Health Check')
    this.addCheck('app-api', '/api/subscriptions', 'API Endpoint Check')
  }

  /**
   * Add a new uptime check
   */
  addCheck(
    name: string,
    url: string,
    description?: string,
    customConfig?: Partial<UptimeConfig>
  ): string {
    const checkId = this.generateCheckId()
    const fullUrl = url.startsWith('http') ? url : `${this.getBaseUrl()}${url}`
    
    const check: UptimeCheck = {
      id: checkId,
      name,
      url: fullUrl,
      status: 'up',
      responseTime: 0,
      statusCode: 200,
      lastCheck: new Date(),
      lastUp: new Date(),
      lastDown: new Date(),
      uptimePercentage: 100,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      metadata: {
        description,
        customConfig
      }
    }

    this.checks.set(checkId, check)
    
    // Start monitoring this check
    this.startMonitoring(checkId)
    
    return checkId
  }

  /**
   * Remove an uptime check
   */
  removeCheck(checkId: string): boolean {
    const check = this.checks.get(checkId)
    if (!check) {
      return false
    }

    // Stop monitoring
    this.stopMonitoring(checkId)
    
    // Remove from checks
    this.checks.delete(checkId)
    
    return true
  }

  /**
   * Start monitoring a check
   */
  private startMonitoring(checkId: string): void {
    const check = this.checks.get(checkId)
    if (!check) return

    // Clear existing interval
    this.stopMonitoring(checkId)

    // Start new interval
    const interval = setInterval(() => {
      this.performCheck(checkId)
    }, this.config.checkInterval)

    this.checkIntervals.set(checkId, interval)
  }

  /**
   * Stop monitoring a check
   */
  private stopMonitoring(checkId: string): void {
    const interval = this.checkIntervals.get(checkId)
    if (interval) {
      clearInterval(interval)
      this.checkIntervals.delete(checkId)
    }
  }

  /**
   * Perform a single uptime check
   */
  private async performCheck(checkId: string): Promise<void> {
    const check = this.checks.get(checkId)
    if (!check) return

    const startTime = Date.now()
    let statusCode = 0
    let responseTime = 0
    let errorMessage: string | undefined

    try {
      const response = await fetch(check.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'UptimeMonitor/1.0'
        },
        signal: AbortSignal.timeout(this.config.timeout)
      })

      statusCode = response.status
      responseTime = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      responseTime = Date.now() - startTime
    }

    // Update check status
    this.updateCheckStatus(checkId, statusCode, responseTime, errorMessage)
  }

  /**
   * Update check status based on response
   */
  private updateCheckStatus(
    checkId: string,
    statusCode: number,
    responseTime: number,
    errorMessage?: string
  ): void {
    const check = this.checks.get(checkId)
    if (!check) return

    const now = new Date()
    const wasUp = check.status === 'up'
    
    // Determine new status
    let newStatus: 'up' | 'down' | 'degraded' = 'up'
    
    if (errorMessage || statusCode >= 400) {
      newStatus = 'down'
      check.consecutiveFailures++
      check.consecutiveSuccesses = 0
      check.lastDown = now
    } else if (responseTime > this.config.degradedThreshold) {
      newStatus = 'degraded'
      check.consecutiveFailures = 0
      check.consecutiveSuccesses++
    } else {
      newStatus = 'up'
      check.consecutiveFailures = 0
      check.consecutiveSuccesses++
      check.lastUp = now
    }

    // Update check data
    check.status = newStatus
    check.statusCode = statusCode
    check.responseTime = responseTime
    check.lastCheck = now
    check.totalChecks++
    check.errorMessage = errorMessage

    if (newStatus === 'up') {
      check.successfulChecks++
    } else {
      check.failedChecks++
    }

    // Calculate uptime percentage
    check.uptimePercentage = (check.successfulChecks / check.totalChecks) * 100

    // Check if we should create an alert
    if (check.consecutiveFailures >= this.config.alertThreshold && !wasUp) {
      this.createAlert(checkId, 'down', `Service ${check.name} is down after ${check.consecutiveFailures} consecutive failures`)
    } else if (newStatus === 'up' && !wasUp) {
      this.createAlert(checkId, 'up', `Service ${check.name} is back up`)
    } else if (newStatus === 'degraded' && wasUp) {
      this.createAlert(checkId, 'degraded', `Service ${check.name} is experiencing degraded performance`)
    }

    // Update the check
    this.checks.set(checkId, check)
  }

  /**
   * Create an uptime alert
   */
  private createAlert(checkId: string, type: 'down' | 'up' | 'degraded', message: string): void {
    const alert: UptimeAlert = {
      id: this.generateAlertId(),
      checkId,
      type,
      message,
      timestamp: new Date(),
      acknowledged: false
    }

    this.alerts.push(alert)

    // In production, you'd send this to your alerting system
    console.log(`🚨 UPTIME ALERT [${type.toUpperCase()}]: ${message}`)
    
    // You could send to Slack, email, PagerDuty, etc.
    // await sendSlackAlert(alert)
    // await sendEmailAlert(alert)
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert) {
      return false
    }

    alert.acknowledged = true
    alert.acknowledgedBy = acknowledgedBy
    alert.acknowledgedAt = new Date()

    return true
  }

  /**
   * Get all uptime checks
   */
  getChecks(): UptimeCheck[] {
    return Array.from(this.checks.values())
  }

  /**
   * Get a specific uptime check
   */
  getCheck(checkId: string): UptimeCheck | null {
    return this.checks.get(checkId) || null
  }

  /**
   * Get all alerts
   */
  getAlerts(includeAcknowledged: boolean = false): UptimeAlert[] {
    if (includeAcknowledged) {
      return this.alerts
    }
    return this.alerts.filter(alert => !alert.acknowledged)
  }

  /**
   * Get uptime statistics
   */
  getUptimeStats(): {
    totalChecks: number
    totalAlerts: number
    overallUptime: number
    checksByStatus: Record<string, number>
    recentAlerts: UptimeAlert[]
  } {
    const checks = Array.from(this.checks.values())
    const totalChecks = checks.length
    
    if (totalChecks === 0) {
      return {
        totalChecks: 0,
        totalAlerts: this.alerts.length,
        overallUptime: 100,
        checksByStatus: {},
        recentAlerts: this.alerts.slice(-10)
      }
    }

    const overallUptime = checks.reduce((sum, check) => sum + check.uptimePercentage, 0) / totalChecks
    
    const checksByStatus: Record<string, number> = {}
    checks.forEach(check => {
      checksByStatus[check.status] = (checksByStatus[check.status] || 0) + 1
    })

    const recentAlerts = this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    return {
      totalChecks,
      totalAlerts: this.alerts.length,
      overallUptime,
      checksByStatus,
      recentAlerts
    }
  }

  /**
   * Get uptime history for a check
   */
  getCheckHistory(checkId: string, days: number = 7): {
    check: UptimeCheck
    history: Array<{
      timestamp: Date
      status: 'up' | 'down' | 'degraded'
      responseTime: number
      statusCode: number
    }>
  } {
    const check = this.checks.get(checkId)
    if (!check) {
      throw new Error(`Check ${checkId} not found`)
    }

    // In a real implementation, you'd store historical data
    // For now, we'll return the current check data
    const history = [{
      timestamp: check.lastCheck,
      status: check.status,
      responseTime: check.responseTime,
      statusCode: check.statusCode
    }]

    return { check, history }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<UptimeConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart monitoring with new configuration
    this.restartMonitoring()
  }

  /**
   * Restart monitoring with current configuration
   */
  private restartMonitoring(): void {
    const checkIds = Array.from(this.checks.keys())
    
    checkIds.forEach(checkId => {
      this.stopMonitoring(checkId)
      this.startMonitoring(checkId)
    })
  }

  /**
   * Enable/disable uptime monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    
    if (enabled) {
      this.restartMonitoring()
    } else {
      this.checkIntervals.forEach(interval => clearInterval(interval))
      this.checkIntervals.clear()
    }
    
    console.log(`[UPTIME] Uptime monitoring ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Check if monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * Export uptime data
   */
  exportUptimeData(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): string {
    const filteredAlerts = this.alerts.filter(alert => 
      alert.timestamp >= startDate && alert.timestamp <= endDate
    )

    const data = {
      checks: Array.from(this.checks.values()),
      alerts: filteredAlerts,
      config: this.config,
      exportDate: new Date().toISOString(),
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() }
    }

    if (format === 'csv') {
      return this.toCSV(data)
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Clean up old alerts
   */
  cleanupOldAlerts(retentionDays: number = 30): number {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const initialCount = this.alerts.length
    
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffDate)
    
    const removedCount = initialCount - this.alerts.length
    console.log(`[UPTIME] Cleaned up ${removedCount} old alerts`)
    
    return removedCount
  }

  private generateCheckId(): string {
    return `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  private toCSV(data: any): string {
    // Implementation for CSV export
    return JSON.stringify(data)
  }
}

// Export singleton instance
export const uptimeMonitor = UptimeMonitor.getInstance()

// Convenience functions for common uptime operations
export const uptime = {
  addCheck: (name: string, url: string, description?: string, config?: Partial<UptimeConfig>) =>
    uptimeMonitor.addCheck(name, url, description, config),
  
  removeCheck: (checkId: string) => uptimeMonitor.removeCheck(checkId),
  
  getChecks: () => uptimeMonitor.getChecks(),
  
  getCheck: (checkId: string) => uptimeMonitor.getCheck(checkId),
  
  getAlerts: (includeAcknowledged?: boolean) => uptimeMonitor.getAlerts(includeAcknowledged),
  
  acknowledgeAlert: (alertId: string, acknowledgedBy: string) =>
    uptimeMonitor.acknowledgeAlert(alertId, acknowledgedBy),
  
  getStats: () => uptimeMonitor.getUptimeStats(),
  
  getHistory: (checkId: string, days?: number) => uptimeMonitor.getCheckHistory(checkId, days),
  
  updateConfig: (config: Partial<UptimeConfig>) => uptimeMonitor.updateConfig(config),
  
  setEnabled: (enabled: boolean) => uptimeMonitor.setEnabled(enabled),
  
  export: (startDate: Date, endDate: Date, format?: 'json' | 'csv') =>
    uptimeMonitor.exportUptimeData(startDate, endDate, format)
}

// Health check endpoint for uptime monitoring
export async function healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; timestamp: string; checks: any[] }> {
  const checks = uptimeMonitor.getChecks()
  const overallStatus = uptimeMonitor.getUptimeStats().overallUptime
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  if (overallStatus < 95) {
    status = 'unhealthy'
  } else if (overallStatus < 99) {
    status = 'degraded'
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    checks: checks.map(check => ({
      name: check.name,
      status: check.status,
      responseTime: check.responseTime,
      uptimePercentage: check.uptimePercentage,
      lastCheck: check.lastCheck
    }))
  }
}
