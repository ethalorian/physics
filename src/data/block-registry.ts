import { numericCell } from '@/components/blocks/data-plot'
import type { BlockType, ContentBlock } from './content-blocks'

export type FieldKind = 'text' | 'textarea' | 'number' | 'select' | 'stringlist' | 'terms' | 'simref' | 'visualgen' | 'imageupload' | 'formulapicker' | 'solvefor' | 'toggle' | 'svggen' | 'question' | 'numberlist'
export interface FieldDef { key: string; label: string; kind: FieldKind; options?: string[]; placeholder?: string }
export interface BlockDef { type: BlockType; label: string; group: 'Teach' | 'Practice'; capture?: boolean; fields: FieldDef[] }

export const BLOCK_DEFS: BlockDef[] = [
  { type: 'question', label: 'Checkpoint question', group: 'Practice', capture: true, fields: [{ key: 'question', label: 'Question and feedback', kind: 'question' }] },
  { type: 'self_assessment', label: 'Self-assessment', group: 'Practice', capture: true, fields: [{ key: 'targetIds', label: 'Learning target IDs', kind: 'stringlist' }] },
  { type: 'transfer_prompt', label: 'Transfer task', group: 'Practice', capture: true, fields: [{ key: 'masteryTaskSlug', label: 'Mastery task slug', kind: 'text' }] },
  { type: 'deck', label: 'Teacher slide deck', group: 'Teach', fields: [{ key: 'title', label: 'Title', kind: 'text' }, { key: 'src', label: 'Deck URL', kind: 'text' }] },
  { type: 'target', label: 'Learning target', group: 'Teach', fields: [
    { key: 'statement', label: 'I can… statement', kind: 'textarea' },
    { key: 'targetId', label: 'Target ID (optional)', kind: 'text' },
  ] },
  { type: 'asteroid_thread', label: 'Asteroid thread', group: 'Teach', fields: [
    { key: 'whatWeKnow', label: 'What we know (optional)', kind: 'textarea' },
    { key: 'connection', label: 'Connection to 2026-XJ', kind: 'textarea' },
  ] },
  { type: 'prose', label: 'Prose / reading', group: 'Teach', fields: [
    { key: 'markdown', label: 'Markdown (supports $KaTeX$)', kind: 'textarea' },
  ] },
  { type: 'vocab', label: 'Vocabulary', group: 'Teach', fields: [
    { key: 'terms', label: 'Terms', kind: 'terms' },
  ] },
  { type: 'worked_example', label: 'Worked example', group: 'Teach', fields: [
    { key: 'prompt', label: 'Prompt', kind: 'textarea' },
    { key: 'given', label: 'Given', kind: 'text' },
    { key: 'equation', label: 'Equation', kind: 'text' },
    { key: 'work', label: 'Work', kind: 'textarea' },
    { key: 'answer', label: 'Answer', kind: 'text' },
  ] },
  { type: 'callout', label: 'Callout', group: 'Teach', fields: [
    { key: 'variant', label: 'Variant', kind: 'select', options: ['note', 'tip', 'warning', 'misconception'] },
    { key: 'title', label: 'Title (optional)', kind: 'text' },
    { key: 'markdown', label: 'Body (markdown)', kind: 'textarea' },
  ] },
  { type: 'procedure', label: 'Build steps / procedure', group: 'Teach', fields: [
    { key: 'title', label: 'Title (e.g. "Build steps 10–15")', kind: 'text' },
    { key: 'intro', label: 'Intro line (optional, markdown)', kind: 'textarea' },
    { key: 'steps', label: 'Steps (one per line)', kind: 'stringlist' },
    { key: 'startNumber', label: 'First step number (default 1)', kind: 'number' },
  ] },
  { type: 'sentence_frame', label: 'Sentence frame', group: 'Teach', fields: [
    { key: 'capture', label: 'Students write an answer into this frame', kind: 'toggle' },
    { key: 'frame', label: 'Frame (use ___ for blanks)', kind: 'text' },
    { key: 'wordBank', label: 'Word bank', kind: 'stringlist' },
  ] },
  { type: 'sim_embed', label: 'Simulation embed', group: 'Teach', fields: [
    { key: 'simulationSlug', label: 'Simulation', kind: 'simref' },
  ] },
  { type: 'animation_3d', label: '3D animation (watch & predict)', group: 'Teach', fields: [
    { key: 'animationSlug', label: 'Animation slug (e.g. approach-geometry)', kind: 'text' },
    { key: 'caption', label: 'Caption — frame what to watch for (optional)', kind: 'textarea' },
  ] },
  { type: 'equation_visualizer', label: 'Equation visualizer', group: 'Teach', fields: [] },
  { type: 'lesson_vocab', label: 'Lesson vocabulary', group: 'Teach', fields: [] },
  { type: 'figure', label: 'Figure / image', group: 'Teach', fields: [
    { key: 'src', label: 'Image — upload a file or paste a URL', kind: 'imageupload', placeholder: 'https://…' },
    { key: 'alt', label: 'Alt text (what the image shows)', kind: 'text' },
    { key: 'caption', label: 'Caption (optional)', kind: 'text' },
    { key: 'credit', label: 'Credit / source (optional)', kind: 'text' },
    { key: 'align', label: 'Size', kind: 'select', options: ['center', 'full'] },
  ] },
  { type: 'diagram', label: 'Physics diagram', group: 'Teach', fields: [
    { key: 'kind', label: 'Diagram type', kind: 'select', options: ['free_body', 'vectors', 'motion_map', 'circuit', 'energy_chain', 'friction_asymmetry'] },
    { key: 'genPrompt', label: 'Describe it in plain English', kind: 'visualgen', placeholder: 'e.g. A box sitting still on a table: gravity pulling down and the table pushing up, equal size.' },
    { key: 'title', label: 'Title (optional override)', kind: 'text' },
    { key: 'caption', label: 'Caption (optional override)', kind: 'text' },
  ] },
  { type: 'graph', label: 'Read-the-graph', group: 'Teach', fields: [
    { key: 'genPrompt', label: 'Describe it in plain English', kind: 'visualgen', placeholder: 'e.g. Velocity vs. time for two carts: one steady at 6 m/s, one speeding up from 0 at 2 m/s^2, over 4 seconds.' },
    { key: 'title', label: 'Title (optional override)', kind: 'text' },
    { key: 'xLabel', label: 'X-axis label (optional override)', kind: 'text' },
    { key: 'yLabel', label: 'Y-axis label (optional override)', kind: 'text' },
  ] },
  { type: 'sketch', label: 'Sketch / draw (with optional trace-over)', group: 'Practice', capture: true, fields: [
    { key: 'instruction', label: 'Task — what to draw and how', kind: 'textarea' },
    { key: 'prompts', label: 'Checklist bullets (shown under the canvas)', kind: 'stringlist' },
    { key: 'scaffoldSvg', label: 'Trace-over background (describe it, or paste SVG)', kind: 'svggen' },
    { key: 'grid', label: 'Coordinate grid behind the canvas', kind: 'toggle' },
    { key: 'xLabel', label: 'X-axis label (if grid on)', kind: 'text' },
    { key: 'yLabel', label: 'Y-axis label (if grid on)', kind: 'text' },
  ] },
  { type: 'lab_notebook', label: 'Lab notebook (sketch + log)', group: 'Practice', capture: true, fields: [
    { key: 'requireAllFields', label: 'Require every reasoning field', kind: 'toggle' },
    { key: 'instruction', label: 'Instruction', kind: 'text' },
    { key: 'fields', label: 'Reasoning prompts (boxes)', kind: 'stringlist' },
  ] },
  { type: 'gewa', label: 'GEWA solve', group: 'Practice', capture: true, fields: [
    { key: 'prompt', label: 'Problem prompt', kind: 'textarea' },
    { key: 'requireCompleteWork', label: 'Require given, work trail and answer units', kind: 'toggle' },
    { key: 'givenHint', label: 'Given hint', kind: 'text' },
    { key: 'equationHint', label: 'Equation hint', kind: 'text' },
    { key: 'equationIds', label: 'Formula bank — pick the formulas students may use', kind: 'formulapicker' },
    { key: 'solveFor', label: 'Solve for (the unknown to isolate)', kind: 'solvefor' },
  ] },
  { type: 'equation_sandbox', label: 'Equation sandbox', group: 'Practice', capture: true, fields: [
    { key: 'prompt', label: 'Problem prompt', kind: 'textarea' },
  ] },
  { type: 'data_table', label: 'Data table + graph', group: 'Practice', capture: true, fields: [
    { key: 'columns', label: 'Column headers', kind: 'stringlist' },
    { key: 'rows', label: 'Blank rows', kind: 'number' },
    { key: 'minRows', label: 'Required complete readings', kind: 'number' },
    { key: 'patternPrompt', label: 'Pattern prompt', kind: 'text' },
  ] },
  { type: 'observation', label: 'Observation', group: 'Practice', capture: true, fields: [
    { key: 'patternPrompt', label: 'Pattern prompt', kind: 'text' },
    { key: 'interpretPrompt', label: 'Interpret prompt', kind: 'text' },
    { key: 'frame', label: 'Sentence frame (optional)', kind: 'text' },
  ] },
  { type: 'exit_ticket', label: 'Exit ticket', group: 'Practice', capture: true, fields: [
    { key: 'prompt', label: 'Prompt', kind: 'textarea' },
    { key: 'frame', label: 'Sentence frame (optional)', kind: 'text' },
  ] },
  { type: 'marzano', label: 'Marzano self-check', group: 'Practice', capture: true, fields: [
    { key: 'targetId', label: 'Target ID', kind: 'text' },
  ] },
  { type: 'reading', label: 'Reading (homework from the textbook)', group: 'Teach', fields: [
    { key: 'chapter', label: 'Chapter number', kind: 'number' },
    { key: 'sectionIds', label: 'Section ids (one per line, e.g. 4.2)', kind: 'stringlist' },
    { key: 'thinkAndSolve', label: 'Think and Solve problem numbers (one per line, optional)', kind: 'numberlist' },
    { key: 'focus', label: 'Read for… (one line, optional)', kind: 'text' },
  ] },
  { type: 'concept_exercise', label: 'Read & practice (textbook + exercise)', group: 'Practice', capture: true, fields: [
    { key: 'chapter', label: 'Chapter number (must be loaded in concept_exercises)', kind: 'number' },
    { key: 'title', label: 'Title (optional override)', kind: 'text' },
    { key: 'sectionIds', label: 'Assigned sections (e.g. 4.4) — blank = whole chapter', kind: 'stringlist' },
  ] },
]
export const DEF_BY_TYPE = new Map<string, BlockDef>(BLOCK_DEFS.map((d): [string, BlockDef] => [d.type, d]))

const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0
const rating = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 3
const drawing = (v: unknown) => Array.isArray(v) && v.some((s) => Array.isArray(obj(s).points) && (obj(s).points as unknown[]).length > 0)
const textAnswer = (v: unknown) => typeof v === 'string' ? text(v) : obj(v).mode === 'sketch' ? drawing(obj(v).strokes) : text(obj(v).text)

/** Unchanged sentence starters and blanks are assistance, not completed reasoning. */
function substantiveAnswer(v: unknown, b?: ContentBlock): boolean {
  if (!textAnswer(v)) return false;
  if (obj(v).mode === 'sketch') return true;
  const answer = typeof v === 'string' ? v.trim() : String(obj(v).text ?? '').trim();
  const frames = [...(b?.sei?.frames?.map((f) => f.text) ?? []), ...(b && 'frame' in b && typeof b.frame === 'string' ? [b.frame] : [])];
  return !/_{2,}/.test(answer) && !frames.some((f) => f.trim() === answer);
}

/** Metadata never counts as student work. Block context adds requirements such as valid choices. */
export const RESPONSE_RULES: Partial<Record<BlockType, (response: unknown, block?: ContentBlock) => boolean>> = {
  exit_ticket: (v, b) => substantiveAnswer(v, b),
  transfer_prompt: (v, b) => substantiveAnswer(v, b),
  sentence_frame: (v, b) => substantiveAnswer(v, b),
  sketch: (v) => drawing(obj(v).strokes) || text(obj(v).text),
  lab_notebook: (v, b) => !(b?.type === 'lab_notebook' && b.requireAllFields) ? drawing(obj(v).strokes) || Object.values(obj(obj(v).fields)).some(text) : (b?.type === 'lab_notebook' && b.fields?.length ? b.fields : ['What I did', 'What I observed', 'What it means']).every((field) => text(obj(obj(v).fields)[field])),
  observation: (v, b) => substantiveAnswer({ text: obj(v).pattern }, b) && substantiveAnswer({ text: obj(v).interpret }, b),
  marzano: rating,
  self_assessment: (v, b) => {
    const ids = b?.type === 'self_assessment' ? b.targetIds : Object.keys(obj(v))
    return ids.length > 0 && ids.every((id) => rating(obj(v)[id]))
  },
  equation_sandbox: (v) => Array.isArray(obj(v).lines) && (obj(v).lines as unknown[]).some(text),
  gewa: (v, b) => !(b?.type === 'gewa' && b.requireCompleteWork) ? text(obj(v).answer) && (text(obj(v).equationId) || text(obj(v).equation)) : text(obj(v).given) && text(obj(v).answer) && /[a-zA-Z°%]/.test(String(obj(v).answer).replace(/[eE][+-]?\d+/g, '')) && (text(obj(v).equationId) || text(obj(v).equation)) && (text(obj(v).work) || Object.keys(obj(obj(v).substitutions)).length > 0),
  data_table: (v, b) => {
    const rows = obj(v).rows;
    const required = b?.type === 'data_table' ? b.minRows ?? 1 : 1;
    const cols = b?.type === 'data_table' ? b.columns.length : 1;
    const xi = b?.type === 'data_table' ? b.xCol ?? 0 : 0;
    const yi = b?.type === 'data_table' ? b.yCol ?? 1 : 1;
    const numeric = b?.type === 'data_table' ? b.plot ?? cols >= 2 : false;
    return Array.isArray(rows) && rows.filter((row) => Array.isArray(row) && row.length >= cols && row.every(text) && (!numeric || [row[xi], row[yi]].every((v) => numericCell(v) !== null))).length >= required && text(obj(v).pattern) && text(obj(v).interpret);
  },
  concept_exercise: (v) => obj(v).submitted === true && Number(obj(obj(v).summary).itemCount) > 0 && obj(obj(v).summary).answeredCount === obj(obj(v).summary).itemCount,
  question: (v, b) => {
    const r = obj(v), q = b?.type === 'question' ? obj(b.question) : {}
    const options = Array.isArray(q.options) ? q.options : []
    const choice = options.length > 0 || r.mode === 'choice' || text(r.optionId)
    if (choice && (!text(r.optionId) || (options.length > 0 && !options.some((o) => obj(o).id === r.optionId)))) return false
    return choice ? (!text(q.explain) || substantiveAnswer({ text: r.explain }, b)) : substantiveAnswer({ text: r.explain }, b)
  },
}

export function createBlock(type: string, id: string): ContentBlock {
  const def = DEF_BY_TYPE.get(type)
  if (!def) throw new Error(`Unknown block type: ${type}`)
  const data: Record<string, unknown> = {}
  for (const field of def.fields) {
    if (['stringlist', 'numberlist', 'terms'].includes(field.kind)) data[field.key] = []
    else if (field.kind === 'number') data[field.key] = 1
    else if (field.kind === 'select') data[field.key] = field.options?.[0]
    else if (field.kind === 'toggle') data[field.key] = false
    else if (field.kind === 'question') data[field.key] = { prompt: '', options: [] }
    else data[field.key] = ''
  }
  if (type === 'graph') data.series = []
  if (type === 'diagram') data.forces = []
  if (type === 'lab_notebook') data.requireAllFields = true
  if (type === 'gewa') data.requireCompleteWork = true
  if (type === 'data_table') { data.minRows = 4; data.columns = ['Time (s)', 'Position (m)']; data.rows = 4 }
  return { id, type, ...(def.capture ? { capture: true } : {}), ...data } as ContentBlock
}

export interface BlockIssue { blockId?: string; message: string }
/** Structural checks run on every save; required authoring fields run for publication/preview. */
export function validateBlockDocument(value: unknown, publishing = false): BlockIssue[] {
  const doc = obj(value), issues: BlockIssue[] = []
  if (doc.schemaVersion !== 1 || !Array.isArray(doc.blocks)) return [{ message: 'Use a version 1 lesson with a blocks array.' }]
  const ids = new Set<string>()
  for (const raw of doc.blocks) {
    const b = obj(raw), id = typeof b.id === 'string' ? b.id : undefined
    const add = (message: string) => issues.push({ blockId: id, message })
    if (!id || ids.has(id)) add('Every block needs a unique ID.')
    if (id) ids.add(id)
    const def = typeof b.type === 'string' ? DEF_BY_TYPE.get(b.type) : undefined
    if (!def) { add('Choose a supported block type.'); continue }
    if (b.gate === true && !RESPONSE_RULES[def.type]) add('Only answer blocks can be checkpoints.')
    for (const field of def.fields) {
      const v = b[field.key]
      if (v === undefined || v === null) continue
      if (['stringlist', 'terms', 'numberlist'].includes(field.kind) && !Array.isArray(v)) add(`${field.label} must be a list.`)
      if (field.kind === 'number' && (typeof v !== 'number' || !Number.isFinite(v))) add(`${field.label} must be a number.`)
    }
    if (!publishing) continue
    const required: Partial<Record<BlockType, string[]>> = {
      target: ['statement'], prose: ['markdown'], asteroid_thread: ['connection'], worked_example: ['prompt'], callout: ['markdown'], sentence_frame: ['frame'],
      lab_notebook: ['instruction'], sketch: ['instruction'], sim_embed: ['simulationSlug'], deck: ['src', 'title'], animation_3d: ['animationSlug'],
      gewa: ['prompt'], exit_ticket: ['prompt'], observation: ['patternPrompt', 'interpretPrompt'], figure: ['src', 'alt'], transfer_prompt: ['masteryTaskSlug'], marzano: ['targetId'],
    }
    for (const key of required[def.type] ?? []) if (!text(b[key])) add(`Fill in ${key}.`)
    for (const key of def.type === 'procedure' ? ['steps'] : def.type === 'self_assessment' ? ['targetIds'] : def.type === 'reading' ? ['sectionIds'] : []) {
      if (!Array.isArray(b[key]) || !(b[key] as unknown[]).length || !(b[key] as unknown[]).every(text)) add(`Add ${key}.`)
    }
    if (def.type === 'question') {
      const q = obj(b.question), options = Array.isArray(q.options) ? q.options : []
      if (!text(q.prompt)) add('Write the question prompt.')
      if (options.length && (options.length < 2 || options.some((o) => !text(obj(o).id) || !text(obj(o).text)) || new Set(options.map((o) => obj(o).id)).size !== options.length)) add('Add at least two choices with unique IDs and text.')
      if (q.correctOptionId && !options.some((o) => obj(o).id === q.correctOptionId)) add('The answer key must match a choice.')
    }
    if (def.type === 'data_table' && (!Array.isArray(b.columns) || !b.columns.length || !b.columns.every(text) || !Number.isInteger(b.rows) || Number(b.rows) < 1)) add('Add column headings and at least one row.')
    if (def.type === 'data_table' && b.minRows !== undefined && (!Number.isInteger(b.minRows) || Number(b.minRows) < 1)) add('Required readings must be a positive whole number.')
    if (['reading', 'concept_exercise'].includes(def.type) && (!Number.isInteger(b.chapter) || Number(b.chapter) < 1)) add('Choose a chapter number.')
  }
  return issues
}

export function blockingDrafts(blocks: ContentBlock[], responses: Record<string, { draft?: boolean }>): ContentBlock[] {
  return blocks.filter((b) => Boolean(RESPONSE_RULES[b.type]) && (b.type !== 'sentence_frame' || b.capture === true) && responses[b.id]?.draft)
}

/** Whether the resulting lesson, rather than just the request, is published. */
export function remainsPublished(current: boolean, patch: { published?: boolean }): boolean {
  return patch.published ?? current
}
