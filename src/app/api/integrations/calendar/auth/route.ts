import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      // Redirect to Google OAuth for Calendar
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
      googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/auth`);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events');
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('state', userId);

      return NextResponse.redirect(googleAuthUrl.toString());
    }

    // Exchange code for tokens
    if (code && state === userId) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/auth`,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const tokens = await tokenResponse.json();

        // TODO: Store tokens securely in database
        console.log('Google Calendar tokens received for user:', userId);

        // TODO: Set up calendar sync for subscription events
        await setupCalendarSync(tokens.access_token);

        // Redirect back to settings with success
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=success`);
      } catch (error) {
        console.error('Google Calendar token exchange error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`);
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`);
  } catch (error) {
    console.error('[CALENDAR_AUTH_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function setupCalendarSync(accessToken: string) {
  try {
    // TODO: Implement calendar sync setup
    // This would sync subscription billing dates to Google Calendar
    console.log('Setting up Google Calendar sync with access token');
  } catch (error) {
    console.error('Failed to setup Google Calendar sync:', error);
  }
}
