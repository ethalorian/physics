/** CPA/Honors syllabus, section 5.5: use the explicit table, never average dimensions. */
export const FOUR_DIMENSION_LAB_VERSION = 'lab-four-dimensions-v1'
export const LAB_DIMENSIONS = [
  { id: 'science', label: 'Science', description: 'Correct physics, measurements, and calculations.' },
  { id: 'reasoning', label: 'Reasoning', description: 'The claim follows from the evidence.' },
  { id: 'communication', label: 'Communication', description: 'Clear labels, units, organization, and explanation.' },
  { id: 'transfer', label: 'Transfer', description: 'Connect the physics to the investigation or scenario beyond restating the prompt.' },
] as const
export type LabDimension = typeof LAB_DIMENSIONS[number]['id']
export type LabDimensionScore = { id: LabDimension; earned: number; possible: 4; feedback: string }
export const FOUR_DIMENSION_LAB_RUBRIC = 'Score Science, Reasoning, Communication, and Transfer from 0 to 4. The lowest score sets the grade: 4 → 96% (A), 3 → 89% (B+), 2 → 85% (B), 1 → 75% (C), 0 → 50% (Not Yet). Do not average the four dimensions. Mastery is reviewed separately.'
export function validLabDimensions(value: unknown): value is LabDimensionScore[] {
  if (!Array.isArray(value) || value.length !== LAB_DIMENSIONS.length) return false
  const seen = new Set<string>()
  return value.every(item => {
    if (!item || !LAB_DIMENSIONS.some(d => d.id === item.id) || seen.has(item.id)) return false
    seen.add(item.id)
    return item.possible === 4 && Number.isInteger(item.earned) && item.earned >= 0 && item.earned <= 4 && typeof item.feedback === 'string' && item.feedback.length <= 1200
  })
}
export function labDimensionGrade(value: unknown) {
  if (!validLabDimensions(value)) return null
  const lowest = Math.min(...value.map(item => item.earned))
  return { lowest, percent: [50, 75, 85, 89, 96][lowest], letter: ['Not Yet', 'C', 'B', 'B+', 'A'][lowest] }
}
/** Released records only. Includes legacy grades so their history remains visible. */
export type ReleasedLabEntry = { submissionId: string; rubricVersion: string; items: { id: string; earned: number; possible: number; feedback: string }[]; percent: number; letter: string; feedback: string; releasedAt: string; submittedAt: string }
