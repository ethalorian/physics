import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessVocabTask, vocabCourses } from '@/lib/vocab-access'
import { vocabRows } from '@/lib/vocab-pagination'
import { UUID, type VocabTask } from '@/lib/vocab-learning'
import { vocabularyProgress, type VocabEvidenceCheck, type VocabMasteryReview } from '@/lib/vocab-mastery'

export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const sp = new URL(request.url).searchParams
  const courses = (await vocabCourses(ctx)).filter(c => (!sp.get('class') || c.id === sp.get('class')) && (!sp.get('teacher') || c.teacher_email === sp.get('teacher')))
  const { data: targets, error } = await supabaseAdmin.from('learning_targets').select('id,statement,program').eq('unit_id', sp.get('unit_id') ?? 'unit-1').eq('domain', 'knowledge').order('order_index')
  if (error) throw error
  if (!courses.length) return NextResponse.json({ tasks: [], students: [], targets: targets ?? [] })
  const courseIds = courses.map(c => c.id)
  const tasks = await vocabRows<VocabTask>((a, b) => {
    let q = supabaseAdmin.from('vocab_tasks').select('*').in('course_id', courseIds).order('created_at', { ascending: false }).order('id')
    if (sp.get('archived') !== 'true') q = q.eq('active', true)
    return q.range(a, b)
  })
  const visible = tasks.filter(t => !t.target_id || targets?.some(k => k.id === t.target_id))
  const taskIds = visible.map(t => t.id)
  const [enrollments, checks, reviews] = await Promise.all([
    vocabRows((a, b) => supabaseAdmin.from('course_students').select('course_id,student_id,students(id,name)').in('course_id', courseIds).eq('enrollment_state', 'ACTIVE').order('id').range(a, b)),
    vocabRows<VocabEvidenceCheck>((a, b) => supabaseAdmin.from('vocab_checks').select('id,task_id,user_id,completed_at,result,review_version').in('task_id', taskIds).not('completed_at', 'is', null).order('id').range(a, b)),
    vocabRows<VocabMasteryReview>((a, b) => supabaseAdmin.from('vocab_mastery_reviews').select('id,task_id,user_id,target_id,level,evidence_key,note,created_at,reviewer_email').in('task_id', taskIds).order('id').range(a, b)),
  ])
  const roster = [...new Map(enrollments.map(e => {
    const student = (Array.isArray(e.students) ? e.students[0] : e.students) as { id: string; name: string } | null
    return [e.student_id, { studentId: e.student_id, name: student?.name ?? 'Student' }] as const
  })).values()].sort((a, b) => a.name.localeCompare(b.name))
  return NextResponse.json({ students: roster, targets: targets ?? [], tasks: visible.map(task => {
    const course = courses.find(c => c.id === task.course_id)!
    const students = enrollments.filter(e => e.course_id === task.course_id && task.student_ids.includes(e.student_id))
    return { ...task, courseLabel: [course.name, course.section].filter(Boolean).join(' · '), program: course.program ?? 'physics', progress: students.map(e => {
      const student = (Array.isArray(e.students) ? e.students[0] : e.students) as { id: string; name: string } | null
      return { studentId: e.student_id, name: student?.name ?? 'Student', ...vocabularyProgress(task, checks.filter(c => c.task_id === task.id && c.user_id === e.student_id), reviews.filter(r => r.task_id === task.id && r.user_id === e.student_id)) }
    }).sort((a, b) => a.name.localeCompare(b.name)) }
  }) })
})

export const PATCH = withRole(['teacher', 'admin'], async (request, ctx) => {
  const body = await request.json()
  if (!UUID.test(body.task_id ?? '') || !UUID.test(body.target_id ?? '')) return NextResponse.json({ error: 'Choose an assignment and Knowledge target.' }, { status: 400 })
  const task = await accessVocabTask(body.task_id, ctx)
  if (!task) return NextResponse.json({ error: 'Assignment is not in your classes.' }, { status: 403 })
  const course = (await vocabCourses(ctx)).find(c => c.id === task.course_id)!
  const { data: target, error } = await supabaseAdmin.from('learning_targets').select('id,domain,program').eq('id', body.target_id).maybeSingle()
  if (error) throw error
  if (!target || target.domain !== 'knowledge' || (target.program ?? 'physics') !== (course.program ?? 'physics')) return NextResponse.json({ error: 'Choose a Knowledge target in this class’s program.' }, { status: 400 })
  const { error: updateError } = await supabaseAdmin.from('vocab_tasks').update({ target_id: target.id }).eq('id', task.id)
  if (updateError) throw updateError
  return NextResponse.json({ ok: true })
})
