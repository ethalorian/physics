import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { 
  vertexAIConfig, 
  buildPhysicsVideoPrompt, 
  physicsTopicStyles,
  type VideoGenerationResponse,
  type VideoOperationStatus
} from '@/lib/vertex-ai'
import {
  getStandardById,
  getStandardSetForStandard,
  type Standard
} from '@/data/physics-standards'

interface GenerateVideoRequest {
  prompt: string
  physicsTopic?: string
  videoType?: 'motion' | 'experiment' | 'realWorld' | 'simulation'
  duration?: 4 | 5 | 6 | 7 | 8
  aspectRatio?: '16:9' | '9:16'
  sampleCount?: number
  negativePrompt?: string
  enhanceForPhysics?: boolean
  // Standards alignment
  selectedStandardSet?: string
  selectedStandards?: string[]
}

interface PollOperationRequest {
  operationName: string
}

/**
 * POST /api/generate-media/video
 * Generate physics education videos using Vertex AI Veo
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Check role (admin/teacher only)
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json(
        { error: 'Forbidden - Admin or teacher access required' },
        { status: 403 }
      )
    }

    // Validate configuration
    if (!vertexAIConfig.projectId) {
      return NextResponse.json(
        { error: 'Vertex AI not configured. Please add GOOGLE_CLOUD_PROJECT_ID to environment variables.' },
        { status: 500 }
      )
    }

    const body: GenerateVideoRequest = await request.json()
    const {
      prompt,
      physicsTopic,
      videoType = 'motion',
      duration = 6,
      aspectRatio = '16:9',
      sampleCount = 1,
      negativePrompt,
      enhanceForPhysics = true,
      selectedStandardSet,
      selectedStandards = []
    } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Get selected standards details for context
    const standardDetails: Standard[] = selectedStandards
      .map(id => getStandardById(id))
      .filter((s): s is Standard => s !== undefined)

    // Build standards context for prompt enhancement
    let standardsContext = ''
    if (standardDetails.length > 0) {
      const standardsDescription = standardDetails
        .map(s => `${s.code}: ${s.title}`)
        .join('; ')
      standardsContext = ` This video should demonstrate physics concepts aligned with these education standards: ${standardsDescription}.`
    }

    // Build the enhanced prompt for physics education
    let finalPrompt = prompt
    if (enhanceForPhysics) {
      // Get topic-specific style if available
      const topicStyle = physicsTopic ? physicsTopicStyles[physicsTopic] : null
      const actualVideoType = topicStyle?.videoType || videoType
      const colorContext = topicStyle?.colorScheme ? `Visual style: ${topicStyle.colorScheme}` : undefined
      
      finalPrompt = buildPhysicsVideoPrompt(prompt, actualVideoType, colorContext)
      
      // Add standards context to the prompt
      if (standardsContext) {
        finalPrompt += standardsContext
      }
    }

    // Build default negative prompt for educational content
    const defaultNegativePrompt = 'blurry, low quality, distorted, unrealistic physics, incorrect demonstration, misleading, violent, inappropriate, fast motion that obscures physics'
    const finalNegativePrompt = negativePrompt 
      ? `${negativePrompt}, ${defaultNegativePrompt}`
      : defaultNegativePrompt

    // Get access token
    const accessToken = await getGoogleAccessToken()
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Google Cloud. Please check your credentials.' },
        { status: 500 }
      )
    }

    // Build the request body for Veo 3.1 API
    const requestBody = {
      instances: [
        {
          prompt: finalPrompt
        }
      ],
      parameters: {
        sampleCount: Math.min(sampleCount, 4), // Veo 3.1 supports up to 4 videos
        aspectRatio,
        negativePrompt: finalNegativePrompt,
        duration,
        personGeneration: 'allow_adult',
        // Veo 3.1 specific parameters
        resolution: '1080p' // Veo 3 supports 720p and 1080p
      }
    }

    console.log('Starting video generation with Veo 3.1:', finalPrompt.substring(0, 100) + '...')

    // Try Veo 3.1 first, then fallback to stable Veo 3
    let response = await fetch(vertexAIConfig.getVeoEndpoint('latest'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    // Fallback to stable Veo 3.0 if preview fails
    if (!response.ok && response.status !== 401 && response.status !== 429) {
      console.log('Veo 3.1 failed, trying Veo 3.0 stable...')
      response = await fetch(vertexAIConfig.getVeoEndpoint('stable'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...requestBody,
          parameters: {
            ...requestBody.parameters,
            resolution: '720p' // Veo 2 default
          }
        })
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vertex AI Veo error:', errorText)
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Google Cloud authentication failed. Please check your credentials.' },
          { status: 401 }
        )
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to start video generation', details: errorText },
        { status: response.status }
      )
    }

    const data: VideoGenerationResponse = await response.json()
    console.log('Veo API response:', JSON.stringify(data, null, 2))

    if (!data.name) {
      console.error('Veo did not return an operation name:', data)
      return NextResponse.json(
        { error: 'Video generation started but no operation name returned', details: data },
        { status: 500 }
      )
    }

    // Return the operation name for polling
    console.log('Video generation started, operation:', data.name)
    return NextResponse.json({
      success: true,
      operationName: data.name,
      status: 'processing',
      metadata: {
        originalPrompt: prompt,
        enhancedPrompt: finalPrompt,
        physicsTopic,
        videoType,
        duration,
        aspectRatio,
        startedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/generate-media/video
 * Poll for video generation status
 */
export async function PUT(request: NextRequest) {
  console.log('PUT /api/generate-media/video called')
  
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      console.log('PUT: Unauthorized - no session')
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body: PollOperationRequest = await request.json()
    const { operationName } = body
    console.log('PUT: Polling operation:', operationName)

    if (!operationName) {
      console.log('PUT: No operation name provided')
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
    console.log('PUT: Fetching operation status from:', operationEndpoint)
    
    const response = await fetch(operationEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    console.log('PUT: Operation status response:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PUT: Operation status error:', errorText)
      return NextResponse.json(
        { error: 'Failed to check operation status', details: errorText },
        { status: response.status }
      )
    }

    const status: VideoOperationStatus = await response.json()

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
 * GET /api/generate-media/video
 * Get available options and configuration
 */
export async function GET() {
  return NextResponse.json({
    model: {
      primary: 'Veo 3.1',
      fallback: 'Veo 3.0',
      description: 'Latest Google video generation models with 1080p support'
    },
    videoTypes: [
      { id: 'motion', name: 'Motion Demo', description: 'Clear motion paths and trajectories' },
      { id: 'experiment', name: 'Experiment', description: 'Laboratory or real-world experiment' },
      { id: 'realWorld', name: 'Real World', description: 'Everyday physics in action' },
      { id: 'simulation', name: 'Simulation', description: 'Physics simulation visualization' }
    ],
    durations: [
      { id: 4, name: '4 seconds', description: 'Quick demonstration' },
      { id: 5, name: '5 seconds', description: 'Short clip' },
      { id: 6, name: '6 seconds', description: 'Standard (recommended)' },
      { id: 7, name: '7 seconds', description: 'Extended clip' },
      { id: 8, name: '8 seconds', description: 'Full demonstration' }
    ],
    aspectRatios: [
      { id: '16:9', name: 'Widescreen', description: 'Best for presentations' },
      { id: '9:16', name: 'Portrait', description: 'Best for mobile/social' }
    ],
    resolutions: [
      { id: '720p', name: 'HD 720p', description: 'Standard quality' },
      { id: '1080p', name: 'Full HD 1080p', description: 'High quality (Veo 3+)' }
    ],
    physicsTopics: Object.keys(physicsTopicStyles),
    configured: !!vertexAIConfig.projectId,
    notes: [
      'Using Veo 3.1 with 1080p resolution',
      'Video generation takes 30-120 seconds',
      'Up to 4 videos per request',
      'Videos are stored temporarily - download promptly'
    ]
  })
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
        // Fall through to try other methods
      }
    }

    // Option 1b: Use service account key from environment variable (JSON string)
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (serviceAccountKey) {
      try {
        let keyString = serviceAccountKey.trim()
        
        // Remove surrounding quotes if present (but not if it's JSON starting with {)
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
        
        console.log('Using service account from env var')
        const token = await getTokenFromServiceAccount(key)
        return token
      } catch (parseError) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', parseError)
        console.error('Key starts with:', serviceAccountKey.substring(0, 50))
        // Fall through to try other auth methods
      }
    }

    // Option 2: Use the metadata server (for Cloud Run, GCE, etc.)
    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      try {
        const metadataResponse = await fetch(
          'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
          {
            headers: { 'Metadata-Flavor': 'Google' }
          }
        )
        if (metadataResponse.ok) {
          const data = await metadataResponse.json()
          return data.access_token
        }
      } catch {
        // Not running on Google Cloud
      }
    }

    // Option 3: Use Application Default Credentials
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
    throw new Error('Failed to exchange JWT for access token')
  }

  const data = await response.json()
  return data.access_token
}

async function createJWT(key: {
  client_email: string
  private_key: string
}): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: key.client_email,
    sub: key.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  }

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const signingInput = `${headerB64}.${payloadB64}`
  
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(key.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${signingInput}.${signatureB64}`
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')
  
  const binary = atob(base64)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)
  
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i)
  }
  
  return buffer
}

