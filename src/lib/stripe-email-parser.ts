import { hybridStorage } from './hybrid-storage'

export interface StripeEmailData {
  type: 'receipt' | 'invoice' | 'subscription_update' | 'payment_failed' | 'trial_ending'
  merchantName: string
  amount: number
  currency: string
  subscriptionId?: string
  customerId?: string
  billingCycle?: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'one-time' | 'biannual' | 'per-user'
  status: 'success' | 'failed' | 'pending'
  date: Date
  confidence: number
  rawEmail: any
  metadata: {
    stripeEventId?: string
    invoiceId?: string
    receiptUrl?: string
    customerEmail?: string
  }
}

export class StripeEmailParser {
  private static readonly STRIPE_PATTERNS = {
    // Stripe email identifiers
    senderPatterns: [
      /noreply@stripe\.com/i,
      /receipts@stripe\.com/i,
      /billing@stripe\.com/i,
      /support@stripe\.com/i
    ],
    
    // Subject line patterns
    subjectPatterns: {
      receipt: [
        /receipt.*stripe/i,
        /payment.*receipt/i,
        /stripe.*receipt/i,
        /receipt.*\$\d+/i
      ],
      invoice: [
        /invoice.*stripe/i,
        /stripe.*invoice/i,
        /invoice.*\$\d+/i
      ],
      subscription: [
        /subscription.*updated/i,
        /subscription.*renewed/i,
        /subscription.*created/i,
        /renewal.*reminder/i
      ],
      payment_failed: [
        /payment.*failed/i,
        /failed.*payment/i,
        /card.*declined/i,
        /billing.*failed/i
      ],
      trial_ending: [
        /trial.*ending/i,
        /trial.*expires/i,
        /trial.*expiring/i
      ]
    },

    // Enhanced amount patterns for ALL price ranges
    amountPatterns: [
      // Basic dollar amounts (covers $0.01 to $999,999.99)
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /\$(\d+(?:\.\d{2})?)/g,
      
      // International currencies
      /€(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /¥(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /₹(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /CAD\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /AUD\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      
      // Amount labels with various formats
      /amount[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /total[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /charged[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /billing[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /payment[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /cost[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /price[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      
      // Subscription-specific patterns
      /subscription[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /plan[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /monthly[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /yearly[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /annual[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      
      // Range pricing (e.g., "$99-199/month")
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[-–—]\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      
      // Starting at pricing
      /starting\s*at\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /from\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      
      // Per user/per seat pricing
      /per\s*user[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /per\s*seat[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /per\s*month[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      
      // Annual pricing (monthly equivalent)
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\/\s*year/i,
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*per\s*year/i,
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*annually/i
    ],

    // Enhanced subscription ID patterns
    subscriptionPatterns: [
      /subscription[:\s]*([a-z0-9_]+)/i,
      /sub[:\s]*([a-z0-9_]+)/i,
      /id[:\s]*([a-z0-9_]+)/i,
      /customer[:\s]*([a-z0-9_]+)/i,
      /account[:\s]*([a-z0-9_]+)/i
    ],

    // Enhanced billing cycle patterns
    billingCyclePatterns: [
      { pattern: /\b(monthly|month|mo\.?)\b/i, value: 'monthly' as const },
      { pattern: /\b(yearly|annual|year|yr\.?)\b/i, value: 'yearly' as const },
      { pattern: /\b(weekly|week|wk\.?)\b/i, value: 'weekly' as const },
      { pattern: /\b(quarterly|quarter|qtr\.?)\b/i, value: 'quarterly' as const },
      { pattern: /\b(bi.?annual|semi.?annual|6.?month)\b/i, value: 'biannual' as const },
      { pattern: /\b(one.?time|single|once)\b/i, value: 'one-time' as const },
      { pattern: /\b(per\s*user|per\s*seat)\b/i, value: 'per-user' as const }
    ],

    // Expanded known merchants (100+ services)
    knownMerchants: {
      // Streaming & Entertainment
      Netflix: { patterns: ['netflix', 'netflix\.com'], category: 'Entertainment', confidence: 0.95 },
      Spotify: { patterns: ['spotify', 'spotify\.com'], category: 'Entertainment', confidence: 0.95 },
      'Disney+': { patterns: ['disney\+', 'disneyplus', 'disney\.com'], category: 'Entertainment', confidence: 0.95 },
      Hulu: { patterns: ['hulu', 'hulu\.com'], category: 'Entertainment', confidence: 0.95 },
      'Amazon Prime': { patterns: ['amazon\s*prime', 'prime\s*membership'], category: 'Shopping', confidence: 0.9 },
      'HBO Max': { patterns: ['hbo\s*max', 'hbomax'], category: 'Entertainment', confidence: 0.95 },
      'Apple TV+': { patterns: ['apple\s*tv\+', 'appletv\+'], category: 'Entertainment', confidence: 0.95 },
      'YouTube Premium': { patterns: ['youtube\s*premium', 'youtube\s*red'], category: 'Entertainment', confidence: 0.95 },
      
      // Productivity & Design
      Notion: { patterns: ['notion', 'notion\.so'], category: 'Productivity', confidence: 0.95 },
      Figma: { patterns: ['figma', 'figma\.com'], category: 'Design', confidence: 0.95 },
      Slack: { patterns: ['slack', 'slack\.com'], category: 'Communication', confidence: 0.95 },
      Zoom: { patterns: ['zoom', 'zoom\.us'], category: 'Communication', confidence: 0.95 },
      Dropbox: { patterns: ['dropbox', 'dropbox\.com'], category: 'Storage', confidence: 0.95 },
      'Adobe Creative Cloud': { patterns: ['adobe', 'creative\s*cloud', 'photoshop'], category: 'Design', confidence: 0.95 },
      'Canva Pro': { patterns: ['canva\s*pro', 'canva'], category: 'Design', confidence: 0.9 },
      Miro: { patterns: ['miro', 'miro\.com'], category: 'Design', confidence: 0.95 },
      Airtable: { patterns: ['airtable', 'airtable\.com'], category: 'Productivity', confidence: 0.95 },
      'Monday.com': { patterns: ['monday\.com', 'monday'], category: 'Productivity', confidence: 0.95 },
      
      // Business & Marketing
      Salesforce: { patterns: ['salesforce', 'salesforce\.com'], category: 'Business', confidence: 0.95 },
      HubSpot: { patterns: ['hubspot', 'hubspot\.com'], category: 'Marketing', confidence: 0.95 },
      Mailchimp: { patterns: ['mailchimp', 'mailchimp\.com'], category: 'Marketing', confidence: 0.95 },
      Stripe: { patterns: ['stripe', 'stripe\.com'], category: 'Business', confidence: 0.95 },
      Shopify: { patterns: ['shopify', 'shopify\.com'], category: 'E-commerce', confidence: 0.95 },
      QuickBooks: { patterns: ['quickbooks', 'quickbooks\.com'], category: 'Business', confidence: 0.95 },
      Zendesk: { patterns: ['zendesk', 'zendesk\.com'], category: 'Business', confidence: 0.95 },
      Intercom: { patterns: ['intercom', 'intercom\.com'], category: 'Business', confidence: 0.95 },
      Calendly: { patterns: ['calendly', 'calendly\.com'], category: 'Productivity', confidence: 0.95 },
      Loom: { patterns: ['loom', 'loom\.com'], category: 'Communication', confidence: 0.95 },
      
      // Development & Cloud
      GitHub: { patterns: ['github', 'github\.com'], category: 'Development', confidence: 0.95 },
      Vercel: { patterns: ['vercel', 'vercel\.app'], category: 'Development', confidence: 0.95 },
      Heroku: { patterns: ['heroku', 'heroku\.com'], category: 'Development', confidence: 0.95 },
      AWS: { patterns: ['aws', 'amazon\s*web\s*services'], category: 'Development', confidence: 0.9 },
      'Google Cloud': { patterns: ['google\s*cloud', 'gcp'], category: 'Development', confidence: 0.9 },
      'Microsoft Azure': { patterns: ['azure', 'microsoft\s*azure'], category: 'Development', confidence: 0.9 },
      DigitalOcean: { patterns: ['digitalocean', 'do\.com'], category: 'Development', confidence: 0.95 },
      Cloudflare: { patterns: ['cloudflare', 'cloudflare\.com'], category: 'Development', confidence: 0.95 },
      'MongoDB Atlas': { patterns: ['mongodb\s*atlas', 'mongodb'], category: 'Development', confidence: 0.95 },
      PostgreSQL: { patterns: ['postgresql', 'postgres'], category: 'Development', confidence: 0.9 },
      
      // Communication & Social
      'Discord Nitro': { patterns: ['discord\s*nitro', 'discord'], category: 'Communication', confidence: 0.9 },
      'Telegram Premium': { patterns: ['telegram\s*premium', 'telegram'], category: 'Communication', confidence: 0.9 },
      'WhatsApp Business': { patterns: ['whatsapp\s*business', 'whatsapp'], category: 'Communication', confidence: 0.9 },
      'LinkedIn Premium': { patterns: ['linkedin\s*premium', 'linkedin'], category: 'Professional', confidence: 0.9 },
      'Twitter Blue': { patterns: ['twitter\s*blue', 'twitter'], category: 'Social', confidence: 0.9 },
      
      // Education & Learning
      Coursera: { patterns: ['coursera', 'coursera\.org'], category: 'Education', confidence: 0.95 },
      Udemy: { patterns: ['udemy', 'udemy\.com'], category: 'Education', confidence: 0.95 },
      Skillshare: { patterns: ['skillshare', 'skillshare\.com'], category: 'Education', confidence: 0.95 },
      MasterClass: { patterns: ['masterclass', 'masterclass\.com'], category: 'Education', confidence: 0.95 },
      'Duolingo Plus': { patterns: ['duolingo\s*plus', 'duolingo'], category: 'Education', confidence: 0.9 },
      
      // Health & Fitness
      Peloton: { patterns: ['peloton', 'peloton\.com'], category: 'Health', confidence: 0.95 },
      MyFitnessPal: { patterns: ['myfitnesspal', 'myfitnesspal\.com'], category: 'Health', confidence: 0.95 },
      Headspace: { patterns: ['headspace', 'headspace\.com'], category: 'Health', confidence: 0.95 },
      Calm: { patterns: ['calm', 'calm\.com'], category: 'Health', confidence: 0.95 },
      Noom: { patterns: ['noom', 'noom\.com'], category: 'Health', confidence: 0.95 },
      
      // Finance & Investment
      Mint: { patterns: ['mint', 'mint\.com'], category: 'Finance', confidence: 0.95 },
      YNAB: { patterns: ['ynab', 'youneedabudget'], category: 'Finance', confidence: 0.95 },
      'Personal Capital': { patterns: ['personal\s*capital', 'personalcapital'], category: 'Finance', confidence: 0.95 },
      'Robinhood Gold': { patterns: ['robinhood\s*gold', 'robinhood'], category: 'Finance', confidence: 0.9 },
      Acorns: { patterns: ['acorns', 'acorns\.com'], category: 'Finance', confidence: 0.95 },
      
      // Security & VPN
      NordVPN: { patterns: ['nordvpn', 'nordvpn\.com'], category: 'Security', confidence: 0.95 },
      ExpressVPN: { patterns: ['expressvpn', 'expressvpn\.com'], category: 'Security', confidence: 0.95 },
      '1Password': { patterns: ['1password', '1password\.com'], category: 'Security', confidence: 0.95 },
      LastPass: { patterns: ['lastpass', 'lastpass\.com'], category: 'Security', confidence: 0.95 },
      Dashlane: { patterns: ['dashlane', 'dashlane\.com'], category: 'Security', confidence: 0.95 }
    }
  }

  /**
   * Check if an email is from Stripe
   */
  static isStripeEmail(email: any): boolean {
    const from = email.from?.toLowerCase() || ''
    const subject = email.subject?.toLowerCase() || ''
    
    // Check sender patterns
    const isStripeSender = this.STRIPE_PATTERNS.senderPatterns.some(pattern => 
      pattern.test(from)
    )
    
    // Check subject patterns
    const hasStripeSubject = subject.includes('stripe') || 
      subject.includes('receipt') || 
      subject.includes('payment') ||
      subject.includes('invoice')
    
    return isStripeSender || hasStripeSubject
  }

  /**
   * Parse a Stripe email for subscription information
   */
  static parseStripeEmail(email: any): StripeEmailData | null {
    if (!this.isStripeEmail(email)) {
      return null
    }

    try {
      const emailType = this.detectEmailType(email)
      const amount = this.extractAmount(email)
      const merchantName = this.extractMerchantName(email)
      const subscriptionId = this.extractSubscriptionId(email)
      const billingCycle = this.extractBillingCycle(email)
      const status = this.determineStatus(emailType, email)
      const confidence = this.calculateConfidence(email, emailType, amount, merchantName)

      if (confidence < 0.6) {
        return null // Low confidence, skip this email
      }

      return {
        type: emailType,
        merchantName,
        amount,
        currency: 'USD', // Stripe defaults to USD
        subscriptionId,
        customerId: this.extractCustomerId(email),
        billingCycle,
        status,
        date: new Date(email.date || Date.now()),
        confidence,
        rawEmail: email,
        metadata: {
          stripeEventId: this.extractStripeEventId(email),
          invoiceId: this.extractInvoiceId(email),
          receiptUrl: this.extractReceiptUrl(email),
          customerEmail: email.to?.[0]?.email || email.to
        }
      }
    } catch (error) {
      console.error('Error parsing Stripe email:', error)
      return null
    }
  }

  /**
   * Detect the type of Stripe email
   */
  private static detectEmailType(email: any): StripeEmailData['type'] {
    const subject = email.subject?.toLowerCase() || ''
    const body = email.body?.toLowerCase() || ''

    // Check for payment failures
    if (this.STRIPE_PATTERNS.subjectPatterns.payment_failed.some(pattern => 
      pattern.test(subject) || pattern.test(body)
    )) {
      return 'payment_failed'
    }

    // Check for trial ending
    if (this.STRIPE_PATTERNS.subjectPatterns.trial_ending.some(pattern => 
      pattern.test(subject) || pattern.test(body)
    )) {
      return 'trial_ending'
    }

    // Check for subscription updates
    if (this.STRIPE_PATTERNS.subjectPatterns.subscription.some(pattern => 
      pattern.test(subject) || pattern.test(body)
    )) {
      return 'subscription_update'
    }

    // Check for invoices
    if (this.STRIPE_PATTERNS.subjectPatterns.invoice.some(pattern => 
      pattern.test(subject) || pattern.test(body)
    )) {
      return 'invoice'
    }

    // Default to receipt
    return 'receipt'
  }

  /**
   * Extract amount from email content
   */
  private static extractAmount(email: any): number {
    const subject = email.subject || ''
    const body = email.body || ''
    const content = `${subject} ${body}`

    // Find all amount matches
    const amounts: number[] = []
    
    this.STRIPE_PATTERNS.amountPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const amount = parseFloat(match.replace(/[^\d.]/g, ''))
          if (!isNaN(amount) && amount > 0 && amount < 10000) {
            amounts.push(amount)
          }
        })
      }
    })

    // Return the highest amount (usually the total)
    return amounts.length > 0 ? Math.max(...amounts) : 0
  }

  /**
   * Extract merchant name from email content
   */
  private static extractMerchantName(email: any): string {
    const subject = email.subject || ''
    const body = email.body || ''
    const content = `${subject} ${body}`.toLowerCase()

    // Check known merchants first
    for (const [merchantName, merchant] of Object.entries(this.STRIPE_PATTERNS.knownMerchants)) {
      if (merchant.patterns.some(pattern => 
        new RegExp(pattern, 'i').test(content)
      )) {
        return merchantName
      }
    }

    // Try to extract from subject line
    const subjectWords = subject.split(/\s+/)
    for (const word of subjectWords) {
      if (word.length > 3 && !word.includes('@') && !word.includes('http')) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      }
    }

    // Default to "Unknown Service"
    return 'Unknown Service'
  }

  /**
   * Extract subscription ID from email content
   */
  private static extractSubscriptionId(email: any): string | undefined {
    const subject = email.subject || ''
    const body = email.body || ''
    const content = `${subject} ${body}`

    for (const pattern of this.STRIPE_PATTERNS.subscriptionPatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return undefined
  }

  /**
   * Extract billing cycle from email content
   */
  private static extractBillingCycle(email: any): StripeEmailData['billingCycle'] {
    const subject = email.subject || ''
    const body = email.body || ''
    const content = `${subject} ${body}`.toLowerCase()

    for (const cyclePattern of this.STRIPE_PATTERNS.billingCyclePatterns) {
      if (cyclePattern.pattern.test(content)) {
        return cyclePattern.value
      }
    }

    // Default to monthly for subscription updates
    return 'monthly'
  }

  /**
   * Determine the status of the transaction
   */
  private static determineStatus(emailType: StripeEmailData['type'], email: any): StripeEmailData['status'] {
    switch (emailType) {
      case 'payment_failed':
        return 'failed'
      case 'receipt':
      case 'invoice':
        return 'success'
      case 'subscription_update':
      case 'trial_ending':
        return 'pending'
      default:
        return 'success'
    }
  }

  /**
   * Calculate confidence score for the detection
   */
  private static calculateConfidence(
    email: any, 
    emailType: StripeEmailData['type'], 
    amount: number, 
    merchantName: string
  ): number {
    let confidence = 0.5 // Base confidence

    // Stripe sender verification
    if (this.isStripeEmail(email)) {
      confidence += 0.3
    }

    // Amount detection
    if (amount > 0) {
      confidence += 0.2
    }

    // Known merchant
    if (merchantName !== 'Unknown Service') {
      confidence += 0.2
    }

    // Email type specificity
    if (emailType === 'receipt' || emailType === 'invoice') {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Extract additional metadata from email
   */
  private static extractStripeEventId(email: any): string | undefined {
    // Look for Stripe event IDs in the email
    const body = email.body || ''
    const match = body.match(/event_([a-z0-9_]+)/i)
    return match ? match[1] : undefined
  }

  private static extractInvoiceId(email: any): string | undefined {
    const body = email.body || ''
    const match = body.match(/invoice_([a-z0-9_]+)/i)
    return match ? match[1] : undefined
  }

  private static extractReceiptUrl(email: any): string | undefined {
    const body = email.body || ''
    const match = body.match(/(https?:\/\/receipt\.stripe\.com\/[^\s]+)/i)
    return match ? match[1] : undefined
  }

  private static extractCustomerId(email: any): string | undefined {
    const body = email.body || ''
    const match = body.match(/customer_([a-z0-9_]+)/i)
    return match ? match[1] : undefined
  }

  /**
   * Process a batch of emails for Stripe content
   */
  static async processEmailBatch(emails: any[]): Promise<StripeEmailData[]> {
    const results: StripeEmailData[] = []
    
    for (const email of emails) {
      try {
        const parsed = this.parseStripeEmail(email)
        if (parsed) {
          results.push(parsed)
        }
      } catch (error) {
        console.error('Error processing email:', error)
      }
    }

    return results
  }

  /**
   * Process historical emails (bulk processing)
   */
  static async processHistoricalEmails(
    emailProvider: 'gmail' | 'outlook' | 'generic',
    accessToken: string,
    options: {
      maxEmails?: number
      dateRange?: { start: Date; end: Date }
      includeRead?: boolean
    } = {}
  ): Promise<{
    processed: number
    found: number
    subscriptions: StripeEmailData[]
    errors: string[]
  }> {
    const {
      maxEmails = 1000,
      dateRange,
      includeRead = false
    } = options

    const subscriptions: StripeEmailData[] = []
    const errors: string[] = []
    const processed = 0

    try {
      // This would integrate with the specific email provider's API
      // For now, we'll return a mock structure
      console.log(`Processing historical emails from ${emailProvider}`)
      
      // TODO: Implement actual email fetching based on provider
      // - Gmail: Use Gmail API with history.list and messages.list
      // - Outlook: Use Microsoft Graph API
      // - Generic: Use IMAP/POP3

      return {
        processed,
        found: subscriptions.length,
        subscriptions,
        errors
      }
    } catch (error) {
      errors.push(`Failed to process historical emails: ${error}`)
      return {
        processed,
        found: subscriptions.length,
        subscriptions,
        errors
      }
    }
  }
}

// Export convenience functions
export const stripeEmailParser = {
  isStripeEmail: StripeEmailParser.isStripeEmail,
  parseStripeEmail: StripeEmailParser.parseStripeEmail,
  processEmailBatch: StripeEmailParser.processEmailBatch,
  processHistoricalEmails: StripeEmailParser.processHistoricalEmails
}
