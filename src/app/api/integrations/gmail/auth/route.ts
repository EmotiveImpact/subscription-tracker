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
      // Redirect to Google OAuth
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
      googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/auth`);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.readonly');
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
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/auth`,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const tokens = await tokenResponse.json();

        // TODO: Store tokens securely in database
        console.log('Gmail tokens received for user:', userId);

        // TODO: Set up Gmail watch for real-time notifications
        await setupGmailWatch(tokens.access_token);

        // Redirect back to settings with success
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail=success`);
      } catch (error) {
        console.error('Gmail token exchange error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail=error`);
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail=error`);
  } catch (error) {
    console.error('[GMAIL_AUTH_ERROR]', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail=error`);
  }
}

async function setupGmailWatch(accessToken: string) {
  try {
    // TODO: Implement Gmail watch setup
    // This would set up real-time notifications for new emails
    console.log('Setting up Gmail watch with access token');
  } catch (error) {
    console.error('Failed to setup Gmail watch:', error);
  }
}
