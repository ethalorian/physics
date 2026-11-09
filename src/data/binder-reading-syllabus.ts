import 'server-only'
import lessons from '../../resources/student-choice/daily-reader/lessons.json'
import cpa from '../../resources/student-choice/unit-1-readings/cpa.json'
import honors from '../../resources/student-choice/unit-1-readings/honors.json'
import checks from '../../resources/student-choice/daily-reader/checks.json'
import { binderDayLabel, binderPassage, binderStepId } from '@/lib/binder-reading'
import type { SyllabusStep } from '@/lib/reading-syllabus'
import { READING_SYLLABUS } from './reading-syllabus'

// Reuse reviewed mastery mappings for the physics students actually use each day.
const topics = ['measurement-precision','distance-displacement','position-graphs','motion-graphs','position','vector-components','acceleration','motion-graphs','inertia','forces','second-law','second-law','second-law','third-law','forces','second-law','friction','equilibrium','second-law','second-law','vectors','measurement-precision']
export const BINDER_READINGS: SyllabusStep[] = lessons.map(lesson => {
  const source = { edition: lesson.edition === 'honors' ? 'honors' as const : 'cpa' as const, day: lesson.day }
  const item = checks.find(q => q.day === source.day && q.edition === source.edition)
  const topic = READING_SYLLABUS.find(s => s.id === topics[source.day - 1])
  if (!item || !topic) throw Error('Missing binder reading or target for ' + binderStepId(source))
  const reading = (source.edition === 'honors' ? honors : cpa)[source.day - 1]
  const plain = (text: string) => text.replace(/<[^>]*>/g, '')
  const figure = reading.paragraphs.find(p => p.includes('Section C'))
  if (!figure) throw Error('Missing note diagram explanation.')
  const target = topic.readingCheck.target
  return {
    id: binderStepId(source), sourceBook:'binder', unit:'unit-1', title: `${binderDayLabel(lesson.day)} · ${lesson.title}`, focus:lesson.focus,
    // The existing course-passage schema uses chapter 4 with no textbook sections.
    chapter:4, sections:[], prerequisites:[], passage:binderPassage(source),
    words:lesson.words, vocabularyTarget:topic.vocabularyTarget,
    binderPractice:item.practice,
    narrativeCheck:{reference:'Daily reading',prompt:item.narrativePrompt,guide:item.narrativeGuide,target},
    readingCheck:{reference:'Section C · Diagram',prompt:item.diagramPrompt,guide:'Credit an accurate interpretation supported by a feature of the diagram. ' + plain(figure),target},
    quizCheck:{reference:'Apply the daily reading',prompt:item.transferPrompt,guide:item.guide,target},
    honors:{reference:'Section D · Worked example',prompt:lesson.example,guide:lesson.solution,target},
  }
})
