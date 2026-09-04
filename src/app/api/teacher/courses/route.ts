import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ownerEmailsFor } from '@/lib/identity-aliases'

// A teacher's imported courses + the class type (curriculum track) assigned to
// each. The track is attached PER COURSE (a teacher may run CPA in one section
// and AP in another). A newly-imported course has track=null until assigned —
// that's what re-prompts the teacher.

const VALID_TRACKS = ['cpa', 'honors'] // CPA + Honors are live; ap/pbl come later
const VALID_PROGRAMS = ['physics', 'trades', 'projects'] // which curriculum (units/targets) the class follows

type CourseRow = { id: string; name: string; section: string | null; track: string | null; program: string | null; teacher_email: string | null }

// Scoping rule: "mine" is the DEFAULT for every staff role, admins included.
// It used to be teacher-only, which meant an admin got all 15 courses in the
// district and any consumer that defaulted to `courses[0]` landed on whichever
// class sorted first alphabetically — routinely a colleague's section. Seeing
// the whole school is now something you must ask for (?scope=all), and only a
// real admin who is not currently viewing-as gets it.
export const GET = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const canSeeAll = ctx.realRole === 'admin' && !ctx.viewingAsTeacher
    const scope = request.nextUrl.searchParams.get('scope') === 'all' && canSeeAll ? 'all' : 'mine'

    // One person can sign in under more than one address; ownership rows carry
    // only whichever address did the Classroom import. See @/lib/identity-aliases.
    const owners = ownerEmailsFor(ctx.scopeEmail)

    let q = supabaseAdmin.from('courses').select('id, name, section, track, program, teacher_email').order('name', { ascending: true })
    if (scope === 'mine') q = q.in('teacher_email', owners)
    const { data } = await q

    // `mine` is returned on every row so a client showing the wider list can mark
    // (and refuse to default to) another teacher's class without re-deriving
    // ownership in the browser.
    const courses = ((data ?? []) as CourseRow[]).map((c) => ({
      id: c.id,
      name: c.name,
      section: c.section,
      track: c.track,
      program: c.program ?? 'physics',
      teacher_email: c.teacher_email,
      mine: owners.includes((c.teacher_email ?? '').trim().toLowerCase()),
    }))
    const untracked = courses.filter((c) => !c.track).length

    // `scopedTo` lets a caller say WHICH account it filtered by, so an empty list
    // reads as "wrong account" instead of "no classes exist".
    return NextResponse.json({ courses, untracked, scope, scopedTo: owners, canSeeAll })
})

// POST { course_id, track?, program? } — assign a class type and/or program to one of the teacher's courses.
export const POST = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const courseId: string | undefined = body.course_id
    const track: string | undefined = body.track
    const program: string | undefined = body.program
    if (!courseId || (track === undefined && program === undefined)) {
      return NextResponse.json({ error: 'course_id and a track or program are required' }, { status: 400 })
    }
    if (track !== undefined && !VALID_TRACKS.includes(track)) return NextResponse.json({ error: 'invalid track' }, { status: 400 })
    if (program !== undefined && !VALID_PROGRAMS.includes(program)) return NextResponse.json({ error: 'invalid program' }, { status: 400 })

    // Owner check: a teacher may only set tracks on their own courses.
    const { data: course } = await supabaseAdmin.from('courses').select('teacher_email').eq('id', courseId).maybeSingle()
    const owner = (course as { teacher_email?: string | null } | null)?.teacher_email
    if (ctx.role === 'teacher' && !ownerEmailsFor(ctx.scopeEmail).includes((owner ?? '').trim().toLowerCase())) {
      return NextResponse.json({ error: 'Not your course' }, { status: 403 })
    }

    const update: Record<string, string> = {}
    if (track !== undefined) update.track = track
    if (program !== undefined) update.program = program
    const { error } = await supabaseAdmin.from('courses').update(update).eq('id', courseId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
})
