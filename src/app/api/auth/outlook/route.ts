import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { outlookService } from '@/lib/oauth'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate OAuth authorization URL
    const authUrl = outlookService.generateAuthUrl(userId)
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Outlook OAuth initiation error:', error)
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  }
}
