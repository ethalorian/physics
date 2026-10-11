import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { readingRows } from './textbook-assignments-server'
import type { SyllabusBundle, SyllabusBundleView, SyllabusResource } from './reading-syllabus'
import { lockedReadingQuizIds } from './reading-quiz-access'

export async function syllabusBundles(courseIds: string[], studentId?: string): Promise<SyllabusBundleView[]> {
  if (!courseIds.length) return []
  const bundles = await readingRows<SyllabusBundle>((a,b) => supabaseAdmin.from('reading_syllabus_bundles').select('course_id,step_id,reading_id,practice_id,reading_quiz_id,vocabulary_quiz_id,created_at').in('course_id',courseIds).order('course_id').order('step_id').range(a,b))
  if (!bundles.length) return []
  const readingIds = bundles.map(b=>b.reading_id), quizIds = bundles.flatMap(b=>[b.reading_quiz_id,b.vocabulary_quiz_id])
  const locked = studentId ? await lockedReadingQuizIds(quizIds,studentId) : new Set<string>()
  const [readings, quizzes, practices, readingWork, quizWork] = await Promise.all([
    readingRows<SyllabusResource>((a,b)=>supabaseAdmin.from('textbook_assignments').select('id,title,status,version,due_at').in('id',readingIds).order('id').range(a,b)),
    readingRows<SyllabusResource & {deleted_at: string | null; student_ids: string[] | null}>((a,b)=>supabaseAdmin.from('quiz_assignments').select('id,title,status,deleted_at,student_ids').in('id',quizIds).order('id').range(a,b)),
    readingRows<{id:string;title:string;active:boolean;student_ids:string[];syllabus_draft:boolean;due_on:string|null}>((a,b)=>supabaseAdmin.from('vocab_tasks').select('id,title,active,student_ids,syllabus_draft,due_on').in('id',bundles.map(b=>b.practice_id)).order('id').range(a,b)),
    studentId ? readingRows<{assignment_id:string;state:string}>((a,b)=>supabaseAdmin.from('textbook_work').select('assignment_id,state').in('assignment_id',readingIds).eq('user_id',studentId).order('assignment_id').range(a,b)) : [],
    studentId ? readingRows<{quiz_id:string;state:string}>((a,b)=>supabaseAdmin.from('quiz_work').select('quiz_id,state').in('quiz_id',quizIds).eq('user_id',studentId).order('quiz_id').range(a,b)) : [],
  ])
  const resource = (id:string, items:SyllabusResource[], state?:string):SyllabusResource => {
    const item=items.find(x=>x.id===id)
    return item && (!studentId || item.status!=='draft') ? {...item,state} : {id:'',title:'Not assigned yet',status:'draft'}
  }
  return bundles.flatMap(b=>{
    const reading = readings.find(r=>r.id===b.reading_id)
    if (!reading || studentId && reading.status==='draft') return []
    const practice = practices.find(p=>p.id===b.practice_id)
    const visibleQuizzes = quizzes.filter(q=>!q.deleted_at&&(!studentId||!q.student_ids||q.student_ids.includes(studentId)))
    // Explicitly project safe fields: answer guides, roster IDs, and unpublished
    // assignment IDs never leave the staff boundary.
    const view:SyllabusBundleView = {...b, reading:resource(b.reading_id,readings,readingWork.find(w=>w.assignment_id===b.reading_id)?.state),
      practice:practice && (!studentId||practice.active&&practice.student_ids.includes(studentId)) ? {id:practice.id,title:practice.title,status:practice.active?'published':practice.syllabus_draft?'draft':'archived',...(!studentId?{due_on:practice.due_on}:{})} : {id:'',title:'Not assigned yet',status:'draft'},
      readingQuiz:resource(b.reading_quiz_id,visibleQuizzes.map(({id,title,status})=>({id,title,status})),quizWork.find(w=>w.quiz_id===b.reading_quiz_id)?.state),
      vocabularyQuiz:resource(b.vocabulary_quiz_id,visibleQuizzes.map(({id,title,status})=>({id,title,status})),quizWork.find(w=>w.quiz_id===b.vocabulary_quiz_id)?.state)}
    if(studentId){if(view.readingQuiz.id&&locked.has(b.reading_quiz_id))view.readingQuiz={id:'',title:'Complete the reading to unlock',status:'locked'};view.reading_id=view.reading.id;view.practice_id=view.practice.id;view.reading_quiz_id=view.readingQuiz.id;view.vocabulary_quiz_id=view.vocabularyQuiz.id}
    return [view]
  })
}
