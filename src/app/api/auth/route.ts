import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Authentication API is temporarily disabled for deployment',
    status: 'maintenance'
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'Authentication API is temporarily disabled for deployment',
    status: 'maintenance'
  }, { status: 503 });
}
