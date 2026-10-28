import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { dailyWorksheet, worksheetLabels, type WorksheetTrack } from '@/lib/daily-worksheets'
import { worksheetCatalogEntries, worksheetQuizPreview, worksheetUuid } from '@/lib/worksheet-assignments-server'
import { parseWorksheetPlanKey, worksheetPlanKey } from '@/lib/worksheet-planning'
import { validateQuiz } from '@/lib/quizzes/validation'
import type { WorksheetAssignment } from '@/lib/worksheet-assignments'
import type { ReadingCourse } from '@/lib/textbook-assignments'
import type { PlanActivity, PlanningData } from './types'

export function worksheetPlanCatalog(course: ReadingCourse, targets: PlanningData['targets']): PlanActivity[] {
  if (course.program !== 'physics') return []
  const track = course.track === 'honors' ? 'honors' : 'cpa'
  const editions: WorksheetTrack[] = [track, `${track}-sei`]
  return worksheetCatalogEntries(track).flatMap(entry => editions.map(edition => {
    const key = worksheetPlanKey(entry.unit, entry.day, edition)
    const setupHref = '/admin/worksheets?' + new URLSearchParams({class:course.id,unit:entry.unit,day:String(entry.day),edition})
    return {
      key, sourceId:key, kind:'worksheet', title:`Day ${entry.day} · ${entry.title} · ${worksheetLabels[edition]}`,
      unitIds:[entry.unit], targetIds:targets.filter(t => t.unit_id === entry.unit && entry.targetSlugs.includes(t.slug)).map(t => t.id),
      description:'Paper hand-in with a paired six-question multiple-choice quiz using new problems. Placing this on the calendar assigns both; paper receipt and quiz results stay separate.',
      prompts:entry.criteria, minutes:null, href:setupHref, setupHref,
      teach:[{label:'Print worksheet',href:dailyWorksheet(entry.unit,entry.day)!.files[edition].path}],
      scheduling:'source', availability:'Worksheet + paired quiz · Ready to assign',
    }
  }))
}

/** Prepare validated, offline-authored content. Only the calendar RPC writes. */
export async function worksheetTeachingAssignment(course: ReadingCourse, key: string) {
  const selection = parseWorksheetPlanKey(key)
  if (!selection || course.program !== 'physics') throw Error('Choose an available Physics worksheet.')
  const {unit,day,edition} = selection
  const {data,error} = await supabaseAdmin.from('worksheet_assignments').select('*').eq('course_id',course.id).eq('unit_id',unit).eq('day',day).eq('edition',edition).order('created_at').order('id')
  if (error) throw error
  const copies = (data ?? []) as WorksheetAssignment[]
  const bound = copies.find(a => a.plan_key === key)
  const candidates = copies.filter(a => !a.plan_key && a.student_ids === null)
  const active = candidates.filter(a => a.status === 'published')
  if (!bound && active.length > 1) throw Error('This class has multiple active copies of this worksheet. Archive the extra copies in Worksheets & paired quizzes, then add the remaining pair to the calendar.')
  const saved = bound ?? active[0] ?? candidates.at(-1)
  if (saved) return {worksheetId:saved.id,worksheetVersion:saved.version}
  const id = worksheetUuid(course.id + ':' + key)
  const preview = await worksheetQuizPreview(unit,day,edition,id)
  // The RPC supplies the selected class day atomically before publication.
  const quiz = validateQuiz({id:worksheetUuid(id+':quiz'),course_id:course.id,title:`Day ${day} · ${preview.title} · Paired quiz`,kind:'understanding',instructions:'Complete the paper worksheet and hand it to your teacher. Then answer these new problems independently. Choose one answer for each question. Your teacher will review your quiz and release your score and feedback.',grade_mode:'numeric',questions:preview.questions,due_at:null,status:'published',version:0,student_ids:null,source_quiz_id:null,language_level:edition.startsWith('honors')?'honors':'cpa',sei_supports:edition.endsWith('-sei')})
  return {worksheetId:null,worksheetVersion:0,worksheetDraft:{id,unit,day,edition,source:preview.source_sha256,quiz}}
}
