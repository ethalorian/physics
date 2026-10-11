import { NextResponse } from 'next/server'
import { withEnrolledStudent } from '@/lib/api-auth'
import { authorizeLesson } from '@/lib/lesson-access'
import { isBlockVisible } from '@/lib/track-visibility'
import { supabaseAdmin } from '@/lib/supabase'
import { validVideoHeartbeat } from '@/lib/lesson-video-xp'

export const GET = withEnrolledStudent(async (request, ctx) => {
  if (ctx.realRole !== 'student') return NextResponse.json({ error: 'Previews do not earn XP.' }, { status: 403 })
  const params = new URL(request.url).searchParams
  if (params.get('expected_user_id') !== ctx.userId) return NextResponse.json({ error: 'Account changed. Reload this lesson.' }, { status: 409 })
  const lessonId = params.get('lesson_id'), blockId = params.get('block_id')
  if (!lessonId || !blockId) return NextResponse.json({ error: 'Missing lesson or video.' }, { status: 400 })
  const access = await authorizeLesson(ctx, lessonId)
  if (!access.ok) return access.response
  const block = access.document?.blocks.find(b => b.id === blockId && b.type === 'instruction_video')
  if (!block || !isBlockVisible(block, access.viewer)) return NextResponse.json({ error: 'Video not found.' }, { status: 404 })
  const { data, error } = await supabaseAdmin.rpc('lesson_video_xp_status', { p_user: ctx.userId, p_lesson: lessonId, p_block: blockId })
  if (error) throw error
  if (!data) return NextResponse.json({ error: 'Watch XP needs a verified video duration.' }, { status: 422 })
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
})

export const POST = withEnrolledStudent(async (request, ctx) => {
  if (ctx.realRole !== 'student') return NextResponse.json({ error: 'Previews do not earn XP.' }, { status: 403 })
  const body: unknown = await request.json()
  if (!validVideoHeartbeat(body)) return NextResponse.json({ error: 'Invalid watch progress.' }, { status: 400 })
  if (body.expected_user_id !== ctx.userId) return NextResponse.json({ error: 'Account changed. Reload this lesson.' }, { status: 409 })
  // Video participation does not edit submitted answers; the lesson must still be open.
  const access = await authorizeLesson(ctx, body.lesson_id)
  if (!access.ok) return access.response
  const block = access.document?.blocks.find(b => b.id === body.block_id && b.type === 'instruction_video')
  if (!block || !isBlockVisible(block, access.viewer)) return NextResponse.json({ error: 'Video not found.' }, { status: 404 })
  const { data, error } = await supabaseAdmin.rpc('record_lesson_video_watch', {
    p_user: ctx.userId, p_email: ctx.email, p_lesson: body.lesson_id, p_block: body.block_id,
    p_session: body.session_id, p_position: body.position, p_playing: body.playing,
  })
  if (error) throw error
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
})
