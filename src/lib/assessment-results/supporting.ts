import 'server-only'
import { calendarAssigned } from '@/lib/calendar-assignment'
import { byIds, read, type Scope } from './queries'
import { notStarted, resultUnitIds } from './model'
import type { ResultActivity, ResultCell } from './types'
import type { VocabTask } from '@/lib/vocab-learning'
import { vocabularyProgress, type VocabEvidenceCheck, type VocabMasteryReview } from '@/lib/vocab-mastery'
import { checkpointScore, publicCheckpoint, type CheckpointRow } from '@/lib/vocab-checkpoint'
import { decayingAverage } from '@/data/curriculum-types'
import type { BlockDocument, InstructionVideoBlock } from '@/data/content-blocks'
import { isCurrentLesson } from '@/lib/current-lesson-catalog'
import { isBlockVisible, isLessonVisible } from '@/lib/track-visibility'
import { lessonsByTarget } from '@/lib/lesson-targets'
import { videoViewing, lessonViewing, type RecordedVideo, type VideoSpec } from '@/lib/teacher-video-progress'
import { getPendingMasteryWork } from '@/lib/pending-lesson-work'
import { pendingLessonSubmissions, type LessonSubmission } from '@/lib/lesson-review'

export async function vocabularyResults(scope: Scope): Promise<ResultActivity[]> {
  const tasks = (await read<VocabTask>('vocab_tasks', '*', q => q.eq('course_id', scope.course.id), ['id'])).filter(t => !t.syllabus_draft)
  const ids = tasks.map(t => t.id), users = scope.students.map(s => s.id)
  const [checks, reviews, attempts] = await Promise.all([
    byIds<VocabEvidenceCheck & { task_id: string; user_id: string }>('vocab_checks', 'id,task_id,user_id,completed_at,result,review_version,requires_release,reviewed_at', 'task_id', ids, ['id'], q => q.in('user_id', users)),
    byIds<VocabMasteryReview>('vocab_mastery_reviews', 'id,task_id,user_id,target_id,level,evidence_key,note,created_at,reviewer_email', 'task_id', ids, ['id'], q => q.in('user_id', users)),
    byIds<CheckpointRow>('vocab_checkpoint_attempts', '*', 'task_id', tasks.filter(t => t.quiz_format === 'checkpoint').map(t => t.id), ['number', 'id'], q => q.in('user_id', users)),
  ])
  return tasks.map(task => ({ key: 'vocabulary:' + task.id, sourceId: task.id, title: task.title, kind: 'vocabulary', unitIds: resultUnitIds(task.target_id ? [task.target_id] : [], scope.targets), targetIds: task.target_id ? [task.target_id] : [], dueAt: task.due_on, dateOnly: true, archived: !task.active,
    cells: Object.fromEntries(scope.students.filter(s => task.student_ids.includes(s.id)).map(student => {
      const studentChecks = checks.filter(c => c.task_id === task.id && c.user_id === student.id)
      const progress = vocabularyProgress(task, studentChecks, reviews.filter(r => r.task_id === task.id && r.user_id === student.id))
      const needsReview = progress.status === 'pending' || progress.status === 'quiz-review'
      let cell: ResultCell = !progress.checks.length ? studentChecks.length ? { state: 'draft', label: 'In progress', needsReview: false } : notStarted() : {
        state: progress.status === 'rated' ? 'reviewed' : 'submitted',
        label: task.task_kind === 'quiz' ? progress.quiz?.score == null ? 'Needs scoring' : `${progress.quiz.score}%` : progress.accuracy == null ? 'Needs review' : `${progress.accuracy}% accuracy`,
        detail: `${progress.ready}/${progress.total} words at practice goal · ${progress.status === 'rated' ? `Knowledge ${progress.review!.level}/3` : task.target_id ? 'Mastery not yet rated' : 'Link a Knowledge target'}`,
        needsReview, submittedAt: progress.checks[0]?.completed_at,
      }
      const quiz=progress.quiz, latestCheck=progress.checks[0]
      if(latestCheck){cell.submissionId=latestCheck.id;cell.assessmentSource='vocabulary'}
      if(quiz?.submitted&&!quiz.needsReview&&quiz.score!==null&&quiz.total){
        const results=quiz.responses??[],weighted=results.every(r=>typeof r.points==='number'&&typeof r.max_points==='number')
        cell.grade={earned:weighted?results.reduce((n,r)=>n+r.points!,0):results.filter(r=>r.correct).length,possible:weighted?results.reduce((n,r)=>n+r.max_points!,0):quiz.total,version:latestCheck.id+':'+latestCheck.review_version}
      }
      if (task.quiz_format === 'checkpoint') {
        const all = attempts.filter(a => a.task_id === task.id && a.user_id === student.id).sort((a, b) => b.number - a.number)
        const latest = all[0], best = all.filter(a => a.released_at).map(a => checkpointScore(a.questions, publicCheckpoint(a, true))).filter(s => s.complete && s.percent !== null).sort((a, b) => b.percent! - a.percent!)[0]
        cell = { ...cell, assessmentSource:'checkpoint', grade: best && best.points !== null ? {earned:best.points,possible:best.possible,version:all.filter(a=>a.released_at).map(a=>a.id+':'+a.version).join('|')} : undefined, submissionId:latest?.id, submittedAt:latest?.submitted_at, state: latest?.submitted_at ? latest.released_at ? 'reviewed' : 'submitted' : latest ? 'draft' : 'not_started', label: best ? `${best.percent}%` : latest?.submitted_at ? 'Needs scoring / release' : latest ? 'In progress' : 'Not started', needsReview: needsReview || !!latest?.submitted_at && !latest.released_at,
          detail: `${best ? 'Best released grade · ' : ''}${latest && !latest.released_at && best ? 'Reassessment in progress · ' : ''}${progress.status === 'rated' ? `Knowledge ${progress.review!.level}/3` : 'Mastery not yet rated'}` }
      }
      if (cell.needsReview && task.target_id) cell.pendingTargets = [task.target_id]
      return [student.id, cell]
    })) }))
}

/** Adaptive math is a year-long strand, not an invented unit assignment or a percentage grade. */
export async function mathResults(scope: Scope): Promise<ResultActivity[]> {
  const users = scope.students.map(s => s.id)
  const [competencies, records, submissions, revisions, instances, missions] = await Promise.all([
    read<{ id: string; code: string; statement: string }>('math_competencies', 'id,code,statement', q => q.eq('is_active', true), ['sequence_order', 'order_index', 'id']),
    byIds<{ user_id: string; competency_id: string; level: number; observed_at: string }>('math_competency_records', 'user_id,competency_id,level,observed_at', 'user_id', users, ['observed_at', 'id']),
    byIds<{ id: string; user_id: string; competency_id: string; tested_competency_ids: string[]; status: string; resulting_level: number | null; submitted_at: string; revision_requested: boolean }>('math_warmup_submissions', 'id,user_id,competency_id,tested_competency_ids,status,resulting_level,submitted_at,revision_requested', 'user_id', users, ['submitted_at', 'id']),
    byIds<{ submission_id: string; user_id: string; status: string }>('math_warmup_revisions', 'submission_id,user_id,status', 'user_id', users, ['submitted_at', 'id']),
    byIds<{ user_id: string; item: { competencyId?: string } }>('math_warmup_instances', 'user_id,item', 'user_id', users, ['id']),
    byIds<{ id:string;user_id: string; code: string; status: string; score: number;completed_at:string|null;reviewed_at:string|null }>('math_mission_sessions', 'id,user_id,code,status,score,completed_at,reviewed_at', 'user_id', users, ['created_at', 'id'], q => q.eq('staff', false)),
  ])
  const pendingRevisions = new Set(revisions.filter(r => r.status === 'pending').map(r => r.submission_id))
  return competencies.map(c => ({ key: 'math:' + c.id, sourceId: c.id, title: `${c.code} · ${c.statement}`, code: c.code, kind: 'math', unitIds: [], crossUnit: true, targetIds: [], dueAt: null, archived: false,
    cells: Object.fromEntries(scope.students.map(s => {
      const work = submissions.filter(w => w.user_id === s.id && (w.tested_competency_ids?.includes(c.id) || w.competency_id === c.id))
      const levels = records.filter(r => r.user_id === s.id && r.competency_id === c.id).map(r => r.level)
      const pending = work.filter(w => w.status === 'pending' || pendingRevisions.has(w.id))
      const mission = missions.filter(m => m.user_id === s.id && m.code === c.code), complete = mission.filter(m => m.status === 'completed').length
      const pendingMissions=mission.filter(m=>m.status==='completed'&&!m.reviewed_at)
      const pendingCount=pending.length+pendingMissions.length
      const issued = instances.some(i => i.user_id === s.id && i.item.competencyId === c.id)
      const latest = work.at(-1)
      const value = levels.length ? decayingAverage(levels) : null
      return [s.id, { state: pendingCount ? 'submitted' : latest?.revision_requested ? 'returned' : latest || levels.length ? 'reviewed' : complete ? 'completed' : issued || mission.length ? 'draft' : 'not_started',
        label: pendingCount ? `${pendingCount} to review` : latest?.revision_requested ? 'Revision requested' : latest?.resulting_level ? `${latest.resulting_level}/3 · latest warm-up` : latest ? 'Reviewed · no rating' : complete ? `${complete} missions completed` : issued || mission.length ? 'In progress' : 'No evidence yet',
        detail: `${levels.length} teacher ${levels.length === 1 ? 'observation' : 'observations'}${mission.length ? ` · ${complete}/${mission.length} missions completed` : ''}`,
        needsReview: pendingCount > 0, submissionId:pending[0]?.id??(pendingMissions[0]?'mission:'+pendingMissions[0].id:latest?.id), reviewIds: [...pending.map(w => 'math:' + w.id),...pendingMissions.map(m=>'mission:'+m.id)], reviewItems:[...pending.map(w=>({id:'math:'+w.id,submittedAt:w.submitted_at})),...pendingMissions.map(m=>({id:'mission:'+m.id,submittedAt:m.completed_at??""}))], masteryValue: value, masteryCount: levels.length, submittedAt: latest?.submitted_at,
      } satisfies ResultCell]
    })) }))
}

export async function videoResults(scope: Scope): Promise<ResultActivity[]> {
  const viewer = { role: 'student' as const, track: scope.course.track }, users = scope.students.map(s => s.id)
  const [allLessons, windows, durations] = await Promise.all([
    byIds<{ id: string; title: string; unit_id: string; visibility_track: string | null; content_blocks: BlockDocument }>('lessons', 'id,title,unit_id,visibility_track,content_blocks', 'unit_id', [...new Set(scope.targetRows.map(t => t.unit_id))], ['id'], q => q.eq('published', true)),
    read<{ lesson_id: string; due_at: string | null }>('lesson_class_windows', 'lesson_id,due_at', q => q.eq('course_id', scope.course.id), ['lesson_id']),
    read<{ youtube_id: string; duration_seconds: number }>('lesson_video_catalog', 'youtube_id,duration_seconds', q => q, ['youtube_id']),
  ])
  const durationMap = new Map(durations.map(d => [d.youtube_id, d.duration_seconds]))
  const lessons = allLessons.filter(l => isCurrentLesson({ ...l, program: scope.course.program }) && isLessonVisible(l.visibility_track, viewer)).map(l => ({ ...l, content_blocks: { ...l.content_blocks, blocks: (l.content_blocks?.blocks ?? []).filter(b => isBlockVisible(b, viewer)) } }))
    .filter(l => l.content_blocks.blocks.some(b => b.type === 'instruction_video'))
  const ids = lessons.map(l => l.id)
  const [progress, submissions] = await Promise.all([
    byIds<RecordedVideo & { user_id: string; lesson_id: string }>('lesson_video_progress', 'user_id,lesson_id,youtube_id,duration_seconds,start_seconds,watched_seconds,updated_at', 'lesson_id', ids, ['lesson_id', 'user_id', 'youtube_id'], q => q.in('user_id', users)),
    byIds<LessonSubmission>('lesson_submissions', 'id,user_id,lesson_id,submitted_at', 'lesson_id', ids, ['submitted_at', 'id'], q => q.in('user_id', users)),
  ])
  const carriers = lessonsByTarget(lessons, scope.targetRows)
  const reviews = await byIds<{ submission_id: string }>('lesson_reviews', 'submission_id', 'submission_id', submissions.map(s => s.id), ['id'])
  const { reviewQueue, assessedSubmissionIds } = await getPendingMasteryWork(users, lessons, scope.targetRows, carriers, submissions, pendingLessonSubmissions(submissions, new Set(reviews.map(r => r.submission_id))))
  const windowMap = new Map(windows.map(w => [w.lesson_id, w]))
  // Include assigned lessons and actual student activity; a published catalog item alone is not an assignment.
  return lessons.filter(l => windowMap.has(l.id) || progress.some(p => p.lesson_id === l.id) || submissions.some(s => s.lesson_id === l.id)).map(l => {
    const specs: VideoSpec[] = [...new Map(l.content_blocks.blocks.filter((b): b is InstructionVideoBlock => b.type === 'instruction_video').map(b => [`${b.youtubeId}:${b.startSeconds ?? 0}`, { youtubeId: b.youtubeId, title: b.title, duration: durationMap.get(b.youtubeId) ?? b.durationSeconds ?? null, start: Math.max(0, Math.floor(b.startSeconds ?? 0)) }])).values()]
    const targetIds = scope.targetRows.filter(t => carriers.get(t.id)?.includes(l.id)).map(t => t.id)
    return { key: 'video:' + l.id, sourceId: l.id, title: l.title, kind: 'video', unitIds: [l.unit_id], targetIds, dueAt: windowMap.get(l.id)?.due_at ?? null, archived: !calendarAssigned(true, windowMap.get(l.id)?.due_at),
      cells: Object.fromEntries(scope.students.flatMap(s => {
        const rows = progress.filter(p => p.user_id === s.id && p.lesson_id === l.id), sub = submissions.filter(p => p.user_id === s.id && p.lesson_id === l.id).at(-1)
        if (!windowMap.has(l.id) && !rows.length && !sub) return []
        const viewing = lessonViewing(specs.map(spec => videoViewing(spec, rows.find(r => r.youtube_id === spec.youtubeId))))
        const pendingTargets = [...new Set(reviewQueue.filter(r => r.studentId === s.id && r.lessonId === l.id).map(r => r.targetId))]
        const reviewed = !!sub && (reviews.some(r => r.submission_id === sub.id) || assessedSubmissionIds.has(sub.id))
        const needsReview = !!sub && !reviewed || pendingTargets.length > 0
        return [[s.id, { state: needsReview ? 'submitted' : reviewed ? 'reviewed' : viewing.state === 'viewed' ? 'completed' : rows.length ? 'draft' : 'not_started',
          label: reviewed ? 'Returned' : viewing.percent === null ? 'Viewing untracked' : `${viewing.percent}% viewed`, detail: `${reviewed ? 'Teacher review returned' : needsReview ? 'Answers need review' : 'No submitted answers'} · ${viewing.viewedVideos}/${viewing.totalVideos} videos viewed`,
          needsReview, pendingTargets, submissionId: sub?.id, submittedAt: sub?.submitted_at,
        } satisfies ResultCell]]
      })) }
  })
}

/** Creative work uses the same submission receipts and target review queue as other lessons. */
export async function reflectionResults(scope: Scope): Promise<ResultActivity[]> {
  const users = scope.students.map(s => s.id)
  const lessons = (await byIds<{id:string; title:string; unit_id:string; visibility_track:string|null; content_blocks:BlockDocument}>('lessons','id,title,unit_id,visibility_track,content_blocks','unit_id',[...new Set(scope.targetRows.map(t=>t.unit_id))],['id'],q=>q.eq('published',true))).filter(l=>(l.content_blocks?.reflection || !(l.content_blocks?.blocks??[]).some(b=>b.type==='instruction_video')) && isLessonVisible(l.visibility_track,{role:'student',track:scope.course.track}))
  for (const lesson of lessons) lesson.content_blocks={...lesson.content_blocks,blocks:lesson.content_blocks.blocks.filter(b=>isBlockVisible(b,{role:'student',track:scope.course.track}))}
  const ids=lessons.map(l=>l.id)
  if(!ids.length || !users.length)return []
  const [windows,submissions,drafts,responses]=await Promise.all([
    byIds<{lesson_id:string;due_at:string|null}>('lesson_class_windows','lesson_id,due_at','lesson_id',ids,['lesson_id'],q=>q.eq('course_id',scope.course.id)),
    byIds<LessonSubmission>('lesson_submissions','id,user_id,lesson_id,submitted_at','lesson_id',ids,['submitted_at','id'],q=>q.in('user_id',users)),
    byIds<{lesson_id:string;user_id:string}>('block_drafts','lesson_id,user_id','lesson_id',ids,['lesson_id','user_id','block_id'],q=>q.in('user_id',users)),
    byIds<{lesson_id:string;user_id:string}>('block_responses','lesson_id,user_id','lesson_id',ids,['id'],q=>q.in('user_id',users)),
  ])
  const reviews=await byIds<{submission_id:string}>('lesson_reviews','submission_id','submission_id',submissions.map(s=>s.id),['id'])
  const carriers=lessonsByTarget(lessons,scope.targetRows)
  const {reviewQueue,assessedSubmissionIds}=await getPendingMasteryWork(users,lessons,scope.targetRows,carriers,submissions,pendingLessonSubmissions(submissions,new Set(reviews.map(r=>r.submission_id))))
  return lessons.filter(l=>windows.some(w=>w.lesson_id===l.id)||submissions.some(s=>s.lesson_id===l.id)).map(l=>({key:(l.content_blocks?.reflection?'reflection:':'lesson:')+l.id,sourceId:l.id,kind:l.content_blocks?.reflection?'reflection':'lesson',title:l.title,unitIds:[l.unit_id],targetIds:scope.targetRows.filter(t=>carriers.get(t.id)?.includes(l.id)).map(t=>t.id),dueAt:windows.find(w=>w.lesson_id===l.id)?.due_at??null,archived:!calendarAssigned(true,windows.find(w=>w.lesson_id===l.id)?.due_at),cells:Object.fromEntries(users.filter(user=>windows.some(w=>w.lesson_id===l.id)||[...submissions,...drafts,...responses].some(r=>r.lesson_id===l.id&&r.user_id===user)).map(user=>{
    const sub=submissions.filter(s=>s.lesson_id===l.id&&s.user_id===user).at(-1),pendingTargets=reviewQueue.filter(r=>r.studentId===user&&r.lessonId===l.id).map(r=>r.targetId),reviewed=!!sub&&(reviews.some(r=>r.submission_id===sub.id)||assessedSubmissionIds.has(sub.id)),working=[...drafts,...responses].some(r=>r.lesson_id===l.id&&r.user_id===user)
    return [user,{state:sub?reviewed?'reviewed':'submitted':working?'draft':'not_started',label:sub?reviewed?'Returned':'Submitted':working?'In progress':'Not started',detail:reviewed?'Teacher review returned':pendingTargets.length?'Target evidence awaits review':sub?'Teacher review records mastery':'No submitted work',needsReview:!!sub&&(!reviewed||pendingTargets.length>0),pendingTargets,submissionId:sub?.id,submittedAt:sub?.submitted_at} satisfies ResultCell]
  }))}))
}
