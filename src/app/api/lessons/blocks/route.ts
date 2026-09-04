import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CAPTURE_BLOCK_TYPES, ContentBlock, isResponseComplete } from '@/data/content-blocks'
import { withAuth, withEnrolledStudent } from '@/lib/api-auth'
import { evidenceSourceFor, isConfidence, isEvidenceSource } from '@/lib/evidence'
import { resolveTargetStudent } from '@/lib/teacher-scope'
import { getStudentTrack } from '@/lib/student-enrollment'
import { isBlockVisible, type Viewer } from '@/lib/track-visibility'

// POST /api/lessons/blocks  — save a student's response to a capture block (append-only).
// Body: { lesson_id, block_id, block_type, response, response_mode?, scaffolds_used?, target_id?, evidence_source?, confidence?, role? }
export const POST = withEnrolledStudent(async (request, ctx) => {
    const body = await request.json()
    if (!body.lesson_id || !body.block_id || body.response === undefined) {
      return NextResponse.json({ error: 'Missing lesson_id, block_id, or response' }, { status: 400 })
    }
    // The lesson's blocks: needed for the auto-check (E-3), the XP award (B-4)
    // and the progress recompute below. One fetch.
    const { data: lessonRow } = await supabaseAdmin
      .from('lessons')
      .select('slug, content_blocks')
      .eq('id', body.lesson_id)
      .single()
    const blocks: ContentBlock[] = lessonRow?.content_blocks?.blocks ?? []
    const block = blocks.find((b) => b.id === body.block_id)

    // E-3 · self-check for an inline question with an answer key: feedback and a
    // sort key on the response (autoCheck), never a mastery record. The key itself
    // never reaches the student (stripped server-side by the lesson page).
    let response: unknown = body.response
    if (block?.type === 'question' && response && typeof response === 'object') {
      const q = (block as { question?: { correctOptionId?: string; options?: { id: string }[] } }).question
      const picked = (response as { optionId?: string }).optionId
      if (q?.correctOptionId && picked) response = { ...(response as object), autoCheck: picked === q.correctOptionId ? 'match' : 'mismatch' }
    }
    // The block's own targetId is the default tag when the client sends none (B-2).
    const targetRef = typeof body.target_id === 'string' && body.target_id.trim() ? body.target_id.trim() : (block?.targetId ?? null)

    // E-1 · target: the block's targetId is a learning_targets slug (or id); resolve to the uuid.
    let targetId: string | null = null
    if (targetRef) {
      const t = targetRef
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)
      const { data: tr } = await supabaseAdmin.from('learning_targets').select('id').eq(isUuid ? 'id' : 'slug', t).maybeSingle()
      targetId = (tr as { id: string } | null)?.id ?? null
    }
    const { data, error } = await supabaseAdmin
      .from('block_responses')
      .insert({
        user_id: ctx.userId,
        target_id: targetId,
        evidence_source: isEvidenceSource(body.evidence_source) ? body.evidence_source : evidenceSourceFor(String(body.block_type ?? '')),
        confidence: isConfidence(body.confidence) ? body.confidence : null,
        role: typeof body.role === 'string' ? body.role.slice(0, 40) : null,
        user_email: ctx.email,
        lesson_id: body.lesson_id,
        block_id: body.block_id,
        block_type: body.block_type ?? null,
        response,
        // SEI context (design "SEI in Blocks"): how they answered + which scaffolds were on. Never a score.
        response_mode: ['text', 'sketch', 'audio', 'label', 'choice'].includes(body.response_mode) ? body.response_mode : null,
        scaffolds_used: Array.isArray(body.scaffolds_used) ? body.scaffolds_used.filter((s: unknown) => typeof s === 'string').slice(0, 24) : [],
      })
      .select()
      .single()
    if (error) {
      console.error('Error saving block response:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // The explicit save is the record; the autosave draft for this block is now moot.
    void supabaseAdmin.from('block_drafts').delete().match({ user_id: ctx.userId, lesson_id: body.lesson_id, block_id: body.block_id }).then(() => undefined, () => undefined)

    // B-4 · XP once per student per block, on the first COMPLETE save. The dedupe
    // key makes re-saves and re-submits no-ops; the existing grants table is the
    // one XP path.
    let xpAwarded = 0
    const blockXp = typeof block?.xp === 'number' && block.xp > 0 ? Math.round(block.xp) : 0
    if (blockXp > 0 && isResponseComplete(block?.type ?? '', response) && (response as { autoCheck?: string })?.autoCheck !== 'mismatch') {
      try {
        const { data: grant } = await supabaseAdmin.from('economy_point_grants').upsert(
          { user_id: ctx.userId, user_email: ctx.email, source: 'lesson-block', reference: `${body.lesson_id}:${body.block_id}`, points: blockXp, note: `Lesson block ${body.block_id}`, dedupe_key: `block-xp:${body.lesson_id}:${body.block_id}:${ctx.userId}` },
          { onConflict: 'dedupe_key', ignoreDuplicates: true },
        ).select('id')
        if (Array.isArray(grant) && grant.length > 0) xpAwarded = blockXp
      } catch { /* XP is best-effort; never block the save */ }
    }

    // Earning loop (best-effort): log activity + recompute lesson engagement so the
    // work feeds the activity feed, streaks, leaderboard points, and the dashboard.
    try {
      await supabaseAdmin.from('student_activity').insert({
        user_id: ctx.userId,
        user_email: ctx.email,
        activity_type: 'lesson_block',
        lesson_id: body.lesson_id,
      })

      // Only count capture blocks this student's track can actually see — otherwise
      // honors capture blocks would hold a CPA student's completion below 100%
      // (and a CPA-only block would do the same to an honors student). Staff see all.
      const viewer: Viewer = ctx.realRole === 'student'
        ? { role: 'student', track: await getStudentTrack(ctx.userId) }
        : { role: 'admin' }
      const captureBlocks = blocks.filter((b) => (CAPTURE_BLOCK_TYPES as string[]).includes(b.type) && isBlockVisible(b, viewer))
      const captureIds = captureBlocks.map((b) => b.id)
      const typeById = new Map(captureBlocks.map((b) => [b.id, b.type]))

      if (captureIds.length > 0) {
        // Latest response per block, then count only those DELIBERATELY completed
        // (submitted/saved with real content) — a draft autosave must not count.
        const { data: resp } = await supabaseAdmin
          .from('block_responses')
          .select('block_id, response, created_at')
          .eq('user_id', ctx.userId)
          .eq('lesson_id', body.lesson_id)
          .in('block_id', captureIds)
          .order('created_at', { ascending: true })
        const latest = new Map<string, unknown>()
        for (const r of resp ?? []) latest.set(r.block_id, r.response)
        const done = new Set<string>()
        for (const [blockId, response] of latest) {
          if (isResponseComplete(typeById.get(blockId) ?? '', response)) done.add(blockId)
        }
        const pct = Math.round((done.size / captureIds.length) * 100)
        const completed = pct >= 100
        await supabaseAdmin.from('lesson_progress').upsert(
          {
            user_id: ctx.userId,
            user_email: ctx.email,
            lesson_id: body.lesson_id,
            lesson_slug: lessonRow?.slug ?? null,
            status: completed ? 'completed' : 'in_progress',
            progress_percentage: pct,
            last_accessed_at: new Date().toISOString(),
            completed_at: completed ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,lesson_id' },
        )
      }
    } catch (e) {
      console.error('block save side-effects failed:', e)
    }

    return NextResponse.json({ ...(data as object), response, xp_awarded: xpAwarded }, { status: 201 })
})

// GET /api/lessons/blocks?lesson_id=...  — latest response per block for the current student.
// Staff may pass &user_id= to view a specific student.
export const GET = withAuth(async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lesson_id')
    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lesson_id' }, { status: 400 })
    }
    const role = ctx.role
    const requested = searchParams.get('user_id')
    // Admins may view any student; a teacher only their own roster.
    const resolved = await resolveTargetStudent({
      role,
      selfId: ctx.userId,
      scopeEmail: ctx.email,
      requestedUserId: requested,
    })
    if (!resolved.ok) {
      return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
    }
    const targetUserId = resolved.userId

    const { data, error } = await supabaseAdmin
      .from('block_responses')
      .select('block_id, block_type, response, created_at')
      .eq('lesson_id', lessonId)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // latest wins per block_id
    const responses: Record<string, { response: unknown; block_type: string | null; created_at: string }> = {}
    for (const row of data ?? []) {
      responses[row.block_id] = { response: row.response, block_type: row.block_type, created_at: row.created_at }
    }
    return NextResponse.json({ responses })
})
