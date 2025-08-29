export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AuditLogEntry {
  userId: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export class AuditLogger {
  private static instance: AuditLogger
  private logs: AuditLog[] = []

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const log: AuditLog = {
      id: this.generateId(),
      ...entry,
      timestamp: new Date(),
      severity: entry.severity || 'low'
    }

    this.logs.push(log)

    // In production, you'd save to database and potentially send to external logging service
    console.log(`[AUDIT] ${log.severity.toUpperCase()}: ${log.action} on ${log.resource} by user ${log.userId}`)
    
    // For critical events, you might want to send alerts
    if (log.severity === 'critical') {
      await this.sendCriticalAlert(log)
    }
  }

  /**
   * Log subscription creation
   */
  async logSubscriptionCreated(userId: string, subscriptionId: string, details: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'subscription_created',
      resource: 'subscription',
      resourceId: subscriptionId,
      details,
      severity: 'medium'
    })
  }

  /**
   * Log subscription deletion
   */
  async logSubscriptionDeleted(userId: string, subscriptionId: string, details: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'subscription_deleted',
      resource: 'subscription',
      resourceId: subscriptionId,
      details,
      severity: 'high'
    })
  }

  /**
   * Log plan upgrade
   */
  async logPlanUpgrade(userId: string, fromPlan: string, toPlan: string): Promise<void> {
    await this.log({
      userId,
      action: 'plan_upgraded',
      resource: 'user_account',
      details: { fromPlan, toPlan },
      severity: 'medium'
    })
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(userId: string, action: 'login' | 'logout' | 'failed_login', details: Record<string, any>): Promise<void> {
    const severity = action === 'failed_login' ? 'high' : 'low'
    
    await this.log({
      userId,
      action: `auth_${action}`,
      resource: 'authentication',
      details,
      severity
    })
  }

  /**
   * Log sensitive data access
   */
  async logDataAccess(userId: string, resource: string, resourceId: string, details: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'data_accessed',
      resource,
      resourceId,
      details,
      severity: 'medium'
    })
  }

  /**
   * Log admin actions
   */
  async logAdminAction(adminId: string, action: string, resource: string, details: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      action: `admin_${action}`,
      resource,
      details,
      severity: 'high'
    })
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.logs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceLogs(resource: string, resourceId?: string, limit: number = 100): Promise<AuditLog[]> {
    return this.logs
      .filter(log => 
        log.resource === resource && 
        (!resourceId || log.resourceId === resourceId)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get audit logs by severity
   */
  async getLogsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical', limit: number = 100): Promise<AuditLog[]> {
    return this.logs
      .filter(log => log.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Search audit logs
   */
  async searchLogs(query: string, limit: number = 100): Promise<AuditLog[]> {
    const searchTerm = query.toLowerCase()
    
    return this.logs
      .filter(log => 
        log.action.toLowerCase().includes(searchTerm) ||
        log.resource.toLowerCase().includes(searchTerm) ||
        log.userId.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): Promise<string> {
    const filteredLogs = this.logs.filter(log => 
      log.timestamp >= startDate && log.timestamp <= endDate
    )

    if (format === 'csv') {
      return this.toCSV(filteredLogs)
    }

    return JSON.stringify(filteredLogs, null, 2)
  }

  /**
   * Clean up old logs (retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const initialCount = this.logs.length
    
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate)
    
    const removedCount = initialCount - this.logs.length
    console.log(`[AUDIT] Cleaned up ${removedCount} old audit logs`)
    
    return removedCount
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async sendCriticalAlert(log: AuditLog): Promise<void> {
    // In production, you'd send this to your alerting system
    console.error(`🚨 CRITICAL AUDIT EVENT: ${log.action} by user ${log.userId} at ${log.timestamp}`)
    
    // You could send to Slack, email, PagerDuty, etc.
    // await sendSlackAlert(log)
    // await sendEmailAlert(log)
  }

  private toCSV(logs: AuditLog[]): string {
    const headers = ['ID', 'User ID', 'Action', 'Resource', 'Resource ID', 'Details', 'IP Address', 'User Agent', 'Timestamp', 'Severity']
    const rows = logs.map(log => [
      log.id,
      log.userId,
      log.action,
      log.resource,
      log.resourceId || '',
      JSON.stringify(log.details),
      log.ipAddress || '',
      log.userAgent || '',
      log.timestamp.toISOString(),
      log.severity
    ])

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()

// Convenience functions for common audit events
export const audit = {
  subscription: {
    created: (userId: string, subscriptionId: string, details: Record<string, any>) =>
      auditLogger.logSubscriptionCreated(userId, subscriptionId, details),
    deleted: (userId: string, subscriptionId: string, details: Record<string, any>) =>
      auditLogger.logSubscriptionDeleted(userId, subscriptionId, details),
    updated: (userId: string, subscriptionId: string, details: Record<string, any>) =>
      auditLogger.log({
        userId,
        action: 'subscription_updated',
        resource: 'subscription',
        resourceId: subscriptionId,
        details,
        severity: 'medium'
      })
  },
  user: {
    planUpgrade: (userId: string, fromPlan: string, toPlan: string) =>
      auditLogger.logPlanUpgrade(userId, fromPlan, toPlan),
    planDowngrade: (userId: string, fromPlan: string, toPlan: string) =>
      auditLogger.log({
        userId,
        action: 'plan_downgraded',
        resource: 'user_account',
        details: { fromPlan, toPlan },
        severity: 'medium'
      }),
    settingsChanged: (userId: string, setting: string, oldValue: any, newValue: any) =>
      auditLogger.log({
        userId,
        action: 'settings_changed',
        resource: 'user_settings',
        details: { setting, oldValue, newValue },
        severity: 'low'
      })
  },
  auth: {
    login: (userId: string, details: Record<string, any> = {}) =>
      auditLogger.logAuthEvent(userId, 'login', details),
    logout: (userId: string, details: Record<string, any> = {}) =>
      auditLogger.logAuthEvent(userId, 'logout', details),
    failedLogin: (userId: string, details: Record<string, any> = {}) =>
      auditLogger.logAuthEvent(userId, 'failed_login', details)
  },
  admin: {
    action: (adminId: string, action: string, resource: string, details: Record<string, any> = {}) =>
      auditLogger.logAdminAction(adminId, action, resource, details)
  }
}
