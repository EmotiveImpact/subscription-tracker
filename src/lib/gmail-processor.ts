import { stripeEmailParser, StripeEmailData } from './stripe-email-parser'

export interface GmailEmail {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  historyId: string
  internalDate: string
  payload: {
    headers: Array<{ name: string; value: string }>
    body?: {
      data?: string
      attachmentId?: string
    }
    parts?: Array<{
      mimeType: string
      body: { data?: string; attachmentId?: string }
      headers: Array<{ name: string; value: string }>
    }>
  }
}

export interface GmailProcessingOptions {
  maxEmails?: number
  dateRange?: { start: Date; end: Date }
  includeRead?: boolean
  searchQuery?: string
  labelIds?: string[]
}

export class GmailProcessor {
  private accessToken: string
  private baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Fetch emails from Gmail with optional filtering
   */
  async fetchEmails(options: GmailProcessingOptions = {}): Promise<GmailEmail[]> {
    const {
      maxEmails = 100,
      dateRange,
      searchQuery = '',
      labelIds = []
    } = options

    try {
      // Build search query
      let query = searchQuery
      
      if (dateRange) {
        const startDate = dateRange.start.toISOString().split('T')[0]
        const endDate = dateRange.end.toISOString().split('T')[0]
        query += ` after:${startDate} before:${endDate}`
      }

      // Add Stripe-specific search if no custom query
      if (!searchQuery) {
        query = 'from:stripe.com OR subject:stripe OR subject:receipt OR subject:payment'
      }

      // Build URL with parameters
      const url = new URL(`${this.baseUrl}/messages`)
      url.searchParams.set('q', query)
      url.searchParams.set('maxResults', maxEmails.toString())
      
      if (labelIds.length > 0) {
        url.searchParams.set('labelIds', labelIds.join(','))
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const emails: GmailEmail[] = []

      // Fetch full email content for each message ID
      for (const message of data.messages || []) {
        try {
          const fullEmail = await this.fetchEmailContent(message.id)
          if (fullEmail) {
            emails.push(fullEmail)
          }
        } catch (error) {
          console.error(`Failed to fetch email ${message.id}:`, error)
        }
      }

      return emails
    } catch (error) {
      console.error('Error fetching Gmail emails:', error)
      throw error
    }
  }

  /**
   * Fetch full email content by message ID
   */
  private async fetchEmailContent(messageId: string): Promise<GmailEmail | null> {
    try {
      const url = `${this.baseUrl}/messages/${messageId}?format=full`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch email content: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error fetching email content for ${messageId}:`, error)
      return null
    }
  }

  /**
   * Extract readable content from Gmail email payload
   */
  private extractEmailContent(email: GmailEmail): {
    subject: string
    from: string
    to: string
    body: string
    date: Date
  } {
    const headers = email.payload.headers
    const subject = headers.find(h => h.name === 'Subject')?.value || ''
    const from = headers.find(h => h.name === 'From')?.value || ''
    const to = headers.find(h => h.name === 'To')?.value || ''
    const date = new Date(parseInt(email.internalDate))

    let body = ''

    // Extract body content
    if (email.payload.body?.data) {
      body = this.decodeBody(email.payload.body.data)
    } else if (email.payload.parts) {
      // Find text/plain or text/html part
      for (const part of email.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = this.decodeBody(part.body.data)
          break
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          body = this.decodeBody(part.body.data)
          // Convert HTML to plain text (basic conversion)
          body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          break
        }
      }
    }

    return { subject, from, to, body, date }
  }

  /**
   * Decode base64 encoded email body
   */
  private decodeBody(data: string): string {
    try {
      return Buffer.from(data, 'base64').toString('utf-8')
    } catch (error) {
      console.error('Error decoding email body:', error)
      return ''
    }
  }

  /**
   * Process emails for Stripe content
   */
  async processStripeEmails(emails: GmailEmail[]): Promise<StripeEmailData[]> {
    const stripeEmails: StripeEmailData[] = []

    for (const email of emails) {
      try {
        const content = this.extractEmailContent(email)
        
        // Check if this is a Stripe email
        if (stripeEmailParser.isStripeEmail(content)) {
          const parsed = stripeEmailParser.parseStripeEmail(content)
          if (parsed) {
            stripeEmails.push(parsed)
          }
        }
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error)
      }
    }

    return stripeEmails
  }

  /**
   * Process historical emails for Stripe content
   */
  async processHistoricalStripeEmails(options: GmailProcessingOptions = {}): Promise<{
    processed: number
    found: number
    subscriptions: StripeEmailData[]
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      console.log('Fetching historical emails from Gmail...')
      
      // Fetch emails
      const emails = await this.fetchEmails(options)
      console.log(`Fetched ${emails.length} emails`)
      
      // Process for Stripe content
      const stripeEmails = await this.processStripeEmails(emails)
      console.log(`Found ${stripeEmails.length} Stripe emails`)
      
      return {
        processed: emails.length,
        found: stripeEmails.length,
        subscriptions: stripeEmails,
        errors
      }
    } catch (error) {
      errors.push(`Failed to process historical emails: ${error}`)
      return {
        processed: 0,
        found: 0,
        subscriptions: [],
        errors
      }
    }
  }

  /**
   * Search for specific types of Stripe emails
   */
  async searchStripeEmails(searchType: 'receipts' | 'invoices' | 'failures' | 'all' = 'all'): Promise<StripeEmailData[]> {
    let searchQuery = 'from:stripe.com'
    
    switch (searchType) {
      case 'receipts':
        searchQuery += ' subject:receipt'
        break
      case 'invoices':
        searchQuery += ' subject:invoice'
        break
      case 'failures':
        searchQuery += ' (subject:failed OR subject:declined OR subject:payment)'
        break
      case 'all':
      default:
        searchQuery += ' (subject:receipt OR subject:invoice OR subject:payment OR subject:subscription)'
    }

    const emails = await this.fetchEmails({ searchQuery, maxEmails: 500 })
    return await this.processStripeEmails(emails)
  }

  /**
   * Get email statistics
   */
  async getEmailStats(): Promise<{
    totalEmails: number
    stripeEmails: number
    receipts: number
    invoices: number
    failures: number
    subscriptions: number
  }> {
    try {
      // Get recent emails for stats
      const emails = await this.fetchEmails({ maxEmails: 1000 })
      const stripeEmails = await this.processStripeEmails(emails)
      
      const stats = {
        totalEmails: emails.length,
        stripeEmails: stripeEmails.length,
        receipts: stripeEmails.filter(e => e.type === 'receipt').length,
        invoices: stripeEmails.filter(e => e.type === 'invoice').length,
        failures: stripeEmails.filter(e => e.type === 'payment_failed').length,
        subscriptions: stripeEmails.filter(e => e.type === 'subscription_update').length
      }

      return stats
    } catch (error) {
      console.error('Error getting email stats:', error)
      return {
        totalEmails: 0,
        stripeEmails: 0,
        receipts: 0,
        invoices: 0,
        failures: 0,
        subscriptions: 0
      }
    }
  }

  /**
   * Set up Gmail push notifications for real-time processing
   */
  async setupWatch(topicName: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/watch`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topicName,
          labelIds: ['INBOX'],
          labelFilterAction: 'include'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to setup Gmail watch: ${response.status}`)
      }

      const data = await response.json()
      console.log('Gmail watch setup successful:', data)
      return true
    } catch (error) {
      console.error('Error setting up Gmail watch:', error)
      return false
    }
  }

  /**
   * Stop Gmail push notifications
   */
  async stopWatch(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/stop`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to stop Gmail watch: ${response.status}`)
      }

      console.log('Gmail watch stopped successfully')
      return true
    } catch (error) {
      console.error('Error stopping Gmail watch:', error)
      return false
    }
  }
}

// Export convenience functions
export const gmailProcessor = {
  create: (accessToken: string) => new GmailProcessor(accessToken),
  processHistoricalStripeEmails: (accessToken: string, options?: GmailProcessingOptions) => 
    new GmailProcessor(accessToken).processHistoricalStripeEmails(options),
  searchStripeEmails: (accessToken: string, searchType?: 'receipts' | 'invoices' | 'failures' | 'all') =>
    new GmailProcessor(accessToken).searchStripeEmails(searchType),
  getEmailStats: (accessToken: string) => new GmailProcessor(accessToken).getEmailStats()
}
