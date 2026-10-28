import type { ChoiceStep } from './choice-calendar'

export const readingTags = ['CPA', 'OpenStax'] as const
export type ReadingTag = typeof readingTags[number]
/** Class placement does not change the source of an existing reading. */
export function readingTagForSource(source: { honors_reading?: unknown }): ReadingTag {
  return source.honors_reading ? 'OpenStax' : 'CPA'
}
export type LibraryMetadata = { unitIds?: string[]; targetIds?: string[]; description?: string; format?: string; availability?: string; setupHref?: string; chapter?: number; book?: string; readingTag?: ReadingTag }
export type LibraryStep = ChoiceStep & LibraryMetadata & { reflectionTemplate?: 'manga' | 'story' }
export type ReadingTemplate = LibraryMetadata & { id: string; title: string; selectionRequired: boolean }
export type LibraryFilters = { query: string; kind: string; unit: string; target: string; status?: string; readingTag?: string }
export const activityLabels: Record<string,string> = { worksheet:'Worksheet · Paper', interactive:'Interactive assignment', 'interactive-reading':'Interactive reading', reading:'Reading', lesson:'Lesson', video:'Video', reflection:'Reflection', manga:'Manga', story:'Written Reflection', 'graphic-novel':'Graphic novel response', simulation:'Simulation', quiz:'Quiz', vocabulary:'Vocabulary', math:'Math' }
export function lessonLibraryFormat(lesson: { reflection_kind?: string; video_sequence?: number }) {
  return lesson.reflection_kind ?? (lesson.video_sequence ? 'video' : 'lesson')
}
export function matchesLibrary(item: LibraryMetadata & {title:string;kind:string}, filters: LibraryFilters, targets: {id:string;statement:string;slug?:string}[] = []) {
  const format=item.format ?? item.kind
  const text=[item.title,item.description,activityLabels[format],item.book,item.readingTag,item.chapter ? `chapter ${item.chapter}` : '',...(item.unitIds??[]),...targets.filter(t=>item.targetIds?.includes(t.id)).flatMap(t=>[t.statement,t.slug??''])].join(' ').toLowerCase()
  return (!filters.kind || filters.kind===format) && (!filters.readingTag || filters.readingTag===item.readingTag) && (!filters.unit || (filters.unit==='unmapped' ? !item.unitIds?.length : item.unitIds?.includes(filters.unit))) && (!filters.target || item.targetIds?.includes(filters.target)) && filters.query.toLowerCase().trim().split(/\s+/).every(word=>(/^\d+(?:\.\d+)?$/.test(word) ? new RegExp('(^|[^0-9.])'+word.replaceAll('.', '\\.')+'([^0-9.]|$)').test(text) : text.includes(word))) && (!filters.status || filters.status===item.availability)
}
