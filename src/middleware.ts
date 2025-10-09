import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware to handle authentication redirects, development URL fixes, and navigation consolidation
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Redirect old assignment system page to unified assignment hub
  if (pathname === '/admin/assignments-system') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/assignments'
    return NextResponse.redirect(url)
  }
  
  // In development, ensure proper URL handling for NextAuth
  if (process.env.NODE_ENV === 'development' && pathname.startsWith('/api/auth')) {
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
  matcher: [
    '/api/auth/:path*',
    '/admin/assignments-system'
  ]
}
