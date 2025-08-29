import { randomBytes, createHmac } from 'crypto'

export interface CSRFToken {
  token: string
  expiresAt: number
}

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Generate a new CSRF token
   */
  static generateToken(): CSRFToken {
    const token = randomBytes(this.TOKEN_LENGTH).toString('hex')
    const expiresAt = Date.now() + this.TOKEN_EXPIRY
    
    return { token, expiresAt }
  }

  /**
   * Verify a CSRF token
   */
  static verifyToken(token: string, storedToken: string, storedExpiry: number): boolean {
    // Check if token has expired
    if (Date.now() > storedExpiry) {
      return false
    }

    // Use timing-safe comparison to prevent timing attacks
    return this.timingSafeEqual(token, storedToken)
  }

  /**
   * Timing-safe string comparison
   */
  private static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }

  /**
   * Generate a signed token using a secret
   */
  static generateSignedToken(secret: string): string {
    const token = randomBytes(this.TOKEN_LENGTH).toString('hex')
    const signature = createHmac('sha256', secret)
      .update(token)
      .digest('hex')
    
    return `${token}.${signature}`
  }

  /**
   * Verify a signed token
   */
  static verifySignedToken(signedToken: string, secret: string): boolean {
    try {
      const [token, signature] = signedToken.split('.')
      
      if (!token || !signature) {
        return false
      }

      const expectedSignature = createHmac('sha256', secret)
        .update(token)
        .digest('hex')
      
      return this.timingSafeEqual(signature, expectedSignature)
    } catch {
      return false
    }
  }
}

/**
 * CSRF middleware for Next.js API routes
 */
export function withCSRF(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    // Skip CSRF check for GET requests
    if (request.method === 'GET') {
      return handler(request, ...args)
    }

    const csrfToken = request.headers.get('x-csrf-token')
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!csrfToken || !sessionToken) {
      return new Response(
        JSON.stringify({ error: 'CSRF token or session token missing' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // In a real app, you'd verify the CSRF token against the session
    // For now, we'll do basic validation
    if (csrfToken.length < 32) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return handler(request, ...args)
  }
}
