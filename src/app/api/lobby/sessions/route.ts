import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateLobbyCode } from '@/lib/lobby/passphrase'

const VALID_MODES = ['random', 'near_peer', 'matched', 'manual']
const VALID_TASKS = ['short_response', 'drawing', 'question', 'proof']

// GET /api/lobby/sessions — sessions created by the signed-in teacher.
export const GET = withRole(['teacher', 'admin'], async (_request, ctx) => {
  const { data, error } = await supabaseAdmin
    .from('lobby_sessions')
    .select('id, course_id, code, task_type, grouping_mode, group_size, status, prompt, created_at')
    .eq('created_by', ctx.userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
})

// POST /api/lobby/sessions — create a session and mint a unique lobby code.
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
  const body = await request.json().catch(() => ({}))
  const {
    course_id,
    task_type = 'short_response',
    grouping_mode = 'random',
    group_size = 4,
    target_id = null,
    prompt = null,
  } = body as Record<string, unknown>

  if (!course_id || typeof course_id !== 'string') {
    return NextResponse.json({ error: 'course_id is required' }, { status: 400 })
  }
  if (!VALID_MODES.includes(String(grouping_mode))) {
    return NextResponse.json({ error: 'invalid grouping_mode' }, { status: 400 })
  }
  if (!VALID_TASKS.includes(String(task_type))) {
    return NextResponse.json({ error: 'invalid task_type' }, { status: 400 })
  }
  const size = Number(group_size)
  if (!Number.isInteger(size) || size < 2 || size > 6) {
    return NextResponse.json({ error: 'group_size must be 2–6' }, { status: 400 })
  }

  // Mint a code, retrying on the (rare) unique collision.
  let created: { id: string; code: string } | null = null
  for (let attempt = 0; attempt < 6 && !created; attempt++) {
    const code = generateLobbyCode(5)
    const { data, error } = await supabaseAdmin
      .from('lobby_sessions')
      .insert({
        course_id,
        created_by: ctx.userId,
        code,
        task_type,
        grouping_mode,
        group_size: size,
        target_id: target_id || null,
        prompt: prompt || null,
        status: 'lobby',
      })
      .select('id, code')
      .single()
    if (!error && data) created = data as { id: string; code: string }
    else if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
  }

  if (!created) return NextResponse.json({ error: 'Could not allocate a lobby code' }, { status: 500 })
  return NextResponse.json({ session: created }, { status: 201 })
})
