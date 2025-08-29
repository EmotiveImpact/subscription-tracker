import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware for development and deployment
export default function middleware(req: NextRequest) {
  const response = NextResponse.next();
  
  // Basic security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
