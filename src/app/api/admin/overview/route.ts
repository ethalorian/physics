import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'

export const GET = withRole('admin', () =>
  NextResponse.json(
    { error: 'The admin overview endpoint has been retired.' },
    { status: 410, headers: { 'Cache-Control': 'private, no-store' } },
  ),
)
