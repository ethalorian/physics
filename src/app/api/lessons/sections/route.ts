import { paginateBlocks } from '@/data/content-blocks'
import { documentRevision, sectionAnchor } from '@/lib/lesson-anchors'
import { authorizeLesson } from '@/lib/lesson-access'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withEnrolledStudent } from '@/lib/api-auth'
import { resolveTargetStudent } from '@/lib/teacher-scope'

// Per-section completion for the lesson reading screen (rail / checkpoints).
// Mirrors /api/lessons/blocks: students write their own; staff may read a
// specific student's via ?user_id (roster-scoped for teachers).

function cleanIndices(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const set = new Set<number>()
  for (const v of value) {
    if (Number.isInteger(v) && (v as number) >= 0 && (v as number) < 1000) set.add(v as number)
  }
  return [...set].sort((a, b) => a - b)
}

// GET /api/lessons/sections?lesson_id=...  → { completed: number[] }
export const GET = withAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'Missing lesson_id' }, { status: 400 })

  const access = await authorizeLesson(ctx, lessonId)
  if (!access.ok) return access.response

  const resolved = await resolveTargetStudent({
    role: ctx.role,
    selfId: ctx.userId,
    scopeEmail: ctx.scopeEmail,
    requestedUserId: searchParams.get('user_id'),
  })
  if (!resolved.ok) {
    return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('lesson_section_progress')
    .select('completed_sections, completed_anchors, document_revision')
    .eq('lesson_id', lessonId)
    .eq('user_id', resolved.userId)
    .maybeSingle()
  if (error) {
    console.error('Error reading section progress:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ completed: cleanIndices(data?.completed_sections), completed_anchors: data?.completed_anchors ?? [], document_revision: data?.document_revision ?? null })
})

// POST /api/lessons/sections  — replace the completed set (idempotent).
// Body: { lesson_id, completed: number[] }
export const POST = withEnrolledStudent(async (request, ctx) => {
  const body = await request.json()
  if (!body.lesson_id || !Array.isArray(body.completed)) {
    return NextResponse.json({ error: 'Missing lesson_id or completed[]' }, { status: 400 })
  }
  const access = await authorizeLesson(ctx, body.lesson_id, true)
  if (!access.ok) return access.response
  const pages = paginateBlocks(access.document?.blocks ?? [])
  const expectedRevision = documentRevision(pages)
  if (body.document_revision !== expectedRevision) return NextResponse.json({ error: 'Lesson content changed. Reload before saving section progress.' }, { status: 409 })
  const validAnchors = new Set(pages.map(sectionAnchor))
  const completed = cleanIndices(body.completed).filter((n) => n < pages.length)
  const anchors = Array.isArray(body.completed_anchors) ? [...new Set(body.completed_anchors.filter((a: unknown): a is string => typeof a === 'string' && a.length > 0 && a.length < 200 && validAnchors.has(a)))].slice(0, 1000) : []
  const revision = typeof body.document_revision === 'string' && body.document_revision.length < 200 ? body.document_revision : null
  const { error } = await supabaseAdmin
    .from('lesson_section_progress')
    .upsert(
      {
        user_id: ctx.userId,
        user_email: ctx.email,
        lesson_id: body.lesson_id,
        completed_sections: completed,
        completed_anchors: anchors,
        document_revision: revision,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' },
    )
  if (error) {
    console.error('Error saving section progress:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, completed }, { status: 200 })
})
