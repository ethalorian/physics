import { CHAPTER_SECTIONS, CHECKS, questionSection } from './chapter-two-model'
import { validateChapterDefinition, type InteractiveChapterDefinition } from './reader-contract'
import { chapterTwoFigureCoverage } from './chapter-two-figure-coverage'

const headings = [
  ['First, see the forces.', 'A push or a pull is an interaction. The net force tells the whole story.'],
  ['A rule for the balance.', 'Different forces can add up to no change in motion.'],
  ['The table is pushing back.', 'A surface can exert a force even when it looks perfectly still.'],
  ['Balance can move.', 'The test is changing velocity—not whether something is moving.'],
  ['Direction changes the answer.', 'When forces meet at an angle, ordinary addition is not enough.'],
]
const slugs = ['u1.identify-forces', 'u1.equilibrium-find-unknown', 'u1.equilibrium-find-unknown', 'u1.equilibrium-find-unknown', 'u1.vectors-tip-to-tail']
export const chapterTwoDefinition: InteractiveChapterDefinition = validateChapterDefinition({
  book: 'hewitt', bookTitle: 'Conceptual Physics', chapter: 2, title: 'Mechanical equilibrium', language: 'en', contentVersion: 'pilot-1',
  pdfUrl: 'https://www.antocciphysics.com/textbook?ch=2&lang=en&page=1',
  focus: 'Explain what a balance of forces tells you about motion.',
  guidingQuestion: 'What can you learn about forces from an object that stays still?',
  scopeNote: 'Original instructional adaptation aligned to Chapter 2, sections 2.1–2.5. The complete publisher text and numbered exercises remain available in the original PDF.',
  sections: CHAPTER_SECTIONS.map((s, i) => ({ ...s, heading: headings[i][0], subtitle: headings[i][1], targetSlug: slugs[i], check: CHECKS[s.id], sourceUrl: `https://www.antocciphysics.com/textbook?ch=2&lang=en&page=${s.page - 11}` })),
  visualCoverage: chapterTwoFigureCoverage,
  teaching: {
    before: 'Ask: “Does a moving object always have a net force?” Collect reasons before discussing answers.',
    during: 'Assign a few sections at a time. Have students describe what they changed and what stayed constant.',
    after: 'Review explanations by target. Return a specific next step, then invite a revised explanation.',
  },
  synthesisIntro: 'A book. A cart. A hanging sign. One rule connects them.',
  reasoningRoutine: 'Identify the object → draw its forces → add the vectors → explain the motion.',
  transfer: {
    prompt: 'An elevator rises at constant speed. A passenger stands on a scale. Is the scale’s support force greater than, less than, or equal to the passenger’s weight? Explain using the passenger’s motion and the forces acting on the passenger.',
    starter: 'The passenger’s velocity is… Therefore the net force is… The two forces are…',
    model: 'The passenger moves at constant velocity, so the net force is zero. The upward support force from the scale equals the downward gravitational force. Moving upward does not by itself mean an upward net force. A scale reading greater than weight would indicate upward acceleration.',
  },
  questionSection,
  isSectionAssigned: (a, s) => !!a && !a.honors_reading && !a.passage && a.chapter === 2 && (a.section_ids.length === 0 || a.section_ids.includes(s.number)),
})
