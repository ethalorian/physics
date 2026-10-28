import { suggestAfterSubmission } from '@/lib/assessment-results/suggestions-server'
import { NextResponse } from 'next/server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessVocabTask } from '@/lib/vocab-access'
import { draftCheckpoint } from '@/lib/vocab-checkpoint-content'
import { vocabRows } from '@/lib/vocab-pagination'
import { UUID } from '@/lib/vocab-learning'
import { publicCheckpoint, validateCheckpointQuestions, type CheckpointRow } from '@/lib/vocab-checkpoint'

export const GET = withAuth(async (req, ctx) => {
  const id = new URL(req.url).searchParams.get('task_id') ?? ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'Choose a checkpoint.' }, { status: 400 })
  const task = await accessVocabTask(id, ctx)
  if (!task || task.quiz_format !== 'checkpoint') return NextResponse.json({ error: 'Checkpoint unavailable.' }, { status: 403 })
  const staff = ctx.role === 'teacher' || ctx.role === 'admin'
  if (!staff && ctx.realRole !== 'student') return NextResponse.json({ error: 'Checkpoint unavailable.' }, { status: 403 })
  const roster = staff ? await vocabRows((a, b) => supabaseAdmin.from('course_students').select('student_id,students(id,name)').eq('course_id', task.course_id).eq('enrollment_state', 'ACTIVE').in('student_id', task.student_ids).order('id').range(a,b)) : []
  const students = roster.map(r => ({ studentId: r.student_id as string, name: ((Array.isArray(r.students) ? r.students[0] : r.students) as { name: string } | null)?.name ?? 'Student' }))
  const attempts = await vocabRows<CheckpointRow>((a,b) => {
    let q = supabaseAdmin.from('vocab_checkpoint_attempts').select('id,task_id,user_id,number,version,questions,answers,scores,notes,submitted_at,released_at,created_at').eq('task_id', id)
    q = staff ? q.in('user_id', students.map(s => s.studentId)) : q.eq('user_id', ctx.userId)
    return q.order('number', { ascending: false }).order('id').range(a,b)
  })
  const { data: blueprint, error } = staff ? await supabaseAdmin.from('vocab_checkpoint_blueprints').select('questions').eq('task_id',id).single() : { data: null, error: null }
  if (error) throw error
  return NextResponse.json({ students, questions: blueprint?.questions, attempts: attempts.map(a => ({ ...publicCheckpoint(a,staff), name: students.find(s => s.studentId === a.user_id)?.name ?? 'Student' })), words: task.words.map(w => w.term) }, { headers: { 'Cache-Control': 'private, no-store' } })
})

export const POST = withAuth(async (req, ctx) => {
  if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Reload before saving.'},{status:403})
  const b = await req.json()
  if (!UUID.test(b.task_id ?? '')) return NextResponse.json({ error: 'Choose a checkpoint.' }, { status: 400 })
  const task = await accessVocabTask(b.task_id, ctx)
  if (!task || task.quiz_format !== 'checkpoint' || !task.active) return NextResponse.json({ error: 'Checkpoint unavailable.' }, { status: 403 })
  const staff = ctx.role === 'teacher' || ctx.role === 'admin'
  const user = staff ? b.student_id : ctx.userId
  if (!UUID.test(user ?? '') || !task.student_ids.includes(user) || !staff && ctx.realRole !== 'student' || staff && ctx.viewingAsTeacher) return NextResponse.json({ error: 'Use your own class to grade checkpoints.' }, { status: 403 })
  if (!(staff ? ['score','release','retake'] : ['start','save','submit']).includes(b.action)) return NextResponse.json({ error: 'Action unavailable.' }, { status: 403 })
  if (b.action !== 'start' && (!UUID.test(b.attempt_id??'') || !Number.isInteger(b.version) || b.version < 0)) return NextResponse.json({ error: 'Refresh this checkpoint before continuing.' }, { status: 400 })
  if (b.action === 'score' && (typeof b.question_id !== 'string' || !Number.isInteger(b.points) || b.points < 0 || b.points > 4 || typeof b.note !== 'string' || b.note.length > 2000)) return NextResponse.json({ error: 'Choose 0–4 points and feedback up to 2000 characters.' }, { status: 400 })
  let questions
  if (b.action === 'retake') {
    try { questions = validateCheckpointQuestions(b.questions, task.words.map(w => w.term)) } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }) }
    const { data: previous, error } = await supabaseAdmin.from('vocab_checkpoint_attempts').select('questions').eq('task_id',task.id).eq('user_id',user).order('number',{ascending:false}).limit(1).maybeSingle()
    if (error) throw error
    if (!previous || questions.slice(4).some((q,i) => q.prompt === previous.questions[i+4]?.prompt)) return NextResponse.json({ error: 'Give every interpretation and explanation a fresh situation for this reassessment.' }, { status: 400 })
  }
  const { data, error } = b.action==='release' ? await supabaseAdmin.rpc('release_vocab_checkpoint_review',{p_task:task.id,p_user:user,p_actor:ctx.scopeEmail,p_attempt:b.attempt_id,p_version:b.version,p_payload:b.review}) : await supabaseAdmin.rpc('mutate_vocab_checkpoint', {
    p_task: task.id, p_user: user, p_actor: staff ? ctx.scopeEmail : ctx.userId, p_staff: staff,
    p_attempt: b.attempt_id ?? null, p_action: b.action, p_version: b.version ?? 0,
    p_payload: b.action === 'retake' ? { questions } : b.action === 'score' ? { question_id: b.question_id, points: b.points, note: b.note } : ['save','submit'].includes(b.action) ? { answers: b.answers } : {},
  })
  if (error) {
    if (error.code === 'P0001') return NextResponse.json({ error: error.message }, { status: 409 })
    throw error
  }
  if(b.action==='submit' && data?.id) suggestAfterSubmission('checkpoint',data.id)
  return NextResponse.json({ attempt: publicCheckpoint(data as CheckpointRow,staff) })
})


/** Starter answer guides are returned only through an authenticated teacher request. */
export const PUT = withRole(['teacher','admin'], async (req) => {
  const b = await req.json()
  if (!Array.isArray(b.term_ids) || b.term_ids.length < 4 || b.term_ids.length > 12 || b.term_ids.some((id:unknown) => typeof id !== 'string' || !UUID.test(id))) return NextResponse.json({error:'Select 4–12 vocabulary words.'},{status:400})
  const {data:words,error} = await supabaseAdmin.from('vocabulary_terms').select('id,term,definition,tier,vocabulary_set_id').in('id',b.term_ids).eq('archived',false)
  if(error)throw error
  if(!words||words.length!==new Set(b.term_ids).size||new Set(words.map(w=>w.term.toLowerCase())).size!==words.length)return NextResponse.json({error:'Choose distinct, available words.'},{status:400})
  const {data:sets,error:setError}=await supabaseAdmin.from('vocabulary_sets').select('id').in('id',words.map(w=>w.vocabulary_set_id)).eq('published',true).eq('archived',false)
  if(setError)throw setError
  if(words.some(w=>!sets?.some(s=>s.id===w.vocabulary_set_id)))return NextResponse.json({error:'Choose published vocabulary.'},{status:400})
  return NextResponse.json({questions:draftCheckpoint(words)},{headers:{'Cache-Control':'private, no-store'}})
})

export const maxDuration = 180
