import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { 
  vertexAIConfig, 
  buildPhysicsImagePrompt, 
  physicsTopicStyles,
  type GenerateImageOptions,
  type ImageGenerationResponse 
} from '@/lib/vertex-ai'
import {
  getStandardById,
  getStandardSetForStandard,
  type Standard
} from '@/data/physics-standards'

interface GenerateImageRequest {
  prompt: string
  physicsTopic?: string
  imageType?: 'diagram' | 'scenario' | 'concept' | 'realWorld' | 'experiment' | 'animation'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  sampleCount?: number
  negativePrompt?: string
  enhanceForPhysics?: boolean
  // Standards alignment
  selectedStandardSet?: string
  selectedStandards?: string[]
}

/**
 * POST /api/generate-media/image
 * Generate physics education images using Vertex AI Imagen
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

    const body: GenerateImageRequest = await request.json()
    const {
      prompt,
      physicsTopic,
      imageType = 'scenario',
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
      standardsContext = ` Align the visual content with these physics education standards: ${standardsDescription}.`
    }

    // Build the enhanced prompt for physics education
    let finalPrompt = prompt
    if (enhanceForPhysics) {
      // Get topic-specific style if available
      const topicStyle = physicsTopic ? physicsTopicStyles[physicsTopic] : null
      const actualImageType = topicStyle?.imageType || imageType
      const colorContext = topicStyle?.colorScheme ? `Color scheme: ${topicStyle.colorScheme}` : undefined
      
      finalPrompt = buildPhysicsImagePrompt(prompt, actualImageType, colorContext)
      
      // Add standards context to the prompt
      if (standardsContext) {
        finalPrompt += standardsContext
      }
    }

    // Build default negative prompt for educational content
    const defaultNegativePrompt = 'blurry, low quality, distorted, unrealistic physics, incorrect diagram, misleading information, violent, inappropriate'
    const finalNegativePrompt = negativePrompt 
      ? `${negativePrompt}, ${defaultNegativePrompt}`
      : defaultNegativePrompt

    // Get access token using Google Application Default Credentials
    // In production, use the google-auth-library
    const accessToken = await getGoogleAccessToken()
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Google Cloud. Please check your credentials.' },
        { status: 500 }
      )
    }

    // Build the request body for Imagen API
    const requestBody = {
      instances: [
        {
          prompt: finalPrompt
        }
      ],
      parameters: {
        sampleCount: Math.min(sampleCount, 4),
        aspectRatio,
        negativePrompt: finalNegativePrompt,
        safetyFilterLevel: 'block_medium_and_above',
        personGeneration: 'allow_adult',
        addWatermark: false, // Disabled for educational use
        enhancePrompt: true
      }
    }

    console.log('Generating image with Imagen 4:', finalPrompt.substring(0, 100) + '...')

    // Call Vertex AI Imagen API (try Imagen 4 first, fallback to Imagen 3)
    let response = await fetch(vertexAIConfig.getImagenEndpoint(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    // Fallback to Imagen 3 if Imagen 4 fails
    if (!response.ok && response.status !== 401 && response.status !== 429) {
      console.log('Imagen 4 failed, trying Imagen 3...')
      response = await fetch(vertexAIConfig.getImagenEndpoint(true), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vertex AI error:', errorText)
      
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
        { error: 'Failed to generate image', details: errorText },
        { status: response.status }
      )
    }

    const data: ImageGenerationResponse = await response.json()

    // Extract images from response
    const images = data.predictions.map((prediction, index) => ({
      id: `img-${Date.now()}-${index}`,
      base64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType || 'image/png',
      prompt: finalPrompt,
      aspectRatio,
      generatedAt: new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      images,
      metadata: {
        originalPrompt: prompt,
        enhancedPrompt: finalPrompt,
        physicsTopic,
        imageType,
        count: images.length
      }
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get Google Cloud access token
 * Uses Application Default Credentials or service account
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
        // Not running on Google Cloud, try other methods
      }
    }

    // Option 3: Use Application Default Credentials via gcloud
    // This requires the google-auth-library package
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
    throw new Error('Failed to exchange JWT for access token')
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
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const signingInput = `${headerB64}.${payloadB64}`
  
  // Import the private key and sign
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
    encoder.encode(signingInput)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${signingInput}.${signatureB64}`
}

/**
 * Convert PEM to ArrayBuffer
 */
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

/**
 * GET /api/generate-media/image
 * Get available options and configuration
 */
export async function GET() {
  return NextResponse.json({
    model: {
      primary: 'Imagen 4',
      fallback: 'Imagen 3',
      description: 'Latest Google image generation models with enhanced quality'
    },
    imageTypes: [
      { id: 'diagram', name: 'Diagram', description: 'Clean educational diagram with labels' },
      { id: 'scenario', name: 'Scenario', description: 'Realistic physics scenario' },
      { id: 'concept', name: 'Concept', description: 'Abstract conceptual illustration' },
      { id: 'realWorld', name: 'Real World', description: 'Everyday physics application' },
      { id: 'experiment', name: 'Experiment', description: 'Laboratory setup visualization' },
      { id: 'animation', name: 'Animation Frame', description: 'Motion visualization frame' }
    ],
    aspectRatios: [
      { id: '1:1', name: 'Square', description: 'Good for diagrams and icons' },
      { id: '16:9', name: 'Widescreen', description: 'Good for presentations and videos' },
      { id: '9:16', name: 'Portrait', description: 'Good for mobile and social media' },
      { id: '4:3', name: 'Standard', description: 'Classic format' },
      { id: '3:4', name: 'Portrait Standard', description: 'Vertical classic format' }
    ],
    physicsTopics: Object.keys(physicsTopicStyles),
    configured: !!vertexAIConfig.projectId,
    notes: [
      'Using Imagen 4 with automatic fallback to Imagen 3',
      'Enhanced prompt optimization for physics education',
      'Up to 4 images per request'
    ]
  })
}

