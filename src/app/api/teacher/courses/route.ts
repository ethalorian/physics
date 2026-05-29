import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// A teacher's imported courses + the class type (curriculum track) assigned to
// each. The track is attached PER COURSE (a teacher may run CPA in one section
// and AP in another). A newly-imported course has track=null until assigned —
// that's what re-prompts the teacher.

const VALID_TRACKS = ['cpa'] // only CPA is live; honors/ap/pbl come later

type CourseRow = { id: string; name: string; section: string | null; track: string | null }

export const GET = withAuth(async (_request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let q = supabaseAdmin.from('courses').select('id, name, section, track').order('name', { ascending: true })
    if (ctx.role === 'teacher') q = q.eq('teacher_email', ctx.scopeEmail)
    const { data } = await q
    const courses = ((data ?? []) as CourseRow[]).map((c) => ({ id: c.id, name: c.name, section: c.section, track: c.track }))
    const untracked = courses.filter((c) => !c.track).length

    return NextResponse.json({ courses, untracked })
})

// POST { course_id, track } — assign a class type to one of the teacher's courses.
export const POST = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const courseId: string | undefined = body.course_id
    const track: string | undefined = body.track
    if (!courseId || !track || !VALID_TRACKS.includes(track)) {
      return NextResponse.json({ error: 'course_id and a valid track are required' }, { status: 400 })
    }

    // Owner check: a teacher may only set tracks on their own courses.
    const { data: course } = await supabaseAdmin.from('courses').select('teacher_email').eq('id', courseId).maybeSingle()
    const owner = (course as { teacher_email?: string | null } | null)?.teacher_email
    if (ctx.role === 'teacher' && owner !== ctx.scopeEmail) {
      return NextResponse.json({ error: 'Not your course' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from('courses').update({ track }).eq('id', courseId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
})
