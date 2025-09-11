import OpenAI from 'openai'
import { OpenResponseQuestion, RubricScore, OpenResponseGrade } from '@/types/assignment'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GradingContext {
  subject?: string
  lessonTitle?: string
  additionalContext?: string
}

/**
 * Grade an open response answer using OpenAI based on a rubric
 */
export async function gradeOpenResponse(
  question: OpenResponseQuestion,
  studentAnswer: string,
  context?: GradingContext
): Promise<OpenResponseGrade> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }

  // Build the grading prompt
  const prompt = buildGradingPrompt(question, studentAnswer, context)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert physics teacher grading student responses. Provide detailed, constructive feedback based on the provided rubric. Be fair but thorough in your assessment.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent grading
      max_tokens: 1500
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse the AI response into structured grades
    return parseGradingResponse(question, response)
  } catch (error) {
    console.error('Error grading with OpenAI:', error)
    throw new Error('Failed to grade response with AI')
  }
}

/**
 * Build a comprehensive grading prompt
 */
function buildGradingPrompt(
  question: OpenResponseQuestion,
  studentAnswer: string,
  context?: GradingContext
): string {
  let prompt = `Please grade the following student response based on the provided rubric.

**Question:** ${question.question}

**Student Answer:**
${studentAnswer}

**Grading Rubric:**
`

  // Add each rubric criterion
  question.rubric.forEach((criterion, index) => {
    prompt += `
${index + 1}. **${criterion.name}** (${criterion.maxPoints} points)
   Description: ${criterion.description}
   
   Scoring Levels:`
    
    criterion.levels.forEach(level => {
      prompt += `
   - ${level.score} points: ${level.description}`
    })
    prompt += '\n'
  })

  // Add sample answer if provided
  if (question.sampleAnswer) {
    prompt += `\n**Sample Answer (for reference):**
${question.sampleAnswer}\n`
  }

  // Add context if provided
  if (context) {
    prompt += '\n**Context:**'
    if (context.subject) prompt += `\nSubject: ${context.subject}`
    if (context.lessonTitle) prompt += `\nLesson: ${context.lessonTitle}`
    if (context.additionalContext) prompt += `\nAdditional Context: ${context.additionalContext}`
    prompt += '\n'
  }

  // Add custom grading prompt if provided
  if (question.gradePrompt) {
    prompt += `\n**Additional Grading Instructions:**
${question.gradePrompt}\n`
  }

  prompt += `
**Instructions:**
1. Evaluate the student's response against each rubric criterion
2. Assign a score for each criterion based on the scoring levels
3. Provide specific feedback for each criterion explaining the score
4. Give an overall summary of the response's strengths and areas for improvement

**Response Format:**
Please respond in the following JSON format:
{
  "criterionScores": [
    {
      "criterionId": "criterion_id",
      "score": number,
      "feedback": "specific feedback for this criterion"
    }
  ],
  "overallFeedback": "Summary feedback about the overall response"
}

Make sure your response is valid JSON and includes all criteria.`

  return prompt
}

/**
 * Parse the OpenAI response into structured grading data
 */
function parseGradingResponse(question: OpenResponseQuestion, response: string): OpenResponseGrade {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate and structure the response
    const rubricScores: RubricScore[] = question.rubric.map(criterion => {
      const scoreData = parsed.criterionScores?.find(
        (cs: {criterionId: string, score: number, feedback: string}) => cs.criterionId === criterion.id
      )
      
      return {
        criterionId: criterion.id,
        score: scoreData?.score || 0,
        feedback: scoreData?.feedback || 'No feedback provided'
      }
    })

    // Calculate total score
    const totalScore = rubricScores.reduce((sum, score) => sum + score.score, 0)

    return {
      questionId: question.id,
      rubricScores,
      totalScore,
      overallFeedback: parsed.overallFeedback || 'No overall feedback provided',
      aiGenerated: true
    }
  } catch (error) {
    console.error('Error parsing grading response:', error)
    
    // Fallback: create a basic grade structure
    const rubricScores: RubricScore[] = question.rubric.map(criterion => ({
      criterionId: criterion.id,
      score: 0,
      feedback: 'Unable to parse AI feedback. Please grade manually.'
    }))

    return {
      questionId: question.id,
      rubricScores,
      totalScore: 0,
      overallFeedback: 'AI grading failed. Manual review required.',
      aiGenerated: false
    }
  }
}

/**
 * Batch grade multiple open response questions
 */
export async function batchGradeOpenResponses(
  questions: OpenResponseQuestion[],
  answers: Record<string, string>,
  context?: GradingContext
): Promise<OpenResponseGrade[]> {
  const grades: OpenResponseGrade[] = []
  
  for (const question of questions) {
    if (question.type === 'open-response' && question.autoGrade && answers[question.id]) {
      try {
        const grade = await gradeOpenResponse(question, answers[question.id], context)
        grades.push(grade)
      } catch (error) {
        console.error(`Failed to grade question ${question.id}:`, error)
        // Add a failed grade entry
        grades.push({
          questionId: question.id,
          rubricScores: question.rubric.map(criterion => ({
            criterionId: criterion.id,
            score: 0,
            feedback: 'Grading failed. Please review manually.'
          })),
          totalScore: 0,
          overallFeedback: 'Automatic grading failed. Manual review required.',
          aiGenerated: false
        })
      }
    }
  }
  
  return grades
}
