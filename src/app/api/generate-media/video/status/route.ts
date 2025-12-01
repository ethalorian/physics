import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { vertexAIConfig, type VideoOperationStatus } from '@/lib/vertex-ai'

interface PollStatusRequest {
  operationName: string
}

/**
 * POST /api/generate-media/video/status
 * Poll for video generation status
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/generate-media/video/status called')
  
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      console.log('Status check: Unauthorized - no session')
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body: PollStatusRequest = await request.json()
    const { operationName } = body
    console.log('Status check: Polling operation:', operationName)

    if (!operationName) {
      console.log('Status check: No operation name provided')
      return NextResponse.json(
        { error: 'Operation name is required' },
        { status: 400 }
      )
    }

    // Get access token
    const accessToken = await getGoogleAccessToken()
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Google Cloud' },
        { status: 500 }
      )
    }

    // Poll the operation status
    const operationEndpoint = vertexAIConfig.getOperationEndpoint(operationName)
    console.log('Status check: Fetching from:', operationEndpoint)
    
    const response = await fetch(operationEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    console.log('Status check: Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Status check: Error:', errorText)
      
      // Handle 404 - likely means Veo isn't enabled for this project
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: 'Video generation is not available. Google Veo API may not be enabled for your project. Please check that you have access to Veo in Google Cloud Console (Vertex AI > Generative AI Studio > Video).',
          details: 'The Veo video generation API requires special access. You may need to request access at https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview'
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to check operation status', details: errorText },
        { status: response.status }
      )
    }

    const status: VideoOperationStatus = await response.json()
    console.log('Status check: Operation status:', JSON.stringify(status, null, 2))

    if (status.error) {
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: status.error.message
      })
    }

    if (status.done && status.response) {
      // Video generation complete - extract video URLs
      const videos = status.response.generatedSamples.map((sample, index) => ({
        id: `vid-${Date.now()}-${index}`,
        uri: sample.video.uri,
        generatedAt: new Date().toISOString()
      }))

      return NextResponse.json({
        success: true,
        status: 'complete',
        videos
      })
    }

    // Still processing
    return NextResponse.json({
      success: true,
      status: 'processing',
      operationName
    })

  } catch (error) {
    console.error('Video status check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check video status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get Google Cloud access token
 */
async function getGoogleAccessToken(): Promise<string | null> {
  try {
    // Option 1a: Load service account key from file path
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (keyPath) {
      try {
        const fs = await import('fs')
        const path = await import('path')
        const fullPath = path.resolve(process.cwd(), keyPath)
        const keyFileContent = fs.readFileSync(fullPath, 'utf-8')
        const key = JSON.parse(keyFileContent)
        
        if (!key.client_email || !key.private_key || !key.token_uri) {
          throw new Error('Service account key file missing required fields')
        }
        
        console.log('Using service account from file:', keyPath)
        const token = await getTokenFromServiceAccount(key)
        return token
      } catch (fileError) {
        console.error('Failed to load service account key from file:', fileError)
      }
    }

    // Option 1b: Use service account key from environment variable
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (serviceAccountKey) {
      try {
        let keyString = serviceAccountKey.trim()
        
        if (!keyString.startsWith('{')) {
          if ((keyString.startsWith('"') && keyString.endsWith('"')) ||
              (keyString.startsWith("'") && keyString.endsWith("'"))) {
            keyString = keyString.slice(1, -1)
          }
        }
        
        const key = JSON.parse(keyString)
        
        if (!key.client_email || !key.private_key || !key.token_uri) {
          throw new Error('Service account key missing required fields')
        }
        
        const token = await getTokenFromServiceAccount(key)
        return token
      } catch (parseError) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', parseError)
      }
    }

    // Option 2: Use Application Default Credentials
    const { GoogleAuth } = await import('google-auth-library')
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    })
    const client = await auth.getClient()
    const tokenResponse = await client.getAccessToken()
    return tokenResponse.token || null

  } catch (error) {
    console.error('Failed to get Google access token:', error)
    return null
  }
}

/**
 * Get access token from service account key
 */
async function getTokenFromServiceAccount(key: {
  client_email: string
  private_key: string
  token_uri: string
}): Promise<string> {
  const jwt = await createJWT(key)
  
  const response = await fetch(key.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Create a JWT for service account authentication
 */
async function createJWT(key: {
  client_email: string
  private_key: string
}): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: key.client_email,
    sub: key.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  }

  const encoder = new TextEncoder()
  
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  
  const signatureInput = `${headerB64}.${payloadB64}`
  
  // Import the private key
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const pemContents = key.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  )
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  
  return `${signatureInput}.${signatureB64}`
}

