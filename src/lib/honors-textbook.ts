import chapters from '@/data/honors-textbook-chapters.json'
import { OPENSTAX_PHYSICS } from '@/lib/openstax-physics'

export const HONORS_LAST_PAGE = OPENSTAX_PHYSICS.pages - OPENSTAX_PHYSICS.offset
export const HONORS_READER_KEY = 'textbook:honors:college-physics-ap-2e'
export const HONORS_PARTS = [
  { title: 'Foundations & mechanics', first: 1, last: 10 },
  { title: 'Matter & thermal physics', first: 11, last: 15 },
  { title: 'Oscillations & sound', first: 16, last: 17 },
  { title: 'Electricity & magnetism', first: 18, last: 24 },
  { title: 'Light & optics', first: 25, last: 27 },
  { title: 'Modern physics', first: 28, last: 34 },
]
export const HONORS_CHAPTERS = chapters.map(chapter => ({
  ...chapter,
  sections: OPENSTAX_PHYSICS.sections.filter(section => Number(section.id.split('.')[0]) === chapter.number),
}))
export function honorsPrintedPage(value: unknown): number | null {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '') return null
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 && page <= HONORS_LAST_PAGE ? page : null
}
export function honorsChapterAt(page: number) {
  return HONORS_CHAPTERS.find(chapter => page >= chapter.from && page <= chapter.to)
}
export function honorsSectionAt(page: number) {
  return honorsChapterAt(page)?.sections.filter(section => page >= section.printedPage && page <= section.lastPrintedPage).at(-1)
}
export function honorsPageTitle(page: number): string {
  const chapter = honorsChapterAt(page), section = honorsSectionAt(page)
  return section ? `${section.id} · ${section.title}` : chapter ? `Chapter ${chapter.number} · ${chapter.title}` : page < HONORS_CHAPTERS[0].from ? 'Preface' : 'Appendices & reference'
}
export function readHonorsPosition(value: string | null): { page: number; bookmarks: number[] } {
  const fallback = { page: OPENSTAX_PHYSICS.defaultPage, bookmarks: [] as number[] }
  try {
    const stored: unknown = JSON.parse(value ?? 'null')
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return fallback
    const record = stored as Record<string, unknown>
    return { page: honorsPrintedPage(record.page) ?? fallback.page, bookmarks: Array.isArray(record.bookmarks) ? [...new Set(record.bookmarks.map(honorsPrintedPage).filter((p): p is number => p !== null))].sort((a, b) => a - b) : [] }
  } catch { return fallback }
}
