import { paymentGatewayDetector, PaymentGatewayData } from './payment-gateway-detector'

export interface EmailPlatform {
  name: string
  type: 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'protonmail' | 'generic'
  apiEndpoint: string
  authMethod: 'oauth2' | 'imap' | 'pop3' | 'api'
  scopes: string[]
  rateLimit: { requests: number; perSeconds: number }
}

export interface EmailProcessingOptions {
  maxEmails?: number
  dateRange?: { start: Date; end: Date }
  includeRead?: boolean
  searchQuery?: string
  labelIds?: string[]
  folder?: string
}

export class EmailPlatformProcessor {
  private static readonly EMAIL_PLATFORMS: Record<string, EmailPlatform> = {
    gmail: {
      name: 'Gmail',
      type: 'gmail',
      apiEndpoint: 'https://gmail.googleapis.com/gmail/v1/users/me',
      authMethod: 'oauth2',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
      rateLimit: { requests: 1000, perSeconds: 100 }
    },

    outlook: {
      name: 'Outlook / Microsoft 365',
      type: 'outlook',
      apiEndpoint: 'https://graph.microsoft.com/v1.0/me/messages',
      authMethod: 'oauth2',
      scopes: [
        'Mail.Read',
        'Mail.ReadWrite',
        'offline_access'
      ],
      rateLimit: { requests: 1000, perSeconds: 60 }
    },

    yahoo: {
      name: 'Yahoo Mail',
      type: 'yahoo',
      apiEndpoint: 'https://api.mail.yahoo.com/ws/v3/mail',
      authMethod: 'oauth2',
      scopes: [
        'mail-r',
        'mail-w'
      ],
      rateLimit: { requests: 100, perSeconds: 60 }
    },

    icloud: {
      name: 'iCloud Mail',
      type: 'icloud',
      apiEndpoint: 'https://api.icloud.com/ws/mail',
      authMethod: 'oauth2',
      scopes: [
        'mail.read',
        'mail.write'
      ],
      rateLimit: { requests: 100, perSeconds: 60 }
    },

    protonmail: {
      name: 'ProtonMail',
      type: 'protonmail',
      apiEndpoint: 'https://api.protonmail.ch/mail/v4',
      authMethod: 'oauth2',
      scopes: [
        'mail.read',
        'mail.write'
      ],
      rateLimit: { requests: 100, perSeconds: 60 }
    },

    generic: {
      name: 'Generic Email (IMAP/POP3)',
      type: 'generic',
      apiEndpoint: '', // Will be set per provider
      authMethod: 'imap',
      scopes: [],
      rateLimit: { requests: 100, perSeconds: 60 }
    }
  }

  private accessToken: string
  private platform: EmailPlatform

  constructor(platformType: string, accessToken: string) {
    this.platform = EmailPlatformProcessor.EMAIL_PLATFORMS[platformType] || EmailPlatformProcessor.EMAIL_PLATFORMS.generic
    this.accessToken = accessToken
  }

  /**
   * Fetch emails from the configured platform
   */
  async fetchEmails(options: EmailProcessingOptions = {}): Promise<any[]> {
    const {
      maxEmails = 100,
      dateRange,
      searchQuery = '',
      labelIds = [],
      folder = 'INBOX'
    } = options

    try {
      switch (this.platform.type) {
        case 'gmail':
          return await this.fetchGmailEmails(options)
        case 'outlook':
          return await this.fetchOutlookEmails(options)
        case 'yahoo':
          return await this.fetchYahooEmails(options)
        case 'icloud':
          return await this.fetchICloudEmails(options)
        case 'protonmail':
          return await this.fetchProtonMailEmails(options)
        case 'generic':
          return await this.fetchGenericEmails(options)
        default:
          throw new Error(`Unsupported platform: ${this.platform.type}`)
      }
    } catch (error) {
      console.error(`Error fetching emails from ${this.platform.name}:`, error)
      throw error
    }
  }

  /**
   * Fetch emails from Gmail
   */
  private async fetchGmailEmails(options: EmailProcessingOptions): Promise<any[]> {
    const { maxEmails = 100, searchQuery = '', labelIds = [] } = options

    // Build search query
    let query = searchQuery || 'has:attachment OR subject:receipt OR subject:payment OR subject:invoice'
    
    if (options.dateRange) {
      const startDate = options.dateRange.start.toISOString().split('T')[0]
      const endDate = options.dateRange.end.toISOString().split('T')[0]
      query += ` after:${startDate} before:${endDate}`
    }

    // Build URL with parameters
    const url = new URL(`${this.platform.apiEndpoint}/messages`)
    url.searchParams.set('q', query)
    url.searchParams.set('maxResults', maxEmails.toString())
    
    if (labelIds.length > 0) {
      url.searchParams.set('labelIds', labelIds.join(','))
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const emails: any[] = []

    // Fetch full email content for each message ID
    for (const message of data.messages || []) {
      try {
        const fullEmail = await this.fetchGmailEmailContent(message.id)
        if (fullEmail) {
          emails.push(fullEmail)
        }
      } catch (error) {
        console.error(`Failed to fetch Gmail email ${message.id}:`, error)
      }
    }

    return emails
  }

  /**
   * Fetch individual Gmail email content
   */
  private async fetchGmailEmailContent(messageId: string): Promise<any | null> {
    try {
      const url = `${this.platform.apiEndpoint}/messages/${messageId}?format=full`
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch Gmail email content: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error fetching Gmail email content for ${messageId}:`, error)
      return null
    }
  }

  /**
   * Fetch emails from Outlook/Microsoft 365
   */
  private async fetchOutlookEmails(options: EmailProcessingOptions): Promise<any[]> {
    const { maxEmails = 100, searchQuery = '', folder = 'INBOX' } = options

    // Build search query
    let query = searchQuery || 'hasAttachments:true OR subject:receipt OR subject:payment OR subject:invoice'
    
    if (options.dateRange) {
      const startDate = options.dateRange.start.toISOString()
      const endDate = options.dateRange.end.toISOString()
      query += ` AND receivedDateTime ge ${startDate} AND receivedDateTime le ${endDate}`
    }

    // Build URL with parameters
    const url = new URL(`${this.platform.apiEndpoint}`)
    url.searchParams.set('$search', query)
    url.searchParams.set('$top', maxEmails.toString())
    url.searchParams.set('$orderby', 'receivedDateTime desc')
    url.searchParams.set('$select', 'id,subject,from,toRecipients,receivedDateTime,body,hasAttachments')

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.value || []
  }

  /**
   * Fetch emails from Yahoo Mail
   */
  private async fetchYahooEmails(options: EmailProcessingOptions): Promise<any[]> {
    const { maxEmails = 100, searchQuery = '', folder = 'INBOX' } = options

    // Build search query
    let query = searchQuery || 'has:attachment OR subject:receipt OR subject:payment'
    
    if (options.dateRange) {
      const startDate = options.dateRange.start.getTime() / 1000
      const endDate = options.dateRange.end.getTime() / 1000
      query += ` date:${startDate}-${endDate}`
    }

    const url = new URL(`${this.platform.apiEndpoint}/search`)
    url.searchParams.set('query', query)
    url.searchParams.set('limit', maxEmails.toString())
    url.searchParams.set('folder', folder)

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Yahoo Mail API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.messages || []
  }

  /**
   * Fetch emails from iCloud Mail
   */
  private async fetchICloudEmails(options: EmailProcessingOptions): Promise<any[]> {
    const { maxEmails = 100, searchQuery = '', folder = 'INBOX' } = options

    // Build search query
    let query = searchQuery || 'has:attachment OR subject:receipt OR subject:payment'
    
    if (options.dateRange) {
      const startDate = options.dateRange.start.getTime()
      const endDate = options.dateRange.end.getTime()
      query += ` date:${startDate}-${endDate}`
    }

    const url = new URL(`${this.platform.apiEndpoint}/search`)
    url.searchParams.set('query', query)
    url.searchParams.set('limit', maxEmails.toString())
    url.searchParams.set('folder', folder)

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`iCloud Mail API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.messages || []
  }

  /**
   * Fetch emails from ProtonMail
   */
  private async fetchProtonMailEmails(options: EmailProcessingOptions): Promise<any[]> {
    const { maxEmails = 100, searchQuery = '', folder = 'INBOX' } = options

    // Build search query
    let query = searchQuery || 'has:attachment OR subject:receipt OR subject:payment'
    
    if (options.dateRange) {
      const startDate = options.dateRange.start.getTime() / 1000
      const endDate = options.dateRange.end.getTime() / 1000
      query += ` date:${startDate}-${endDate}`
    }

    const url = new URL(`${this.platform.apiEndpoint}/messages`)
    url.searchParams.set('query', query)
    url.searchParams.set('limit', maxEmails.toString())
    url.searchParams.set('folder', folder)

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ProtonMail API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.messages || []
  }

  /**
   * Fetch emails using generic IMAP/POP3
   */
  private async fetchGenericEmails(options: EmailProcessingOptions): Promise<any[]> {
    // This would require a server-side IMAP/POP3 library
    // For now, return empty array with note
    console.log('Generic IMAP/POP3 email fetching requires server-side implementation')
    return []
  }

  /**
   * Extract readable content from email payload (platform-agnostic)
   */
  static extractEmailContent(email: any, platform: string): {
    subject: string
    from: string
    to: string
    body: string
    date: Date
  } {
    switch (platform) {
      case 'gmail':
        return EmailPlatformProcessor.extractGmailContent(email)
      case 'outlook':
        return EmailPlatformProcessor.extractOutlookContent(email)
      case 'yahoo':
        return EmailPlatformProcessor.extractYahooContent(email)
      case 'icloud':
        return EmailPlatformProcessor.extractICloudContent(email)
      case 'protonmail':
        return EmailPlatformProcessor.extractProtonMailContent(email)
      default:
        return EmailPlatformProcessor.extractGenericContent(email)
    }
  }

  /**
   * Extract content from Gmail email
   */
  private static extractGmailContent(email: any) {
    const headers = email.payload.headers
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
    const from = headers.find((h: any) => h.name === 'From')?.value || ''
    const to = headers.find((h: any) => h.name === 'To')?.value || ''
    const date = new Date(parseInt(email.internalDate))

    let body = ''

    if (email.payload.body?.data) {
      body = EmailPlatformProcessor.decodeBody(email.payload.body.data)
    } else if (email.payload.parts) {
      for (const part of email.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = EmailPlatformProcessor.decodeBody(part.body.data)
          break
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          body = EmailPlatformProcessor.decodeBody(part.body.data)
          body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          break
        }
      }
    }

    return { subject, from, to, body, date }
  }

  /**
   * Extract content from Outlook email
   */
  private static extractOutlookContent(email: any) {
    return {
      subject: email.subject || '',
      from: email.from?.emailAddress?.address || '',
      to: email.toRecipients?.[0]?.emailAddress?.address || '',
      body: email.body?.content || '',
      date: new Date(email.receivedDateTime || Date.now())
    }
  }

  /**
   * Extract content from Yahoo email
   */
  private static extractYahooContent(email: any) {
    return {
      subject: email.subject || '',
      from: email.from || '',
      to: email.to || '',
      body: email.body || '',
      date: new Date(email.date || Date.now())
    }
  }

  /**
   * Extract content from iCloud email
   */
  private static extractICloudContent(email: any) {
    return {
      subject: email.subject || '',
      from: email.from || '',
      to: email.to || '',
      body: email.body || '',
      date: new Date(email.date || Date.now())
    }
  }

  /**
   * Extract content from ProtonMail email
   */
  private static extractProtonMailContent(email: any) {
    return {
      subject: email.subject || '',
      from: email.from || '',
      to: email.to || '',
      body: email.body || '',
      date: new Date(email.date || Date.now())
    }
  }

  /**
   * Extract content from generic email
   */
  private static extractGenericContent(email: any) {
    return {
      subject: email.subject || '',
      from: email.from || '',
      to: email.to || '',
      body: email.body || '',
      date: new Date(email.date || Date.now())
    }
  }

  /**
   * Decode base64 encoded email body
   */
  private static decodeBody(data: string): string {
    try {
      return Buffer.from(data, 'base64').toString('utf-8')
    } catch (error) {
      console.error('Error decoding email body:', error)
      return ''
    }
  }

  /**
   * Process emails for payment gateway content
   */
  async processPaymentEmails(emails: any[]): Promise<PaymentGatewayData[]> {
    const paymentEmails: PaymentGatewayData[] = []

    for (const email of emails) {
      try {
        const content = EmailPlatformProcessor.extractEmailContent(email, this.platform.type)
        
        // Check if this is a payment email
        if (paymentGatewayDetector.isReceipt(content)) {
          const gateway = paymentGatewayDetector.detect(content)
          if (gateway) {
            // Parse the email for payment data
            const parsed = this.parsePaymentEmail(content, gateway.gateway)
            if (parsed) {
              paymentEmails.push(parsed)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing email:`, error)
      }
    }

    return paymentEmails
  }

  /**
   * Parse payment email for subscription information
   */
  private parsePaymentEmail(content: any, gateway: string): PaymentGatewayData | null {
    // This would use the enhanced price detection patterns
    // For now, return a basic structure
    try {
      // Extract amount using enhanced patterns
      const amount = this.extractAmount(content.body)
      if (amount === 0) return null

      return {
        gateway,
        type: 'receipt',
        merchantName: this.extractMerchantName(content.body),
        amount,
        currency: 'USD', // Default, could be enhanced
        status: 'success',
        date: content.date,
        confidence: 0.8,
        rawEmail: content,
        metadata: {
          customerEmail: content.to
        }
      }
    } catch (error) {
      console.error('Error parsing payment email:', error)
      return null
    }
  }

  /**
   * Extract amount using enhanced patterns
   */
  private extractAmount(body: string): number {
    // Enhanced amount patterns for all price ranges
    const amountPatterns = [
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /\$(\d+(?:\.\d{2})?)/g,
      /€(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /amount[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /total[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /charged[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i
    ]

    const amounts: number[] = []
    
    amountPatterns.forEach(pattern => {
      const matches = body.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const amount = parseFloat(match.replace(/[^\d.]/g, ''))
          if (!isNaN(amount) && amount > 0 && amount < 100000) {
            amounts.push(amount)
          }
        })
      }
    })

    return amounts.length > 0 ? Math.max(...amounts) : 0
  }

  /**
   * Extract merchant name
   */
  private extractMerchantName(body: string): string {
    // Known merchant patterns
    const merchants = [
      'Netflix', 'Spotify', 'Disney+', 'Hulu', 'Amazon Prime',
      'Notion', 'Figma', 'Slack', 'Zoom', 'Dropbox',
      'GitHub', 'Vercel', 'Heroku', 'AWS', 'Salesforce'
    ]

    for (const merchant of merchants) {
      if (body.toLowerCase().includes(merchant.toLowerCase())) {
        return merchant
      }
    }

    return 'Unknown Service'
  }

  /**
   * Get supported email platforms
   */
  static getSupportedPlatforms(): EmailPlatform[] {
    return Object.values(EmailPlatformProcessor.EMAIL_PLATFORMS)
  }

  /**
   * Get platform by type
   */
  static getPlatform(type: string): EmailPlatform | null {
    return EmailPlatformProcessor.EMAIL_PLATFORMS[type] || null
  }
}

// Export convenience functions
export const emailPlatformProcessor = {
  create: (platformType: string, accessToken: string) => new EmailPlatformProcessor(platformType, accessToken),
  getSupported: EmailPlatformProcessor.getSupportedPlatforms,
  getPlatform: EmailPlatformProcessor.getPlatform
}
