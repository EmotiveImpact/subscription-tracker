import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ discoveryId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { discoveryId } = await params;
    const { action } = await req.json();

    if (!action || !['confirm', 'ignore', 'convert'].includes(action)) {
      return new NextResponse('Invalid action', { status: 400 });
    }

    // TODO: Get discovery from database and verify ownership
    console.log(`Discovery ${discoveryId} action: ${action} by user ${userId}`);

    let result;
    switch (action) {
      case 'confirm':
        // TODO: Update discovery status to confirmed
        result = { status: 'confirmed', message: 'Discovery confirmed' };
        break;
      
      case 'ignore':
        // TODO: Update discovery status to ignored
        result = { status: 'ignored', message: 'Discovery ignored' };
        break;
      
      case 'convert':
        // TODO: Convert discovery to subscription and mark as converted
        result = { status: 'converted', message: 'Discovery converted to subscription' };
        break;
      
      default:
        return new NextResponse('Invalid action', { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[DISCOVERY_ACTION_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
