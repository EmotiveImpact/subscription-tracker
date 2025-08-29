import { hybridStorage } from './hybrid-storage'

export interface PaymentGatewayData {
  gateway: string
  type: 'receipt' | 'invoice' | 'subscription_update' | 'payment_failed' | 'trial_ending' | 'refund' | 'dispute'
  merchantName: string
  amount: number
  currency: string
  subscriptionId?: string
  customerId?: string
  billingCycle?: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'one-time' | 'biannual' | 'per-user'
  status: 'success' | 'failed' | 'pending' | 'refunded' | 'disputed'
  date: Date
  confidence: number
  rawEmail: any
  metadata: {
    gatewayEventId?: string
    invoiceId?: string
    receiptUrl?: string
    customerEmail?: string
    transactionId?: string
    paymentMethod?: string
  }
}

export class PaymentGatewayDetector {
  private static readonly PAYMENT_GATEWAYS = {
    // Major Payment Processors
    Stripe: {
      patterns: [
        /noreply@stripe\.com/i,
        /receipts@stripe\.com/i,
        /billing@stripe\.com/i,
        /support@stripe\.com/i,
        /stripe\.com/i
      ],
      subjects: [
        /receipt.*stripe/i,
        /stripe.*receipt/i,
        /payment.*receipt/i,
        /invoice.*stripe/i
      ],
      confidence: 0.95
    },

    PayPal: {
      patterns: [
        /noreply@paypal\.com/i,
        /receipts@paypal\.com/i,
        /billing@paypal\.com/i,
        /paypal\.com/i
      ],
      subjects: [
        /paypal.*receipt/i,
        /receipt.*paypal/i,
        /payment.*confirmation/i,
        /paypal.*payment/i
      ],
      confidence: 0.95
    },

    Square: {
      patterns: [
        /noreply@square\.com/i,
        /receipts@square\.com/i,
        /square\.com/i
      ],
      subjects: [
        /square.*receipt/i,
        /receipt.*square/i,
        /payment.*receipt/i
      ],
      confidence: 0.95
    },

    Shopify: {
      patterns: [
        /noreply@shopify\.com/i,
        /orders@shopify\.com/i,
        /shopify\.com/i
      ],
      subjects: [
        /order.*confirmation/i,
        /shopify.*order/i,
        /payment.*confirmation/i
      ],
      confidence: 0.95
    },

    WooCommerce: {
      patterns: [
        /noreply@.*\.com/i, // Generic but common
        /orders@.*\.com/i
      ],
      subjects: [
        /order.*confirmation/i,
        /woocommerce.*order/i,
        /payment.*received/i
      ],
      confidence: 0.85
    },

    'Square Online': {
      patterns: [
        /noreply@square\.com/i,
        /square\.com/i
      ],
      subjects: [
        /order.*confirmation/i,
        /square.*online/i,
        /payment.*received/i
      ],
      confidence: 0.9
    },

    BigCommerce: {
      patterns: [
        /noreply@bigcommerce\.com/i,
        /orders@bigcommerce\.com/i,
        /bigcommerce\.com/i
      ],
      subjects: [
        /order.*confirmation/i,
        /bigcommerce.*order/i,
        /payment.*confirmation/i
      ],
      confidence: 0.9
    },

    Magento: {
      patterns: [
        /noreply@.*\.com/i,
        /orders@.*\.com/i
      ],
      subjects: [
        /order.*confirmation/i,
        /magento.*order/i,
        /payment.*received/i
      ],
      confidence: 0.8
    },

    // Digital Payment Platforms
    'Apple Pay': {
      patterns: [
        /noreply@apple\.com/i,
        /apple\.com/i
      ],
      subjects: [
        /apple.*pay/i,
        /payment.*confirmation/i,
        /receipt.*apple/i
      ],
      confidence: 0.9
    },

    'Google Pay': {
      patterns: [
        /noreply@google\.com/i,
        /payments@google\.com/i,
        /google\.com/i
      ],
      subjects: [
        /google.*pay/i,
        /payment.*confirmation/i,
        /receipt.*google/i
      ],
      confidence: 0.9
    },

    'Samsung Pay': {
      patterns: [
        /noreply@samsung\.com/i,
        /payments@samsung\.com/i,
        /samsung\.com/i
      ],
      subjects: [
        /samsung.*pay/i,
        /payment.*confirmation/i,
        /receipt.*samsung/i
      ],
      confidence: 0.85
    },

    // Banking & Financial Services
    Chase: {
      patterns: [
        /noreply@chase\.com/i,
        /alerts@chase\.com/i,
        /chase\.com/i
      ],
      subjects: [
        /chase.*payment/i,
        /payment.*confirmation/i,
        /transaction.*alert/i
      ],
      confidence: 0.9
    },

    'Bank of America': {
      patterns: [
        /noreply@bankofamerica\.com/i,
        /alerts@bankofamerica\.com/i,
        /bankofamerica\.com/i
      ],
      subjects: [
        /boa.*payment/i,
        /payment.*confirmation/i,
        /transaction.*alert/i
      ],
      confidence: 0.9
    },

    'Wells Fargo': {
      patterns: [
        /noreply@wellsfargo\.com/i,
        /alerts@wellsfargo\.com/i,
        /wellsfargo\.com/i
      ],
      subjects: [
        /wells.*fargo.*payment/i,
        /payment.*confirmation/i,
        /transaction.*alert/i
      ],
      confidence: 0.9
    },

    Citibank: {
      patterns: [
        /noreply@citibank\.com/i,
        /alerts@citibank\.com/i,
        /citibank\.com/i
      ],
      subjects: [
        /citi.*payment/i,
        /payment.*confirmation/i,
        /transaction.*alert/i
      ],
      confidence: 0.9
    },

    // Credit Card Companies
    'American Express': {
      patterns: [
        /noreply@americanexpress\.com/i,
        /alerts@americanexpress\.com/i,
        /americanexpress\.com/i
      ],
      subjects: [
        /amex.*payment/i,
        /payment.*confirmation/i,
        /transaction.*alert/i
      ],
      confidence: 0.9
    },

    Visa: {
      patterns: [
        /noreply@visa\.com/i,
        /alerts@visa\.com/i,
        /visa\.com/i
      ],
      subjects: [
        /visa.*payment/i,
        /payment.*confirmation/i,
        /transaction.*alert/i
      ],
      confidence: 0.85
    },

    Mastercard: {
      patterns: [
        /noreply@mastercard\.com/i,
        /alerts@mastercard\.com/i,
        /mastercard\.com/i
      ],
      subjects: [
        /mastercard.*payment/i,
        /payment.*confirmation/i,
        /transaction.*alert/i
      ],
      confidence: 0.85
    },

    // International Payment Gateways
    Klarna: {
      patterns: [
        /noreply@klarna\.com/i,
        /receipts@klarna\.com/i,
        /klarna\.com/i
      ],
      subjects: [
        /klarna.*payment/i,
        /payment.*confirmation/i,
        /receipt.*klarna/i
      ],
      confidence: 0.9
    },

    Afterpay: {
      patterns: [
        /noreply@afterpay\.com/i,
        /receipts@afterpay\.com/i,
        /afterpay\.com/i
      ],
      subjects: [
        /afterpay.*payment/i,
        /payment.*confirmation/i,
        /receipt.*afterpay/i
      ],
      confidence: 0.9
    },

    Affirm: {
      patterns: [
        /noreply@affirm\.com/i,
        /receipts@affirm\.com/i,
        /affirm\.com/i
      ],
      subjects: [
        /affirm.*payment/i,
        /payment.*confirmation/i,
        /receipt.*affirm/i
      ],
      confidence: 0.9
    },

    Clearpay: {
      patterns: [
        /noreply@clearpay\.com/i,
        /receipts@clearpay\.com/i,
        /clearpay\.com/i
      ],
      subjects: [
        /clearpay.*payment/i,
        /payment.*confirmation/i,
        /receipt.*clearpay/i
      ],
      confidence: 0.9
    },

    // Cryptocurrency Payment Processors
    Coinbase: {
      patterns: [
        /noreply@coinbase\.com/i,
        /receipts@coinbase\.com/i,
        /coinbase\.com/i
      ],
      subjects: [
        /coinbase.*payment/i,
        /payment.*confirmation/i,
        /receipt.*coinbase/i
      ],
      confidence: 0.9
    },

    BitPay: {
      patterns: [
        /noreply@bitpay\.com/i,
        /receipts@bitpay\.com/i,
        /bitpay\.com/i
      ],
      subjects: [
        /bitpay.*payment/i,
        /payment.*confirmation/i,
        /receipt.*bitpay/i
      ],
      confidence: 0.9
    },

    // Subscription Management Platforms
    Chargebee: {
      patterns: [
        /noreply@chargebee\.com/i,
        /receipts@chargebee\.com/i,
        /chargebee\.com/i
      ],
      subjects: [
        /chargebee.*invoice/i,
        /invoice.*chargebee/i,
        /subscription.*updated/i
      ],
      confidence: 0.9
    },

    Recurly: {
      patterns: [
        /noreply@recurly\.com/i,
        /receipts@recurly\.com/i,
        /recurly\.com/i
      ],
      subjects: [
        /recurly.*invoice/i,
        /invoice.*recurly/i,
        /subscription.*updated/i
      ],
      confidence: 0.9
    },

    Chargify: {
      patterns: [
        /noreply@chargify\.com/i,
        /receipts@chargify\.com/i,
        /chargify\.com/i
      ],
      subjects: [
        /chargify.*invoice/i,
        /invoice.*chargify/i,
        /subscription.*updated/i
      ],
      confidence: 0.9
    },

    // Enterprise Payment Solutions
    Adyen: {
      patterns: [
        /noreply@adyen\.com/i,
        /receipts@adyen\.com/i,
        /adyen\.com/i
      ],
      subjects: [
        /adyen.*payment/i,
        /payment.*confirmation/i,
        /receipt.*adyen/i
      ],
      confidence: 0.9
    },

    Braintree: {
      patterns: [
        /noreply@braintree\.com/i,
        /receipts@braintree\.com/i,
        /braintree\.com/i
      ],
      subjects: [
        /braintree.*payment/i,
        /payment.*confirmation/i,
        /receipt.*braintree/i
      ],
      confidence: 0.9
    },

    Worldpay: {
      patterns: [
        /noreply@worldpay\.com/i,
        /receipts@worldpay\.com/i,
        /worldpay\.com/i
      ],
      subjects: [
        /worldpay.*payment/i,
        /payment.*confirmation/i,
        /receipt.*worldpay/i
      ],
      confidence: 0.9
    },

    // Regional Payment Gateways
    iDEAL: {
      patterns: [
        /noreply@ideal\.nl/i,
        /ideal\.nl/i
      ],
      subjects: [
        /ideal.*payment/i,
        /payment.*confirmation/i,
        /receipt.*ideal/i
      ],
      confidence: 0.85
    },

    Sofort: {
      patterns: [
        /noreply@sofort\.com/i,
        /sofort\.com/i
      ],
      subjects: [
        /sofort.*payment/i,
        /payment.*confirmation/i,
        /receipt.*sofort/i
      ],
      confidence: 0.85
    },

    Bancontact: {
      patterns: [
        /noreply@bancontact\.be/i,
        /bancontact\.be/i
      ],
      subjects: [
        /bancontact.*payment/i,
        /payment.*confirmation/i,
        /receipt.*bancontact/i
      ],
      confidence: 0.85
    },

    // Generic Payment Patterns (catch-all)
    'Generic Payment': {
      patterns: [
        /receipts?@/i,
        /billing@/i,
        /payments?@/i,
        /orders?@/i
      ],
      subjects: [
        /payment.*confirmation/i,
        /order.*confirmation/i,
        /receipt.*received/i,
        /invoice.*sent/i,
        /subscription.*updated/i,
        /billing.*statement/i
      ],
      confidence: 0.7
    }
  }

  /**
   * Detect which payment gateway an email is from
   */
  static detectPaymentGateway(email: any): { gateway: string; confidence: number } | null {
    const from = email.from?.toLowerCase() || ''
    const subject = email.subject?.toLowerCase() || ''
    const body = email.body?.toLowerCase() || ''

    let bestMatch: { gateway: string; confidence: number } | null = null
    let highestConfidence = 0

    for (const [gatewayName, gateway] of Object.entries(this.PAYMENT_GATEWAYS)) {
      let confidence = 0

      // Check sender patterns
      const senderMatch = gateway.patterns.some(pattern => pattern.test(from))
      if (senderMatch) {
        confidence += 0.6
      }

      // Check subject patterns
      const subjectMatch = gateway.subjects.some(pattern => 
        pattern.test(subject) || pattern.test(body)
      )
      if (subjectMatch) {
        confidence += 0.3
      }

      // Check for gateway-specific keywords in content
      const contentMatch = this.checkGatewayContent(gatewayName, body)
      if (contentMatch) {
        confidence += 0.1
      }

      // Apply base confidence multiplier
      confidence *= gateway.confidence

      if (confidence > highestConfidence && confidence > 0.5) {
        highestConfidence = confidence
        bestMatch = { gateway: gatewayName, confidence }
      }
    }

    return bestMatch
  }

  /**
   * Check email content for gateway-specific indicators
   */
  private static checkGatewayContent(gatewayName: string, body: string): boolean {
    const gatewayKeywords: Record<string, string[]> = {
      Stripe: ['stripe', 'stripe.com', 'stripe receipt'],
      PayPal: ['paypal', 'paypal.com', 'paypal payment'],
      Square: ['square', 'square.com', 'square receipt'],
      Shopify: ['shopify', 'shopify.com', 'shopify order'],
      'Apple Pay': ['apple pay', 'apple payment', 'apple receipt'],
      'Google Pay': ['google pay', 'google payment', 'google receipt'],
      Chase: ['chase', 'chase.com', 'chase payment'],
      'Bank of America': ['bank of america', 'boa', 'boa payment'],
      Klarna: ['klarna', 'klarna.com', 'klarna payment'],
      Afterpay: ['afterpay', 'afterpay.com', 'afterpay payment']
    }

    const keywords = gatewayKeywords[gatewayName] || []
    return keywords.some(keyword => body.includes(keyword.toLowerCase()))
  }

  /**
   * Check if an email is a payment receipt from any gateway
   */
  static isPaymentReceipt(email: any): boolean {
    const gateway = this.detectPaymentGateway(email)
    return gateway !== null && gateway.confidence > 0.6
  }

  /**
   * Get all supported payment gateways
   */
  static getSupportedGateways(): string[] {
    return Object.keys(this.PAYMENT_GATEWAYS)
  }

  /**
   * Get gateway statistics
   */
  static getGatewayStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    for (const gateway of Object.keys(this.PAYMENT_GATEWAYS)) {
      stats[gateway] = 0
    }
    return stats
  }
}

// Export convenience functions
export const paymentGatewayDetector = {
  detect: PaymentGatewayDetector.detectPaymentGateway,
  isReceipt: PaymentGatewayDetector.isPaymentReceipt,
  getSupported: PaymentGatewayDetector.getSupportedGateways,
  getStats: PaymentGatewayDetector.getGatewayStats
}
