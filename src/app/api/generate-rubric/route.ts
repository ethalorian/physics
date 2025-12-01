import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { RubricCriterion } from '@/types/assignment'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenerateRubricRequest {
  questionText: string
  maxPoints?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  numberOfCriteria?: number
  focusAreas?: string[]  // Optional: specific areas to include in rubric
}

interface GeneratedRubric {
  rubric: RubricCriterion[]
  sampleAnswer: string
  correctConcepts: string[]
  commonMisconceptions: string[]
}

export async function POST(request: Request) {
  try {
    const body: GenerateRubricRequest = await request.json()
    const { 
      questionText, 
      maxPoints = 20, 
      difficulty = 'medium',
      numberOfCriteria = 3,
      focusAreas = []
    } = body

    if (!questionText) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert HIGH SCHOOL physics teacher creating grading rubrics.

TARGET AUDIENCE: High school students (ages 14-18) studying conceptual physics
MATH LEVEL: Algebra 1 only (no calculus)

Your task is to create a comprehensive grading rubric for a physics question that:
1. Has clear, measurable criteria
2. Is appropriate for high school level
3. Encourages conceptual understanding over memorization
4. Provides clear distinctions between performance levels
5. Uses physics terminology correctly

Return your response in this EXACT JSON format:
{
  "rubric": [
    {
      "id": "criterion-1",
      "name": "Criterion Name",
      "description": "What this criterion evaluates",
      "maxPoints": 10,
      "levels": [
        { "score": 10, "description": "Exemplary performance description" },
        { "score": 8, "description": "Proficient performance description" },
        { "score": 6, "description": "Developing performance description" },
        { "score": 4, "description": "Beginning performance description" },
        { "score": 0, "description": "Not demonstrated" }
      ]
    }
  ],
  "sampleAnswer": "A high-quality sample answer that demonstrates exemplary understanding",
  "correctConcepts": ["List of key physics concepts students should demonstrate"],
  "commonMisconceptions": ["List of common errors or misunderstandings to watch for"]
}`

    const focusAreasText = focusAreas.length > 0
      ? `\nFocus Areas to Include: ${focusAreas.join(', ')}`
      : ''

    const userPrompt = `Create a grading rubric for this physics question:

QUESTION: ${questionText}

REQUIREMENTS:
- Total Points: ${maxPoints}
- Difficulty Level: ${difficulty}
- Number of Criteria: ${numberOfCriteria}${focusAreasText}

Guidelines:
- Distribute points across criteria appropriately
- Each criterion should have 4-5 scoring levels
- Include clear descriptions for each level
- Focus on physics understanding, not just format
- The sample answer should be detailed and educational
- Identify 3-5 key concepts and 2-4 common misconceptions

IMPORTANT: Ensure the rubric total equals ${maxPoints} points.`

    try {
      let completion
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
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
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        })
      }

      const responseContent = completion.choices[0]?.message?.content
      
      if (!responseContent) {
        throw new Error('No response from OpenAI')
      }

      let generated: GeneratedRubric
      try {
        generated = JSON.parse(responseContent)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', responseContent)
        throw new Error('Invalid response format from OpenAI')
      }

      // Add unique IDs to rubric criteria if not present
      const rubricWithIds = generated.rubric.map((criterion, index) => ({
        ...criterion,
        id: criterion.id || `criterion-${Date.now()}-${index}`
      }))

      // Calculate actual total points
      const totalPoints = rubricWithIds.reduce((sum, c) => sum + c.maxPoints, 0)

      return NextResponse.json({
        rubric: rubricWithIds,
        sampleAnswer: generated.sampleAnswer,
        correctConcepts: generated.correctConcepts || [],
        commonMisconceptions: generated.commonMisconceptions || [],
        totalPoints,
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
          error: 'Failed to generate rubric', 
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

