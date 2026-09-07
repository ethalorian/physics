import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { classLesson } from '@/lib/present-server'
import { isBlockComplete } from '@/data/content-blocks'

/** One shared artifact, atomically attributed to each group member (E-4/L-4). */
export const POST = withAuth(async (request, ctx) => {
  const { session_id, response } = await request.json().catch(() => ({})) as {session_id?: string;response?: unknown}
  if (!session_id || !response || typeof response !== 'object' || Array.isArray(response)) return NextResponse.json({ error: 'Session and response required' }, { status: 400 })
  const { data: session } = await supabaseAdmin.from('lobby_sessions').select('id, status, course_id, task_type, lesson_id, block_id').eq('id', session_id).maybeSingle()
  if (!session || session.status !== 'open') return NextResponse.json({ error: 'This group task is not open' }, { status: 409 })
  const { data: enrolled } = await supabaseAdmin.from('course_students').select('student_id').eq('course_id', session.course_id).eq('student_id', ctx.userId).maybeSingle()
  if (!enrolled) return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 })
  const lesson = session.lesson_id ? await classLesson(session.lesson_id, session.course_id) : null
  const block = lesson?.content_blocks.blocks.find(b => b.id === session.block_id)
  if (session.block_id && (!block || !isBlockComplete(block, response))) return NextResponse.json({ error: 'Complete the group task before submitting' }, { status: 400 })
  if (!block && !Object.values(response).some(v => typeof v === 'string' ? v.trim() : Array.isArray(v) && v.length)) return NextResponse.json({ error: 'A group artifact is required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.rpc('submit_lobby_group_artifact', { p_session_id: session_id, p_user_id: ctx.userId, p_response: response, p_block_type: block?.type ?? session.task_type })
  if (error) return NextResponse.json({ error: 'Could not submit. Check that your passphrase is complete and the task is still open.' }, { status: 409 })
  return NextResponse.json(data ?? { ok: true })
})
