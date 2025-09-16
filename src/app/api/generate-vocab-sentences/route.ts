import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or teacher using the permission system
    const userRole = getUserRole(session.user?.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Only admin/teacher can generate sentences' }, { status: 403 })
    }

    const body = await request.json()
    const { vocabularyTerms, context, unit, lesson } = body

    if (!vocabularyTerms || !Array.isArray(vocabularyTerms) || vocabularyTerms.length === 0) {
      return NextResponse.json({ error: 'Vocabulary terms are required' }, { status: 400 })
    }

    // Create the prompt for OpenAI
    const termsInfo = vocabularyTerms.map((term) => 
      `- ${term.term}: ${term.definition}${term.category ? ` (Category: ${term.category})` : ''}`
    ).join('\n')

    const unitContext = unit ? getUnitContext(unit) : ''
    const lessonContext = lesson ? getLessonContext(lesson) : ''

    const prompt = `You are a physics teacher creating fill-in-the-blank sentences for vocabulary practice.

Context: ${context || 'Physics vocabulary practice'}
${unitContext}
${lessonContext}

Vocabulary Terms:
${termsInfo}

Create meaningful, educational sentences for each vocabulary term where the term can be naturally replaced with a blank. The sentences should:

1. Use the vocabulary term in a realistic physics context or scenario
2. Be appropriate for high school physics students
3. Include specific examples, numbers, or real-world applications when possible
4. Make the meaning clear from context clues
5. Be engaging and help students understand the concept
6. Use {term} as the placeholder where the vocabulary word goes
7. Vary sentence structure and complexity
8. Connect to physics principles and everyday examples

Return ONLY a JSON array with this exact format:
[
  {
    "termId": "term-id-here",
    "sentence": "Sentence with {term} placeholder here.",
    "explanation": "Brief explanation of why this sentence works well"
  }
]

Example format:
[
  {
    "termId": "velocity-id",
    "sentence": "When a race car's {term} changes from 30 m/s to 50 m/s during acceleration, its speed increases significantly.",
    "explanation": "Uses specific values and shows velocity in a dynamic context"
  }
]`

function getUnitContext(unitId: string): string {
  const unitContexts: Record<string, string> = {
    'unit-1': 'Focus on motion, kinematics, velocity, acceleration, and displacement concepts',
    'unit-2': 'Focus on forces, Newton\'s laws, friction, and force interactions',
    'unit-3': 'Focus on energy, work, power, and energy conservation principles',
    'unit-4': 'Focus on momentum, collisions, and conservation of momentum',
    'unit-5': 'Focus on waves, sound, frequency, and wave properties',
    'unit-6': 'Focus on electricity, magnetism, circuits, and electromagnetic phenomena'
  }
  return unitContexts[unitId] ? `Physics Unit Context: ${unitContexts[unitId]}` : ''
}

function getLessonContext(lessonId: string): string {
  const lessonContexts: Record<string, string> = {
    'lesson-1-1': 'Introduction to Motion - position, distance, displacement',
    'lesson-1-2': 'Velocity and Speed - understanding vector vs scalar quantities',
    'lesson-1-3': 'Acceleration - rate of change of velocity',
    'lesson-2-1': 'Introduction to Forces - types of forces and force diagrams',
    'lesson-2-2': 'Newton\'s First Law - inertia and balanced forces',
    'lesson-2-3': 'Newton\'s Second Law - F = ma relationship',
    'lesson-3-1': 'Work and Power - defining work in physics',
    'lesson-3-2': 'Kinetic Energy - energy of motion'
  }
  return lessonContexts[lessonId] ? `Lesson Context: ${lessonContexts[lessonId]}` : ''
}

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const aiResponse = response.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    try {
      // Parse the JSON response
      const sentences = JSON.parse(aiResponse)
      
      if (!Array.isArray(sentences)) {
        throw new Error('Response is not an array')
      }

      // Validate the response format
      const validatedSentences = sentences.map((item, index) => {
        if (!item.termId || !item.sentence) {
          throw new Error(`Invalid sentence format at index ${index}`)
        }

        // Find the corresponding term
        const term = vocabularyTerms.find(t => t.id === item.termId)
        if (!term) {
          // If termId doesn't match, use the term by index
          const termByIndex = vocabularyTerms[index]
          if (termByIndex) {
            item.termId = termByIndex.id
          } else {
            throw new Error(`No matching term found for sentence at index ${index}`)
          }
        }

        // Ensure the sentence has the {term} placeholder
        if (!item.sentence.includes('{term}')) {
          throw new Error(`Sentence at index ${index} must contain {term} placeholder`)
        }

        return {
          id: `sentence-${Date.now()}-${index}`,
          text: item.sentence,
          termId: item.termId,
          explanation: item.explanation || ''
        }
      })

      return NextResponse.json({
        success: true,
        sentences: validatedSentences,
        count: validatedSentences.length
      })

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.error('AI Response was:', aiResponse)
      
      // Fallback: Create simple sentences
      const fallbackSentences = vocabularyTerms.map((term, index) => ({
        id: `sentence-${Date.now()}-${index}`,
        text: `The concept of {term} is fundamental in physics.`,
        termId: term.id,
        explanation: 'Generated fallback sentence'
      }))

      return NextResponse.json({
        success: true,
        sentences: fallbackSentences,
        count: fallbackSentences.length,
        note: 'Used fallback sentence generation due to AI parsing error'
      })
    }

  } catch (error) {
    console.error('Error in POST /api/generate-vocab-sentences:', error)
    
    // Emergency fallback
    try {
      const body = await request.json()
      const { vocabularyTerms } = body
      
      const emergencyFallback = vocabularyTerms.map((term: any, index: number) => ({
        id: `sentence-${Date.now()}-${index}`,
        text: `Understanding {term} is important in physics.`,
        termId: term.id,
        explanation: 'Emergency fallback sentence'
      }))

      return NextResponse.json({
        success: true,
        sentences: emergencyFallback,
        count: emergencyFallback.length,
        note: 'Used emergency fallback due to API error'
      })
    } catch (fallbackError) {
      return NextResponse.json({ error: 'Failed to generate sentences' }, { status: 500 })
    }
  }
}
