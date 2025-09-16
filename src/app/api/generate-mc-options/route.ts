import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Configure route segment for longer timeout
export const maxDuration = 60 // 60 seconds for OpenAI API calls

export async function POST(request: Request) {
  try {
    const { questionText, topic } = await request.json()

    if (!questionText) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert HIGH SCHOOL conceptual physics teacher creating multiple choice questions for students with Algebra 1 level math skills.
    
    TARGET AUDIENCE: High school students (ages 14-18) studying conceptual physics
    MATH LEVEL: Algebra 1 only (no trigonometry beyond basic sin/cos/tan, no calculus)
    
    IMPORTANT REQUIREMENTS:
    1. Use ONLY algebra-based physics (no calculus, minimal trig)
    2. Keep calculations simple and use round numbers when possible
    3. For NUMERICAL questions: Show step-by-step work using only basic algebra
    4. For CONCEPTUAL questions: Use everyday language and relatable examples
    5. Create 4 INCORRECT options based on common HIGH SCHOOL student mistakes:
       - Mixing up multiplication and division
       - Forgetting to square values (like in KE = ½mv²)
       - Confusing similar concepts (speed vs velocity, mass vs weight)
       - Common algebra errors (distributing incorrectly, wrong order of operations)
       - Everyday misconceptions (heavier objects fall faster, etc.)
    6. Include units but keep them simple (m/s not km/hr, kg not g)
    7. Avoid complex scenarios - use cars, balls, ramps, simple machines
    8. Make explanations clear for teenage students
    
    Return the response in this EXACT JSON format (no additional text):
    {
      "correctAnswer": {
        "value": "20 m/s",
        "explanation": "Using v = d/t, velocity = 100m / 5s = 20 m/s"
      },
      "incorrectOptions": [
        {
          "value": "10 m/s",
          "misconception": "Divided by 10 instead of 5 (calculation error)"
        },
        {
          "value": "40 m/s",
          "misconception": "Multiplied instead of divided (formula confusion)"
        },
        {
          "value": "500 m",
          "misconception": "Forgot to divide by time (incomplete calculation)"
        },
        {
          "value": "25 m/s",
          "misconception": "Added 5 to distance before dividing (order of operations error)"
        }
      ],
      "concept": "Kinematics - Average Velocity",
      "detailedExplanation": "This problem tests understanding of average velocity calculation using the formula v = d/t where distance = 100m and time = 5s"
    }
    
    IMPORTANT: Return ONLY valid JSON, no markdown formatting, no extra text before or after.`

    const userPrompt = `Generate multiple choice options for this HIGH SCHOOL conceptual physics question:

    "${questionText}"
    
    ${topic ? `Topic/Context: ${topic}` : ''}
    
    REMEMBER: This is for high school students with only Algebra 1 skills!
    
    STEP-BY-STEP APPROACH:
    1. Identify if this is numerical or conceptual
    2. For numerical problems:
       - Use simple formulas (v=d/t, F=ma, KE=½mv², PE=mgh, p=mv)
       - Show each algebra step clearly
       - Use g=10 m/s² for simplicity (not 9.8)
       - Keep numbers simple (5, 10, 20, 100, etc.)
    3. For conceptual questions:
       - Use everyday examples teens can relate to
       - Avoid jargon and complex terminology
    
    Common HIGH SCHOOL student mistakes to test:
    - Forgetting to square velocity in energy problems
    - Mixing up distance and displacement
    - Thinking heavier objects fall faster
    - Confusing mass (kg) with weight (N)
    - Adding/subtracting when should multiply/divide
    - Using the wrong formula entirely
    - Forgetting the ½ in KE = ½mv²
    
    Keep all answers at a high school level - no complex math or advanced concepts!`

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI API request timed out after 45 seconds')), 45000)
      })

      // Try GPT-4 first, fall back to GPT-3.5-turbo if needed
      let completion: any
      try {
        const gpt4Promise = openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3, // Lower temperature for more consistent calculations
          max_tokens: 1000,
          response_format: { type: "json_object" }
        })
        
        completion = await Promise.race([gpt4Promise, timeoutPromise])
      } catch (gpt4Error: any) {
        console.log('GPT-4 failed, trying GPT-3.5-turbo:', gpt4Error.message)
        
        // Fallback to GPT-3.5-turbo with timeout
        const gpt35Promise = openai.chat.completions.create({
          model: "gpt-3.5-turbo-1106", // Latest version with JSON mode support
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        })
        
        completion = await Promise.race([gpt35Promise, timeoutPromise])
      }

      const responseContent = completion.choices[0]?.message?.content
      
      if (!responseContent) {
        throw new Error('No response from OpenAI')
      }

      let generatedOptions
      try {
        generatedOptions = JSON.parse(responseContent)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', responseContent)
        throw new Error('Invalid response format from OpenAI')
      }
      
      // Create the final options array with correct answer and decoys
      const allOptions = [
        {
          text: generatedOptions.correctAnswer.value,
          isCorrect: true,
          explanation: generatedOptions.correctAnswer.explanation
        },
        ...generatedOptions.incorrectOptions.map((opt: any) => ({
          text: opt.value,
          isCorrect: false,
          misconception: opt.misconception
        }))
      ]

      // Shuffle the options to randomize correct answer position
      const shuffledOptions = shuffleArray(allOptions)
      const correctIndex = shuffledOptions.findIndex(opt => opt.isCorrect)

      return NextResponse.json({
        options: shuffledOptions.map(opt => opt.text),
        correctIndex: correctIndex,
        explanations: shuffledOptions.map(opt => 
          opt.isCorrect 
            ? `✓ CORRECT: ${opt.explanation || 'This is the correct answer'}` 
            : `✗ ${opt.misconception || 'Incorrect option'}`
        ),
        concept: generatedOptions.concept,
        detailedExplanation: generatedOptions.detailedExplanation,
        correctAnswer: generatedOptions.correctAnswer.value
      })

    } catch (openAIError: any) {
      console.error('OpenAI API error:', openAIError)
      
      // Handle timeout specifically
      if (openAIError.message?.includes('timed out')) {
        return NextResponse.json(
          { 
            error: 'Request timed out', 
            details: 'The AI service took too long to respond. Please try again with a simpler question or try again later.',
            timeout: true
          },
          { status: 408 }
        )
      }
      
      // Provide detailed error information
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
      } else if (openAIError.status === 500) {
        return NextResponse.json(
          { error: 'OpenAI service error. Please try again.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to generate options', 
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

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
