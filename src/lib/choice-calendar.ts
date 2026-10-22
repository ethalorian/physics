/** Shared choice rules. Completion is supplied by the existing assignment
 * systems; selecting or booking an activity is never evidence of completion. */
export type ChoiceSourceKind = 'lesson' | 'reading' | 'quiz' | 'vocabulary' | 'simulation' | 'math' | 'interactive'
export interface ChoiceStep {
  id: string
  kind: ChoiceSourceKind
  sourceId: string
  title: string
  href: string
  followUp: boolean
  prerequisite?: string
  /** Canonical library identity; independent of a class's assignment row. */
  planKey?: string
  assignmentSlug?: string
  targetId?: string
}
export interface ChoiceOption {
  id: string
  title: string
  category: string
  lab: boolean
  labType?: 'hands-on' | 'problem-solving'
  problem?: string
  /** Blank for legacy labs with no separate artifact requirement. */
  artifactInstructions?: string
  steps: ChoiceStep[]
  targetIds: string[]
}
export interface ChoiceSection {
  id: string
  course_id: string
  title: string
  opens_at: string
  due_at: string
  required_count: number
  category_minimums: Record<string, number>
  points_per_choice: number
  options: ChoiceOption[]
  published: boolean
  published_at?: string | null
  version: number
}
export interface ChoiceSelection {
  section_id: string
  option_id: string
  user_id: string
  planned_on: string | null
  step_dates?: Record<string, string | null>
  selected: boolean
  lab_completed_at: string | null
  artifact_response?: { text?: string; fileId?: string; fileName?: string }
  artifact_submitted_at?: string | null
  artifact_version?: number
  artifact_ratings?: Record<string, { version: number; level: number; note: string; recordId: string; ratedAt: string }>
  swap_requested: boolean
}
export interface ChoiceEvidence {
  attempted: boolean
  submitted: boolean
  earned: number | null
  possible: number | null
}
export type ChoiceEvidenceMap = Record<string, ChoiceEvidence>
export const sourceKey = (step: Pick<ChoiceStep, 'kind' | 'sourceId'>) => `${step.kind}:${step.sourceId}`
/** Lab reservations have their own date; independent work can happen in any order. */
export function choiceStepDate(option: ChoiceOption, selection: ChoiceSelection | undefined, stepId: string): string | null {
  if (!selection?.selected) return null
  if (Object.prototype.hasOwnProperty.call(selection.step_dates ?? {}, stepId)) return selection.step_dates?.[stepId] ?? null
  return option.lab ? null : selection.planned_on
}
export interface ChoiceProgress {
  selected: boolean
  attempted: boolean
  completed: boolean
  pendingQuizzes: number
  grade: 'EX' | 'available' | 'planned' | 'working' | 'submitted' | 'missing'
}
export function optionProgress(option: ChoiceOption, selection: ChoiceSelection | undefined, evidence: ChoiceEvidenceMap, exemptionsFinal: boolean): ChoiceProgress {
  const work = option.steps.filter(s => !s.followUp)
  const attempted = !!selection?.lab_completed_at || !!selection?.artifact_version || option.steps.some(s => evidence[sourceKey(s)]?.attempted)
  const selected = !!selection?.selected || attempted
  const completed = selected && (!option.lab || !!selection?.lab_completed_at) &&
    (!option.lab || !option.artifactInstructions?.trim() || !!selection?.artifact_submitted_at) &&
    (option.lab || work.length > 0) && work.every(s => evidence[sourceKey(s)]?.submitted)
  return { selected, attempted, completed,
    pendingQuizzes: selected ? option.steps.filter(s => s.followUp && !evidence[sourceKey(s)]?.submitted).length : 0,
    grade: !selected ? exemptionsFinal ? 'EX' : 'available' : completed ? 'submitted' : attempted ? 'working' : 'planned' }
}
export function sectionProgress(section: ChoiceSection, selections: ChoiceSelection[], evidence: ChoiceEvidenceMap, now: number) {
  const byOption = new Map(selections.map(s => [s.option_id, s]))
  const states = section.options.map(option => ({ option, ...optionProgress(option, byOption.get(option.id), evidence, false) }))
  const completed = states.filter(s => s.completed)
  const deficits = Object.entries(section.category_minimums).map(([category, minimum]) => ({
    category, missing: Math.max(0, minimum - completed.filter(s => s.option.category === category).length),
  })).filter(d => d.missing > 0)
  // Each option has one category: a missing lab can also satisfy one missing
  // overall choice. Never charge two zeroes for that same missing obligation.
  const missing = Math.max(Math.max(0, section.required_count - completed.length), deficits.reduce((sum, d) => sum + d.missing, 0))
  const complete = missing === 0, overdue = !!(section.published || section.published_at) && now > Date.parse(section.due_at)
  return { completed: completed.length, required: section.required_count, missing, complete, overdue, deficits,
    pendingQuizzes: states.reduce((sum, s) => sum + s.pendingQuizzes, 0),
    options: states.map(s => {
      const requiredRemaining = s.completed ? 0 : deficits.find(d => d.category === s.option.category)?.missing ?? 0
      // A required category stays missing until satisfied. This is a status,
      // not another score: only missingEntries supplies the requirement zero.
      const grade: ChoiceProgress['grade'] = overdue && requiredRemaining > 0 ? 'missing'
        : s.grade === 'available' && (complete || overdue) ? 'EX' : s.grade
      return { ...s, requiredRemaining, grade }
    }),
    missingEntries: overdue ? Array.from({ length: missing }, (_, i) => ({
      id: `${section.id}:missing:${i + 1}`, title: `Missing required choice ${i + 1}`, earned: 0,
      possible: section.points_per_choice, reason: deficits.map(d => `${d.missing} ${d.category}`).join(', '),
    })) : [],
  }
}
/** A choice exemption must never remove a separate direct assignment or a
 * recorded attempt. Use this when projecting shared source gradebook cells. */
export function assignmentExempt(input: { directRequired: boolean; chosenInAnySection: boolean; attempted: boolean; choiceExempt: boolean }) {
  return input.choiceExempt && !input.directRequired && !input.chosenInAnySection && !input.attempted
}
export function canRemoveChoice(option: ChoiceOption, selection: ChoiceSelection | undefined, evidence: ChoiceEvidenceMap, teacherApproved = false) {
  return teacherApproved || !optionProgress(option, selection, evidence, false).attempted
}
export function validateSection(section: ChoiceSection): string | null {
  if (!section.title.trim() || section.title.length > 160) return 'Enter a section title of 1–160 characters.'
  if (!Number.isFinite(Date.parse(section.opens_at)) || !Number.isFinite(Date.parse(section.due_at)) || Date.parse(section.opens_at) >= Date.parse(section.due_at)) return 'The opening time must be before the deadline.'
  if (!Number.isInteger(section.required_count) || section.required_count < 1 || section.required_count > section.options.length) return 'Choose a required count that fits the available activities.'
  if (!Number.isFinite(section.points_per_choice) || section.points_per_choice <= 0 || section.points_per_choice > 1000) return 'Each choice must be worth between 0 and 1,000 points, excluding 0.'
  if (section.options.length > 40 || new Set(section.options.map(o => o.id)).size !== section.options.length) return 'Use at most 40 distinct choices.'
  const sources = new Set<string>()
  for (const option of section.options) {
    if (!option.id || !option.title.trim() || !option.category.trim() || option.steps.length > 20) return 'Each choice needs a title and category and at most 20 steps.'
    if (!option.lab && !option.steps.some(s => !s.followUp)) return 'Each choice needs an activity or an instructor lab.'
    if (option.labType !== undefined && !['hands-on', 'problem-solving'].includes(option.labType)) return 'Choose a hands-on or problem-solving lab.'
    if (!option.lab && (option.labType !== undefined || option.problem !== undefined)) return 'Only instructor labs can include a group problem.'
    if (option.problem !== undefined && (typeof option.problem !== 'string' || option.problem.length > 6000)) return 'Keep the group problem under 6,000 characters.'
    if (option.labType === 'problem-solving' && !option.problem?.trim()) return 'Enter one multi-step problem for the group.'
    if (option.artifactInstructions !== undefined && (!option.lab || typeof option.artifactInstructions !== 'string' || option.artifactInstructions.length > 1000)) return 'Use a brief lab artifact instruction of up to 1,000 characters.'
    for (const step of option.steps) {
      if (!['lesson', 'reading', 'quiz', 'vocabulary', 'simulation', 'math', 'interactive'].includes(step.kind) || !step.sourceId || !step.title || !step.href.startsWith('/') || step.href.startsWith('//')) return 'Choose an existing activity from the class inventory.'
      if (step.followUp && step.kind !== 'quiz') return 'Only an attached quiz can be tracked separately.'
      if (sources.has(sourceKey(step))) return 'An activity can appear in only one choice within a section.'
      sources.add(sourceKey(step))
    }
  }
  let categoryTotal = 0
  for (const [category, minimum] of Object.entries(section.category_minimums)) {
    if (!Number.isInteger(minimum) || minimum < 0 || minimum > section.options.filter(o => o.category === category).length) return 'Category requirements must fit the available choices.'
    categoryTotal += minimum
  }
  if (categoryTotal > section.required_count) return 'Category minimums cannot add up to more than the required choice count.'
  return null
}

export interface GroupCandidate { id: string; name: string; mastery: number | null }
export interface GroupSuggestion { members: GroupCandidate[]; mean: number }
/** Suggestions only. The teacher confirms placements; absent mastery evidence
 * is not a low score, and student-facing responses never expose these values. */
export function suggestMasteryGroups(candidates: GroupCandidate[], strategy: 'similar' | 'mixed', capacity = 4) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 4) throw Error('Lab groups must contain at most four students.')
  if (new Set(candidates.map(c => c.id)).size !== candidates.length) throw Error('Each student can appear only once.')
  const unscored = candidates.filter(c => c.mastery === null)
  const scored = candidates.filter((c): c is GroupCandidate & { mastery: number } => c.mastery !== null)
  if (scored.some(c => !Number.isFinite(c.mastery) || c.mastery < 1 || c.mastery > 3)) throw Error('Mastery must use the existing 1–3 scale.')
  scored.sort((a, b) => strategy === 'similar' ? a.mastery - b.mastery || a.id.localeCompare(b.id) : b.mastery - a.mastery || a.id.localeCompare(b.id))
  const count = Math.ceil(scored.length / capacity), members: GroupCandidate[][] = Array.from({ length: count }, () => [])
  if (strategy === 'similar') {
    let offset = 0
    members.forEach((group, i) => { const size = Math.floor(scored.length / count) + (i < scored.length % count ? 1 : 0); group.push(...scored.slice(offset, offset + size)); offset += size })
  } else {
    scored.forEach((student, index) => { const round = Math.floor(index / count), position = index % count; members[round % 2 ? count - 1 - position : position].push(student) })
  }
  return { groups: members.map(group => ({ members: group, mean: group.reduce((sum, c) => sum + c.mastery!, 0) / group.length })), unscored }
}
