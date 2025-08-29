import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
  typescript: true,
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { customerId } = await params;
    const updates = await req.json();

    // Validate customer ownership
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      return new NextResponse('Customer not found', { status: 404 });
    }

    // TODO: Verify customer belongs to user from database mapping

    // Update customer
    const updatedCustomer = await stripe.customers.update(customerId, updates);

    return NextResponse.json({
      id: updatedCustomer.id,
      email: updatedCustomer.email,
      name: updatedCustomer.name,
      subscription: null, // TODO: Get subscription data
    });
  } catch (error) {
    console.error('[STRIPE_CUSTOMER_UPDATE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { customerId } = await params;

    // Validate customer ownership
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      return new NextResponse('Customer not found', { status: 404 });
    }

    // TODO: Verify customer belongs to user from database mapping

    // Delete customer (this will also cancel any active subscriptions)
    await stripe.customers.del(customerId);

    // TODO: Remove customer mapping from database

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[STRIPE_CUSTOMER_DELETE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
