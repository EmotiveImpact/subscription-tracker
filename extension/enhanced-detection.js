// Enhanced subscription detection for Chrome extension
class EnhancedSubscriptionDetector {
  constructor() {
    this.patterns = this.initializePatterns()
    this.merchants = this.initializeMerchants()
    this.confidenceThreshold = 0.7
  }

  // Initialize detection patterns
  initializePatterns() {
    return {
      // Billing cycle patterns
      billingCycles: [
        { pattern: /\b(monthly|month|mo\.?)\b/i, value: 'monthly', weight: 0.8 },
        { pattern: /\b(yearly|annual|year|yr\.?)\b/i, value: 'yearly', weight: 0.8 },
        { pattern: /\b(weekly|week|wk\.?)\b/i, value: 'weekly', weight: 0.7 },
        { pattern: /\b(quarterly|quarter|qtr\.?)\b/i, value: 'quarterly', weight: 0.7 },
        { pattern: /\b(bi.?annual|semi.?annual|6.?month)\b/i, value: 'biannual', weight: 0.6 }
      ],

      // Price patterns
      prices: [
        { pattern: /\$(\d+(?:\.\d{2})?)/g, weight: 0.9 },
        { pattern: /(\d+(?:\.\d{2})?)\s*(?:USD|dollars?|bucks?)/gi, weight: 0.8 },
        { pattern: /price[:\s]*\$?(\d+(?:\.\d{2})?)/i, weight: 0.9 },
        { pattern: /cost[:\s]*\$?(\d+(?:\.\d{2})?)/i, weight: 0.9 },
        { pattern: /billing[:\s]*\$?(\d+(?:\.\d{2})?)/i, weight: 0.9 }
      ],

      // Subscription indicators
      subscriptionKeywords: [
        { pattern: /\b(subscription|subscribe|sub)\b/i, weight: 0.9 },
        { pattern: /\b(recurring|recurring\s*billing|auto.?renew)\b/i, weight: 0.9 },
        { pattern: /\b(membership|member|plan)\b/i, weight: 0.8 },
        { pattern: /\b(service|tool|platform|software)\b/i, weight: 0.6 },
        { pattern: /\b(trial|free\s*trial|30.?day|7.?day)\b/i, weight: 0.7 }
      ],

      // Cancellation patterns
      cancellationKeywords: [
        { pattern: /\b(cancel|cancellation|unsubscribe|stop)\b/i, weight: 0.8 },
        { pattern: /\b(manage\s*subscription|billing\s*portal)\b/i, weight: 0.7 },
        { pattern: /\b(account\s*settings|profile|preferences)\b/i, weight: 0.6 }
      ],

      // Date patterns
      dates: [
        { pattern: /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g, weight: 0.7 },
        { pattern: /\b(\d{4}-\d{2}-\d{2})\b/g, weight: 0.7 },
        { pattern: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{4}\b/gi, weight: 0.7 },
        { pattern: /\b(next\s*billing|renewal|due\s*date)\b/i, weight: 0.8 }
      ]
    }
  }

  // Initialize known merchant patterns
  initializeMerchants() {
    return {
      // Streaming services
      'Netflix': { patterns: ['netflix', 'netflix\.com'], category: 'Entertainment', confidence: 0.95 },
      'Spotify': { patterns: ['spotify', 'spotify\.com'], category: 'Entertainment', confidence: 0.95 },
      'Disney+': { patterns: ['disney\+', 'disneyplus', 'disney\.com'], category: 'Entertainment', confidence: 0.95 },
      'Hulu': { patterns: ['hulu', 'hulu\.com'], category: 'Entertainment', confidence: 0.95 },
      'Amazon Prime': { patterns: ['amazon\s*prime', 'prime\s*membership'], category: 'Shopping', confidence: 0.9 },
      
      // Productivity tools
      'Notion': { patterns: ['notion', 'notion\.so'], category: 'Productivity', confidence: 0.95 },
      'Figma': { patterns: ['figma', 'figma\.com'], category: 'Design', confidence: 0.95 },
      'Slack': { patterns: ['slack', 'slack\.com'], category: 'Communication', confidence: 0.95 },
      'Zoom': { patterns: ['zoom', 'zoom\.us'], category: 'Communication', confidence: 0.95 },
      'Dropbox': { patterns: ['dropbox', 'dropbox\.com'], category: 'Storage', confidence: 0.95 },
      
      // Business tools
      'Salesforce': { patterns: ['salesforce', 'salesforce\.com'], category: 'Business', confidence: 0.95 },
      'HubSpot': { patterns: ['hubspot', 'hubspot\.com'], category: 'Marketing', confidence: 0.95 },
      'Mailchimp': { patterns: ['mailchimp', 'mailchimp\.com'], category: 'Marketing', confidence: 0.95 },
      'Stripe': { patterns: ['stripe', 'stripe\.com'], category: 'Business', confidence: 0.95 },
      
      // Development tools
      'GitHub': { patterns: ['github', 'github\.com'], category: 'Development', confidence: 0.95 },
      'Vercel': { patterns: ['vercel', 'vercel\.app'], category: 'Development', confidence: 0.95 },
      'Heroku': { patterns: ['heroku', 'heroku\.com'], category: 'Development', confidence: 0.95 },
      'AWS': { patterns: ['aws', 'amazon\s*web\s*services'], category: 'Development', confidence: 0.9 }
    }
  }

  // Scan page for subscription information
  scanPage() {
    const results = {
      subscriptions: [],
      confidence: 0,
      pageType: this.detectPageType(),
      metadata: this.extractMetadata()
    }

    // Extract text content
    const pageText = this.extractPageText()
    const pageHTML = document.documentElement.outerHTML

    // Detect subscriptions with different strategies
    const textResults = this.scanTextContent(pageText)
    const htmlResults = this.scanHTMLContent(pageHTML)
    const formResults = this.scanForms()
    const urlResults = this.scanURL()

    // Combine and score results
    const allResults = [...textResults, ...htmlResults, ...formResults, ...urlResults]
    const scoredResults = this.scoreResults(allResults, pageText)

    results.subscriptions = scoredResults.filter(result => result.confidence >= this.confidenceThreshold)
    results.confidence = this.calculateOverallConfidence(scoredResults)

    return results
  }

  // Detect page type for better context
  detectPageType() {
    const url = window.location.href.toLowerCase()
    const title = document.title.toLowerCase()
    
    if (url.includes('billing') || url.includes('account') || url.includes('subscription')) {
      return 'billing'
    } else if (url.includes('pricing') || url.includes('plans') || url.includes('checkout')) {
      return 'pricing'
    } else if (url.includes('trial') || url.includes('signup') || url.includes('register')) {
      return 'signup'
    } else if (url.includes('dashboard') || url.includes('home') || url.includes('main')) {
      return 'dashboard'
    } else {
      return 'general'
    }
  }

  // Extract page metadata
  extractMetadata() {
    return {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      description: this.getMetaContent('description'),
      keywords: this.getMetaContent('keywords'),
      ogTitle: this.getMetaContent('og:title'),
      ogDescription: this.getMetaContent('og:description')
    }
  }

  // Get meta tag content
  getMetaContent(name) {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
    return meta ? meta.getAttribute('content') : null
  }

  // Extract text content from page
  extractPageText() {
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style, noscript')
    scripts.forEach(el => el.remove())

    // Get visible text content
    const textContent = document.body.innerText || document.body.textContent || ''
    
    // Clean up text
    return textContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
  }

  // Scan text content for subscription patterns
  scanTextContent(text) {
    const results = []
    
    // Check for merchant names
    Object.entries(this.merchants).forEach(([merchantName, merchantData]) => {
      merchantData.patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'i')
        if (regex.test(text)) {
          results.push({
            type: 'merchant',
            merchantName,
            category: merchantData.category,
            confidence: merchantData.confidence,
            source: 'text'
          })
        }
      })
    })

    // Check for billing cycles
    this.patterns.billingCycles.forEach(cycle => {
      const matches = text.match(cycle.pattern)
      if (matches) {
        results.push({
          type: 'billing_cycle',
          value: cycle.value,
          confidence: cycle.weight,
          source: 'text'
        })
      }
    })

    // Check for prices
    this.patterns.prices.forEach(price => {
      const matches = text.match(price.pattern)
      if (matches) {
        matches.forEach(match => {
          const amount = parseFloat(match.replace(/[^\d.]/g, ''))
          if (amount > 0 && amount < 10000) {
            results.push({
              type: 'price',
              amount,
              currency: 'USD',
              confidence: price.weight,
              source: 'text'
            })
          }
        })
      }
    })

    // Check for subscription keywords
    this.patterns.subscriptionKeywords.forEach(keyword => {
      const matches = text.match(keyword.pattern)
      if (matches) {
        results.push({
          type: 'subscription_indicator',
          keyword: matches[0],
          confidence: keyword.weight,
          source: 'text'
        })
      }
    })

    return results
  }

  // Scan HTML content for structured data
  scanHTMLContent(html) {
    const results = []

    // Look for JSON-LD structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent)
        const structuredResults = this.parseStructuredData(data)
        results.push(...structuredResults)
      } catch (e) {
        // Invalid JSON, skip
      }
    })

    // Look for microdata
    const microdataElements = document.querySelectorAll('[itemtype]')
    microdataElements.forEach(element => {
      const microdataResults = this.parseMicrodata(element)
      results.push(...microdataResults)
    })

    // Look for Open Graph data
    const ogResults = this.parseOpenGraph()
    results.push(...ogResults)

    return results
  }

  // Parse JSON-LD structured data
  parseStructuredData(data) {
    const results = []
    
    if (Array.isArray(data)) {
      data.forEach(item => results.push(...this.parseStructuredData(item)))
      return results
    }

    if (typeof data === 'object' && data !== null) {
      // Check for subscription-related structured data
      if (data['@type'] === 'Product' || data['@type'] === 'Service') {
        if (data.price) {
          results.push({
            type: 'structured_price',
            amount: parseFloat(data.price),
            currency: data.priceCurrency || 'USD',
            confidence: 0.9,
            source: 'structured_data'
          })
        }
        
        if (data.name) {
          results.push({
            type: 'structured_name',
            name: data.name,
            confidence: 0.8,
            source: 'structured_data'
          })
        }
      }

      // Check for organization data
      if (data['@type'] === 'Organization') {
        if (data.name) {
          results.push({
            type: 'organization',
            name: data.name,
            confidence: 0.7,
            source: 'structured_data'
          })
        }
      }

      // Recursively check nested objects
      Object.values(data).forEach(value => {
        if (typeof value === 'object' && value !== null) {
          results.push(...this.parseStructuredData(value))
        }
      })
    }

    return results
  }

  // Parse microdata
  parseMicrodata(element) {
    const results = []
    
    // Look for price information
    const priceElement = element.querySelector('[itemprop="price"]')
    if (priceElement) {
      const amount = parseFloat(priceElement.textContent.replace(/[^\d.]/g, ''))
      if (amount > 0) {
        results.push({
          type: 'microdata_price',
          amount,
          currency: 'USD',
          confidence: 0.8,
          source: 'microdata'
        })
      }
    }

    // Look for organization name
    const nameElement = element.querySelector('[itemprop="name"]')
    if (nameElement) {
      results.push({
        type: 'microdata_name',
        name: nameElement.textContent.trim(),
        confidence: 0.7,
        source: 'microdata'
      })
    }

    return results
  }

  // Parse Open Graph data
  parseOpenGraph() {
    const results = []
    
    // Check for site name
    const siteName = this.getMetaContent('og:site_name')
    if (siteName) {
      results.push({
        type: 'og_site_name',
        name: siteName,
        confidence: 0.7,
        source: 'open_graph'
      })
    }

    // Check for title
    const ogTitle = this.getMetaContent('og:title')
    if (ogTitle) {
      results.push({
        type: 'og_title',
        title: ogTitle,
        confidence: 0.6,
        source: 'open_graph'
      })
    }

    return results
  }

  // Scan forms for subscription information
  scanForms() {
    const results = []
    const forms = document.querySelectorAll('form')
    
    forms.forEach(form => {
      // Check for billing-related form fields
      const billingFields = form.querySelectorAll('input[name*="billing"], input[name*="card"], input[name*="payment"]')
      if (billingFields.length > 0) {
        results.push({
          type: 'billing_form',
          confidence: 0.8,
          source: 'form'
        })
      }

      // Check for subscription-related form fields
      const subscriptionFields = form.querySelectorAll('input[name*="subscription"], input[name*="plan"], input[name*="tier"]')
      if (subscriptionFields.length > 0) {
        results.push({
          type: 'subscription_form',
          confidence: 0.8,
          source: 'form'
        })
      }

      // Check for pricing information in form
      const priceFields = form.querySelectorAll('input[value*="$"], input[placeholder*="$"]')
      priceFields.forEach(field => {
        const priceMatch = field.value?.match(/\$(\d+(?:\.\d{2})?)/) || 
                          field.placeholder?.match(/\$(\d+(?:\.\d{2})?)/)
        if (priceMatch) {
          results.push({
            type: 'form_price',
            amount: parseFloat(priceMatch[1]),
            currency: 'USD',
            confidence: 0.7,
            source: 'form'
          })
        }
      })
    })

    return results
  }

  // Scan URL for subscription information
  scanURL() {
    const results = []
    const url = window.location.href.toLowerCase()
    
    // Check for known subscription domains
    Object.entries(this.merchants).forEach(([merchantName, merchantData]) => {
      if (url.includes(merchantData.patterns[0].toLowerCase())) {
        results.push({
          type: 'url_merchant',
          merchantName,
          category: merchantData.category,
          confidence: 0.9,
          source: 'url'
        })
      }
    })

    // Check for subscription-related URL patterns
    const urlPatterns = [
      { pattern: /billing|subscription|account|pricing|plans/, confidence: 0.7 },
      { pattern: /checkout|payment|subscribe|signup/, confidence: 0.8 },
      { pattern: /trial|free/, confidence: 0.6 }
    ]

    urlPatterns.forEach(pattern => {
      if (pattern.pattern.test(url)) {
        results.push({
          type: 'url_pattern',
          pattern: pattern.pattern.source,
          confidence: pattern.confidence,
          source: 'url'
        })
      }
    })

    return results
  }

  // Score and rank results
  scoreResults(results, pageText) {
    const scoredResults = []
    const context = this.buildContext(pageText)
    
    results.forEach(result => {
      let score = result.confidence
      
      // Boost score based on context
      if (context.hasSubscriptionKeywords) score += 0.1
      if (context.hasPricingInfo) score += 0.1
      if (context.hasBillingInfo) score += 0.1
      
      // Boost score based on page type
      const pageTypeBoost = {
        'billing': 0.2,
        'pricing': 0.2,
        'signup': 0.15,
        'dashboard': 0.1,
        'general': 0
      }
      score += pageTypeBoost[this.detectPageType()] || 0
      
      // Boost score for multiple confirmations
      const similarResults = results.filter(r => 
        r.type === result.type && r.source !== result.source
      )
      if (similarResults.length > 0) score += 0.1
      
      scoredResults.push({
        ...result,
        confidence: Math.min(score, 1.0)
      })
    })

    return scoredResults.sort((a, b) => b.confidence - a.confidence)
  }

  // Build context from page text
  buildContext(text) {
    return {
      hasSubscriptionKeywords: this.patterns.subscriptionKeywords.some(k => k.pattern.test(text)),
      hasPricingInfo: this.patterns.prices.some(p => p.pattern.test(text)),
      hasBillingInfo: text.includes('billing') || text.includes('payment') || text.includes('renewal')
    }
  }

  // Calculate overall confidence
  calculateOverallConfidence(results) {
    if (results.length === 0) return 0
    
    const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0)
    const averageConfidence = totalConfidence / results.length
    
    // Boost confidence if we have multiple high-confidence results
    const highConfidenceCount = results.filter(r => r.confidence >= 0.8).length
    const boost = Math.min(highConfidenceCount * 0.05, 0.2)
    
    return Math.min(averageConfidence + boost, 1.0)
  }

  // Generate subscription object from results
  generateSubscription(results) {
    const subscription = {
      merchantName: null,
      amount: null,
      currency: 'USD',
      cycle: null,
      category: null,
      confidence: 0,
      source: 'chrome_extension',
      metadata: {}
    }

    // Extract merchant name
    const merchantResult = results.find(r => r.type === 'merchant' || r.type === 'organization')
    if (merchantResult) {
      subscription.merchantName = merchantResult.merchantName || merchantResult.name
      subscription.category = merchantResult.category
    }

    // Extract price
    const priceResult = results.find(r => r.type === 'price' || r.type === 'structured_price')
    if (priceResult) {
      subscription.amount = priceResult.amount
      subscription.currency = priceResult.currency
    }

    // Extract billing cycle
    const cycleResult = results.find(r => r.type === 'billing_cycle')
    if (cycleResult) {
      subscription.cycle = cycleResult.value
    }

    // Calculate overall confidence
    subscription.confidence = this.calculateOverallConfidence(results)

    // Add metadata
    subscription.metadata = {
      pageType: this.detectPageType(),
      url: window.location.href,
      timestamp: new Date().toISOString(),
      resultsCount: results.length
    }

    return subscription
  }
}

// Export for use in other extension files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedSubscriptionDetector
} else {
  window.EnhancedSubscriptionDetector = EnhancedSubscriptionDetector
}
