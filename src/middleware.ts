import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { EXPERIENCE_COOKIE, EXPERIENCE_HEADER, EXPERIENCE_READ_ONLY, experienceRequestError, isExperienceControl } from '@/lib/experience'
import { verifyExperience } from '@/lib/experience-token'

// Middleware to handle authentication redirects, development URL fixes, and navigation consolidation
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookie = request.cookies.get(EXPERIENCE_COOKIE)?.value
  if (pathname.startsWith('/api/') && !isExperienceControl(pathname)) {
    const experience = cookie ? await verifyExperience(cookie, process.env.NEXTAUTH_SECRET) : null
    const pageId = request.headers.get(EXPERIENCE_HEADER)
    const error = cookie && !experience ? 'changed' : experienceRequestError(pathname, request.method, experience?.id ?? null, pageId)
    if (error) return NextResponse.json({ code: error === 'changed' ? 'EXPERIENCE_CHANGED' : 'EXPERIENCE_READ_ONLY', error: error === 'changed' ? 'Your walkthrough changed or expired. Reload the page or return to admin.' : EXPERIENCE_READ_ONLY }, { status: error === 'changed' ? 409 : 403, headers: { 'Cache-Control': 'private, no-store' } })
  }
  // Server Actions must not become a side door around the API guard.
  if (cookie && request.method === 'POST' && !pathname.startsWith('/api/')) return new NextResponse(EXPERIENCE_READ_ONLY, { status: 403 })
  
  // The assignment system was retired (2026-07); its hub no longer exists.
  // Land old bookmarks somewhere real instead of a 404.
  if (pathname === '/admin/assignments-system') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/home'
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
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/admin/assignments-system'
  ]
}
