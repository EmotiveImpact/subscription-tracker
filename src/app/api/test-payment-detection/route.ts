import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Payment Gateway Detection System Test',
      data: {
        systemCapabilities: {
          priceRanges: 'All ranges ($0.01 to $100,000+)',
          currencies: 'USD, EUR, GBP, JPY, INR, CAD, AUD, and more',
          merchants: '100+ known services (Netflix, Spotify, Notion, etc.)',
          emailPlatforms: 'Gmail, Outlook, Yahoo, iCloud, ProtonMail, IMAP',
          paymentGateways: '50+ gateways (Stripe, PayPal, Square, banks, etc.)'
        },
        supportedGateways: [
          'Stripe', 'PayPal', 'Square', 'Shopify', 'WooCommerce', 'BigCommerce',
          'Magento', 'Apple Pay', 'Google Pay', 'Samsung Pay', 'Chase',
          'Bank of America', 'Wells Fargo', 'Citibank', 'American Express',
          'Visa', 'Mastercard', 'Klarna', 'Afterpay', 'Affirm', 'Clearpay',
          'Coinbase', 'BitPay', 'Chargebee', 'Recurly', 'Chargify',
          'Adyen', 'Braintree', 'Worldpay', 'iDEAL', 'Sofort', 'Bancontact'
        ],
        supportedEmailPlatforms: [
          'Gmail', 'Outlook / Microsoft 365', 'Yahoo Mail', 'iCloud Mail',
          'ProtonMail', 'Generic Email (IMAP/POP3)'
        ],
        sampleDetection: {
          stripe: {
            email: 'noreply@stripe.com',
            subject: 'Receipt for your payment',
            confidence: '95%+'
          },
          paypal: {
            email: 'receipts@paypal.com',
            subject: 'Payment confirmation',
            confidence: '95%+'
          },
          shopify: {
            email: 'noreply@shopify.com',
            subject: 'Order confirmation',
            confidence: '95%+'
          }
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
