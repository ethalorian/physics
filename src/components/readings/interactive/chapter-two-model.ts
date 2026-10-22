import type { ReadingQuestion } from '@/lib/textbook-assignments'

export const CHAPTER_SECTIONS = [
  { id: 'force', number: '2.1', title: 'See the forces', pages: '13–15', page: 13, target: 'Identify forces and combine their directions.' },
  { id: 'balance', number: '2.2', title: 'Find the balance', pages: '16', page: 16, target: 'Use zero net force to find an unknown force.' },
  { id: 'support', number: '2.3', title: 'Feel the support', pages: '17', page: 17, target: 'Explain how a surface supports an object.' },
  { id: 'motion', number: '2.4', title: 'Balance in motion', pages: '18–19', page: 18, target: 'Distinguish constant motion from changing motion.' },
  { id: 'vectors', number: '2.5', title: 'Look beyond up & down', pages: '19–22', page: 19, target: 'Combine angled forces as vectors.' },
] as const

export type SectionId = typeof CHAPTER_SECTIONS[number]['id']

/** Only place questions beside a section when the source reference is explicit. */
export function questionSection(q: ReadingQuestion): SectionId | null {
  const explicit = q.reference.match(/^Section (2\.[1-5])(?:\s|$)/)?.[1]
  if (explicit) return CHAPTER_SECTIONS.find(s => s.number === explicit)?.id ?? null
  const numbered = q.reference.match(/^Check Concepts #(\d+)$/)
  if (!numbered) return null
  const n = Number(numbered[1])
  if (n >= 1 && n <= 6) return 'force'
  if (n >= 7 && n <= 10) return 'balance'
  if (n >= 11 && n <= 13) return 'support'
  if (n >= 14 && n <= 16) return 'motion'
  if (n >= 17 && n <= 20) return 'vectors'
  return null
}

export const netForce = (left: number, right: number) => right - left
export const supportForce = (weight: number, downPush: number) => weight + downPush
export function ropeTension(weight: number, angleFromHorizontal: number) {
  if (angleFromHorizontal <= 0 || angleFromHorizontal > 90) throw new RangeError('The rope angle must be above 0° and at most 90°.')
  return weight / (2 * Math.sin(angleFromHorizontal * Math.PI / 180))
}

/** Uniform 200 N board, 400 N painter at 25% of its span, and a moving 600 N painter. */
export function scaffoldSupports(positionPercent: number) {
  if (!Number.isFinite(positionPercent) || positionPercent < 0 || positionPercent > 100) throw new RangeError('The painter must stand between the supports.')
  const total = 1200, right = 400 * .25 + 600 * positionPercent / 100 + 200 * .5
  return { left: total - right, right, total }
}

/** Tensions at a weightless knot; both angles are above horizontal and nonvertical. */
export function angledRopeForces(weight: number, leftDegrees: number, rightDegrees: number) {
  if (!Number.isFinite(weight) || weight < 0 || [leftDegrees, rightDegrees].some(a => !Number.isFinite(a) || a <= 0 || a >= 90)) throw new RangeError('Use a nonnegative weight and rope angles between 0° and 90°.')
  const a = leftDegrees * Math.PI / 180, b = rightDegrees * Math.PI / 180
  return { left: weight * Math.cos(b) / Math.sin(a + b), right: weight * Math.cos(a) / Math.sin(a + b) }
}

export const CHECKS = {
  force: {
    title: 'Which way does the net force point?',
    prompt: 'A crate is pulled 40 N to the right and 30 N to the left. What is the net force?',
    options: ['70 N to the right', '10 N to the right', '10 N to the left'], correct: 1,
    hint: 'Choose right as positive. A leftward force contributes a negative value.',
    feedback: ['Adding magnitudes alone loses the directions. These forces oppose each other: +40 − 30 = +10 N.', 'Yes. +40 − 30 = +10 N, so the net force is 10 N to the right.', 'The larger force points right. +40 − 30 = +10 N.'],
    teacher: 'If students add 40 + 30, ask them to draw the arrows before calculating.',
  },
  balance: {
    title: 'Find the missing support.',
    prompt: 'Two vertical cables hold a 600 N sign at rest. The left cable pulls up with 250 N. What is the right cable’s tension?',
    options: ['300 N', '600 N', '350 N'], correct: 2,
    hint: 'The two upward forces together must balance 600 N downward.',
    feedback: ['Half the weight works only for an equal split. Here the left cable carries 250 N.', '600 N is the total upward force needed. The left cable already supplies 250 N.', 'Yes. 250 + T − 600 = 0, so T = 350 N upward.'],
    teacher: 'An automatic “half each” response suggests that the equilibrium rule has become a memorized shortcut.',
  },
  support: {
    title: 'What changes when you press?',
    prompt: 'A 20 N book remains at rest on a table while a hand pushes down with 10 N. How much force does the table exert on the book?',
    options: ['20 N upward', '30 N upward', '10 N upward'], correct: 1,
    hint: 'Draw every force acting on the book. There are now two downward forces.',
    feedback: ['The support force must balance the hand’s push as well as the book’s weight.', 'Yes. The support force balances 20 N + 10 N = 30 N downward.', 'That would leave a net downward force of 20 N. The book would not remain in equilibrium.'],
    teacher: 'Ask students who choose 20 N whether the table can “feel” the extra push. Normal force is not always equal to weight.',
  },
  motion: {
    title: 'Can balance travel?',
    prompt: 'A cart moves right at constant speed along a straight track. A motor pulls right with 12 N. What is the total opposing horizontal force?',
    options: ['Less than 12 N', 'Exactly 12 N', 'More than 12 N'], correct: 1,
    hint: 'Constant speed AND a straight path mean constant velocity. What does that tell you about net force?',
    feedback: ['A smaller opposing force would leave a rightward net force and change the velocity.', 'Yes. Equal opposing forces give zero net force. The cart keeps its existing velocity.', 'A larger opposing force would produce a leftward net force and change the velocity.'],
    teacher: '“Forward must win because it is moving” is the misconception to listen for. Ask what would happen to the speed if forward really did win.',
  },
  vectors: {
    title: 'Make a prediction before using a formula.',
    prompt: 'Two symmetric ropes support the same sign. As the ropes become more horizontal, what happens to the tension in each rope?',
    options: ['It decreases', 'It stays the same', 'It increases'], correct: 2,
    hint: 'Each rope still needs to supply half the upward support. A shallower rope uses less of its pull in the upward direction.',
    feedback: ['The upward portion of each pull gets smaller, so the total pull must get larger.', 'The weight stays the same, but each rope’s direction changes. Direction matters for a vector.', 'Yes. The vertical components stay fixed while the total rope tensions increase.'],
    teacher: 'Look for reasoning about upward components, rather than “the angle makes it heavier.” The weight never changes.',
  },
} as const

