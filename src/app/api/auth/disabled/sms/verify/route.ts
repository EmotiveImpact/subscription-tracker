import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendSms } from '@/lib/twilio';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return new NextResponse('Phone number is required', { status: 400 });
    }

    // TODO: Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new NextResponse('Invalid phone number format', { status: 400 });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // TODO: Store verification code in database with expiration
    console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);

    // Send SMS with verification code
    const smsResult = await sendSms({
      to: phoneNumber,
      body: `Your SubTracker verification code is: ${verificationCode}. Valid for 10 minutes.`
    });

    if (smsResult.ok) {
      // TODO: Store phone number and verification code in database
      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully',
        phoneNumber,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send verification code',
        details: smsResult.reason,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[SMS_VERIFY_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
