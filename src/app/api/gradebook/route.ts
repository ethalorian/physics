import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Fetch gradebook entries
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    const { searchParams } = new URL(request.url)
    
    const userId = searchParams.get('user_id')
    const courseId = searchParams.get('course_id')
    const itemType = searchParams.get('item_type')
    const status = searchParams.get('status')

    let query = supabase
      .from('gradebook_entries')
      .select('*')
      .order('created_at', { ascending: false })

    // Students can only see their own grades
    if (userRole === 'student') {
      query = query.eq('user_id', session.user.id)
    } else if (userId) {
      // Teachers/admins can filter by student
      query = query.eq('user_id', userId)
    }

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    if (itemType) {
      query = query.eq('item_type', itemType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching gradebook:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Error in GET /api/gradebook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create/update gradebook entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.user_id || !body.item_type || !body.item_id || !body.item_title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const gradebookData = {
      user_id: body.user_id,
      user_email: body.user_email,
      student_name: body.student_name || null,
      item_type: body.item_type,
      item_id: body.item_id,
      item_title: body.item_title,
      course_id: body.course_id || null,
      score: body.score || null,
      max_score: body.max_score || null,
      percentage: body.score && body.max_score ? (body.score / body.max_score) * 100 : null,
      status: body.status || 'not_started',
      due_date: body.due_date || null,
      submitted_at: body.submitted_at || null,
      graded_at: body.graded_at || null,
      synced_to_classroom: false
    }

    const { data, error } = await supabase
      .from('gradebook_entries')
      .upsert(gradebookData, {
        onConflict: 'user_id,item_type,item_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving gradebook entry:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/gradebook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
