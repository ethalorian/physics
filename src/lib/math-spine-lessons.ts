/**
 * Mini-lessons for the math-literacy spine — a short "how to do this kind of
 * problem" shown on the warm-up screen, keyed by competency CODE (PR1, QE2, …).
 *
 * Authored drafts: edit freely. These are intentionally brief — a reminder of
 * the move, not a full lecture — so the student can get to the work.
 */
export interface MiniLesson {
  title: string
  steps: string[]
  tip?: string
}

export const MINI_LESSONS: Record<string, MiniLesson> = {
  PR1: {
    title: 'Scale with a ratio',
    steps: [
      'Write the two quantities that change together as a fraction (e.g. distance over time).',
      'Find the scale factor: divide the new amount of one quantity by the old amount.',
      'Multiply the other quantity by that same factor.',
    ],
    tip: 'Twice the time at the same speed → twice the distance. Ratios scale, they don’t add.',
  },
  PR2: {
    title: 'Multiplicative & inverse-square change',
    steps: [
      'Ask how the input changed as a factor (×2? ÷2?), not how much it changed.',
      'For a direct relationship, the output changes by the same factor.',
      'For inverse-square, the output changes by the factor squared, the other way: ×2 in → ÷4 out.',
    ],
    tip: 'Half the distance from a source → four times the field/intensity.',
  },
  QE1: {
    title: 'Scientific notation',
    steps: [
      'Write the number as (a number between 1 and 10) × 10^power.',
      'To multiply: multiply the front numbers, ADD the powers.',
      'To divide: divide the front numbers, SUBTRACT the powers.',
    ],
    tip: 'Count how many places the decimal moves — that’s the power (left = positive, right = negative).',
  },
  QE2: {
    title: 'Track your units',
    steps: [
      'Carry the unit with every number through the whole calculation.',
      'Cancel units like factors (m/s × s leaves m).',
      'Check the final unit matches what the question asks — if not, you used the wrong step.',
    ],
    tip: 'Units are a free error-check. A force in kg·m/s is missing a “per second.”',
  },
  QE3: {
    title: 'Order-of-magnitude estimate',
    steps: [
      'Round every number to one digit times a power of ten.',
      'Do the easy arithmetic with the front digits; add/subtract the powers.',
      'State the answer as “about 10^n” and sanity-check it’s plausible.',
    ],
    tip: 'You’re after the right power of ten, not the exact value.',
  },
  QE4: {
    title: 'Significant figures & precision',
    steps: [
      'Ask what the instrument or data can actually resolve.',
      'Keep only the digits you can trust; round the rest.',
      'Report the value with its unit at that precision.',
    ],
    tip: 'More decimals ≠ more accurate. Don’t claim digits the data can’t support.',
  },
  SM1: {
    title: 'Rearrange before you plug in',
    steps: [
      'Decide which variable you’re solving for.',
      'Use inverse operations to isolate it — do the same thing to both sides.',
      'Only substitute numbers AFTER the variable is alone.',
    ],
    tip: 'Solving with symbols first keeps the algebra clean and reusable.',
  },
  SM2: {
    title: 'Substitute with units & evaluate',
    steps: [
      'Write the equation with the variable already isolated.',
      'Replace each symbol with its value AND its unit.',
      'Evaluate the arithmetic; carry the units to the final answer.',
    ],
    tip: 'Keep units in the substitution — they tell you if the result makes sense.',
  },
  GV1: {
    title: 'Read a graph’s slope & area',
    steps: [
      'Slope = rise ÷ run — what rate does that represent here?',
      'For a position–time graph, slope is velocity; for velocity–time, slope is acceleration.',
      'Area under the line often means an accumulated quantity (e.g. area under v–t = distance).',
    ],
    tip: 'Always say what the slope MEANS, not just its number.',
  },
  GV2: {
    title: 'Linearize data to find a rate',
    steps: [
      'Plot the measured pairs (cause on x, effect on y).',
      'If it’s a straight line through the origin, the two are proportional.',
      'The slope is the constant that links them (e.g. a vs. F has slope 1/mass).',
    ],
    tip: 'A straight line turns messy data into a law you can read off the slope.',
  },
  GV3: {
    title: 'Break a vector into components',
    steps: [
      'Draw the vector and the angle it makes with a reference axis.',
      'Adjacent component = magnitude × cos(angle); opposite component = magnitude × sin(angle).',
      'Add vectors by adding their x-components and y-components separately.',
    ],
    tip: 'sin and cos split one arrow into its “across” and “up/down” parts.',
  },
}

export function miniLessonForCode(code: string | undefined | null): MiniLesson | null {
  if (!code) return null
  return MINI_LESSONS[code] ?? null
}
