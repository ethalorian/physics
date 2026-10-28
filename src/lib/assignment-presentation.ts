import type { LearningActivity } from './learning-week'

export type ActivityType = 'transfer-brief' | 'foundation' | 'foundation-lab' | 'simulation-lab' | 'daily-review' | 'unit-review' | 'worksheet' | 'worksheet-quiz' | 'lesson-quiz' | 'reading-check' | 'vocabulary-quiz' | 'quiz' | 'reading' | 'video' | 'chapter-response' | 'lesson' | 'vocabulary' | 'math'
export type LearningLane = 'math' | 'learn' | 'assignments' | 'investigate' | 'quizzes'
interface ActivityProfile { label: string; lane: LearningLane; thinking: string; directions: string }
export const ACTIVITY_PROFILES: Record<ActivityType, ActivityProfile> = {
  'transfer-brief': {label:'Transfer Brief',lane:'assignments',thinking:'Apply unit physics. Defend a real-world decision.',directions:'Use the supplied real-world scenario and data. Show the requested calculations or evidence, explain your judgment, and identify a model limit where asked. This short application is graded in the Transfer Task category.'},
  foundation: { label: 'In-class discussion', lane: 'learn', thinking: 'Discuss ideas. Explain in your own words.', directions: 'Read the slides and respond to the questions. At partner stops, compare ideas, then write your own explanation. Follow your teacher’s directions for approved independent work.' },
  'foundation-lab': { label: 'Foundation lab', lane: 'investigate', thinking: 'Measure. Analyze. Explain the evidence.', directions: 'Use the slides to guide the investigation. Record your data, compare results and explain what your evidence supports. Use approved sample data only when your teacher assigns it.' },
  'simulation-lab': { label: 'Simulation lab', lane: 'investigate', thinking: 'Predict. Test. Explain with evidence.', directions: 'Make a prediction, run the simulation and record the requested trials. Compare your results and use the evidence to explain your conclusion.' },
  'daily-review': { label: 'Daily review', lane: 'assignments', thinking: 'Apply the ideas. Show your reasoning.', directions: 'Use the lesson’s ideas to work through the review questions. Show how you reached your answers and explain your reasoning.' },
  'unit-review': { label: 'Unit review', lane: 'assignments', thinking: 'Connect ideas. Explain your choices.', directions: 'Bring together ideas from the unit. Work through the review and explain how the evidence or calculations support your answers.' },
  worksheet: { label: 'Paper worksheet', lane: 'assignments', thinking: 'Work on paper. Show your reasoning.', directions: 'Complete the worksheet on paper and show your work. Hand it to your teacher. Its linked online quiz is a separate assignment with its own due date.' },
  'worksheet-quiz': { label: 'Worksheet quiz', lane: 'quizzes', thinking: 'Apply what you practiced on paper.', directions: 'Complete the online quiz linked to your paper worksheet. Explain your answers or show calculations where requested.' },
  'lesson-quiz': { label: 'Lesson quiz', lane: 'quizzes', thinking: 'Solve problems. Justify your answers.', directions: 'Show what you understand from the in-class activities and daily review. Use your own reasoning and show explanations or calculations where requested.' },
  'reading-check': { label: 'Reading check', lane: 'quizzes', thinking: 'Recall ideas. Explain what they mean.', directions: 'Answer questions about the assigned reading. Use its ideas to explain your answers, following the quiz directions.' },
  'vocabulary-quiz': { label: 'Vocabulary quiz', lane: 'quizzes', thinking: 'Recall meanings. Use terms accurately.', directions: 'Show that you understand the assigned terms. Follow each question’s directions to identify, explain or use their meanings.' },
  quiz: { label: 'Quiz', lane: 'quizzes', thinking: 'Use what you know. Explain your answers.', directions: 'Read the quiz directions and answer each question. Show your explanation or calculations where requested.' },
  reading: { label: 'Reading & response', lane: 'learn', thinking: 'Read for meaning. Support your answers.', directions: 'Read the assigned text and answer its questions. Use details from the reading to support your explanations.' },
  video: { label: 'Video lesson', lane: 'learn', thinking: 'Watch closely. Explain the ideas.', directions: 'Watch the assigned video and complete the questions or responses included in the lesson.' },
  'chapter-response': { label: 'Chapter response', lane: 'assignments', thinking: 'Interpret the story. Support your ideas.', directions: 'Read the assigned chapter and respond to its prompts. Support your interpretation with details from the story and relevant physics ideas.' },
  lesson: { label: 'Lesson assignment', lane: 'learn', thinking: 'Explore the ideas. Explain your thinking.', directions: 'Work through the lesson and complete its prompts. Follow the directions for the evidence, explanations or work you need to submit.' },
  vocabulary: { label: 'Vocabulary practice', lane: 'assignments', thinking: 'Build meaning. Practice using terms.', directions: 'Practice the assigned words and their meanings. Complete the activities to prepare for using the terms in explanations.' },
  math: { label: 'Math warm-up', lane: 'math', thinking: 'Recall a skill. Work through a problem.', directions: 'Work through the assigned math practice. Use the feedback to check your method and correct mistakes.' },
}

type PresentationItem = Pick<LearningActivity, 'id' | 'kind' | 'title' | 'quizSchedule' | 'activityType' | 'topicTitle' | 'courseDay' | 'focusQuestion' | 'status' | 'complete'>
export function activityTypeFor(item: PresentationItem): ActivityType {
  if (item.activityType) return item.activityType
  if (item.quizSchedule === 'vocabulary') return 'vocabulary-quiz'
  if (item.quizSchedule === 'daily') return 'lesson-quiz'
  if (item.kind === 'quiz') return /· Reading check$/i.test(item.title) ? 'reading-check' : 'quiz'
  if (item.kind === 'review') return item.id.startsWith('interactive:') ? 'daily-review' : 'unit-review'
  if (item.kind === 'lesson' && /^Graphic novel · Chapter /i.test(item.title)) return 'chapter-response'
  return item.kind
}

/** Display copy only. Never changes an assignment's identity, deadline, access or grading. */
export function assignmentPresentation(item: PresentationItem) {
  const type = activityTypeFor(item), profile = ACTIVITY_PROFILES[type]
  const day = item.courseDay ?? (Number(item.title.match(/^Day (\d+)\s*·/)?.[1]) || undefined)
  let title = item.topicTitle ?? item.title.replace(/^Day \d+\s*·\s*/, '')
  if (!item.topicTitle) {
    if (type === 'foundation' || type === 'foundation-lab') title = title.replace(/^Foundation(?: lab)?:\s*/i, '')
    if (type === 'lesson-quiz') title = title.replace(/^Quiz:\s*/i, '')
    if (type === 'worksheet') title = title.replace(/\s*· Worksheet$/i, '')
    if (type === 'worksheet-quiz') title = title.replace(/\s*· Paired quiz$/i, '')
    if (type === 'reading-check') title = title.replace(/\s*· Reading check$/i, '')
    if (type === 'vocabulary-quiz') title = title.replace(/\s*· Vocabulary check$/i, '')
    if (type === 'vocabulary') title = title.replace(/\s*· Vocabulary practice$/i, '')
    if (type === 'chapter-response') title = title.replace(/^Graphic novel · /i, '')
    if (type === 'math' && title === 'Math warm-up') title = 'Daily skill practice'
  }
  return { ...profile, type, title: title || item.title, day, question: item.focusQuestion }
}

export function assignmentStatus(item: Pick<LearningActivity, 'status' | 'complete' | 'prerequisiteText'>) {
  if (item.prerequisiteText) return 'Locked · finish required work'
  if (item.status === 'Awaiting paper') return 'Hand in to your teacher'
  if (item.status === 'Needs completion' || item.status === 'To do') return 'Not started'
  return item.status
}
