import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
  typescript: true,
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new NextResponse('No stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    console.error('[STRIPE_WEBHOOK_ERROR]', error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', checkoutSession.id);
        
        if (checkoutSession.metadata?.userId) {
          // TODO: Update user's plan in database
          console.log('User plan upgraded:', checkoutSession.metadata.userId);
        }
        break;

      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscriptionUpdated.id);
        
        if (subscriptionUpdated.metadata?.userId) {
          // TODO: Update user's plan status in database
          console.log('User subscription updated:', subscriptionUpdated.metadata.userId);
        }
        break;

      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscriptionDeleted.id);
        
        if (subscriptionDeleted.metadata?.userId) {
          // TODO: Downgrade user's plan in database
          console.log('User subscription cancelled:', subscriptionDeleted.metadata.userId);
        }
        break;

      case 'invoice.payment_succeeded':
        const invoiceSucceeded = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoiceSucceeded.id);
        
        if (invoiceSucceeded.metadata?.userId) {
          // TODO: Update user's billing status
          console.log('User payment succeeded:', invoiceSucceeded.metadata.userId);
        }
        break;

      case 'invoice.payment_failed':
        const invoiceFailed = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoiceFailed.id);
        
        if (invoiceFailed.metadata?.userId) {
          // TODO: Update user's billing status and send notification
          console.log('User payment failed:', invoiceFailed.metadata.userId);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK_PROCESSING_ERROR]', error);
    return new NextResponse('Webhook processing failed', { status: 500 });
  }
}
