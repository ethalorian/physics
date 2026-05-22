import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { CAPTURE_BLOCK_TYPES, ContentBlock } from '@/data/content-blocks'

// POST /api/lessons/blocks  — save a student's response to a capture block (append-only).
// Body: { lesson_id, block_id, block_type, response }
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    if (!body.lesson_id || !body.block_id || body.response === undefined) {
      return NextResponse.json({ error: 'Missing lesson_id, block_id, or response' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('block_responses')
      .insert({
        user_id: session.user.id,
        user_email: session.user.email,
        lesson_id: body.lesson_id,
        block_id: body.block_id,
        block_type: body.block_type ?? null,
        response: body.response,
      })
      .select()
      .single()
    if (error) {
      console.error('Error saving block response:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Earning loop (best-effort): log activity + recompute lesson engagement so the
    // work feeds the activity feed, streaks, leaderboard points, and the dashboard.
    try {
      await supabaseAdmin.from('student_activity').insert({
        user_id: session.user.id,
        user_email: session.user.email,
        activity_type: 'lesson_block',
        lesson_id: body.lesson_id,
      })

      const { data: lessonRow } = await supabaseAdmin
        .from('lessons')
        .select('slug, content_blocks')
        .eq('id', body.lesson_id)
        .single()
      const blocks: ContentBlock[] = lessonRow?.content_blocks?.blocks ?? []
      const captureIds = blocks
        .filter((b) => (CAPTURE_BLOCK_TYPES as string[]).includes(b.type))
        .map((b) => b.id)

      if (captureIds.length > 0) {
        const { data: resp } = await supabaseAdmin
          .from('block_responses')
          .select('block_id')
          .eq('user_id', session.user.id)
          .eq('lesson_id', body.lesson_id)
          .in('block_id', captureIds)
        const done = new Set((resp ?? []).map((r) => r.block_id))
        const pct = Math.round((done.size / captureIds.length) * 100)
        const completed = pct >= 100
        await supabaseAdmin.from('lesson_progress').upsert(
          {
            user_id: session.user.id,
            user_email: session.user.email,
            lesson_id: body.lesson_id,
            lesson_slug: lessonRow?.slug ?? null,
            status: completed ? 'completed' : 'in_progress',
            progress_percentage: pct,
            last_accessed_at: new Date().toISOString(),
            completed_at: completed ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,lesson_id' },
        )
      }
    } catch (e) {
      console.error('block save side-effects failed:', e)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/lessons/blocks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/lessons/blocks?lesson_id=...  — latest response per block for the current student.
// Staff may pass &user_id= to view a specific student.
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lesson_id')
    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lesson_id' }, { status: 400 })
    }
    const role = getUserRole(session.user.email)
    const isStaff = role === 'admin' || role === 'teacher'
    const requested = searchParams.get('user_id')
    const targetUserId = isStaff && requested ? requested : session.user.id

    const { data, error } = await supabaseAdmin
      .from('block_responses')
      .select('block_id, block_type, response, created_at')
      .eq('lesson_id', lessonId)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // latest wins per block_id
    const responses: Record<string, { response: unknown; block_type: string | null; created_at: string }> = {}
    for (const row of data ?? []) {
      responses[row.block_id] = { response: row.response, block_type: row.block_type, created_at: row.created_at }
    }
    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Error in GET /api/lessons/blocks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
