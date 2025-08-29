import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// TODO: Replace with database queries
const mockDiscoveries = [
  {
    id: '1',
    userId: 'user_123',
    source: 'gmail' as const,
    merchantName: 'Netflix',
    amount: 15.99,
    currency: 'USD',
    cycle: 'monthly' as const,
    confidence: 'high' as const,
    status: 'pending' as const,
    rawData: { emailSubject: 'Netflix subscription renewal' },
    metadata: {
      emailId: 'email_123',
      detectedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'user_123',
    source: 'gmail' as const,
    merchantName: 'Spotify',
    amount: 9.99,
    currency: 'USD',
    cycle: 'monthly' as const,
    confidence: 'medium' as const,
    status: 'pending' as const,
    rawData: { emailSubject: 'Your Spotify Premium subscription' },
    metadata: {
      emailId: 'email_456',
      detectedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // TODO: Filter discoveries by userId from database
    const userDiscoveries = mockDiscoveries.filter(d => d.userId === userId);

    return NextResponse.json(userDiscoveries);
  } catch (error) {
    console.error('[DISCOVERIES_GET_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const discoveryData = await req.json();
    
    // TODO: Validate discovery data
    const newDiscovery = {
      id: Date.now().toString(),
      userId,
      ...discoveryData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // TODO: Save to database
    console.log('New discovery created:', newDiscovery);

    return NextResponse.json(newDiscovery, { status: 201 });
  } catch (error) {
    console.error('[DISCOVERIES_CREATE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
