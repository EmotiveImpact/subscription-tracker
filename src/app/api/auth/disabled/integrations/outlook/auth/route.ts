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
      // Redirect to Microsoft OAuth
      const msAuthUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      msAuthUrl.searchParams.set('client_id', process.env.MS_CLIENT_ID || '');
      msAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/outlook/auth`);
      msAuthUrl.searchParams.set('response_type', 'code');
      msAuthUrl.searchParams.set('scope', 'offline_access Mail.Read');
      msAuthUrl.searchParams.set('state', userId);

      return NextResponse.redirect(msAuthUrl.toString());
    }

    // Exchange code for tokens
    if (code && state === userId) {
      try {
        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: process.env.MS_CLIENT_ID || '',
            client_secret: process.env.MS_CLIENT_SECRET || '',
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/outlook/auth`,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const tokens = await tokenResponse.json();

        // TODO: Store tokens securely in database
        console.log('Outlook tokens received for user:', userId);

        // TODO: Set up Outlook delta sync for real-time notifications
        await setupOutlookDeltaSync(tokens.access_token);

        // Redirect back to settings with success
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?outlook=success`);
      } catch (error) {
        console.error('Outlook token exchange error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?outlook=error`);
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?outlook=error`);
  } catch (error) {
    console.error('[OUTLOOK_AUTH_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function setupOutlookDeltaSync(accessToken: string) {
  try {
    // TODO: Implement Outlook delta sync setup
    // This would set up delta sync to track changes in emails
    console.log('Setting up Outlook delta sync with access token');
  } catch (error) {
    console.error('Failed to setup Outlook delta sync:', error);
  }
}
