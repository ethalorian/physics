/**
 * RISC (Cross-Account Protection) Webhook Endpoint
 * Receives security event tokens from Google
 * https://developers.google.com/identity/protocols/risc
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  validateSecurityEventToken, 
  handleSecurityEvent,
  handleVerificationRequest 
} from '@/lib/risc-handler'

// Google will send security events as POST requests
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const contentType = request.headers.get('content-type')
    let token: string

    if (contentType?.includes('application/secevent+jwt')) {
      // Token sent as raw JWT in body
      token = await request.text()
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Token sent as form data
      const formData = await request.formData()
      token = formData.get('token') as string
    } else {
      // Unsupported content type
      console.error('Unsupported content type:', contentType)
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      )
    }

    if (!token) {
      console.error('No security event token provided')
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 400 }
      )
    }

    // Validate the security event token
    const validatedToken = await validateSecurityEventToken(token)
    if (!validatedToken) {
      console.error('Invalid security event token')
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Check if this is a verification request
    const events = validatedToken.events
    const isVerification = Object.keys(events).some(
      key => key.includes('verification')
    )

    if (isVerification) {
      // Handle verification request from Google
      const verified = await handleVerificationRequest(token)
      if (verified) {
        console.log('RISC endpoint verification successful')
        return new NextResponse('Verification successful', { status: 200 })
      } else {
        console.error('RISC endpoint verification failed')
        return NextResponse.json(
          { error: 'Verification failed' },
          { status: 400 }
        )
      }
    }

    // Process the security event
    await handleSecurityEvent(validatedToken)

    // Return success response
    // Google expects a 200 OK or 202 Accepted response
    return new NextResponse('Event processed', { status: 202 })

  } catch (error) {
    console.error('Error processing RISC webhook:', error)
    
    // Log the error but return 200 to prevent Google from retrying
    // We log the error for debugging but don't want to trigger retries
    // for temporary issues
    return new NextResponse('Event acknowledged', { status: 200 })
  }
}

// Google will use GET to check if the endpoint is alive
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'RISC webhook',
    timestamp: new Date().toISOString()
  })
}
