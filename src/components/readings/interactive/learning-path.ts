import type { ReadingDetail } from '@/lib/textbook-assignments'
import type { SyllabusBundleView, SyllabusResource } from '@/lib/reading-syllabus'

export type LearningPathItem = { title: string; status: string; description: string; href?: string }

export function learningPathItems(bundle: SyllabusBundleView, readingState: string, quiz: ReadingDetail['readingQuiz']): LearningPathItem[] {
  const activity = (title: string, resource: SyllabusResource, href: string, description: string): LearningPathItem => ({
    title, description,
    status: !resource.id ? resource.status === 'locked' ? 'Submit the reading to unlock' : 'Not assigned yet' : resource.status === 'archived' ? 'Archived' : resource.state === 'graded' ? 'Reviewed' : resource.state === 'returned' ? 'Revise & resubmit' : resource.state === 'submitted' ? 'Submitted' : resource.state === 'in_progress' ? 'In progress' : 'Assigned',
    ...(resource.id ? { href } : {}),
  })
  // The submit response is authoritative immediately; the course list may still
  // have the pre-submission locked state. Never derive access from UI completion.
  const readingQuiz: SyllabusResource = quiz === undefined ? bundle.readingQuiz : quiz ? {
    id: quiz.locked ? '' : quiz.id ?? '', title: 'Reading quiz', status: quiz.locked ? 'locked' : 'published', state: quiz.state,
  } : { id: '', title: 'Reading quiz', status: 'draft' }
  const quizItem = activity('Reading quiz', readingQuiz, `/quizzes/${encodeURIComponent(readingQuiz.id)}`, 'Apply the ideas after submitting your reading. You can return to the quiz later.')
  if (quizItem.href && readingQuiz.status === 'published' && !['submitted', 'graded', 'returned'].includes(readingQuiz.state ?? '')) quizItem.status = 'Needs completion'
  const reading = { title: 'Read & explain', status: ({in_progress:'In progress', submitted:'Submitted for review', returned:'Revise & resubmit', rated:'Mastery review recorded'} as Record<string,string>)[readingState] ?? 'Ready to begin', description: 'Your assigned explanations give your teacher evidence of your thinking.' }
  return [reading,
    activity('Vocabulary practice', bundle.practice, `/vocabulary/work?task_id=${encodeURIComponent(bundle.practice.id)}`, 'Practice the words that help you explain this reading.'),
    quizItem,
    activity('Vocabulary quiz', bundle.vocabularyQuiz, `/quizzes/${encodeURIComponent(bundle.vocabularyQuiz.id)}`, 'Explain and use the words when your teacher assigns this check.'),
  ]
}

