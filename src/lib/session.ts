import { randomBytes, createHmac } from 'crypto'

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  lastActivity: Date
  isActive: boolean
  metadata: Record<string, any>
}

export interface SessionData {
  userId: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export class SessionManager {
  private static instance: SessionManager
  private sessions: Map<string, Session> = new Map()
  private userSessions: Map<string, string[]> = new Map() // userId -> sessionIds[]
  private readonly SESSION_TOKEN_LENGTH = 32
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly MAX_SESSIONS_PER_USER = 5

  private constructor() {
    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000)
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Create a new session for a user
   */
  async createSession(data: SessionData): Promise<Session> {
    const sessionId = this.generateSessionId()
    const token = this.generateSessionToken()
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION)

    const session: Session = {
      id: sessionId,
      userId: data.userId,
      token,
      expiresAt,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      lastActivity: new Date(),
      isActive: true,
      metadata: data.metadata || {}
    }

    // Store session
    this.sessions.set(sessionId, session)

    // Track user sessions
    const userSessionIds = this.userSessions.get(data.userId) || []
    userSessionIds.push(sessionId)
    this.userSessions.set(data.userId, userSessionIds)

    // Enforce maximum sessions per user
    if (userSessionIds.length > this.MAX_SESSIONS_PER_USER) {
      const oldestSessionId = userSessionIds.shift()!
      await this.revokeSession(oldestSessionId)
    }

    return session
  }

  /**
   * Validate a session token
   */
  async validateSession(sessionId: string, token: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId)
    
    if (!session || !session.isActive) {
      return null
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await this.revokeSession(sessionId)
      return null
    }

    // Validate token
    if (session.token !== token) {
      return null
    }

    // Update last activity
    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    return session
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId)
    
    if (!session || !session.isActive) {
      return null
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await this.revokeSession(sessionId)
      return null
    }

    return session
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const sessionIds = this.userSessions.get(userId) || []
    const sessions: Session[] = []

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId)
      if (session) {
        sessions.push(session)
      }
    }

    return sessions
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return false
    }

    // Mark session as inactive
    session.isActive = false
    this.sessions.set(sessionId, session)

    // Remove from user sessions
    const userSessionIds = this.userSessions.get(session.userId) || []
    const updatedUserSessions = userSessionIds.filter(id => id !== sessionId)
    this.userSessions.set(session.userId, updatedUserSessions)

    return true
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const sessionIds = this.userSessions.get(userId) || []
    let revokedCount = 0

    for (const sessionId of sessionIds) {
      if (await this.revokeSession(sessionId)) {
        revokedCount++
      }
    }

    return revokedCount
  }

  /**
   * Revoke sessions from a specific IP address
   */
  async revokeSessionsByIP(ipAddress: string): Promise<number> {
    let revokedCount = 0

    const sessionIds = Array.from(this.sessions.keys())
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId)!
      if (session.ipAddress === ipAddress && session.isActive) {
        if (await this.revokeSession(sessionId)) {
          revokedCount++
        }
      }
    }

    return revokedCount
  }

  /**
   * Extend session duration
   */
  async extendSession(sessionId: string, additionalHours: number = 24): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.isActive) {
      return false
    }

    session.expiresAt = new Date(session.expiresAt.getTime() + additionalHours * 60 * 60 * 1000)
    this.sessions.set(sessionId, session)

    return true
  }

  /**
   * Update session metadata
   */
  async updateSessionMetadata(sessionId: string, metadata: Record<string, any>): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.isActive) {
      return false
    }

    session.metadata = { ...session.metadata, ...metadata }
    this.sessions.set(sessionId, session)

    return true
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number
    activeSessions: number
    expiredSessions: number
    totalUsers: number
  }> {
    let activeCount = 0
    let expiredCount = 0

    const sessions = Array.from(this.sessions.values())
    for (const session of sessions) {
      if (session.isActive) {
        if (new Date() > session.expiresAt) {
          expiredCount++
        } else {
          activeCount++
        }
      }
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions: activeCount,
      expiredSessions: expiredCount,
      totalUsers: this.userSessions.size
    }
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<number> {
    const now = new Date()
    let cleanedCount = 0

    const sessionIds = Array.from(this.sessions.keys())
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId)!
      if (session.expiresAt < now) {
        if (await this.revokeSession(sessionId)) {
          cleanedCount++
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SESSION] Cleaned up ${cleanedCount} expired sessions`)
    }

    return cleanedCount
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${randomBytes(8).toString('hex')}`
  }

  /**
   * Generate a secure session token
   */
  private generateSessionToken(): string {
    return randomBytes(this.SESSION_TOKEN_LENGTH).toString('hex')
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

// Utility functions for common session operations
export const session = {
  create: (data: SessionData) => sessionManager.createSession(data),
  validate: (sessionId: string, token: string) => sessionManager.validateSession(sessionId, token),
  get: (sessionId: string) => sessionManager.getSession(sessionId),
  getUserSessions: (userId: string) => sessionManager.getUserSessions(userId),
  revoke: (sessionId: string) => sessionManager.revokeSession(sessionId),
  revokeAll: (userId: string) => sessionManager.revokeAllUserSessions(userId),
  revokeByIP: (ipAddress: string) => sessionManager.revokeSessionsByIP(ipAddress),
  extend: (sessionId: string, hours?: number) => sessionManager.extendSession(sessionId, hours),
  updateMetadata: (sessionId: string, metadata: Record<string, any>) => 
    sessionManager.updateSessionMetadata(sessionId, metadata),
  getStats: () => sessionManager.getSessionStats()
}

// Session middleware for API routes
export function withSession(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    const sessionId = request.headers.get('x-session-id')
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionId || !sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Session credentials missing' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const session = await sessionManager.validateSession(sessionId, sessionToken)
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Add session info to request headers for the handler to use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.userId)
    requestHeaders.set('x-session-id', session.id)

    const modifiedRequest = new Request(request, {
      headers: requestHeaders
    })

    return handler(modifiedRequest, ...args)
  }
}
