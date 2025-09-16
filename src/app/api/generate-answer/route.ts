import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { questionText, questionType, correctConcepts } = await request.json()

    if (!questionText) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert HIGH SCHOOL conceptual physics teacher helping students learn.
    
    TARGET AUDIENCE: High school students (ages 14-18) studying conceptual physics
    MATH LEVEL: Algebra 1 only (no trigonometry beyond basic sin/cos/tan, no calculus)
    
    Generate a HIGH-QUALITY sample answer that:
    1. Uses appropriate physics terminology for high school level
    2. Explains concepts clearly with everyday examples
    3. Shows step-by-step reasoning for calculations
    4. Addresses all key concepts mentioned
    5. Uses g = 10 m/s² for simplicity
    6. Keeps math at Algebra 1 level
    7. Is structured with clear paragraphs
    8. Demonstrates good scientific communication
    
    The answer should be a model response that students can learn from, not just copy.
    Make it educational and explanatory, showing the thought process.`

    const conceptsText = correctConcepts && correctConcepts.length > 0
      ? `\n\nKey concepts to address:\n${correctConcepts.map((c: string) => `- ${c}`).join('\n')}`
      : ''

    const userPrompt = `Generate a HIGH-QUALITY sample answer for this high school physics question:

    QUESTION: ${questionText}
    ${conceptsText}
    
    Remember:
    - Use simple language appropriate for teenagers
    - Include relevant physics formulas
    - Show calculations step-by-step if needed
    - Use g = 10 m/s² for gravity
    - Make connections to real-world examples
    - Structure the answer clearly
    
    The answer should teach the student HOW to think about the problem, not just give the solution.`

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
          max_tokens: 800,
        })
      } catch (gpt4Error: any) {
        console.log('GPT-4 failed, trying GPT-3.5-turbo:', gpt4Error.message)
        completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800,
        })
      }

      const sampleAnswer = completion.choices[0]?.message?.content
      
      if (!sampleAnswer) {
        throw new Error('No response from OpenAI')
      }

      return NextResponse.json({
        sampleAnswer: sampleAnswer.trim(),
        success: true
      })

    } catch (openAIError: any) {
      console.error('OpenAI API error:', openAIError)
      
      if (openAIError.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your OpenAI API key configuration.' },
          { status: 401 }
        )
      } else if (openAIError.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to generate answer', 
          details: openAIError.message || 'Unknown error occurred'
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
