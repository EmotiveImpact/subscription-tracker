import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { subscriptionId, billingDate, merchantName, amount } = await req.json();

    if (!subscriptionId || !billingDate || !merchantName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // TODO: Get Google Calendar access token from database for this user
    const accessToken = 'mock_token';

    try {
      // TODO: Create calendar event using Google Calendar API
      const event = await createCalendarEvent(accessToken, {
        summary: `${merchantName} - Subscription Renewal`,
        description: `Subscription renewal for ${merchantName} - $${amount}`,
        start: {
          dateTime: new Date(billingDate).toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(new Date(billingDate).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      });

      // TODO: Store event ID in database linked to subscription
      console.log('Calendar event created:', event.id);

      return NextResponse.json({
        success: true,
        eventId: event.id,
        message: 'Calendar event created successfully',
      });
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create calendar event',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[CALENDAR_EVENTS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return new NextResponse('Event ID is required', { status: 400 });
    }

    // TODO: Get Google Calendar access token from database for this user
    const accessToken = 'mock_token';

    try {
      // TODO: Delete calendar event using Google Calendar API
      await deleteCalendarEvent(accessToken, eventId);

      // TODO: Remove event ID from database
      console.log('Calendar event deleted:', eventId);

      return NextResponse.json({
        success: true,
        message: 'Calendar event deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete calendar event',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[CALENDAR_EVENTS_DELETE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function createCalendarEvent(accessToken: string, eventData: any) {
  // TODO: Implement Google Calendar API call to create event
  console.log('Creating calendar event:', eventData);
  return {
    id: `event_${Date.now()}`,
    ...eventData,
  };
}

async function deleteCalendarEvent(accessToken: string, eventId: string) {
  // TODO: Implement Google Calendar API call to delete event
  console.log('Deleting calendar event:', eventId);
}
