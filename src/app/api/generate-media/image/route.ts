/* eslint-disable no-restricted-syntax -- retired endpoint: returns 410 Gone, no handler to wrap */
import { NextResponse } from 'next/server'

// AI media generation (Google Imagen) was retired at the team's request — the
// app does not use Imagen. This endpoint is intentionally disabled.
const gone = () => NextResponse.json({ error: 'AI media generation has been removed.' }, { status: 410 })

export async function GET() { return gone() }
export async function POST() { return gone() }
