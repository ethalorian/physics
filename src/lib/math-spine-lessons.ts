/**
 * Mini-lessons for the math-literacy spine.
 *
 * Each competency has THREE tiers, because students arrive not knowing these
 * skills and grow into them over the year:
 *   tier 0 "Start here"  — assumes NOTHING; defines the idea in plain language
 *                          with a concrete example before any procedure.
 *   tier 1 "Building it" — the step-by-step procedure.
 *   tier 2 "Fluent"      — the efficient move / extension.
 *
 * The warm-up screen shows the tier that matches the student's current mastery
 * on that competency (see pickTier), so the same skill teaches from scratch in
 * September and stretches a fluent student in spring.
 *
 * Authored defaults — editable per competency in the Warm-Up Bank (stored on
 * math_competencies.mini_lesson as { tiers: MiniLesson[] }).
 */
export interface MiniLesson {
  title: string
  steps: string[]
  tip?: string
}

export const TIER_LABELS = ['Start here', 'Building it', 'Fluent'] as const

/** Which tier to show from a student's decaying mastery value (null = no evidence). */
export function pickTier(value: number | null | undefined): number {
  if (value == null || value < 1.5) return 0
  if (value < 2.5) return 1
  return 2
}

export const MINI_LESSONS: Record<string, MiniLesson[]> = {
  PR1: [
    {
      title: 'What a proportion is',
      steps: [
        'A ratio compares two amounts that go together — like miles and hours.',
        'If things stay “in proportion,” when one amount grows the other grows by the SAME factor.',
        'Example: in 1 hour you walk 3 miles; in 2 hours (twice the time) you walk 6 miles (twice the distance).',
      ],
      tip: 'In proportion = same factor for both, not the same amount added on.',
    },
    {
      title: 'Setting up a proportion',
      steps: [
        'Write the matching amounts as two equal fractions: old ÷ old = new ÷ new.',
        'Find the scale factor: divide the new known by the old known (e.g. 49 d ÷ 14 d = 3.5).',
        'Multiply the other quantity by that same factor.',
      ],
      tip: 'Keep the units attached so the answer makes sense.',
    },
    {
      title: 'Scaling fluently',
      steps: [
        'Spot the scale factor directly and multiply.',
        'Watch for inverse cases (more workers → less time): then you divide instead.',
        'Estimate the answer first so you notice if your factor is upside-down.',
      ],
    },
  ],
  PR2: [
    {
      title: 'Why distance changes strength',
      steps: [
        'Some effects get weaker as you move away — like a lamp getting dimmer.',
        'For gravity and light, moving twice as far does NOT cut it in half — it cuts it to a quarter.',
        'That’s because the effect spreads over an area, and area grows with the distance squared.',
      ],
      tip: 'Twice as far → 1/4. Three times as far → 1/9.',
    },
    {
      title: 'Using the factor',
      steps: [
        'Find how many times farther or closer you moved (the factor).',
        'Square that factor.',
        'Inverse-square: divide by the squared factor (farther = weaker).',
      ],
    },
    {
      title: 'Both directions',
      steps: [
        'Half the distance → 4× stronger; double the distance → 1/4 as strong.',
        'Set it up as new = old × (old distance ÷ new distance)².',
        'Sanity-check the direction: closer must come out stronger.',
      ],
    },
  ],
  QE1: [
    {
      title: 'What scientific notation is',
      steps: [
        'It’s a short way to write very big or very small numbers.',
        'It’s a number between 1 and 10, times a power of ten. Example: 8,500 = 8.5 × 1000 = 8.5 × 10³.',
        'The little raised number just counts how many places the decimal moves.',
      ],
      tip: 'Big number → positive power. Tiny number → negative power.',
    },
    {
      title: 'Writing a number this way',
      steps: [
        'Put the decimal right after the first non-zero digit (8500 → 8.5).',
        'Count how many places you moved it (8500 → 8.5 is 3 places).',
        'That count is the power: 8.5 × 10³. Moved left → positive; moved right → negative.',
      ],
      tip: 'Check by multiplying back out — you should get the original number.',
    },
    {
      title: 'Computing with it',
      steps: [
        'To multiply: multiply the front numbers and ADD the powers.',
        'To divide: divide the front numbers and SUBTRACT the powers.',
        'Re-write so the front is between 1 and 10, adjusting the power if needed.',
      ],
    },
  ],
  QE2: [
    {
      title: 'What units tell you',
      steps: [
        'A number in science means nothing without its unit (5 what — meters? seconds?).',
        'Units travel with the number through every step.',
        'Example: (meters/second) × (seconds) = meters — the seconds cancel.',
      ],
      tip: 'If the leftover unit is wrong, the math is wrong.',
    },
    {
      title: 'Tracking and cancelling',
      steps: [
        'Write every number with its unit.',
        'Cancel units like factors in a fraction (an “s” on top cancels an “s” on the bottom).',
        'Check that the final unit matches what the question asks for.',
      ],
    },
    {
      title: 'Converting units',
      steps: [
        'Multiply by a conversion factor written as a fraction equal to 1 (1000 m ÷ 1 km).',
        'Arrange it so the unit you don’t want cancels.',
        'Use units to catch a wrong formula before you trust the number.',
      ],
    },
  ],
  QE3: [
    {
      title: 'What an estimate is',
      steps: [
        'An estimate is a rough answer that gives the right ballpark, not the exact value.',
        'It answers “about 10? about 1,000? about a billion?”',
        'Example: 312 × 49 is about 300 × 50 = 15,000.',
      ],
      tip: 'An estimate tells you whether your exact answer is even reasonable.',
    },
    {
      title: 'Round to one digit',
      steps: [
        'Round each number to one digit times a power of ten (3.5×10¹¹ → 4×10¹¹).',
        'Do the easy arithmetic with the front digits.',
        'Add or subtract the powers of ten.',
      ],
    },
    {
      title: 'Order of magnitude',
      steps: [
        'Keep just the powers of ten; state the answer as “about 10ⁿ.”',
        'Combine rough known numbers to estimate something you can’t measure directly.',
        'Compare to your exact calculation — a big gap means a slip somewhere.',
      ],
    },
  ],
  QE4: [
    {
      title: 'Why not every digit counts',
      steps: [
        'A measurement is only as exact as the tool that made it.',
        'If a ruler only shows millimeters, you can’t claim you measured to a thousandth of one.',
        'Extra digits can look precise without being trustworthy.',
      ],
      tip: 'More decimals does NOT mean more accurate.',
    },
    {
      title: 'Keeping the right digits',
      steps: [
        'Find the smallest amount your tool or data can actually resolve.',
        'Keep digits down to that place; round the rest away.',
        'Report the value with its unit.',
      ],
    },
    {
      title: 'Precision in a calculation',
      steps: [
        'Your answer can’t be more precise than the least-precise number you used.',
        'Keep extra digits during the work; round only at the very end.',
        'Round the final result to that many significant figures.',
      ],
    },
  ],
  SM1: [
    {
      title: 'What “solve for” means',
      steps: [
        'An equation is a balance: whatever you do to one side, do to the other.',
        '“Solve for x” means get x by itself on one side.',
        'Example: x + 3 = 7 → subtract 3 from both sides → x = 4.',
      ],
      tip: 'Undo the operations in reverse order.',
    },
    {
      title: 'Isolating a variable',
      steps: [
        'Decide which letter you want alone.',
        'Use inverse operations on both sides (÷ undoes ×, − undoes +).',
        'Keep going until that letter stands by itself.',
      ],
    },
    {
      title: 'Solve with symbols first',
      steps: [
        'Rearrange the formula using letters BEFORE putting in any numbers.',
        'Squares and square roots undo each other — apply to both sides.',
        'A clean symbolic answer can be reused for any numbers.',
      ],
    },
  ],
  SM2: [
    {
      title: 'What substituting is',
      steps: [
        'Substituting means replacing a letter with the number it stands for.',
        'Example: if a = 3, then 2a means 2 × 3 = 6.',
        'Always bring the unit along with the number.',
      ],
      tip: 'Put the number where the letter was — unit and all.',
    },
    {
      title: 'Substitute and evaluate',
      steps: [
        'Start from the equation with the variable already isolated.',
        'Replace each letter with its value AND its unit.',
        'Do the arithmetic; carry the units to the answer.',
      ],
    },
    {
      title: 'Clean evaluation',
      steps: [
        'Substitute in one line so you can check it.',
        'Combine the units as you go (kg·m/s² = N).',
        'State the answer with the right unit and precision.',
      ],
    },
  ],
  GV1: [
    {
      title: 'What a graph shows',
      steps: [
        'A graph turns a table of numbers into a picture.',
        'The slope is how steep the line is — how fast y changes as x changes.',
        'Example: on a distance-vs-time graph, a steeper line means faster.',
      ],
      tip: 'Steeper line = bigger rate.',
    },
    {
      title: 'Finding the slope',
      steps: [
        'Pick two clear points on the line.',
        'Slope = (change in y) ÷ (change in x) = rise ÷ run.',
        'Say what that slope MEANS here (e.g., velocity).',
      ],
    },
    {
      title: 'Slope and area',
      steps: [
        'On a velocity-vs-time graph, the slope is acceleration.',
        'The AREA under the line is often a total (area under v-t = distance).',
        'Always attach the physical meaning and the units.',
      ],
    },
  ],
  GV2: [
    {
      title: 'What a straight-line graph tells you',
      steps: [
        'When plotted data falls on a straight line, the two quantities follow a steady rule.',
        'If the line passes through (0,0), doubling one doubles the other — they’re proportional.',
        'Example: double the force on a cart, double its acceleration.',
      ],
      tip: 'Straight line through the origin = proportional.',
    },
    {
      title: 'Reading the relationship',
      steps: [
        'Plot the cause on the x-axis and the effect on the y-axis.',
        'Draw the best straight line through your points.',
        'The slope is the constant that links them.',
      ],
    },
    {
      title: 'Linearize to find a law',
      steps: [
        'Choose axes so the data straightens into a line.',
        'The slope gives the physical constant (a vs F → slope = 1/mass).',
        'Use the line to predict values you didn’t measure.',
      ],
    },
  ],
  GV3: [
    {
      title: 'What a vector is',
      steps: [
        'A vector is an arrow: it has a size AND a direction (like “5 m east”).',
        'A slanted arrow can be split into how much goes sideways and how much goes up.',
        'Those two pieces are called its components.',
      ],
      tip: 'One slanted arrow = an “across” part plus an “up/down” part.',
    },
    {
      title: 'Finding the components',
      steps: [
        'Draw the vector and the angle it makes with a reference line.',
        'Across (adjacent) = size × cos(angle).',
        'Up or down (opposite) = size × sin(angle).',
      ],
    },
    {
      title: 'Adding vectors',
      steps: [
        'Break each vector into its x and y components.',
        'Add all the x’s together, and all the y’s together.',
        'Recombine with the Pythagorean theorem for the total.',
      ],
    },
  ],
}

/** The 3 tiers for a competency code (authored defaults). */
export function tieredLessonsForCode(code: string | undefined | null): MiniLesson[] | null {
  if (!code) return null
  return MINI_LESSONS[code] ?? null
}

/** A single tier (defaults to the most basic) — back-compat helper. */
export function miniLessonForCode(code: string | undefined | null, tier = 0): MiniLesson | null {
  const tiers = tieredLessonsForCode(code)
  if (!tiers) return null
  return tiers[Math.min(tier, tiers.length - 1)] ?? tiers[0]
}
