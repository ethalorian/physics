// Next.js imports
import { NextResponse } from 'next/server'

// Internal imports
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Get filter parameters
    const unitId = searchParams.get('unit')
    const lessonId = searchParams.get('lesson')
    const difficulty = searchParams.get('difficulty')
    const questionType = searchParams.get('type')
    const searchText = searchParams.get('search')
    const topics = searchParams.get('topics')?.split(',').filter(Boolean)
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)

    // Build query
    let query = supabaseAdmin
      .from('question_bank')
      .select(`
        *,
        unit:units(id, name),
        lesson:lessons(id, title)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (unitId) query = query.eq('unit_id', unitId)
    if (lessonId) query = query.eq('lesson_id', lessonId)
    if (difficulty) query = query.eq('difficulty', difficulty)
    if (questionType) query = query.eq('question_type', questionType)
    if (topics && topics.length > 0) {
      query = query.contains('topics', topics)
    }
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags)
    }
    if (searchText) {
      query = query.ilike('question_text', `%${searchText}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database question_bank table not found, returning empty array:', error)
      // Return empty array when database tables don't exist yet
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET /api/question-bank:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or teacher
    const userRole = getUserRole(session.user?.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Only admin/teacher can add questions' }, { status: 403 })
    }

    const body = await request.json()

    const questionData = {
      question_data: body.question,
      unit_id: body.unit_id,
      lesson_id: body.lesson_id,
      question_type: body.question.type,
      question_text: body.question.question,
      points: body.question.points || 0,
      difficulty: body.difficulty,
      topics: body.topics || [],
      tags: body.tags || [],
      cognitive_level: body.cognitive_level,
      estimated_time: body.estimated_time,
      created_by: session.user.id,
      usage_count: 0
    }

    const { data, error } = await supabaseAdmin
      .from('question_bank')
      .insert([questionData])
      .select()
      .single()

    if (error) {
      console.error('Error adding question:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/question-bank:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or teacher
    const userRole = getUserRole(session.user?.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Only admin/teacher can update questions' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
    }

    // If updating question content, extract text for search
    if (updates.question_data) {
      updates.question_text = updates.question_data.question
      updates.question_type = updates.question_data.type
      updates.points = updates.question_data.points || 0
    }

    const { data, error } = await supabaseAdmin
      .from('question_bank')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating question:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/question-bank:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or teacher
    const userRole = getUserRole(session.user?.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Only admin/teacher can delete questions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('question_bank')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting question:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/question-bank:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
