import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
  typescript: true,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return new NextResponse('Price ID is required', { status: 400 });
    }

    // Get or create customer
    const user = await auth();
    const email = user?.sessionClaims?.email as string;
    const name = user?.sessionClaims?.name as string;

    if (!email) {
      return new NextResponse('User email not found', { status: 400 });
    }

    // Check if customer exists
    let customerId: string;
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/settings?cancelled=true`,
      customer: customerId,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[BILLING_CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
