import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { gradeOpenResponse, batchGradeOpenResponses, GradingContext } from '@/lib/openai-grading'
import { OpenResponseQuestion } from '@/types/assignment'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questions, answers, context, mode = 'batch' } = body

    // Validate input
    if (!questions || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: questions and answers' }, 
        { status: 400 }
      )
    }

    // Filter for open response questions that should be auto-graded
    const openResponseQuestions = questions.filter(
      (q: OpenResponseQuestion) => q.type === 'open-response' && q.autoGrade
    )

    if (openResponseQuestions.length === 0) {
      return NextResponse.json({ grades: [] })
    }

    let grades
    
    if (mode === 'single' && openResponseQuestions.length === 1) {
      // Grade a single question
      const question = openResponseQuestions[0]
      const answer = answers[question.id]
      
      if (!answer) {
        return NextResponse.json(
          { error: 'No answer provided for the question' }, 
          { status: 400 }
        )
      }

      const grade = await gradeOpenResponse(question, answer, context as GradingContext)
      grades = [grade]
    } else {
      // Batch grade multiple questions
      grades = await batchGradeOpenResponses(
        openResponseQuestions, 
        answers, 
        context as GradingContext
      )
    }

    return NextResponse.json({ 
      grades,
      gradedAt: new Date().toISOString(),
      gradedBy: 'ai'
    })

  } catch (error) {
    console.error('Error in grade-assignment API:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to grade assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
