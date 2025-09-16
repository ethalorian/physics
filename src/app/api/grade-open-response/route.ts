import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { 
      studentAnswer, 
      questionText,
      correctConcepts = [],
      commonMisconceptions = [],
      rubric = [],
      sampleAnswer,
      maxPoints = 10
    } = await request.json()

    if (!studentAnswer || !questionText) {
      return NextResponse.json(
        { error: 'Student answer and question text are required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert HIGH SCHOOL conceptual physics teacher grading student responses.
    
    IMPORTANT: This is for high school students (ages 14-18) with Algebra 1 level math skills.
    
    Your task is to evaluate the student's answer based on:
    1. Physics concept understanding (not just memorization)
    2. Correct use of physics terminology
    3. Logical reasoning and explanation
    4. Identification of ACTUAL misconceptions present in their answer (not hypothetical ones)
    
    IMPORTANT: Only identify misconceptions that are ACTUALLY PRESENT in the student's answer.
    Do NOT assume misconceptions that aren't demonstrated in their response.
    
    Be encouraging but accurate in your assessment. Remember these are teenage students learning physics.
    
    Return your evaluation in this EXACT JSON format:
    {
      "score": 8,
      "maxScore": 10,
      "conceptsIdentified": ["List of physics concepts the student correctly understood"],
      "misconceptionsFound": ["ONLY list misconceptions ACTUALLY present in the answer - leave empty array [] if none"],
      "strengths": ["What the student did well"],
      "improvements": ["Specific suggestions for improvement based on their actual errors"],
      "feedback": "Constructive feedback message addressing their specific answer"
    }
    
    CRITICAL: In misconceptionsFound, ONLY include misconceptions that are EXPLICITLY demonstrated in the student's answer. 
    Do NOT add generic misconceptions that aren't evident in their response.`

    const rubricText = rubric.length > 0 
      ? `\nGrading Rubric:\n${rubric.map((r: any) => `- ${r.name} (${r.maxPoints} points): ${r.description}`).join('\n')}`
      : ''

    const conceptsText = correctConcepts.length > 0
      ? `\nKey Concepts to Look For:\n${correctConcepts.map((c: string) => `- ${c}`).join('\n')}`
      : ''

    const misconceptionsText = commonMisconceptions.length > 0
      ? `\nCommon Misconceptions to Check:\n${commonMisconceptions.map((m: string) => `- ${m}`).join('\n')}`
      : ''

    const sampleText = sampleAnswer
      ? `\nSample Correct Answer:\n${sampleAnswer}`
      : ''

    const userPrompt = `Grade this HIGH SCHOOL physics student's response:

    QUESTION: ${questionText}
    
    STUDENT'S ANSWER: ${studentAnswer}
    ${conceptsText}${misconceptionsText}${rubricText}${sampleText}
    
    Maximum Points: ${maxPoints}
    
    Remember to:
    1. Check if key physics concepts are understood
    2. Identify any misconceptions or errors
    3. Provide constructive feedback appropriate for a high school student
    4. Use encouraging language while being accurate
    5. Focus on conceptual understanding over memorization`

    try {
      let completion
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 800,
          response_format: { type: "json_object" }
        })
      } catch (gpt4Error: any) {
        console.log('GPT-4 failed, trying GPT-3.5-turbo:', gpt4Error.message)
        completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-1106",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 800,
          response_format: { type: "json_object" }
        })
      }

      const responseContent = completion.choices[0]?.message?.content
      
      if (!responseContent) {
        throw new Error('No response from OpenAI')
      }

      let evaluation
      try {
        evaluation = JSON.parse(responseContent)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', responseContent)
        throw new Error('Invalid response format from OpenAI')
      }

      // Calculate percentage
      const percentage = Math.round((evaluation.score / evaluation.maxScore) * 100)
      
      // Determine if any major misconceptions were found
      // Check if any identified misconceptions match the common ones we're looking for
      const hasMajorMisconceptions = Boolean(
        evaluation.misconceptionsFound && 
        evaluation.misconceptionsFound.length > 0 &&
        commonMisconceptions.length > 0 &&
        evaluation.misconceptionsFound.some((found: string) => {
          const foundLower = found.toLowerCase()
          return commonMisconceptions.some((common: string) => {
            const commonLower = common.toLowerCase()
            // Check for key phrases that indicate the same misconception
            const keyPhrases = [
              'heavier', 'faster', 'mass', 'weight', 'velocity', 'acceleration',
              'force', 'constant', 'fall', 'gravity'
            ]
            
            // If both contain similar key phrases, they likely refer to the same misconception
            const foundKeywords = keyPhrases.filter(phrase => foundLower.includes(phrase))
            const commonKeywords = keyPhrases.filter(phrase => commonLower.includes(phrase))
            
            // If they share at least 2 keywords, consider it a match
            const sharedKeywords = foundKeywords.filter(k => commonKeywords.includes(k))
            return sharedKeywords.length >= 2
          })
        })
      )

      return NextResponse.json({
        score: evaluation.score,
        maxScore: evaluation.maxScore || maxPoints,
        percentage: percentage,
        feedback: evaluation.feedback,
        conceptsIdentified: evaluation.conceptsIdentified || [],
        misconceptionsFound: evaluation.misconceptionsFound || [],
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        hasMajorMisconceptions: hasMajorMisconceptions,
        passed: percentage >= 70 && !hasMajorMisconceptions
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
          error: 'Failed to grade response', 
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
