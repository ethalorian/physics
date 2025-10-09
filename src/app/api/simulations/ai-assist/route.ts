import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * AI Assistant for Simulations
 * Provides hints, validates understanding, generates questions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, context, student_input } = body

    if (!action || !context) {
      return NextResponse.json({ 
        error: 'action and context required' 
      }, { status: 400 })
    }

    let result

    switch (action) {
      case 'hint':
        result = await provideHint(context)
        break
      
      case 'validate':
        result = await validateUnderstanding(context, student_input)
        break
      
      case 'generate-question':
        result = await generateQuestion(context)
        break
      
      case 'discuss':
        result = await discussConcept(context, student_input)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ result })

  } catch (error: any) {
    console.error('AI assist error:', error)
    return NextResponse.json({ 
      error: 'AI assistant failed',
      message: error.message 
    }, { status: 500 })
  }
}

// Provide a hint without giving away the answer
async function provideHint(context: any): Promise<string> {
  const systemPrompt = `You are an expert physics tutor providing hints to students working with interactive simulations.

Guidelines:
- Provide hints, not answers
- Use Socratic questioning to guide discovery
- Reference specific simulation data when relevant
- Encourage experimentation
- Be encouraging and supportive
- Use appropriate physics terminology
- Keep hints concise (2-3 sentences)`

  const userPrompt = `The student is working with the "${context.simulation_id}" simulation.
They've been working for ${Math.floor(context.time_spent / 60)} minutes.
Their question: "${context.question_asked}"

Recent interactions: ${JSON.stringify(context.student_interactions?.slice(-3) || [])}

Provide a helpful hint without giving away the answer.`

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 150
  })

  return response.choices[0].message.content || 'Try experimenting with different values and observe what changes.'
}

// Validate student understanding
async function validateUnderstanding(context: any, explanation: string): Promise<{
  understood: boolean
  feedback: string
  score: number
}> {
  const prompt = `Evaluate if this student demonstrates understanding of the physics concepts:

Simulation: ${context.simulation_id}
Student's explanation: "${explanation}"

Context: ${JSON.stringify(context.current_state)}

Respond with JSON:
{
  "understood": boolean,
  "feedback": "specific feedback",
  "score": number (0-100)
}

Be generous but ensure they demonstrate conceptual understanding, not just memorization.`

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" }
  })

  return JSON.parse(response.choices[0].message.content || '{"understood": false, "feedback": "Unable to evaluate", "score": 0}')
}

// Generate a question based on simulation activity
async function generateQuestion(context: any): Promise<any> {
  const prompt = `Based on this simulation activity, generate a relevant physics question:

Simulation: ${context.simulation_id}
Student actions: ${JSON.stringify(context.student_interactions)}
Current state: ${JSON.stringify(context.current_state)}

Create either a multiple-choice or numerical question that:
1. Tests understanding of what they just observed
2. Requires them to apply the physics concepts
3. Is appropriate difficulty

Return JSON matching this structure:
{
  "type": "multiple-choice" or "numerical",
  "question": "question text",
  "options": ["option1", "option2", "option3", "option4"], // if MC
  "correctAnswer": 0, // if MC
  "correctValue": number, // if numerical
  "unit": "m/s", // if numerical
  "tolerance": 0.1, // if numerical
  "explanation": "why this is the answer",
  "points": 5
}`

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" }
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

// Discuss a concept with the student
async function discussConcept(context: any, studentMessage: string): Promise<string> {
  const systemPrompt = `You are a physics tutor having a Socratic discussion with a student.

Guidelines:
- Ask probing questions rather than explaining directly
- Help them discover concepts themselves
- Reference what they observed in the simulation
- Build on their current understanding
- Be patient and encouraging`

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Student: ${studentMessage}\n\nContext: Working with ${context.simulation_id}` }
    ],
    temperature: 0.7,
    max_tokens: 200
  })

  return response.choices[0].message.content || 'Can you tell me more about what you observed?'
}
