import type { ReadingAssignment, ReadingQuestion } from '@/lib/textbook-assignments'
import type { InteractiveChapterDefinition } from './reader-contract'

export function assignmentScope(definition: InteractiveChapterDefinition, assignment?: ReadingAssignment) {
  const sections = assignment ? definition.sections.filter(section => definition.isSectionAssigned(assignment, section)) : []
  return {
    sections,
    first: sections[0],
    last: sections.at(-1),
    label: `${sections.length === 1 ? 'Section' : 'Sections'} ${sections.map(section => section.number).join(', ')}`,
  }
}

/** Questions outside the focused reading remain available in the turn-in area. */
export function visibleQuestionSection(definition: InteractiveChapterDefinition, question: ReadingQuestion, visibleSectionIds: ReadonlySet<string>) {
  const id = definition.questionSection(question)
  return id && visibleSectionIds.has(id) ? id : null
}
