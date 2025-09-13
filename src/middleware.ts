import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware to handle authentication redirects and development URL fixes
export function middleware(request: NextRequest) {
  // In development, ensure proper URL handling for NextAuth
  if (process.env.NODE_ENV === 'development' && request.nextUrl.pathname.startsWith('/api/auth')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-forwarded-host', 'localhost:3000')
    requestHeaders.set('x-forwarded-proto', 'http')
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/auth/:path*'
}
