import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import {
  masteryLevels,
  physicsTopics, 
  realWorldEnvironments,
  lessonStructures,
  getMasteryLevelById,
  getTopicById,
  getEnvironmentById
} from '@/data/reading-lesson-config'
import {
  allStandardSets,
  getStandardById,
  getStandardsBySet,
  getStandardSetForStandard,
  formatStandardsForPrompt,
  type Standard
} from '@/data/physics-standards'
import {
  vertexAIConfig,
  type GeminiGenerateRequest,
  type GeminiGenerateResponse
} from '@/lib/vertex-ai'

// Helper to get Google access token (supports multiple auth methods)
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

interface GenerateReadingLessonRequest {
  // Required
  masteryLevel: string  // ID from masteryLevels
  
  // Optional context
  topic?: string  // Physics topic ID
  selectedTerms?: string[]  // Array of term IDs to focus on
  environments?: string[]  // Array of environment IDs for context
  
  // Custom content
  customContext?: string  // Additional user-provided context
  lessonTitle?: string  // Optional title
  lessonStructure?: string  // ID from lessonStructures
  
  // Content options
  includeFormulas?: boolean
  includeMisconceptions?: boolean
  includeCheckQuestions?: boolean
  wordCount?: number  // Target word count
  
  // Embedded questions options
  includeEmbeddedQuestions?: boolean
  questionFrequency?: 'after-each-section' | 'every-other-section' | 'end-only'
  questionTypes?: string[]  // 'multiple-choice', 'quick-check', 'reflection'
  
  // Standards alignment
  selectedStandardSets?: string[]  // Array of standard set IDs (ngss, ap-physics-1, etc.)
  selectedStandards?: string[]  // Array of individual standard IDs
  
  // AI Model selection
  aiModel?: 'openai' | 'vertex'  // Which AI provider to use
}

interface EmbeddedQuestion {
  id: string
  type: 'multiple-choice' | 'reflection' | 'quick-check'
  question: string
  afterSection: string  // Title of the section this question follows
  options?: string[]  // For multiple choice
  correctAnswer?: number  // Index for multiple choice (0-indexed)
  sampleAnswer?: string  // For reflection questions
  explanation: string  // Shown after answering
  points: number
}

interface GeneratedLesson {
  title: string
  content: string
  objectives: string[]
  keyTerms: {
    term: string
    definition: string
  }[]
  embeddedQuestions?: EmbeddedQuestion[]  // Questions throughout the lesson
  checkForUnderstanding?: {
    question: string
    answer: string
  }[]
  estimatedReadingTime: number  // in minutes
  masteryLevel: string
  metadata: {
    topic?: string
    environments?: string[]
    generatedAt: string
    wordCount: number
    alignedStandards?: { code: string; title: string }[]
    aiModel?: string
  }
}

export const POST = withRole(['teacher', 'admin'], async (request) => {
  try {
    const body: GenerateReadingLessonRequest = await request.json()
    const { 
      masteryLevel,
      topic,
      selectedTerms = [],
      environments = [],
      customContext,
      lessonTitle,
      lessonStructure = 'introduction',
      includeFormulas = true,
      includeMisconceptions = true,
      includeCheckQuestions = true,
      wordCount = 800,
      includeEmbeddedQuestions = false,
      questionFrequency = 'after-each-section',
      questionTypes = ['multiple-choice', 'quick-check'],
      selectedStandardSets = [],
      selectedStandards = []
    } = body

    // Vertex AI is the only supported provider.
    if (!vertexAIConfig.projectId) {
      return NextResponse.json(
        { error: 'Vertex AI not configured. Please add GOOGLE_CLOUD_PROJECT_ID to your environment variables.' },
        { status: 500 }
      )
    }

    // Validate mastery level
    const level = getMasteryLevelById(masteryLevel)
    if (!level) {
      return NextResponse.json(
        { error: 'Invalid mastery level' },
        { status: 400 }
      )
    }

    // Get topic details if provided
    const topicDetails = topic ? getTopicById(topic) : null
    
    // Get selected term details
    const termDetails = selectedTerms.map(termId => {
      for (const t of physicsTopics) {
        const found = t.terms.find(term => term.id === termId)
        if (found) return found
      }
      return null
    }).filter(Boolean)

    // Get environment details
    const envDetails = environments.map(envId => getEnvironmentById(envId)).filter(Boolean)

    // Get selected standards details
    const standardDetails: Standard[] = selectedStandards
      .map(id => getStandardById(id))
      .filter((s): s is Standard => s !== undefined)

    // Get lesson structure
    const structure = lessonStructures.find(s => s.id === lessonStructure) || lessonStructures[0]

    // Build the system prompt based on mastery level
    const systemPrompt = `You are an expert conceptual physics lecturer in the tradition of Richard Feynman and Paul Hewitt, creating engaging reading lessons for ${level.gradeRange} students.

═══════════════════════════════════════════════════════════════
YOUR TEACHING PHILOSOPHY (Channel Feynman & Hewitt)
═══════════════════════════════════════════════════════════════

You believe that if you truly understand something, you can explain it simply. Your goal is not to impress with complexity, but to illuminate with clarity. Like Feynman, you approach physics with childlike wonder—every phenomenon is a puzzle worth exploring. Like Hewitt, you make physics accessible through conversation, analogy, and genuine warmth.

KEY PRINCIPLES:
• **Wonder over formality**: Physics is an adventure of discovery, not a chore
• **Intuition before equations**: Build mental pictures first, then introduce math as a tool
• **Analogies are your superpower**: Connect abstract concepts to concrete, everyday experiences
• **Ask the questions students are thinking**: "But wait—if that's true, then why...?"
• **Embrace the "aha!" moments**: Guide students to discover insights themselves
• **Honesty about what we don't know**: Science is a process, not a collection of facts

READING LEVEL: ${level.readingLevel}
CHARACTERISTICS FOR THIS LEVEL:
${level.characteristics.map(c => `- ${c}`).join('\n')}

═══════════════════════════════════════════════════════════════
WRITING STYLE (The Feynman-Hewitt Voice)
═══════════════════════════════════════════════════════════════

1. **START WITH WONDER**: Hook them with a puzzle or surprising observation
   - "Here's something strange: throw a ball straight up from a moving car. To you, it goes up and down. To someone on the sidewalk, it follows a curve. Same ball, same throw—what's going on?"
   - "Have you ever wondered why you feel heavier in an elevator going up, but lighter when it's going down?"

2. **BUILD MENTAL PICTURES**: Create vivid images they can see in their mind
   - "Imagine you're standing on a giant skateboard..."
   - "Picture a swimming pool filled with honey instead of water..."
   - "Think of energy like water flowing through pipes..."

3. **USE THE SOCRATIC METHOD**: Ask questions that lead to understanding
   - "So what do you think happens next?"
   - "Does that match what you expected? If not, where did our intuition go wrong?"
   - "Here's the key question: why doesn't the moon fall down?"

4. **ANALOGIES, ANALOGIES, ANALOGIES**: Connect physics to what they already know
   - Momentum is like a freight train—hard to stop once it's moving
   - Voltage is like water pressure in a hose
   - Atoms are like tiny solar systems (but watch out—this analogy has limits!)

5. **ADDRESS THE "YEAH, BUT..." MOMENTS**: Anticipate confusion and objections
   - "Now, you might be thinking: 'But I've seen feathers fall slower than rocks!' Good catch. Let me explain..."
   - "This might seem to contradict what I said earlier. Here's why it doesn't..."

6. **CELEBRATE THE WEIRD AND WONDERFUL**: Physics is genuinely amazing
   - "Here's where it gets really interesting..."
   - "This might be the most counterintuitive thing you'll learn this year..."
   - "When I first learned this, I couldn't believe it was true."

7. **CONVERSATIONAL BUT PRECISE**: Talk like a knowledgeable friend, not a textbook
   - Use "you" and "we" naturally
   - Short paragraphs and varied sentence length
   - Occasional humor when it fits naturally (Hewitt-style)
   - But never sacrifice accuracy for accessibility

STRUCTURE:
- **The Hook** (A question, puzzle, or surprising observation - 50-100 words)
- **Building Intuition** (Develop the mental picture with analogies - 150-200 words)
- **The Physics Unveiled** (Clear explanation with examples - 200-300 words)
- **Going Deeper** (Explore implications and connections - 150-200 words)
- **The Big Picture** (Why this matters, connections to other ideas - 50-100 words)

FORMATTING:
- Use Markdown formatting
- Bold **key terms** when first introduced
- Use short paragraphs
- Clear section headers

MATH EQUATIONS - IMPORTANT:
Write all math equations as plain text. Do NOT use LaTeX, backslashes, or special delimiters.
- Write: F = ma (not \\(F = ma\\) or any LaTeX)
- Write: v = d/t
- Write: KE = (1/2)mv² (use ² character for squared)
- Write: a = Δv/Δt (use Δ for delta)
- Write fractions as: a/b or "a divided by b"

For important equations, put them on their own line:
**F = ma**

Do NOT use any of these: \\( \\) \\[ \\] \\frac \\text or any backslash commands.
Just write equations as plain readable text with Unicode symbols: × ÷ Δ ² ³ √ ≈ ≠ ≤ ≥

TARGET LENGTH: Approximately ${wordCount} words

${includeFormulas ? 'INCLUDE relevant physics formulas with clear explanations of what each variable represents.' : 'Focus on conceptual understanding - minimize mathematical formulas.'}

${includeMisconceptions ? 'INCLUDE a section addressing common misconceptions directly.' : ''}

${includeCheckQuestions ? 'END with 2-3 check-for-understanding questions.' : ''}

${standardDetails.length > 0 ? `
═══════════════════════════════════════════════════════════════
STANDARDS ALIGNMENT - IMPORTANT
═══════════════════════════════════════════════════════════════

This lesson should be aligned with the following educational standards:

${formatStandardsForPrompt(standardDetails)}

REQUIREMENTS:
• Ensure the lesson content directly addresses the learning objectives in these standards
• Include content that allows students to demonstrate mastery of these standards
• Use vocabulary and concepts consistent with the standard frameworks
• Structure explanations to build toward the skills described in the standards
• If applicable, include examples and activities that align with the science practices mentioned
` : ''}

${includeEmbeddedQuestions ? `
═══════════════════════════════════════════════════════════════
EMBEDDED QUESTIONS - CRITICAL FORMATTING RULE
═══════════════════════════════════════════════════════════════

You MUST generate questions and put them ONLY in the "embeddedQuestions" array in the JSON output.
DO NOT put any question JSON or question objects inside the "content" field.
The "content" field should contain ONLY pure Markdown text for the lesson.

QUESTION PLACEMENT: ${questionFrequency === 'after-each-section' ? 'Create a question for EACH main section' : questionFrequency === 'every-other-section' ? 'Create a question for every OTHER section' : 'Create questions for the END of the lesson'}

QUESTION TYPES TO INCLUDE:
${questionTypes.includes('multiple-choice') ? '- MULTIPLE CHOICE: 4 options, one correct answer, with explanation' : ''}
${questionTypes.includes('quick-check') ? '- QUICK CHECK: True/False or Yes/No questions to verify basic understanding' : ''}
${questionTypes.includes('reflection') ? '- REFLECTION: Open-ended questions that ask students to think deeper or connect to their experience' : ''}

For each question in the embeddedQuestions array, provide:
- id: unique identifier like "q1", "q2", etc.
- type: "multiple-choice", "quick-check", or "reflection"
- question: the question text
- afterSection: the EXACT section header name this question relates to
- options: array of choices (for multiple-choice and quick-check)
- correctAnswer: index of correct option (0-based)
- explanation: why the answer is correct
- sampleAnswer: for reflection questions only
- points: point value (1-2)

Make questions that:
✓ Test understanding, not just memory
✓ Relate directly to what was just read
✓ Help students self-assess their learning

IMPORTANT: Keep the "content" field as pure Markdown. Questions go ONLY in "embeddedQuestions" array.
` : ''}

TONE GUIDELINES (The Feynman-Hewitt Way):
✓ Curious and wonder-filled, not dry or pedantic
✓ Conversational and warm, like explaining to a friend
✓ Uses analogies and mental pictures to build understanding
✓ Asks thought-provoking questions throughout
✓ Celebrates the elegance and surprises of physics
✓ Precise about the science, relaxed about the language
✓ Makes students think "I never thought of it that way!"

Remember: The best physics teaching feels like a conversation with someone who genuinely loves the subject and wants you to love it too.`

    // Build the user prompt
    let userPrompt = `Create an educational reading lesson that explains physics through real-world examples.`
    
    if (lessonTitle) {
      userPrompt += `\n\nTITLE: "${lessonTitle}"`
    }
    
    if (topicDetails) {
      userPrompt += `\n\nTOPIC: ${topicDetails.name}
${topicDetails.description}`
    }

    if (termDetails.length > 0) {
      userPrompt += `\n\nKEY TERMS TO EXPLAIN:`
      termDetails.forEach(term => {
        if (term) {
          userPrompt += `\n• ${term.term}${term.symbol ? ` (${term.symbol})` : ''}: ${term.definition}`
          if (term.unit) userPrompt += ` [Unit: ${term.unit}]`
          if (term.commonMisconceptions?.length) {
            userPrompt += `\n  Common misconception: ${term.commonMisconceptions.join('; ')}`
          }
        }
      })
    }

    if (envDetails.length > 0) {
      userPrompt += `\n\nUSE EXAMPLES FROM THESE CONTEXTS:`
      envDetails.forEach(env => {
        if (env) {
          userPrompt += `\n• ${env.name}: ${env.examples.slice(0, 3).join(', ')}`
        }
      })
    }

    if (customContext) {
      userPrompt += `\n\nADDITIONAL INSTRUCTIONS:\n${customContext}`
    }

    if (standardDetails.length > 0) {
      userPrompt += `\n\nALIGN WITH THESE STANDARDS:`
      standardDetails.forEach(standard => {
        const set = getStandardSetForStandard(standard.id)
        userPrompt += `\n• [${set?.shortName || 'Standard'}] ${standard.code}: ${standard.title}`
      })
    }

    userPrompt += `

OUTPUT FORMAT - STRICT JSON STRUCTURE:
Return a valid JSON object with this EXACT structure. Do NOT mix formats.

{
  "title": "Clear, descriptive title",
  "content": "PURE MARKDOWN ONLY - no JSON, no question objects, just the lesson text with headers and paragraphs",
  "objectives": ["Learning objective 1", "Learning objective 2", "Learning objective 3"],
  "keyTerms": [{"term": "Term", "definition": "Clear definition"}],
  ${includeEmbeddedQuestions ? `"embeddedQuestions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question about the section content",
      "afterSection": "Section Header Name",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct",
      "points": 1
    }
  ],` : ''}
  ${includeCheckQuestions ? '"checkForUnderstanding": [{"question": "Question text", "answer": "Answer text"}],' : ''}
  "estimatedReadingTime": 5
}

CRITICAL RULES:
1. The "content" field must contain ONLY Markdown text (headers, paragraphs, bold text, etc.)
2. Do NOT put any JSON objects or question data inside the "content" field
3. All questions must go in the "embeddedQuestions" array as proper JSON objects
4. Write equations as plain text like "F = ma" or "v = d/t"
5. Use section headers in content like "## Section Name" and reference them in afterSection`

    try {
      let responseContent: string | null = null

      // Use Google Vertex AI Gemini
      console.log('Generating lesson with Vertex AI Gemini...')

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
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: includeEmbeddedQuestions ? 8192 : 4096,
          responseMimeType: 'application/json'
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
        throw new Error('No response from Vertex AI')
      }

      let generated: GeneratedLesson
      try {
        const parsed = JSON.parse(responseContent)
        
        // Clean up any LaTeX that AI might have generated despite instructions
        let cleanContent = parsed.content || ''
        // Remove LaTeX delimiters and convert to plain text
        cleanContent = cleanContent
          .replace(/\\\\\(/g, '')  // Remove \\(
          .replace(/\\\\\)/g, '')  // Remove \\)
          .replace(/\\\\\[/g, '')  // Remove \\[
          .replace(/\\\\\]/g, '')  // Remove \\]
          .replace(/\\\(/g, '')    // Remove \(
          .replace(/\\\)/g, '')    // Remove \)
          .replace(/\\\[/g, '')    // Remove \[
          .replace(/\\\]/g, '')    // Remove \]
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')  // \frac{a}{b} -> a/b
          .replace(/\\text\{([^}]+)\}/g, '$1')  // \text{m/s} -> m/s
          .replace(/\\cdot/g, '×')  // \cdot -> ×
          .replace(/\\times/g, '×')  // \times -> ×
          .replace(/\\div/g, '÷')   // \div -> ÷
          .replace(/\\sqrt\{([^}]+)\}/g, '√$1')  // \sqrt{x} -> √x
          .replace(/\\Delta/g, 'Δ')  // \Delta -> Δ
          .replace(/\\quad/g, ' ')   // \quad -> space
          .replace(/\\\\/g, '')      // Remove remaining backslashes
        
        // Count words in the content
        const actualWordCount = cleanContent.split(/\s+/).length || 0
        
        // Process embedded questions if present
        const embeddedQuestions: EmbeddedQuestion[] = (parsed.embeddedQuestions || []).map((q: any, idx: number) => ({
          id: q.id || `eq-${idx + 1}`,
          type: q.type || 'multiple-choice',
          question: q.question || '',
          afterSection: q.afterSection || '',
          options: q.options,
          correctAnswer: q.correctAnswer,
          sampleAnswer: q.sampleAnswer,
          explanation: q.explanation || '',
          points: q.points || 1
        }))

        generated = {
          title: parsed.title || lessonTitle || 'Physics Lesson',
          content: cleanContent,
          objectives: parsed.objectives || [],
          keyTerms: parsed.keyTerms || [],
          embeddedQuestions: embeddedQuestions.length > 0 ? embeddedQuestions : undefined,
          checkForUnderstanding: parsed.checkForUnderstanding,
          estimatedReadingTime: parsed.estimatedReadingTime || Math.ceil(actualWordCount / 200),
          masteryLevel: level.name,
          metadata: {
            topic: topicDetails?.name,
            environments: envDetails.map(e => e?.name).filter(Boolean) as string[],
            generatedAt: new Date().toISOString(),
            wordCount: actualWordCount,
            alignedStandards: standardDetails.length > 0 
              ? standardDetails.map(s => ({ code: s.code, title: s.title }))
              : undefined,
            aiModel: 'Gemini 2.0 Flash'
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseContent)
        throw new Error('Invalid response format from Vertex AI')
      }

      // Validate required fields
      if (!generated.content) {
        throw new Error('Generated lesson has no content')
      }

      return NextResponse.json({
        success: true,
        lesson: generated
      })

    } catch (aiError: unknown) {
      console.error('Vertex AI error:', aiError)

      const error = aiError as { status?: number; message?: string }

      if (error.status === 401) {
        return NextResponse.json(
          { error: 'AI authentication failed. Please check the Vertex AI / Google Cloud configuration.' },
          { status: 401 }
        )
      } else if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to generate lesson', 
          details: error.message || 'Unknown error occurred'
        },
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

// GET endpoint to retrieve configuration options
// eslint-disable-next-line no-restricted-syntax -- returns static lesson-config options, no auth required
export async function GET() {
  return NextResponse.json({
    masteryLevels: masteryLevels.map(l => ({
      id: l.id,
      name: l.name,
      gradeRange: l.gradeRange,
      description: l.description
    })),
    topics: physicsTopics.map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      description: t.description,
      termCount: t.terms.length
    })),
    environments: realWorldEnvironments.map(e => ({
      id: e.id,
      name: e.name,
      icon: e.icon,
      description: e.description,
      bestForTopics: e.bestForTopics
    })),
    lessonStructures: lessonStructures.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      estimatedWords: s.estimatedWords
    }))
  })
}

