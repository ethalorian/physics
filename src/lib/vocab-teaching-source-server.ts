import 'server-only'
import type {AuthContext} from './api-auth'
import {supabaseAdmin} from './supabase'
import {readingCourses} from './textbook-assignments-server'
import {vocabRows} from './vocab-pagination'
import {CURRENT_LESSON_FIELDS,isCurrentLesson} from './current-lesson-catalog'
import {coursePlanChoices} from './course-plan-presentation-server'
import {isLessonVisible} from './track-visibility'
import {teachingSourceKey,teachingDeckLabel,validTeachingSource,type VocabularyTeachingChoice,type VocabularyTeachingSource} from './vocab-teaching-source'

export async function vocabularyTeachingChoices(ctx:AuthContext):Promise<VocabularyTeachingChoice[]> {
  const courses=await readingCourses(ctx)
  if(!courses.length)return []
  const [units,lessons]=await Promise.all([
    vocabRows<{id:string;name:string;program:string}>((a,b)=>supabaseAdmin.from('units').select('id,name,program').in('program',[...new Set(courses.map(c=>c.program))]).order('id').range(a,b)),
    vocabRows<{id:string;title:string;slug:string;lesson_type:string;visibility_track:string|null;unit_id:string;presentation:unknown;learning_path:unknown}>((a,b)=>supabaseAdmin.from('lessons').select(`id,title,slug,lesson_type,visibility_track,${CURRENT_LESSON_FIELDS}`).eq('lesson_type','video').order('lesson_number').order('id').range(a,b)),
  ])
  const choices:VocabularyTeachingChoice[]=lessons.flatMap(l=>{
    const unit=units.find(u=>u.id===l.unit_id)
    if(!unit||!isCurrentLesson({...l,program:unit.program})||!courses.some(c=>c.program===unit.program&&isLessonVisible(l.visibility_track,{role:'student',track:c.track})))return []
    const source:VocabularyTeachingSource={kind:'video',lesson_id:l.id}
    return [{key:teachingSourceKey(source),source,label:l.title,unit_id:unit.id,unit_name:unit.name,program:unit.program,href:'/lessons/'+encodeURIComponent(l.slug)}]
  })
  for(const course of courses)for(const day of coursePlanChoices({...course,track:course.track??null})){
    if(!day.deck)continue
    const source:VocabularyTeachingSource={kind:'deck',unit_id:day.unit_id,day:day.day,track:course.track==='honors'?'honors':'cpa'},key=teachingSourceKey(source)
    if(choices.some(c=>c.key===key))continue
    choices.push({key,source,label:teachingDeckLabel(day.deck.title,source.track),unit_id:day.unit_id,unit_name:day.unit,program:course.program,href:day.deck.src})
  }
  return choices
}

/** Validate against real video lessons and authored day decks before saving. */
export async function resolveVocabularyTeachingSource(value:unknown,ctx:AuthContext){
  if(!validTeachingSource(value))return {ok:false as const,error:'Choose a valid video lesson or class presentation deck.'}
  if(value.kind==='none')return {ok:true as const,source:value,unit_id:null}
  const choice=(await vocabularyTeachingChoices(ctx)).find(c=>c.key===teachingSourceKey(value))
  if(!choice)return {ok:false as const,error:'This video lesson or presentation deck is unavailable for your classes. Reload the choices.'}
  return {ok:true as const,source:choice.source,unit_id:choice.unit_id}
}
