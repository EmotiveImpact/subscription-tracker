import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';

// Initialize Stripe only if secret key is available
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
}) : null;

export async function GET() {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return new NextResponse('Stripe is not configured', { status: 503 });
    }

    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await auth();
    const email = user?.sessionClaims?.email as string;
    
    if (!email) {
      return new NextResponse('User email not found', { status: 400 });
    }

    // Find existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return new NextResponse('Customer not found', { status: 404 });
    }

    const customer = customers.data[0];
    
    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1,
    });

    let subscription: Stripe.Subscription | null = null;
    if (subscriptions.data.length > 0) {
      subscription = subscriptions.data[0];
    }

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
        priceId: subscription.items.data[0]?.price.id,
      } : null,
    });
  } catch (error) {
    console.error('[STRIPE_CUSTOMER_GET_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return new NextResponse('Stripe is not configured', { status: 503 });
    }

    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await auth();
    const email = user?.sessionClaims?.email as string;
    const name = user?.sessionClaims?.name as string;
    
    if (!email) {
      return new NextResponse('User email not found', { status: 400 });
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      subscription: null,
    });
  } catch (error) {
    console.error('[STRIPE_CUSTOMER_CREATE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
