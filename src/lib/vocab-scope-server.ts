import 'server-only'
import {supabaseAdmin} from '@/lib/supabase'
import type {AuthContext} from '@/lib/api-auth'
import {readingCourses} from './textbook-assignments-server'
import {vocabRows} from './vocab-pagination'
import {CURRENT_LESSON_FIELDS,isCurrentLesson} from './current-lesson-catalog'
import {scopeVocabulary,type VocabularyCourse,type VocabularySetSource,type VocabularyTaskSource,type VocabularyWindow} from './vocab-scope'
import type {LearningWord} from './vocab-learning'

export async function vocabularyFor(ctx:AuthContext,options:{courseId?:string|null;authoring?:boolean}={}){
 const staff=ctx.role==='teacher'||ctx.role==='admin'
 const owned=await readingCourses(ctx), courses=(options.courseId?owned.filter(c=>c.id===options.courseId):owned) as VocabularyCourse[]
 const [sets,words,units,lessons,targets,windows,tasks,assignments]=courses.length?await Promise.all([
  vocabRows<VocabularySetSource>((a,b)=>supabaseAdmin.from('vocabulary_sets').select('id,name,lesson_id,unit_id,teaching_source').eq('published',true).eq('archived',false).order('name').order('id').range(a,b)),
  vocabRows<LearningWord>((a,b)=>supabaseAdmin.from('vocabulary_terms').select('id,term,definition,vocabulary_set_id,tier,icon,cognate,definition_es,translations,example,part_of_speech').eq('archived',false).order('term').order('id').range(a,b)),
  vocabRows<{id:string;name:string;program:string}>((a,b)=>supabaseAdmin.from('units').select('id,name,program').order('id').range(a,b)),
  vocabRows<{id:string;title:string;slug:string;unit_id:string|null;published:boolean;visibility_track:string|null;presentation:string|null;learning_path:unknown}>((a,b)=>supabaseAdmin.from('lessons').select(`id,title,slug,published,visibility_track,${CURRENT_LESSON_FIELDS}`).order('lesson_number').order('id').range(a,b)),
  vocabRows<{id:string;slug:string;statement:string;lesson_id:string|null;unit_id:string;program:string;domain:string}>((a,b)=>supabaseAdmin.from('learning_targets').select('id,slug,statement,lesson_id,unit_id,program,domain').eq('exclude_from_growth',false).order('id').range(a,b)),
  vocabRows<VocabularyWindow>((a,b)=>supabaseAdmin.from('lesson_class_windows').select('course_id,lesson_id,open_at,close_at').in('course_id',courses.map(c=>c.id)).order('course_id').order('lesson_id').range(a,b)),
  vocabRows<VocabularyTaskSource>((a,b)=>{let q=supabaseAdmin.from('vocab_tasks').select('course_id,title,active,student_ids,term_ids,task_kind,target_id').eq('active',true).in('course_id',courses.map(c=>c.id));if(!staff)q=q.contains('student_ids',[ctx.userId]).eq('task_kind','practice');return q.order('id').range(a,b)}),
  vocabRows<{course_id:string;vocabulary_set_id:string;active:boolean}>((a,b)=>supabaseAdmin.from('vocab_assignments').select('course_id,vocabulary_set_id,active').in('course_id',courses.map(c=>c.id)).eq('active',true).order('id').range(a,b)),
 ]):[[],[],[],[],[],[],[],[]]
 const lessonMetadata=lessons.map(l=>{const refs=(l.learning_path as {targetSlugs?:string[]}|null)?.targetSlugs??[];return {...l,current:isCurrentLesson({...l,program:units.find(u=>u.id===l.unit_id)?.program}),target_ids:targets.filter(t=>t.lesson_id===l.id||refs.includes(t.slug)||refs.includes(t.id)).map(t=>t.id)}})
 const scoped=scopeVocabulary({courses,sets,words,units,lessons:lessonMetadata,windows,tasks,assignments,studentId:staff?undefined:ctx.userId,authoring:staff&&options.authoring})
 const ids=new Set(scoped.flatMap(s=>s.term_ids))
 return {courses,sets:scoped,words:words.filter(w=>ids.has(w.id)),targets:targets.filter(t=>courses.some(c=>c.program===t.program)),units:units.filter(u=>scoped.some(s=>s.unit_id===u.id)),lessons:lessonMetadata.filter(l=>scoped.some(s=>s.lesson_id===l.id))}
}
