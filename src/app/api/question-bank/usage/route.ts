import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, assignmentId } = body

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
    }

    // Log the usage
    const { error: logError } = await supabase
      .from('question_usage_log')
      .insert([{
        question_id: questionId,
        assignment_id: assignmentId,
        user_id: session.user.id
      }])

    if (logError) {
      console.error('Error logging usage:', logError)
    }

    // Increment usage count
    const { error: updateError } = await supabase
      .rpc('increment_question_usage', { question_id: questionId })

    if (updateError) {
      console.error('Error incrementing usage count:', updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/question-bank/usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
