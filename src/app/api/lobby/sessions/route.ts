import {presentationForActor} from '@/lib/presentation-tools-server'
import { textbookGroupActivities } from '@/lib/textbook-group-activities-server'
import { groupTextbookPrompt, type TextbookGroupActivity } from '@/lib/textbook-group-activities'
import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { classLesson } from '@/lib/present-server'
import { getCourseOwnerEmail } from '@/lib/teacher-scope'
import { lobbyReadyDefault } from '@/data/content-blocks'
import { targetIdsForLesson } from '@/lib/lesson-targets'
import { generateLobbyCode } from '@/lib/lobby/passphrase'
import { getRoom, encodeEscapeConfig, type EscapePrize, type EscapePrizeTier } from '@/lib/lobby/escape'

const VALID_MODES = ['random', 'near_peer', 'matched', 'manual']
const VALID_TASKS = ['short_response', 'drawing', 'question', 'proof', 'jigsaw', 'escape']

// GET /api/lobby/sessions — sessions created by the signed-in teacher.
export const GET = withRole(['teacher', 'admin'], async (_request, ctx) => {
  const { data, error } = await supabaseAdmin
    .from('lobby_sessions')
    .select('id, course_id, code, task_type, grouping_mode, group_size, status, prompt:task_prompt, created_at')
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
    jigsaw_pieces = null,
    room_id = null,
    prize = null,
    // L-1 · launched from a lesson: which lesson / block / target the artifact is evidence for
    present_session_id = null,
    lesson_id = null,
    block_id = null,
    target_slug = null,
    language_balance = false,
    debrief = null,
    then = null,
    textbook_activity_id = null,
    explainer_frame = null,
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

  if (ctx.role !== 'admin' && (await getCourseOwnerEmail(course_id))?.toLowerCase() !== ctx.email.toLowerCase()) return NextResponse.json({ error: 'Forbidden class' }, { status: 403 })
  const presentation=typeof present_session_id==='string'?await presentationForActor(present_session_id,ctx):null
  if(present_session_id!==null&&(!presentation||presentation.status!=='live'||presentation.course_id!==course_id||presentation.lesson_id!==(lesson_id||null)))return NextResponse.json({error:'Choose the active presentation for this class.'},{status:409})
  if(presentation&&(typeof prompt!=='string'||!prompt.trim()||prompt.length>4000)&&!block_id&&!textbook_activity_id)return NextResponse.json({error:'Write a group activity prompt up to 4,000 characters.'},{status:400})
  const linkedLesson = typeof lesson_id === 'string' ? await classLesson(lesson_id, course_id, ctx) : null
  if (lesson_id && !linkedLesson) return NextResponse.json({ error: 'Lesson unavailable for class' }, { status: 400 })
  let textbook:TextbookGroupActivity|undefined
  if(textbook_activity_id!==null) {
    if(typeof textbook_activity_id!=='string'||!linkedLesson||task_type!=='short_response')return NextResponse.json({error:'Choose a textbook question for this lesson.'},{status:400})
    try { textbook=(await textbookGroupActivities(linkedLesson.content_blocks,course_id)).find(a=>a.id===textbook_activity_id) }
    catch { return NextResponse.json({error:'Textbook question could not be verified. Retry.'},{status:502}) }
    if(!textbook)return NextResponse.json({error:'Textbook question is no longer available.'},{status:400})
  }
  const linkedBlock = linkedLesson?.content_blocks.blocks.find(b => b.id === (textbook ? textbook.blockId : block_id))
  if (!textbook && block_id && (!linkedBlock || (!lobbyReadyDefault(linkedBlock) && !(linkedBlock.teachingTool?.kind==='physics-explainer' && explainer_frame!==null)))) return NextResponse.json({ error: 'Invalid lobby block' }, { status: 400 })

  const explainer=linkedBlock?.teachingTool?.kind==='physics-explainer'?linkedBlock.teachingTool:undefined
  const discussion=explainer&&typeof explainer_frame==='number'&&Number.isInteger(explainer_frame)?explainer.frames[explainer_frame]?.discussion:undefined
  if(explainer_frame!==null&&(!discussion||textbook||task_type!=='short_response'))return NextResponse.json({error:'Choose a discussion slide.'},{status:400})

  // Jigsaw: clean the authored pieces; require at least two.
  let pieces: string[] | null = null
  if (Array.isArray(jigsaw_pieces)) {
    pieces = (jigsaw_pieces as unknown[]).map((p) => String(p).trim()).filter(Boolean)
  }
  if (task_type === 'jigsaw' && (!pieces || pieces.length < 2)) {
    return NextResponse.json({ error: 'Jigsaw needs at least 2 content pieces' }, { status: 400 })
  }

  // Escape: validate the room and fold the room id + prize into task_prompt as
  // JSON (decoded by the escape API). Keeps the run self-contained — no new column.
  let taskPrompt: string | null = textbook?groupTextbookPrompt(textbook):discussion?discussion.prompt+'\n\nThink first, take turns explaining, then submit a group claim with evidence and reasoning.':typeof prompt === 'string' ? prompt : null
  if (task_type === 'escape') {
    const room = getRoom(typeof room_id === 'string' ? room_id : null)
    if (!room) return NextResponse.json({ error: 'Unknown escape room' }, { status: 400 })
    // Merge any teacher overrides over the room's default prize so blank fields fall back.
    const base = room.defaultPrize
    const p = (prize && typeof prize === 'object' ? (prize as Partial<EscapePrize>) : {})
    const chosenPrize: EscapePrize = {
      tier: (p.tier as EscapePrizeTier) ?? base.tier,
      xp: typeof p.xp === 'number' ? p.xp : base.xp,
      reveal: typeof p.reveal === 'string' && p.reveal.trim() ? p.reveal : base.reveal,
    }
    taskPrompt = encodeEscapeConfig({ roomId: room.id, prize: chosenPrize })
  }

  // L-1 · resolve the target: explicit id, else the block's slug, else the lesson's first target.
  let targetId: string | null = textbook?textbook.targetId:discussion?null:(typeof target_id === 'string' && target_id ? target_id : null)
  if (linkedBlock?.targetId) {
    const { data: target } = await supabaseAdmin.from('learning_targets').select('id').eq('slug', linkedBlock.targetId).maybeSingle()
    targetId = target?.id ?? null
  }
  if (!textbook && !discussion && !targetId && typeof target_slug === 'string' && target_slug) {
    const { data: t } = await supabaseAdmin.from('learning_targets').select('id').eq('slug', target_slug).maybeSingle()
    targetId = (t as { id: string } | null)?.id ?? null
  }
  if (!targetId && typeof lesson_id === 'string' && lesson_id) {
    const { data: t } = await supabaseAdmin.from('learning_targets').select('id').eq('lesson_id', lesson_id).order('order_index', { ascending: true }).limit(1).maybeSingle()
    targetId = (t as { id: string } | null)?.id ?? null
    if (!targetId) targetId = (await targetIdsForLesson(lesson_id))[0] ?? null // a day lesson that only references its week's targets
  }
  // Debrief question + teacher's next move ride along for the projector (L-5, L-6).
  const debriefText=textbook?.debrief??discussion?.debrief??debrief
  const debriefMeta = (typeof debriefText === 'string' && debriefText) || (typeof then === 'string' && then)
    ? { ...(textbook||discussion?{prompt_source:textbook?'textbook':'explainer',source_block_id:linkedBlock?.id??null,textbook_activity_id:textbook?.id??null,explainer_frame:discussion?explainer_frame:null}:{}), debrief: typeof debriefText === 'string' ? debriefText : null, then: typeof then === 'string' ? then : null }
    : null

  // Mint a code, retrying on the (rare) unique collision.
  let created: { id: string; code: string } | null = null
  for (let attempt = 0; attempt < 6 && !created; attempt++) {
    const code = generateLobbyCode(5)
    const { data, error } = await supabaseAdmin
      .from('lobby_sessions')
      .insert({
        course_id,
        created_by: presentation?.teacher_id??ctx.userId,
        present_session_id: presentation?.id??null,
        code,
        task_type,
        grouping_mode,
        group_size: size,
        target_id: targetId,
        task_prompt: taskPrompt,
        jigsaw_pieces: task_type === 'jigsaw' ? pieces : null,
        status: 'lobby',
        lesson_id: typeof lesson_id === 'string' && lesson_id ? lesson_id : null,
        block_id: textbook||discussion?null:typeof block_id === 'string' && block_id ? block_id : null,
        language_balance: language_balance === true,
        debrief_meta: debriefMeta,
      })
      .select('id, code, status, debrief_meta, task_prompt')
      .single()
    if (!error && data) created = data as { id: string; code: string }
    else if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return NextResponse.json({ error: error.code==='P0001'?error.message:'Failed to create session' }, { status: error.code==='P0001'?409:500 })
    }
  }

  if (!created) return NextResponse.json({ error: 'Could not allocate a lobby code' }, { status: 500 })
  return NextResponse.json({ session: created }, { status: 201 })
})
