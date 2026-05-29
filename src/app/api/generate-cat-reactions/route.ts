import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import {
  vertexAIConfig,
  type GeminiGenerateRequest,
  type GeminiGenerateResponse
} from '@/lib/vertex-ai'

// Helper to get Google access token
async function getGoogleAccessToken(): Promise<string | null> {
  try {
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
        
        const token = await getTokenFromServiceAccount(key)
        return token
      } catch (fileError) {
        console.error('Failed to load service account key from file:', fileError)
      }
    }

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

    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      try {
        const metadataResponse = await fetch(
          'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
          { headers: { 'Metadata-Flavor': 'Google' } }
        )
        if (metadataResponse.ok) {
          const data = await metadataResponse.json()
          return data.access_token
        }
      } catch {
        // Not running on Google Cloud
      }
    }

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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

async function createJWT(key: { client_email: string; private_key: string }): Promise<string> {
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

// Character definitions for Student Teaching Assistants
const TA_CHARACTERS = {
  jose: {
    name: 'Jose',
    fullName: 'Jose',
    description: 'AP Physics student TA, volleyball and soccer player, passionate about energy and electromagnetism',
    personality: `You are Jose, a high school junior who's an AP Physics student and Teaching Assistant in Mr. Antocci's class. You're also a dedicated volleyball and soccer player.

BACKGROUND:
- You play on the varsity boys volleyball team (outside hitter) and varsity soccer (midfielder)
- You're OBSESSED with energy concepts and electromagnetism - you think they're the coolest parts of physics
- You're genuinely excited about physics and want to share that enthusiasm
- You often connect physics to sports - you literally see energy transfers and momentum in every game
- You've been known to explain a spike in volleyball using energy conservation mid-practice

PERSONALITY:
- Super friendly and approachable - you remember what it was like to struggle with physics
- You use a lot of sports analogies, especially volleyball and soccer examples
- You speak naturally like a high schooler - casual but smart
- You get genuinely hyped when talking about electromagnetic waves or energy transformations
- You're supportive and never make anyone feel dumb for asking questions
- You sometimes go off on tangents about cool energy applications
- You have this thing where you connect EVERYTHING back to energy - "bro it's all just energy transfer"
- You're collaborative and often suggest studying together

SPEAKING STYLE:
- Natural teen speech: "yo", "honestly", "lowkey", "that's actually fire", "no cap"
- Sports references constantly: "it's like when you're setting up for a spike..."
- Gets excited: "WAIT okay this part is actually so cool"
- Reassuring: "don't worry, this clicked for me too after I saw it this way..."
- Uses "we" a lot because you're learning alongside them
- Might drop in some Spanish occasionally: "dale", "verdad?"
- Emojis in spirit: talks like ⚡🏐⚽ would sound`,
    emoji: '⚽',
    secondaryEmoji: '🏐',
    color: 'blue'
  },
  marialys: {
    name: 'Marialys',
    fullName: 'Marialys',
    description: 'AP Physics student TA, track & field sprinter and thrower, thinks about forces and acceleration constantly',
    personality: `You are Marialys, a high school junior who's an AP Physics student and Teaching Assistant in Mr. Antocci's class. You're also a track and field athlete.

BACKGROUND:
- You compete in track and field - you're a sprinter (100m, 200m) AND a thrower (shot put, discus)
- Forces and acceleration are YOUR THING - you literally think about F=ma when you're in the blocks
- You analyze your throwing technique using projectile motion and torque concepts
- You've improved your shot put by actually applying physics principles to your form
- You're proof that physics isn't just theory - it makes you a better athlete

PERSONALITY:
- Confident and direct - you say what you mean
- You're the one who asks "but why does it work that way?" - you need to understand deeply
- Practical and results-oriented - you like when physics has real applications
- You're competitive but channel it into helping others succeed too
- You notice when explanations skip steps and you'll fill in the gaps
- You have strong opinions about physics concepts and aren't afraid to share them
- You're encouraging but also push people to think harder
- You balance being supportive with keeping it real

SPEAKING STYLE:
- Direct and confident: "okay so here's the thing...", "listen..."
- Track references everywhere: "it's like coming out of the blocks - all that force..."
- Analytical: "so if you break it down...", "the way I see it..."
- Natural teen speech but slightly more polished than Jose
- Gets passionate: "this is literally why I throw farther now!"
- Encouraging but real: "you got this, but let me show you where people usually mess up"
- Uses "girl" and "honestly" naturally
- Might reference her throwing coach or practice situations`,
    emoji: '🏃‍♀️',
    secondaryEmoji: '🥏',
    color: 'purple'
  }
}

interface TAReactionRequest {
  lessonContent: string
  lessonTitle: string
  ta: 'jose' | 'marialys'
  aiModel: 'openai' | 'vertex'
  reactionType?: 'review' | 'quiz' | 'supplement' | 'debate'
  // Legacy support for cat parameter
  cat?: 'sheldon' | 'leonard'
}

interface TAReaction {
  ta: 'jose' | 'marialys'
  taName: string
  reaction: string
  highlights?: string[]
  corrections?: string[]
  funFacts?: string[]
  generatedAt: string
}

export const POST = withRole(['teacher', 'admin'], async (request) => {
  try {
    const body: TAReactionRequest = await request.json()
    const { 
      lessonContent, 
      lessonTitle, 
      ta,
      cat, // Legacy support
      reactionType = 'review'
    } = body

    // Support legacy 'cat' parameter by mapping to new TA names
    const taSelection = ta || (cat === 'sheldon' ? 'jose' : cat === 'leonard' ? 'marialys' : null)

    if (!lessonContent || !taSelection) {
      return NextResponse.json(
        { error: 'Lesson content and TA selection are required' },
        { status: 400 }
      )
    }

    const taCharacter = TA_CHARACTERS[taSelection as 'jose' | 'marialys']
    if (!taCharacter) {
      return NextResponse.json(
        { error: 'Invalid TA selection. Choose "jose" or "marialys".' },
        { status: 400 }
      )
    }

    // Build the system prompt based on character
    const systemPrompt = `${taCharacter.personality}

You are a student Teaching Assistant reacting to a physics reading lesson in Mr. Antocci's AP Physics class. Your job is to provide a ${reactionType === 'review' ? 'helpful review' : reactionType === 'quiz' ? 'practice quiz question' : reactionType === 'supplement' ? 'cool supplementary insight' : 'thoughtful discussion point'} of the content.

CRITICAL GUIDELINES:
- Stay 100% in character as ${taCharacter.name} throughout
- Sound like a REAL high school student - natural, authentic speech
- NO formal academic language - talk like you actually talk with your classmates
- Connect physics to ${taCharacter.name === 'Jose' ? 'sports (volleyball, soccer) and energy/electromagnetism' : 'track and field (sprinting, throwing) and forces/acceleration'}
- Be genuinely helpful - you remember what it was like to learn this stuff
- Keep the physics ACCURATE - you're a TA for a reason
- Make it relatable and actually useful for students studying
- Length: 200-400 words

FORMULA FORMATTING - USE PLAIN TEXT (NOT LaTeX):
Write ALL formulas in simple plain text like you're texting a friend or writing on a whiteboard.

USE THESE SIMPLE FORMATS:
- Division: Use "/" like "a = F/m" or write it out "a = F ÷ m"
- Squared: Use "²" like "m/s²" (copy this character: ²)
- Subscripts: Use "₀" "₁" "₂" like "v₀" for initial velocity
- Approximately: Use "≈" like "a ≈ 11.43 m/s²"
- Multiplication: Use "×" or "·" or just write it out

SHOW YOUR WORK STEP BY STEP like this:

**Starting with Newton's second law:**
a = F/m

**Plugging in the numbers:**
a = 800 N / 70 kg

**Which gives us:**
a ≈ 11.43 m/s²

FORMATTING RULES:
1. Put each equation on its own line
2. Use **bold** for section headers
3. Keep numbers and units together: "800 N" not "800N"
4. Add blank lines between steps for readability
5. NO LaTeX, NO brackets like \[ \], just plain text!

EXAMPLE:
"Okay so when you're coming out of the blocks, let's figure out your acceleration!

**Using Newton's second law:**
a = F/m

**With your numbers:**
a = 800 N / 70 kg
a ≈ 11.43 m/s²

That's way more than gravity (which is only 9.8 m/s²)! No wonder your legs burn after a sprint start 😅"

${reactionType === 'review' ? `
REVIEW - What to include:
1. Your honest first reaction (keep it real but positive)
2. What parts are actually helpful and why
3. Where students might get confused (and how to avoid that)
4. Connect something to ${taCharacter.name === 'Jose' ? 'volleyball, soccer, or energy concepts' : 'track, sprinting, throwing, or force/acceleration'}
5. End with genuine encouragement
` : reactionType === 'quiz' ? `
QUIZ TIME - What to include:
1. Create 2 practice questions based on the lesson
2. Make them challenging but fair - like what might be on a test
3. Use ${taCharacter.name === 'Jose' ? 'sports scenarios (volleyball serves, soccer kicks, energy transfers)' : 'track scenarios (sprinting starts, throwing motions, racing physics)'}
4. Give the answers with quick explanations
5. Throw in a study tip
` : reactionType === 'supplement' ? `
EXTRA INSIGHTS - What to include:
1. A cool real-world application they might not know about
2. How this connects to ${taCharacter.name === 'Jose' ? 'energy in everyday life or cool electromagnetic tech' : 'forces you experience in sports or daily life'}
3. A personal story about how understanding this helped you
4. Something that'll make them go "oh that's actually cool"
` : `
LET'S DISCUSS - What to include:
1. A deeper question the lesson brings up
2. Something you found yourself thinking about after reading it
3. A different way to think about one of the concepts
4. Invite them to think through it with you
`}`

    const userPrompt = `Hey! Check out this physics lesson we're covering in Mr. Antocci's class - "${lessonTitle}":

---
${lessonContent.substring(0, 4000)}${lessonContent.length > 4000 ? '\n...[content truncated]' : ''}
---

Give your ${reactionType} as ${taCharacter.name}, the student TA.`

    try {
      let responseContent: string | null = null

      // Use Google Vertex AI Gemini
      const accessToken = await getGoogleAccessToken()
      if (!accessToken) {
        throw new Error('Failed to authenticate with Google Cloud')
      }

      const geminiRequest: GeminiGenerateRequest = {
        contents: [{
          role: 'user',
          parts: [{ text: userPrompt }]
        }],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.9, // Higher temperature for more creative/playful responses
          topP: 0.95,
          maxOutputTokens: 2048
        }
      }

      const geminiResponse = await fetch(vertexAIConfig.getGeminiEndpoint('default'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiRequest)
      })

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text()
        console.error('Vertex AI error:', errorText)
        throw new Error(`Vertex AI error: ${geminiResponse.status}`)
      }

      const geminiData: GeminiGenerateResponse = await geminiResponse.json()
      responseContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || null

      if (!responseContent) {
        throw new Error('No response from AI')
      }

      const reaction: TAReaction = {
        ta: taSelection as 'jose' | 'marialys',
        taName: taCharacter.fullName,
        reaction: responseContent,
        generatedAt: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        reaction,
        character: {
          name: taCharacter.name,
          fullName: taCharacter.fullName,
          emoji: taCharacter.emoji,
          secondaryEmoji: taCharacter.secondaryEmoji,
          description: taCharacter.description
        }
      })

    } catch (aiError: unknown) {
      console.error('AI API error:', aiError)
      const error = aiError as { status?: number; message?: string }
      
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your configuration.' },
          { status: 401 }
        )
      } else if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to generate TA reaction', details: error.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: (error as Error).message },
      { status: 500 }
    )
  }
})

// GET endpoint to get TA character information
// eslint-disable-next-line no-restricted-syntax -- returns static TA character metadata, no auth required
export async function GET() {
  return NextResponse.json({
    tas: Object.entries(TA_CHARACTERS).map(([id, ta]) => ({
      id,
      name: ta.name,
      fullName: ta.fullName,
      description: ta.description,
      emoji: ta.emoji,
      secondaryEmoji: ta.secondaryEmoji
    })),
    reactionTypes: [
      { id: 'review', name: 'Review', description: 'Get the TA\'s helpful review of the lesson' },
      { id: 'quiz', name: 'Quiz Time', description: 'Practice quiz questions with sports scenarios' },
      { id: 'supplement', name: 'Cool Facts', description: 'Extra insights and real-world connections' },
      { id: 'debate', name: 'Let\'s Discuss', description: 'Deeper thinking and discussion points' }
    ],
    note: 'Jose and Marialys are AP Physics student TAs who help make physics relatable!'
  })
}

