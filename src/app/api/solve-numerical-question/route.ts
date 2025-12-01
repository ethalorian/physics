import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface SolveNumericalRequest {
  questionText: string
  topic?: string  // Optional hint about the physics topic
}

export async function POST(request: Request) {
  try {
    const body: SolveNumericalRequest = await request.json()
    const { questionText, topic } = body

    if (!questionText) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert HIGH SCHOOL physics teacher solving problems for students with Algebra 1 level math skills.

TARGET AUDIENCE: High school students (ages 14-18)
MATH LEVEL: Algebra only (no calculus)
GRAVITY: Use g = 10 m/s² (standard high school simplification)

Your task is to:
1. Identify the given values from the problem
2. Determine what is being asked for
3. Select the appropriate formula
4. Solve step-by-step showing all work
5. Provide the final answer with correct units
6. Explain the physics concepts involved
7. Identify common mistakes students might make

FORMAT ALL EQUATIONS IN LATEX using double backslashes for LaTeX commands.

Return your response in this EXACT JSON format:
{
  "givenValues": [
    { "name": "mass", "symbol": "m", "value": 5, "unit": "kg" },
    { "name": "velocity", "symbol": "v", "value": 10, "unit": "m/s" }
  ],
  "unknownQuantity": { "name": "kinetic energy", "symbol": "KE", "unit": "J" },
  "formula": "KE = (1/2)mv²",
  "formulaLatex": "KE = \\\\frac{1}{2}mv^2",
  "correctValue": 250,
  "unit": "J",
  "tolerance": 5,
  "solutionSteps": [
    { 
      "step": 1, 
      "description": "Identify what we know from the problem",
      "equation": "m = 5 \\\\text{ kg}, \\\\quad v = 10 \\\\text{ m/s}"
    },
    { 
      "step": 2, 
      "description": "Write the kinetic energy formula",
      "equation": "KE = \\\\frac{1}{2}mv^2"
    },
    { 
      "step": 3, 
      "description": "Substitute the known values",
      "equation": "KE = \\\\frac{1}{2}(5 \\\\text{ kg})(10 \\\\text{ m/s})^2"
    },
    { 
      "step": 4, 
      "description": "Square the velocity first",
      "equation": "KE = \\\\frac{1}{2}(5)(100) \\\\text{ kg} \\\\cdot \\\\text{m}^2/\\\\text{s}^2"
    },
    {
      "step": 5,
      "description": "Complete the calculation",
      "equation": "KE = \\\\frac{500}{2} = 250 \\\\text{ J}",
      "result": "250 J"
    }
  ],
  "explanation": "Kinetic energy is the energy of motion. It depends on both mass and velocity, but velocity has a stronger effect because it's squared. This means doubling the speed quadruples the kinetic energy!",
  "topic": "energy",
  "conceptsUsed": ["kinetic energy", "work-energy theorem"],
  "commonMistakes": [
    { "incorrectValue": 500, "misconception": "Forgot to multiply by 1/2" },
    { "incorrectValue": 50, "misconception": "Forgot to square the velocity" },
    { "incorrectValue": 25, "misconception": "Divided by velocity instead of squaring" }
  ],
  "unitOptions": ["J", "N", "W", "kg⋅m/s"]
}`

    const topicHint = topic ? `\nHINT: This problem is related to ${topic}.` : ''

    const userPrompt = `Solve this HIGH SCHOOL physics problem step-by-step:

PROBLEM: ${questionText}${topicHint}

Requirements:
1. Use g = 10 m/s² if gravity is needed
2. Show all work with clear steps
3. Use LaTeX for all equations (double backslashes)
4. Explain WHY each step is done
5. Identify potential mistakes students might make
6. Keep explanations at a high school level

Solve this completely and provide a thorough step-by-step solution.`

    try {
      let completion
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,  // Lower for more consistent/accurate solutions
          max_tokens: 2500,
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
          temperature: 0.3,
          max_tokens: 2500,
          response_format: { type: "json_object" }
        })
      }

      const responseContent = completion.choices[0]?.message?.content
      
      if (!responseContent) {
        throw new Error('No response from OpenAI')
      }

      let solution
      try {
        solution = JSON.parse(responseContent)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', responseContent)
        throw new Error('Invalid response format from OpenAI')
      }

      // Validate required fields
      if (solution.correctValue === undefined) {
        throw new Error('Could not determine the answer')
      }

      // Add metadata
      solution.solutionGeneratedByAI = true

      return NextResponse.json({
        ...solution,
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
          error: 'Failed to solve question', 
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

