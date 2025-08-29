import { headers } from 'next/headers'
import Stripe from 'stripe'
import { env } from '@/lib/env'
import { hybridStorage } from '@/lib/hybrid-storage'

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
})

// Webhook event types we handle
export const WEBHOOK_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END: 'customer.subscription.trial_will_end',
} as const

// Webhook handler interface
export interface WebhookHandler {
  event: string
  handler: (event: Stripe.Event) => Promise<void>
}

// Webhook handlers
export class StripeWebhookService {
  // Verify webhook signature
  static verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      )
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error}`)
    }
  }

  // Handle subscription created
  static async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    
    try {
      // Get customer details
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return

      const customerEmail = customer.email
      if (!customerEmail) return

      // Update user plan to 'pro'
      // Note: In a real app, you'd need to map Stripe customer to your user
      console.log(`Subscription created for customer: ${customerEmail}`)
      
      // Here you would update the user's plan in your database
      // await updateUserPlan(customerEmail, 'pro')
      
    } catch (error) {
      console.error('Error handling subscription created:', error)
    }
  }

  // Handle subscription updated
  static async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return

      const customerEmail = customer.email
      if (!customerEmail) return

      // Check subscription status
      if (subscription.status === 'active') {
        console.log(`Subscription active for customer: ${customerEmail}`)
        // await updateUserPlan(customerEmail, 'pro')
      } else if (subscription.status === 'canceled') {
        console.log(`Subscription canceled for customer: ${customerEmail}`)
        // await updateUserPlan(customerEmail, 'free')
      } else if (subscription.status === 'past_due') {
        console.log(`Subscription past due for customer: ${customerEmail}`)
        // await updateUserPlan(customerEmail, 'free')
      }
      
    } catch (error) {
      console.error('Error handling subscription updated:', error)
    }
  }

  // Handle subscription deleted
  static async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return

      const customerEmail = customer.email
      if (!customerEmail) return

      console.log(`Subscription deleted for customer: ${customerEmail}`)
      // await updateUserPlan(customerEmail, 'free')
      
    } catch (error) {
      console.error('Error handling subscription deleted:', error)
    }
  }

  // Handle payment succeeded
  static async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return

      const customerEmail = customer.email
      if (!customerEmail) return

      console.log(`Payment succeeded for customer: ${customerEmail}, amount: ${invoice.amount_paid}`)
      
      // Here you could trigger additional actions like:
      // - Send confirmation email
      // - Update billing history
      // - Trigger analytics events
      
    } catch (error) {
      console.error('Error handling payment succeeded:', error)
    }
  }

  // Handle payment failed
  static async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return

      const customerEmail = customer.email
      if (!customerEmail) return

      console.log(`Payment failed for customer: ${customerEmail}, amount: ${invoice.amount_due}`)
      
      // Here you could trigger additional actions like:
      // - Send payment failure notification
      // - Update subscription status
      // - Trigger dunning management
      
    } catch (error) {
      console.error('Error handling payment failed:', error)
    }
  }

  // Handle trial ending soon
  static async handleTrialEndingSoon(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return

      const customerEmail = customer.email
      if (!customerEmail) return

      console.log(`Trial ending soon for customer: ${customerEmail}`)
      
      // Here you could trigger additional actions like:
      // - Send trial ending reminder
      // - Show upgrade prompts in the app
      
    } catch (error) {
      console.error('Error handling trial ending soon:', error)
    }
  }



  // Main webhook handler
  static async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
          await this.handleSubscriptionCreated(event)
          break
        case WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
          await this.handleSubscriptionUpdated(event)
          break
        case WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
          await this.handleSubscriptionDeleted(event)
          break
        case WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
          await this.handlePaymentSucceeded(event)
          break
        case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
          await this.handlePaymentFailed(event)
          break
        case WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END:
          await this.handleTrialEndingSoon(event)
          break

        default:
          console.log(`Unhandled webhook event: ${event.type}`)
      }
    } catch (error) {
      console.error(`Error handling webhook event ${event.type}:`, error)
      throw error
    }
  }

  // Get webhook event types we handle
  static getHandledEvents(): string[] {
    return Object.values(WEBHOOK_EVENTS)
  }
}

// Export webhook handlers for easy access
export const webhookHandlers: WebhookHandler[] = [
  {
    event: WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED,
    handler: StripeWebhookService.handleSubscriptionCreated,
  },
  {
    event: WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED,
    handler: StripeWebhookService.handleSubscriptionUpdated,
  },
  {
    event: WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED,
    handler: StripeWebhookService.handleSubscriptionDeleted,
  },
  {
    event: WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED,
    handler: StripeWebhookService.handlePaymentSucceeded,
  },
  {
    event: WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED,
    handler: StripeWebhookService.handlePaymentFailed,
  },
  {
    event: WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END,
    handler: StripeWebhookService.handleTrialEndingSoon,
  },

]
