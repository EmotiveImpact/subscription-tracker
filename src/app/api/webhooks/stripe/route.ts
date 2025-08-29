import { NextRequest, NextResponse } from 'next/server'
import { StripeWebhookService } from '@/lib/stripe-webhooks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = StripeWebhookService.verifyWebhookSignature(body, signature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the webhook event
    await StripeWebhookService.handleWebhook(event)

    // Return success
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET requests (for webhook testing)
export async function GET() {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is active',
    handledEvents: StripeWebhookService.getHandledEvents(),
  })
}
