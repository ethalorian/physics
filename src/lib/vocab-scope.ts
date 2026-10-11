import {deckForDay} from '@/data/lesson-decks'
import type {VocabularyTeachingSource,VocabularyTeachingChoice} from './vocab-teaching-source'
import {teachingSourceKey,teachingDeckLabel} from './vocab-teaching-source'
import { isLessonVisible } from './track-visibility'

export interface VocabularyCourse { id:string; name:string; section:string|null; program:string; track?:string|null }
export interface VocabularyLesson { id:string; title:string; slug?:string; unit_id:string|null; published:boolean; visibility_track?:string|null; current:boolean; target_ids:string[] }
export interface VocabularySetSource { id:string; name:string; lesson_id:string|null; unit_id:string|null; teaching_source?:VocabularyTeachingSource|null }
export interface VocabularyWordSource { id:string; vocabulary_set_id:string }
export interface VocabularyTaskSource { course_id:string; title:string; active:boolean; student_ids:string[]; term_ids:string[]; task_kind?:string; target_id?:string|null }
export interface VocabularyWindow { course_id:string; lesson_id:string; open_at:string|null; close_at:string|null }

/** A published word set alone never grants student or class access. */
export function scopeVocabulary(input:{
  courses:VocabularyCourse[]; sets:VocabularySetSource[]; words:VocabularyWordSource[];
  lessons:VocabularyLesson[]; units:{id:string;name:string;program:string}[];
  windows:VocabularyWindow[]; tasks:VocabularyTaskSource[];
  assignments:{course_id:string;vocabulary_set_id:string;active:boolean}[];
  studentId?:string; authoring?:boolean; now?:number;
}) {
  const now=input.now??Date.now(), lessons=new Map(input.lessons.map(l=>[l.id,l])), units=new Map(input.units.map(u=>[u.id,u]))
  return input.sets.flatMap(set=>{
    const connection=set.teaching_source
    const linkedId=connection?.kind==='video'?connection.lesson_id:connection?null:set.lesson_id
    const source=lessons.get(linkedId??''), lesson=source?.current?source:undefined
    const unit=units.get(connection?.kind==='deck'?connection.unit_id:set.unit_id??lesson?.unit_id??''), words=input.words.filter(w=>w.vocabulary_set_id===set.id)
    const deck=connection?.kind==='deck'?deckForDay(connection.unit_id,connection.day,connection.track):null
    const effectiveSource=connection??(lesson?{kind:'video' as const,lesson_id:lesson.id}:null)
    const teachingConnection:VocabularyTeachingChoice|null=unit&&effectiveSource&&effectiveSource.kind!=='none'&&(lesson||deck)?{key:teachingSourceKey(effectiveSource),source:effectiveSource,label:deck?teachingDeckLabel(deck.title,connection?.kind==='deck'?connection.track:'cpa'):lesson!.title,unit_id:unit.id,unit_name:unit.name,program:unit.program,href:deck?.src??'/lessons/'+encodeURIComponent(lesson?.slug??'')}:null
    const access:Record<string,string[]>={}, titles=new Set<string>(), assignedTargets=new Set<string>()
    for(const course of input.courses){
      if(unit&&unit.program!==course.program)continue
      const tasks=input.tasks.filter(t=>t.active&&t.course_id===course.id&&(!input.studentId||t.student_ids.includes(input.studentId)&&t.task_kind!=='quiz'))
      const selected=new Set(tasks.flatMap(t=>t.term_ids))
      const assigned=input.assignments.some(a=>a.active&&a.course_id===course.id&&a.vocabulary_set_id===set.id)
      const open=lesson?.published&&isLessonVisible(lesson.visibility_track,{role:'student',track:course.track})&&input.windows.some(w=>w.course_id===course.id&&w.lesson_id===lesson.id&&(!w.open_at||Date.parse(w.open_at)<=now)&&(!w.close_at||Date.parse(w.close_at)>=now))
      // Teachers can explicitly assign current lesson words before opening a lesson.
      const authorable=input.authoring&&!!unit&&(!linkedId||!!lesson&&isLessonVisible(lesson.visibility_track,{role:'student',track:course.track}))&&(connection?.kind!=='deck'||!!deck&&(course.track==='honors'?'honors':'cpa')===connection.track)
      const ids=words.filter(w=>open||assigned||authorable||selected.has(w.id)).map(w=>w.id)
      if(!ids.length)continue
      access[course.id]=ids
      tasks.filter(t=>t.term_ids.some(id=>ids.includes(id))).forEach(t=>{titles.add(t.title);if(t.target_id)assignedTargets.add(t.target_id)})
    }
    const termIds=[...new Set(Object.values(access).flat())]
    return termIds.length?[{...set,unit_id:unit?.id??set.unit_id,teachingConnection,lesson_id:lesson?.id??null,lesson_title:lesson?.title??null,lesson_slug:lesson?.slug??null,
      unit_name:unit?.name??null,program:unit?.program??null,target_ids:lesson?.target_ids??[...assignedTargets],
      course_ids:Object.keys(access),term_ids:termIds,assignment_titles:[...titles],access,
      label:teachingConnection?teachingConnection.label:lesson?lesson.title:titles.size?[...titles].join('; '):set.name}]:[]
  })
}
export type ScopedVocabularySet=ReturnType<typeof scopeVocabulary>[number]
