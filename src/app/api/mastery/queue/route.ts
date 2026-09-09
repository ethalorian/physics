import { evidenceWithLinks } from '@/lib/lesson-evidence-links'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveRosterScope, getTeacherStudentGids } from '@/lib/teacher-scope'
import { pendingLessonSubmissions, type LessonSubmission } from '@/lib/lesson-review'
import { isEvidenceSource } from '@/lib/evidence'

// Deliberate turn-in and low-stakes evidence are separate workflows. Neither a unit-wide
// rating nor a rating of a shared target can dismiss a different submitted lesson.
export const GET = withAuth(async (request, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const qp = new URL(request.url).searchParams
  const unitId = qp.get('unit_id') ?? 'unit-1'
  const source = qp.get('evidence_source')
  if (source && source !== 'untagged' && !isEvidenceSource(source)) return NextResponse.json({ error: 'Invalid evidence source' }, { status: 400 })
  const scope = await resolveRosterScope({ classId: qp.get('class'), role: ctx.role, scopeEmail: ctx.scopeEmail, teacherEmail: qp.get('teacher') })
  const own = new Set(await getTeacherStudentGids(ctx.scopeEmail))
  const gids = scope.gids ? scope.gids.filter((g) => own.has(g)) : [...own]
  if (!gids.length) return NextResponse.json({ unitId, queue: [], submissions: [], evidence: [] })
  const [{ data: students, error: studentError }, { data: lessons, error: lessonError }] = await Promise.all([
    supabaseAdmin.from('students').select('id, name').in('id', gids),
    supabaseAdmin.from('lessons').select('id, title').eq('unit_id', unitId),
  ])
  if (studentError) throw studentError
  if (lessonError) throw lessonError
  const names = new Map((students ?? []).map((s) => [s.id, s.name ?? 'Student']))
  const titles = new Map((lessons ?? []).map((l) => [l.id, l.title]))
  const lessonIds = [...titles.keys()]
  let submissions: (LessonSubmission & { studentId: string; name: string; lessonTitle: string; oldestAgeHours: number })[] = []
  if (lessonIds.length) {
    const { data: rows, error } = await supabaseAdmin.from('lesson_submissions').select('id, user_id, lesson_id, submitted_at').in('user_id', gids).in('lesson_id', lessonIds)
    if (error) throw error
    const ids = (rows ?? []).map((r) => r.id)
    const { data: reviews, error: reviewError } = ids.length ? await supabaseAdmin.from('lesson_reviews').select('submission_id').in('submission_id', ids) : { data: [], error: null }
    if (reviewError) throw reviewError
    submissions = pendingLessonSubmissions(rows ?? [], new Set((reviews ?? []).map((r) => r.submission_id))).map((s) => ({ ...s, studentId: s.user_id, name: names.get(s.user_id) ?? 'Student', lessonTitle: titles.get(s.lesson_id) ?? 'Lesson', oldestAgeHours: Math.floor((Date.now() - Date.parse(s.submitted_at)) / 3600000) }))
    submissions.sort((a, b) => b.oldestAgeHours - a.oldestAgeHours)
  }
  const byUser = new Map<string, { studentId: string; name: string; count: number; oldestAgeHours: number; aged: boolean; needsHelp: boolean }>()
  for (const s of submissions) {
    const prev = byUser.get(s.user_id)
    byUser.set(s.user_id, { studentId: s.user_id, name: s.name, count: (prev?.count ?? 0) + 1, oldestAgeHours: Math.max(prev?.oldestAgeHours ?? 0, s.oldestAgeHours), aged: s.oldestAgeHours >= 48 || Boolean(prev?.aged), needsHelp: false })
  }
  // Always include unlinked work: it cannot otherwise acquire a unit filter. Label it for repair.
  let query = supabaseAdmin.from('block_responses').select('id, user_id, lesson_id, target_id, block_id, block_type, response, created_at, evidence_source, role, present_session_id, poll_run_id, session_id').in('user_id', gids).order('created_at', { ascending: false }).limit(1000)
  if (source === 'untagged') query = query.is('evidence_source', null)
  else if (source) query = query.eq('evidence_source', source)
  const { data: raw, error: evidenceError } = await query
  if (evidenceError) throw evidenceError
  const linked = await evidenceWithLinks(raw ?? [])
  const candidates = linked.filter((r) => (!r.lesson_id || titles.has(r.lesson_id)) && !(r.response && typeof r.response === 'object' && r.response.draft === true))
  const pendingLessons = new Set(submissions.map((s) => `${s.user_id}:${s.lesson_id}`))
  const latestSelf = new Set<string>()
  for (const row of candidates) {
    if (!pendingLessons.has(`${row.user_id}:${row.lesson_id}`) || !['marzano', 'self_assessment'].includes(row.block_type ?? '')) continue
    const key = `${row.user_id}:${row.lesson_id}:${row.block_id}`
    if (latestSelf.has(key)) continue
    latestSelf.add(key)
    const needsHelp = row.block_type === 'marzano' ? Number(row.response) === 1 : Boolean(row.response && typeof row.response === 'object' && Object.values(row.response).some((value) => value === 1))
    if (needsHelp && byUser.has(row.user_id)) byUser.get(row.user_id)!.needsHelp = true
  }
  const ids = candidates.map((r) => r.id)
  const { data: evidenceReviews, error: evidenceReviewError } = ids.length ? await supabaseAdmin.from('lesson_evidence_reviews').select('response_id').in('response_id', ids) : { data: [], error: null }
  if (evidenceReviewError) throw evidenceReviewError
  const reviewed = new Set((evidenceReviews ?? []).map((r) => r.response_id))
  const seen = new Set<string>()
  const evidence = candidates.filter((r) => {
    const key = `${r.user_id}:${r.lesson_id}:${r.block_id}:${r.evidence_source}:${r.present_session_id ?? r.session_id ?? ''}:${r.poll_run_id ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return !reviewed.has(r.id)
  }).map((r) => ({ ...r, name: names.get(r.user_id) ?? 'Student', lessonTitle: r.lesson_id ? titles.get(r.lesson_id) ?? 'Lesson' : 'Unlinked Lobby work', untargeted: !r.target_id, unlinked: !r.lesson_id }))
  return NextResponse.json({ unitId, queue: [...byUser.values()], submissions, evidence, evidenceLimit: 1000, evidenceMayBeTruncated: (raw ?? []).length === 1000 })
})
