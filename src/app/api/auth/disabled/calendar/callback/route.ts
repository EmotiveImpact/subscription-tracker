import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { calendarService } from '@/lib/oauth'
import { hybridStorage } from '@/lib/hybrid-storage'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      console.error('Google Calendar OAuth error:', error)
      return NextResponse.redirect(new URL('/settings?error=calendar_oauth_failed', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?error=no_auth_code', request.url))
    }

    // Exchange code for token
    const token = await calendarService.exchangeCodeForToken(code)
    const userInfo = await calendarService.getUserInfo(token)

    // Update user settings with Calendar integration
    const currentSettings = await hybridStorage.getSettings()
    const updatedSettings = {
      ...currentSettings,
      integrations: {
        ...currentSettings.integrations,
        calendar: {
          connected: true,
          email: userInfo.email,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          expiresAt: token.expires_at,
        },
      },
    }

    await hybridStorage.updateSettings(updatedSettings)

    // Redirect back to settings with success message
    return NextResponse.redirect(new URL('/settings?success=calendar_connected', request.url))
  } catch (error) {
    console.error('Google Calendar OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?error=calendar_oauth_failed', request.url))
  }
}
