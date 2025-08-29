import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { gmailProcessor } from '@/lib/gmail-processor'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { 
      maxEmails = 1000,
      dateRange,
      searchType = 'all',
      includeRead = false
    } = await req.json()

    // TODO: Get Gmail access token from database for this user
    const accessToken = 'mock_token' // This should come from user's stored tokens

    if (accessToken === 'mock_token') {
      return NextResponse.json({
        success: false,
        error: 'Gmail not connected. Please connect your Gmail account first.',
        code: 'GMAIL_NOT_CONNECTED'
      }, { status: 400 })
    }

    console.log(`Processing historical emails for user ${userId}`)
    console.log(`Options: maxEmails=${maxEmails}, searchType=${searchType}, includeRead=${includeRead}`)

    // Process historical emails
    const result = await gmailProcessor.processHistoricalStripeEmails(accessToken, {
      maxEmails,
      dateRange: dateRange ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      } : undefined,
      includeRead
    })

    // TODO: Save discovered subscriptions to database
    if (result.subscriptions.length > 0) {
      console.log(`Found ${result.subscriptions.length} subscriptions from historical emails`)
      
      // Process each subscription
      for (const subscription of result.subscriptions) {
        try {
          // Create discovery record
          const discovery = {
            id: `discovery_${Date.now()}_${subscription.metadata.invoiceId || subscription.metadata.stripeEventId || 'unknown'}`,
            userId,
            source: 'gmail_stripe' as const,
            merchantName: subscription.merchantName,
            amount: subscription.amount,
            currency: subscription.currency,
            cycle: subscription.billingCycle || 'monthly',
            confidence: subscription.confidence,
            status: subscription.status === 'success' ? 'active' : 'pending',
            rawData: { 
              emailType: subscription.type,
              stripeData: subscription.metadata,
              processedAt: new Date().toISOString()
            },
            metadata: {
              emailSource: 'gmail',
              stripeType: subscription.type,
              stripeEventId: subscription.metadata.stripeEventId,
              invoiceId: subscription.metadata.invoiceId,
              receiptUrl: subscription.metadata.receiptUrl,
              detectedAt: new Date().toISOString()
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          // TODO: Save to database
          console.log('Created discovery:', discovery.id)
        } catch (error) {
          console.error('Error processing subscription:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} emails, found ${result.found} Stripe subscriptions`,
      data: {
        processed: result.processed,
        found: result.found,
        subscriptions: result.subscriptions.map(s => ({
          type: s.type,
          merchantName: s.merchantName,
          amount: s.amount,
          currency: s.currency,
          billingCycle: s.billingCycle,
          status: s.status,
          confidence: s.confidence,
          date: s.date,
          metadata: s.metadata
        })),
        errors: result.errors
      }
    })

  } catch (error) {
    console.error('[GMAIL_HISTORICAL_PROCESSING_ERROR]', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process historical emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // TODO: Get Gmail access token from database for this user
    const accessToken = 'mock_token'

    if (accessToken === 'mock_token') {
      return NextResponse.json({
        success: false,
        error: 'Gmail not connected',
        code: 'GMAIL_NOT_CONNECTED'
      }, { status: 400 })
    }

    // Get email statistics
    const stats = await gmailProcessor.getEmailStats(accessToken)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('[GMAIL_STATS_ERROR]', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get email statistics'
    }, { status: 500 })
  }
}
