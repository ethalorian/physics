import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import type { ContentBlock } from '@/data/content-blocks'

// GET /api/lessons/experience?lesson_id=…
// Everything the stepped reader needs beyond the document (A-5, S-4, S-6, MC-3):
//   flags        — the student's class flags (lesson_experience, gate_checkpoints, …)
//   mastery      — latest TEACHER rating per target slug used by this lesson (S-4 drawer default)
//   calibration  — self vs teacher per lesson target, from the mastery_calibration view (MC-2/MC-3)
//   lobbyToday   — MC-6: a lobby ran for this lesson today with this student → self-rating waits for the exit ticket
//   xpEarned     — XP already granted for this lesson's blocks (B-4), so the Done screen is honest on reload
// Staff get the stepped experience with gates on (preview = what a student sees by default).

type Flags = { experience: 'classic' | 'stepped'; gateCheckpoints: boolean; presentLive: boolean; lobbyLauncher: boolean }
const STAFF: Flags = { experience: 'stepped', gateCheckpoints: true, presentLive: true, lobbyLauncher: true }

export const GET = withAuth(async (request, ctx) => {
    const lessonId = new URL(request.url).searchParams.get('lesson_id')
    if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

    const { data: lesson } = await supabaseAdmin.from('lessons').select('id, content_blocks').eq('id', lessonId).maybeSingle()
    const blocks: ContentBlock[] = (lesson as { content_blocks?: { blocks?: ContentBlock[] } } | null)?.content_blocks?.blocks ?? []
    const slugs = [...new Set(blocks.map((b) => b.targetId).filter((s): s is string => Boolean(s)))]

    // Flags from the student's class (first enrolled course with a non-classic reader wins; a
    // student in one class simply gets that class's flags).
    let flags: Flags = STAFF
    if (ctx.realRole === 'student') {
      const { data: cs } = await supabaseAdmin
        .from('course_students')
        .select('courses ( lesson_experience, gate_checkpoints, present_live_layer, lobby_launcher )')
        .eq('student_id', ctx.userId)
      type C = { lesson_experience: string | null; gate_checkpoints: boolean | null; present_live_layer: boolean | null; lobby_launcher: boolean | null }
      const courses = ((cs ?? []) as { courses: C | C[] | null }[]).flatMap((r) => (Array.isArray(r.courses) ? r.courses : r.courses ? [r.courses] : []))
      const pick = courses.find((c) => c.lesson_experience === 'stepped') ?? courses[0]
      flags = pick
        ? { experience: pick.lesson_experience === 'classic' ? 'classic' : 'stepped', gateCheckpoints: pick.gate_checkpoints ?? true, presentLive: pick.present_live_layer ?? true, lobbyLauncher: pick.lobby_launcher ?? true }
        : { experience: 'stepped', gateCheckpoints: true, presentLive: true, lobbyLauncher: true }
    }

    // Targets used by this lesson → ids + statements.
    let targets: { id: string; slug: string; statement: string }[] = []
    if (slugs.length > 0) {
      const { data: t } = await supabaseAdmin.from('learning_targets').select('id, slug, statement').in('slug', slugs)
      targets = (t ?? []) as { id: string; slug: string; statement: string }[]
    }
    const idToSlug = new Map(targets.map((t) => [t.id, t.slug]))

    // Latest teacher rating per target (M-4: read the same table; never duplicate).
    const mastery: Record<string, number> = {}
    const calibration: { slug: string; statement: string; self: number | null; teacher: number | null; delta: number | null }[] = []
    if (targets.length > 0) {
      const ids = targets.map((t) => t.id)
      const { data: recs } = await supabaseAdmin
        .from('mastery_records').select('target_id, level, observed_at')
        .eq('user_id', ctx.userId).in('target_id', ids).order('observed_at', { ascending: false })
      for (const r of (recs ?? []) as { target_id: string; level: number }[]) {
        const slug = idToSlug.get(r.target_id)
        if (slug && mastery[slug] === undefined) mastery[slug] = r.level
      }
      const { data: cal } = await supabaseAdmin
        .from('mastery_calibration').select('target_id, self_level, teacher_level, delta')
        .eq('user_id', ctx.userId).in('target_id', ids)
      const byId = new Map(((cal ?? []) as { target_id: string; self_level: number | null; teacher_level: number | null; delta: number | null }[]).map((c) => [c.target_id, c]))
      for (const t of targets) {
        const c = byId.get(t.id)
        calibration.push({ slug: t.slug, statement: t.statement, self: c?.self_level ?? null, teacher: c?.teacher_level ?? mastery[t.slug] ?? null, delta: c?.delta ?? null })
      }
    }

    // XP already granted for this lesson's blocks.
    const { data: grants } = await supabaseAdmin
      .from('economy_point_grants').select('points')
      .eq('user_id', ctx.userId).eq('source', 'lesson-block').like('reference', `${lessonId}:%`)
    const xpEarned = ((grants ?? []) as { points: number }[]).reduce((a, g) => a + (g.points ?? 0), 0)

    // MC-6 · did a lobby run for this lesson today with this student in it?
    let lobbyToday = false
    {
      const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
      const { data: ls } = await supabaseAdmin.from('lobby_sessions').select('id').eq('lesson_id', lessonId).gte('created_at', dayStart.toISOString())
      const ids = ((ls ?? []) as { id: string }[]).map((l) => l.id)
      if (ids.length > 0) {
        const { count } = await supabaseAdmin.from('lobby_members').select('user_id', { count: 'exact', head: true }).in('session_id', ids).eq('user_id', ctx.userId)
        lobbyToday = (count ?? 0) > 0
      }
    }

    return NextResponse.json({ flags, mastery, calibration, xpEarned, lobbyToday })
})
