import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withRole } from '@/lib/api-auth'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

// GET - Fetch gradebook entries
export const GET = withAuth(async (request, ctx) => {
    const userRole = ctx.role
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('user_id')
    const courseId = searchParams.get('course_id')
    const itemType = searchParams.get('item_type')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('gradebook_entries')
      .select('*')
      .order('created_at', { ascending: false })

    // Students can only see their own grades.
    if (userRole === 'student') {
      query = query.eq('user_id', ctx.userId)
    } else if (userRole === 'teacher') {
      // Teachers are constrained to their own roster.
      const rosterGids = await getTeacherStudentGids(ctx.email)
      if (userId) {
        if (!rosterGids.includes(userId)) {
          return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
        }
        query = query.eq('user_id', userId)
      } else {
        query = query.in('user_id', rosterGids)
      }
    } else if (userId) {
      // Admins are unrestricted; may filter by any student.
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
})

// POST - Create/update gradebook entry
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
    const userRole = ctx.role

    const body = await request.json()

    // Validate required fields
    if (!body.user_id || !body.item_type || !body.item_id || !body.item_title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // A teacher may only write grades for students on their own roster.
    // (Admins are unrestricted.)
    if (userRole === 'teacher') {
      const rosterGids = await getTeacherStudentGids(ctx.email)
      if (!rosterGids.includes(body.user_id)) {
        return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
      }
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

    const { data, error } = await supabaseAdmin
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
})
