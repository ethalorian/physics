import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const POST = withAuth(async (request, ctx) => {
    const body = await request.json()
    const { questionId, assignmentId } = body

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
    }

    // Log the usage
    const { error: logError } = await supabaseAdmin
      .from('question_usage_log')
      .insert([{
        question_id: questionId,
        assignment_id: assignmentId,
        user_id: ctx.userId
      }])

    if (logError) {
      console.error('Error logging usage:', logError)
    }

    // Increment usage count
    const { error: updateError } = await supabaseAdmin
      .rpc('increment_question_usage', { question_id: questionId })

    if (updateError) {
      console.error('Error incrementing usage count:', updateError)
    }

    return NextResponse.json({ success: true })
})
