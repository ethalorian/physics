import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'

export const GET = withRole(['teacher', 'admin'], () =>
  NextResponse.json(
    { error: 'The admin stats endpoint has been retired.' },
    { status: 410, headers: { 'Cache-Control': 'private, no-store' } },
  ),
)
