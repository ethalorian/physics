import 'server-only'
import { READING_SYLLABUS } from '@/data/reading-syllabus'
import { TEXTBOOK_SYLLABUS } from '@/data/textbook-syllabus'
import { readingTagForSource, type ReadingTemplate } from './activity-library'
import { HONORS_READING_MAP } from './openstax-physics'
import { isInteractiveSyllabusStep } from './reading-availability'

export function readingLibrary(track: string | null | undefined, targets: {id:string;slug:string;unit_id:string}[]): ReadingTemplate[] {
  return [...READING_SYLLABUS,...TEXTBOOK_SYLLABUS].filter(s=>isInteractiveSyllabusStep(s,track)).map(s=>({
    id:s.id,title:s.title,description:s.focus,format:'interactive-reading',unitIds:s.unit?[s.unit]:[],
    targetIds:targets.filter(t=>[s.readingCheck.target,s.vocabularyTarget].includes(t.slug)).map(t=>t.id),
    selectionRequired:!!s.selectionRequired,book:s.passage?'Course reading':s.sourceBook==='openstax'||track==='honors'&&s.sourceBook!=='hewitt'&&HONORS_READING_MAP[s.id]?'OpenStax':'Hewitt',chapter:s.chapter,availability:'Needs setup',
    readingTag:readingTagForSource({honors_reading:s.sourceBook!=='hewitt'&&(s.sourceBook==='openstax'||track==='honors')?(s.honorsReading??HONORS_READING_MAP[s.id]):null}),
  }))
}
