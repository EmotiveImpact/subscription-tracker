import { AppSettings } from '@/types'

// OAuth configuration
export const OAUTH_CONFIG = {
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`,
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  outlook: {
    clientId: process.env.MS_CLIENT_ID || '',
    clientSecret: process.env.MS_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`,
    scope: 'Mail.Read',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  },
  calendar: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/calendar/callback`,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
} as const

export type OAuthProvider = keyof typeof OAUTH_CONFIG

// OAuth token interface
export interface OAuthToken {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
  expires_at?: number
}

// OAuth user info interface
export interface OAuthUserInfo {
  id: string
  email: string
  name?: string
  picture?: string
}

// OAuth service class
export class OAuthService {
  private provider: OAuthProvider
  private config: typeof OAUTH_CONFIG[OAuthProvider]

  constructor(provider: OAuthProvider) {
    this.provider = provider
    this.config = OAUTH_CONFIG[provider]
  }

  // Generate OAuth authorization URL
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    })

    if (state) {
      params.append('state', state)
    }

    return `${this.config.authUrl}?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`)
    }

    const token: OAuthToken = await response.json()
    
    // Calculate expiration time
    if (token.expires_in) {
      token.expires_at = Date.now() + token.expires_in * 1000
    }

    return token
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<OAuthToken> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error(`OAuth token refresh failed: ${response.statusText}`)
    }

    const token: OAuthToken = await response.json()
    
    // Calculate expiration time
    if (token.expires_in) {
      token.expires_at = Date.now() + token.expires_in * 1000
    }

    return token
  }

  // Check if token is expired
  isTokenExpired(token: OAuthToken): boolean {
    if (!token.expires_at) return false
    return Date.now() >= token.expires_at
  }

  // Get user info from OAuth provider
  async getUserInfo(token: OAuthToken): Promise<OAuthUserInfo> {
    let userInfoUrl: string

    switch (this.provider) {
      case 'gmail':
      case 'calendar':
        userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo'
        break
      case 'outlook':
        userInfoUrl = 'https://graph.microsoft.com/v1.0/me'
        break
      default:
        throw new Error(`Unsupported OAuth provider: ${this.provider}`)
    }

    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`)
    }

    const data = await response.json()

    if (this.provider === 'outlook') {
      return {
        id: data.id,
        email: data.mail || data.userPrincipalName,
        name: data.displayName,
        picture: undefined,
      }
    } else {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
      }
    }
  }
}

// Gmail-specific service
export class GmailService extends OAuthService {
  constructor() {
    super('gmail')
  }

  // Get emails from Gmail
  async getEmails(token: OAuthToken, maxResults: number = 100): Promise<any[]> {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get Gmail messages: ${response.statusText}`)
    }

    const data = await response.json()
    return data.messages || []
  }

  // Get email content
  async getEmailContent(token: OAuthToken, messageId: string): Promise<any> {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get email content: ${response.statusText}`)
    }

    return await response.json()
  }
}

// Outlook-specific service
export class OutlookService extends OAuthService {
  constructor() {
    super('outlook')
  }

  // Get emails from Outlook
  async getEmails(token: OAuthToken, maxResults: number = 100): Promise<any[]> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get Outlook messages: ${response.statusText}`)
    }

    const data = await response.json()
    return data.value || []
  }
}

// Google Calendar service
export class GoogleCalendarService extends OAuthService {
  constructor() {
    super('calendar')
  }

  // Get calendar events
  async getEvents(token: OAuthToken, calendarId: string = 'primary', maxResults: number = 100): Promise<any[]> {
    const now = new Date()
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
      `timeMin=${now.toISOString()}&timeMax=${oneMonthFromNow.toISOString()}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get calendar events: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  }

  // Get calendar list
  async getCalendars(token: OAuthToken): Promise<any[]> {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get calendar list: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  }
}

// Export service instances
export const gmailService = new GmailService()
export const outlookService = new OutlookService()
export const calendarService = new GoogleCalendarService()
