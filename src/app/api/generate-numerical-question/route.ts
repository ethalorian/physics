import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenerateNumericalRequest {
  topic: string  // Physics topic like 'kinematics', 'forces', 'energy', 'momentum'
  difficulty?: 'easy' | 'medium' | 'hard'
  context?: string  // Optional context like 'sports', 'cars', 'everyday life'
  specificConcept?: string  // Specific concept like 'free fall', 'F=ma', 'conservation of energy'
  includeImage?: boolean  // Whether to suggest an image scenario
}

export async function POST(request: Request) {
  try {
    const body: GenerateNumericalRequest = await request.json()
    const { 
      topic, 
      difficulty = 'medium',
      context,
      specificConcept
    } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert HIGH SCHOOL conceptual physics teacher creating word problems.

TARGET AUDIENCE: High school students (ages 14-18) with Algebra 1 level math skills
MATH LEVEL: Algebra only (no calculus, minimal trigonometry - only basic sin/cos/tan for inclined planes)
GRAVITY: Always use g = 10 m/s² for simplicity

REQUIREMENTS:
1. Create ENGAGING, REALISTIC word problems students can relate to
2. Use round numbers that are easy to calculate (10, 20, 50, 100, etc.)
3. Include clear given information
4. Have ONE clear unknown to solve for
5. Be solvable with HIGH SCHOOL algebra
6. Use SI units (meters, seconds, kilograms, newtons, joules)
7. Include real-world scenarios (sports, cars, amusement parks, everyday activities)

DIFFICULTY LEVELS:
- easy: Single formula, direct plug-and-play (e.g., v = d/t)
- medium: May require 2 steps or simple unit conversion
- hard: Requires combining concepts or multi-step reasoning

Return your response in this EXACT JSON format:
{
  "question": "The full word problem text",
  "givenValues": [
    { "name": "distance", "symbol": "d", "value": 100, "unit": "m" },
    { "name": "time", "symbol": "t", "value": 5, "unit": "s" }
  ],
  "correctValue": 20,
  "unit": "m/s",
  "tolerance": 0.5,
  "topic": "kinematics",
  "formula": "v = d/t",
  "formulaLatex": "v = \\\\frac{d}{t}",
  "solutionSteps": [
    { "step": 1, "description": "Identify what we know", "equation": "d = 100 \\\\text{ m}, \\\\quad t = 5 \\\\text{ s}" },
    { "step": 2, "description": "Write the formula for velocity", "equation": "v = \\\\frac{d}{t}" },
    { "step": 3, "description": "Substitute the values", "equation": "v = \\\\frac{100 \\\\text{ m}}{5 \\\\text{ s}}" },
    { "step": 4, "description": "Calculate the answer", "equation": "v = 20 \\\\text{ m/s}", "result": "20 m/s" }
  ],
  "explanation": "Velocity is how fast something moves in a specific direction. We find it by dividing the distance traveled by the time it took.",
  "commonMistakes": [
    { "incorrectValue": 500, "misconception": "Multiplied instead of divided (d × t)" },
    { "incorrectValue": 0.05, "misconception": "Divided time by distance (t / d)" },
    { "incorrectValue": 200, "misconception": "Calculation error or wrong formula" }
  ],
  "unitOptions": ["m/s", "km/h", "m/s²", "m"],
  "imageScenario": "A runner on a track with distance markers"
}`

    const contextText = context ? `\nREAL-WORLD CONTEXT: ${context}` : ''
    const conceptText = specificConcept ? `\nSPECIFIC CONCEPT TO TEST: ${specificConcept}` : ''

    const userPrompt = `Generate a ${difficulty} difficulty physics word problem for HIGH SCHOOL students.

TOPIC: ${topic}${contextText}${conceptText}

Requirements:
- Use g = 10 m/s² for gravity
- Round numbers (no ugly decimals like 3.7892)
- Clear, engaging scenario
- Solvable with basic algebra
- Include step-by-step solution with LaTeX equations
- Generate plausible wrong answers based on common mistakes

Make the problem interesting and relatable to teenagers!`

    try {
      let completion
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8,  // Higher for creativity in word problems
          max_tokens: 2000,
          response_format: { type: "json_object" }
        })
      } catch (gpt4Error: unknown) {
        const errorMessage = gpt4Error instanceof Error ? gpt4Error.message : 'Unknown error'
        console.log('GPT-4 failed, trying GPT-3.5-turbo:', errorMessage)
        completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-1106",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        })
      }

      const responseContent = completion.choices[0]?.message?.content
      
      if (!responseContent) {
        throw new Error('No response from OpenAI')
      }

      let generated
      try {
        generated = JSON.parse(responseContent)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', responseContent)
        throw new Error('Invalid response format from OpenAI')
      }

      // Ensure required fields
      if (!generated.question || generated.correctValue === undefined) {
        throw new Error('Missing required fields in generated question')
      }

      // Add metadata
      generated.generatedByAI = true
      generated.solutionGeneratedByAI = true
      generated.difficulty = difficulty

      return NextResponse.json({
        ...generated,
        success: true
      })

    } catch (openAIError: unknown) {
      console.error('OpenAI API error:', openAIError)
      
      const error = openAIError as { status?: number; message?: string }
      
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your OpenAI API key configuration.' },
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
          error: 'Failed to generate question', 
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
}

