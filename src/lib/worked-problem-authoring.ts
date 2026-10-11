import type { BlockDocument, ContentBlock, GewaBlock, WorkedExampleBlock } from '@/data/content-blocks'

/** Reviewed authoring data, materialized into lessons by the content installer.
 * Keep private practice solutions in block.note, which student projection removes. */
export const WORKED_PROBLEM_01 = {
  youtubeId: 'B51oRJa9MSM',
  playlistId: 'PLZKwzUFM2PaM',
  title: 'Distance vs. displacement on a number line · Worked Problem 01',
  durationSeconds: 167,
  reviewedAt: '2026-10-07',
  targetId: 'u1.vocab-position-distance-displacement',
  positions: [2, 8, -3],
}

interface TripProblem {
  id: string
  title: string
  prompt: string
  positions: number[]
  direction: 'right' | 'up'
  modelHint: string
  planHint: string
  interpretation: string
}

export const WORKED_PROBLEM_PRACTICE: Record<'position' | 'signs', TripProblem[]> = {
  position: [
    { id: 'turnaround', title: 'Practice 1 · A new turnaround', positions: [1, 7, -2], direction: 'right',
      prompt: 'A student starts at x = +1 m, walks along a straight hallway to x = +7 m, then turns and walks to x = −2 m. Choose right as positive. Find the total distance and displacement, and explain the direction of the displacement.',
      modelHint: 'Draw a number line. Mark +1 m as start, +7 m as the turn, and −2 m as finish. Draw one arrow for each leg.',
      planHint: 'Add the lengths of both legs for distance. For displacement, compare only the initial and final positions.',
      interpretation: 'The student finishes 3 m left of the starting point. Adding signed leg changes gives displacement, not distance.' },
    { id: 'return', title: 'Practice 2 · Back to the start', positions: [-4, 3, -4], direction: 'right',
      prompt: 'A cart starts at x = −4 m, rolls directly to x = +3 m, then returns to x = −4 m. Choose right as positive. Find distance and displacement. Explain why returning to the start does not erase the distance traveled.',
      modelHint: 'Show both legs, even though the initial and final positions share the same point.',
      planHint: 'Which calculation depends on the whole route? Which depends only on the endpoints?',
      interpretation: 'The displacement is zero because the endpoints coincide. There is no net direction, but both 7 m legs count toward distance.' },
    { id: 'three-legs', title: 'Practice 3 · Plan a longer trip', positions: [5, -1, 2, -3], direction: 'right',
      prompt: 'A robot moves on one straight track through these positions in order: +5 m → −1 m → +2 m → −3 m. It moves directly between each listed position. Right is positive. Find its total distance and displacement. Show a model and a plan before calculating, then check that the distance is at least as large as the magnitude of the displacement.',
      modelHint: 'Label each stop in order and count the legs. A table or a number-line sketch can organize the route.',
      planHint: 'Choose which positions each quantity needs. Explain your choice before doing the arithmetic.',
      interpretation: 'The robot finishes 8 m left of its start. The check is 14 m ≥ |−8 m|; changes of direction add distance without increasing the net change by the same amount.' },
  ],
  signs: [
    { id: 'negative-positions', title: 'Practice 1 · Negative position, positive change', positions: [-6, -2, -5], direction: 'right',
      prompt: 'A cart follows the route x = −6 m → −2 m → −5 m, moving directly between each stop. Right is positive. Find distance and displacement. Its final position is negative: does that make its total displacement negative? Use your calculation to explain.',
      modelHint: 'Put all three positions left of zero, then draw the motion arrows in order.',
      planHint: 'The sign of final position tells you which side of the origin it is on. To find the sign of displacement, compare final with initial position.',
      interpretation: 'The final position is −5 m, but displacement is +1 m: the cart finishes 1 m to the right of where it started. Its final leg is leftward; that is different from its total displacement.' },
    { id: 'vertical', title: 'Practice 2 · Use a vertical axis', positions: [2, -4, 1], direction: 'up',
      prompt: 'A lift moves directly from y = +2 m to y = −4 m, then to y = +1 m. Up is positive. Find its total distance and displacement. State the direction of the last leg and the direction of the total displacement, and explain why they differ.',
      modelHint: 'Turn the number line vertically. Label up as positive and mark the three positions.',
      planHint: 'Use Δy = yf − yi for the whole trip. The direction of the final leg depends on a different pair of positions.',
      interpretation: 'The last leg is 5 m upward, while total displacement is −1 m (1 m down from the start). A positive final position does not imply positive total displacement.' },
  ],
}

export function tripSolution(positions: number[]) {
  const changes = positions.slice(1).map((value, i) => value - positions[i])
  return { changes, lengths: changes.map(Math.abs), distance: changes.reduce((sum, value) => sum + Math.abs(value), 0), displacement: positions.at(-1)! - positions[0] }
}

const signed = (n: number) => n > 0 ? `+${n}` : String(n).replace('-', '−')
const referenceId = (kind: string) => `wp01-${kind}-reference`

function practiceBlock(problem: TripProblem, kind: string): GewaBlock {
  const solution = tripSolution(problem.positions)
  const coordinate = problem.direction === 'up' ? 'y' : 'x'
  return {
    id: `wp01-${kind}-${problem.id}`, type: 'gewa', capture: true,
    responseFormat: 'problem-workspace', requireCompleteWork: true,
    targetId: WORKED_PROBLEM_01.targetId, evidenceRole: 'practice',
    prompt: problem.prompt, referenceBlockIds: [referenceId(kind)],
    workshop: { stage: problem.title, pageBreakBefore: true },
    stageHints: {
      model: problem.modelHint, plan: problem.planHint,
      work: 'Write final minus initial for each leg. Use each leg’s magnitude when adding distance, and keep meters with your values.',
      answer: 'Report both quantities with units. Explain what the displacement sign means for your chosen positive direction.',
    },
    sei: { modes: ['text', 'sketch'], wordBank: ['initial', 'final', 'leg', 'distance', 'displacement', 'direction'],
      frames: [{ level: 1, text: 'The total distance is ___ m. The displacement is ___ m, which means ___. They differ because ___.' }] },
    note: `Teacher solution — ${problem.title}. Model: ${problem.positions.map(n => signed(n) + ' m').join(' → ')}; positive ${problem.direction}. Plan: sum the magnitude of every leg for distance; Δ${coordinate} = ${coordinate}f − ${coordinate}i for displacement. Work: signed leg changes = ${solution.changes.map(n => signed(n) + ' m').join(', ')}. Distance = ${solution.lengths.join(' + ')} = ${solution.distance} m. Displacement = (${signed(problem.positions.at(-1)!)}) − (${signed(problem.positions[0])}) = ${signed(solution.displacement)} m. Answer: ${problem.interpretation} Review the model, plan, arithmetic, units, and interpretation; a completed save alone is not evidence of correctness.`,
  }
}

function exampleBlocks(kind: string): ContentBlock[] {
  const example: WorkedExampleBlock = {
    id: `wp01-${kind}-solution`, type: 'worked_example', format: 'problem-workspace',
    teachingMoment: { phase: 'reference', title: 'Open the video’s worked solution' },
    prompt: 'A student starts at +2 m, walks to a fountain at +8 m, then to a locker at −3 m. Find distance and displacement.',
    given: 'Use a straight x-axis with right positive. Mark start +2 m, turn +8 m, and finish −3 m. Draw the two legs in order.',
    equation: 'Distance adds the magnitude of each leg. Displacement compares only the endpoints: $\\Delta x=x_f-x_i$.',
    work: 'First leg: $|8-2|=6$ m. Second leg: $|-3-8|=11$ m. Distance: $6+11=17$ m. Displacement: $-3-2=-5$ m.',
    answer: 'Distance = 17 m. Displacement = −5 m: the student finishes 5 m to the left of where she started. The return leg adds distance; it does not subtract distance.',
  }
  return [
    { id: `wp01-${kind}-video`, type: 'instruction_video', youtubeId: WORKED_PROBLEM_01.youtubeId,
      title: WORKED_PROBLEM_01.title, durationSeconds: WORKED_PROBLEM_01.durationSeconds,
      targetId: WORKED_PROBLEM_01.targetId, workshop: { stage: 'Watch a worked problem', pageBreakBefore: true },
      summary: 'Follow the trip +2 m → +8 m → −3 m using Problem → Model → Plan → Work → Answer. Pause at 1:40, just before Work, and try the calculation. Resume to compare your method and interpret the sign.',
    },
    { id: referenceId(kind), type: 'callout', variant: 'tip', title: 'Distance and displacement method',
      teachingMoment: { phase: 'reference', title: 'Distance and displacement method' },
      markdown: '**Problem:** Name the quantities you need.\n\n**Model:** Choose a positive direction, label the positions, and draw every leg.\n\n**Plan:** For distance, add the lengths of all legs: $d=|x_1-x_0|+|x_2-x_1|+\\cdots$. For displacement, use only the endpoints: $\\Delta x=x_f-x_i$. Use $y$ for a vertical axis.\n\n**Work:** Substitute signed positions; take magnitudes for distance.\n\n**Answer:** Include meters and interpret the displacement sign. Check $d\\geq|\\Delta x|$.\n\nVideo chapters: 0:00 Problem · 0:30 Model · 1:04 Plan · 1:40 Work · 2:20 Answer.\n\n[Watch Worked Problem 01 on YouTube](https://www.youtube.com/watch?v=B51oRJa9MSM) · [Worked Problems: Kinematics playlist](https://www.youtube.com/playlist?list=PLZKwzUFM2PaM)',
    },
    example,
  ]
}

export const WORKED_PROBLEM_LESSONS = [
  { id: 'fc67d63d-a011-426b-b9f3-fd8f1ea7f501', slug: 'position-and-displacement', kind: 'position', exampleBefore: 'position-model-title', practiceBefore: 'position-explain-title', estimatedTime: 35 },
  { id: 'c1f8c609-88ad-4d42-93ce-25ae2b0c8206', slug: 'video-6-the-sign-is-the-direction-position-vectors-in-1d', kind: 'signs', exampleBefore: 'check-maoz-9mGWyk', practiceBefore: 'explain-maoz-9mGWyk', estimatedTime: 25 },
] as const

/** Additive and idempotent: existing block IDs, prompts, order, and vocabulary stay intact. */
export function addWorkedProblem01(doc: BlockDocument, kind: 'position' | 'signs'): BlockDocument {
  const config = WORKED_PROBLEM_LESSONS.find(item => item.kind === kind)!
  const additions = [...exampleBlocks(kind), ...WORKED_PROBLEM_PRACTICE[kind].map(p => practiceBlock(p, kind))]
  const existing = additions.filter(b => doc.blocks.some(old => old.id === b.id))
  if (existing.length) {
    if (existing.length !== additions.length) throw Error('Partially installed worked-problem content; review before updating.')
    return doc
  }
  for (const anchor of [config.exampleBefore, config.practiceBefore]) if (!doc.blocks.some(b => b.id === anchor)) throw Error(`Missing lesson anchor: ${anchor}`)
  return { ...doc, blocks: doc.blocks.flatMap(b => [
    ...(b.id === config.exampleBefore ? additions.slice(0, 3) : []),
    ...(b.id === config.practiceBefore ? additions.slice(3) : []), b,
  ]) }
}
