import { COMIC_BOOKS } from './comics'
import { demand } from './assessment-demand'
import type { BlockDocument, ExitTicketBlock } from '@/data/content-blocks'
import type { LessonAssignment, LessonQuestion } from './interactive-assignments/catalog'
import type { DrawingResponse } from './problem-response'

export const NOVEL_BOOK = COMIC_BOOKS.find(book => book.slug === 'book-one')!
// Prompts follow the published chapter summaries and text companions.
const prompts: Record<number, [string, string]> = {
  "1": [
    "Maz says the asteroid will miss Earth. How is her promise different from a claim backed by evidence? Use a detail from the chapter.",
    "What should Maz tell her brother now? Use what she knows and what she still needs to learn about 2026-XJ."
  ],
  "2": [
    "Maz walks away and comes back. How can her distance be greater than zero while her displacement is zero? Use her trip to explain.",
    "What would you need to know to predict where 2026-XJ will go? Explain why each piece of information matters."
  ],
  "3": [
    "A person walks out and back. Their average velocity is zero. Why does that not mean they stood still? Use the graph to explain.",
    "You know how fast 2026-XJ moves, but not its direction. Can you predict where it will be? Defend your answer."
  ],
  "4": [
    "A line on a velocity–time graph is flat. Why might the object still be moving? Use a scene from the chapter.",
    "Maz leaves out the sideways part of 2026-XJ’s motion. How could this change her prediction? Explain your reasoning."
  ],
  "5": [
    "Why does Maz give a range of possible positions for the asteroid instead of one exact spot? Use the chapter to explain.",
    "How much should Maz trust her first prediction for 2026-XJ? Use evidence from the chapter. Explain one thing her model leaves out."
  ],
  "6": [
    "Maz breaks a motion arrow into parts, then puts them back together. Why should the final arrow mean the same thing?",
    "Two teams draw axes in different directions for 2026-XJ. How could you check whether their arrows still show the same motion?"
  ],
  "7": [
    "How does the cart’s changing motion help Maz see a problem with her first model? Use a detail from the chapter.",
    "A team says a tiny change in 2026-XJ’s velocity will not matter. Do you agree? Use the chapter’s physics and explain how time could change your judgment."
  ],
  "8": [
    "Maz is not given a time. How does she choose a motion equation? Explain why a value of zero matters.",
    "Maz’s equation assumes steady acceleration. What would you need to check before using it for 2026-XJ? Explain why that check matters."
  ],
  "9": [
    "Choose the coin or the toy passenger. How does it show what makes motion change? Use the chapter to explain.",
    "Would 2026-XJ slow down just because time passes? Defend your answer. Explain what would have to act on it."
  ],
  "10": [
    "Why does each force arrow need a source and a direction? Explain using one object from the chapter.",
    "Someone draws a force arrow on 2026-XJ just because it is moving. Do you agree? Explain what would have to push or pull it."
  ],
  "11": [
    "What happens to the cart’s acceleration when its mass grows? Use the test as evidence. Name one thing the test does not prove.",
    "We do not know 2026-XJ’s exact mass. How could that affect a plan to push it off course? Use the cart test to explain."
  ],
  "12": [
    "What does the second cart test show about force and acceleration? Use a result from the chapter to explain.",
    "Could a small push move 2026-XJ far enough off course? Explain how the push, the asteroid’s mass, and the time would matter."
  ],
  "13": [
    "Maz leaves friction out of her math. Why does that change her answer? Explain using all the forces on the object.",
    "Before trusting a force model for 2026-XJ, what would you check? Use Maz’s missing-force mistake to explain why your checks matter."
  ],
  "14": [
    "Two objects push on each other with equal forces. Why do those forces not cancel on one object? Use a chapter example.",
    "A small spacecraft hits 2026-XJ. Each pushes equally on the other. Could their speeds change by different amounts? Explain why."
  ],
  "15": [
    "Maz draws forces on just one object. What does she leave out, and why does that make her drawing useful?",
    "You draw a force diagram for 2026-XJ while a spacecraft pushes it. Which forces belong on it? Explain how you decide."
  ],
  "16": [
    "Maz changes the direction of her axes. How can that make the math easier without changing the forces?",
    "Two teams use different axes for 2026-XJ. Their numbers differ. How would you test whether they predict the same path?"
  ],
  "17": [
    "The box stays still. Why might the friction on it be less than the most friction it could have? Use the chapter to explain.",
    "Space has no frictional brake like the floor in class. Why could this help a plan to move 2026-XJ—and also cause a problem?"
  ]
}
export function novelQuestionBank(day: number): ExitTicketBlock[] {
  const chapter = NOVEL_BOOK.chapters.find(c => c.day === day)
  if (!chapter || !prompts[day]) throw Error('Choose an available graphic novel chapter.')
  return [...prompts[day], 'Choose a claim about 2026-XJ from this chapter. What new evidence would test it? Describe one result that would support it and one that would not.'].map((prompt, i) => ({
    id: `novel-${day}-q${i + 1}`, type: 'exit_ticket', capture: true, evidenceRole: 'main', prompt,
    demand: i === 0 ? demand('Analyze', 2, 'Explains a relationship using a specific event, model, or diagram from the chapter.') : i === 1 ? demand('Evaluate', 3, 'Defends a claim about the asteroid using chapter evidence, physics reasoning, and a relevant assumption or limit.') : demand('Analyze', 3, 'Proposes evidence that could test a claim and reasons through contrasting results.'),
    sei: { visual: { src: NOVEL_BOOK.pages[chapter.end].src, alt: NOVEL_BOOK.pages[chapter.end].description }, frames: [
      { level: 1, text: 'In the chapter, ___. This supports / does not support the claim because ___.' },
      { level: 2, text: 'My evidence is ___. The physics explains this because ___.' },
    ] },
  }))
}

/** Presentation adapter only: retain lesson and response IDs for existing grading and mastery evidence. */
export function graphicNovelWorkspace(document: BlockDocument, title: string, id: string): LessonAssignment {
  const chapter = NOVEL_BOOK.chapters.find(c => c.day === document.reflection?.chapter)
  if (!chapter || document.reflection?.kind !== 'graphic-novel') throw Error('Choose an available graphic novel chapter.')
  const questions: LessonQuestion[] = document.blocks.filter((b): b is ExitTicketBlock => b.type === 'exit_ticket').map(b => ({
    id: b.id, part: 1, prompt: b.prompt, demand: b.demand, targets: b.targetId ? [b.targetId] : [],
    hint: '', explanation: '', independent: true,
  }))
  return { slug: id, title, day: chapter.day, unit: 'unit-1', minutes: 10,
    targets: [...new Set(questions.flatMap(q => q.targets ?? []))], targetNote: 'Your teacher reviews your reasoning.',
    toolHref: `/comics/2026-xj/${NOVEL_BOOK.slug}?page=${chapter.start}`,
    questions, sections: [{ title: 'Explain your thinking', stop: 'Chapter response', learn: 'Use a scene or panel as evidence.', questions }],
  }
}

export function novelResponseText(value: unknown): string {
  if (typeof value === 'string') return value
  return value && typeof value === 'object' && 'text' in value && typeof value.text === 'string' ? value.text : ''
}

/** Keep any previously saved drawing or response metadata when editing the written answer. */
export function editNovelResponse(value: unknown, text: string): Record<string, unknown> & { text: string; mode: 'text' } {
  return { ...(value && typeof value === 'object' ? value : {}), text, mode: 'text' }
}

export function novelDrawingResponse(value: unknown): DrawingResponse {
  const prior = (value && typeof value === 'object' ? value : {}) as Partial<DrawingResponse> & { mode?: string }
  return { text: novelResponseText(value), strokes: Array.isArray(prior.strokes) ? prior.strokes : [], mode: String(prior.mode) === 'sketch' || prior.mode === 'drawing' ? 'drawing' : 'text' }
}
export function createGraphicNovelAssignment(day = 1, count = 2): BlockDocument {
  if (!Number.isInteger(count) || count < 1 || count > 3) throw Error('Use 1–3 questions.')
  const chapter = NOVEL_BOOK.chapters.find(c => c.day === day)
  if (!chapter) throw Error('Choose an available graphic novel chapter.')
  return { schemaVersion: 1, reflection: { version: 1, kind: 'graphic-novel', book: NOVEL_BOOK.slug, chapter: day }, blocks: [
    { id: 'novel-chapter', type: 'prose', markdown: `Read [Chapter ${day}: ${chapter.title}](/comics/2026-xj/${NOVEL_BOOK.slug}?page=${chapter.start}).\n\nUse a scene or panel to explain your answer.` },
    ...novelQuestionBank(day).slice(0, count),
  ] }
}
