import type { BlockDocument } from '@/data/content-blocks'
import quiz from '@/data/explainers/units-notebook.json'
import { UNITS_NOTEBOOK_SOURCE } from './interactive-notebook'

/** Stable IDs keep drafts, evidence and submission snapshots on the standard path. */
export function createUnitsNotebook(targetId?: string): BlockDocument {
  const source = UNITS_NOTEBOOK_SOURCE, ids = quiz.questions.map((_, index) => `units-check-${index + 1}`)
  return {
    schemaVersion: 1, presentation: 'physics-path',
    learningPath: { version: 1, kind: 'lesson', focus: 'Use units and dimensions to interpret quantities and check a physical equation.', targetSlugs: targetId ? [targetId] : [], foundations: true },
    interactiveNotebook: { version: 1, sourceId: 'units', sourceHash: quiz.sourceHash, sourceBlockId: 'units-original', questionBlockIds: ids },
    blocks: [
      { id: 'units-original', type: 'prose', markdown: '# Units and dimensions\n\nExplore the unit builder and dimensional-analysis examples, then answer the five checks below.', teachingMoment: { phase: 'model', title: source.title }, teachingTool: { kind: 'physics-explainer', version: 1, source: { id: source.id, src: source.src }, frames: source.frames } },
      ...quiz.questions.map((q, index) => ({ id: ids[index], type: 'question' as const, capture: true as const, targetId, question: { prompt: q.text, options: q.options.map((text, i) => ({ id: 'ABCD'[i], text, feedback: q.feedback })), correctOptionId: 'ABCD'[q.correct] }, evidenceRole: 'main' as const })),
      { id: 'units-reflection', type: 'exit_ticket', capture: true, targetId, evidenceRole: 'exit', prompt: 'Choose one equation or unit from this notebook. Explain how its units help you decide what it means or whether it could be correct.' },
    ],
  }
}
