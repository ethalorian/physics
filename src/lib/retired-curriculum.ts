// Superseded Trades courses (2026-09-23) and Project Physics (2026-09-28).
// Keep their rows and IDs for historical work and recovery. This is an explicit
// list: unpublished drafts and future Trades units must remain discoverable.
export const RETIRED_CURRICULUM_UNIT_IDS: readonly string[] = [
  'proj-1', 'proj-2', 'proj-3', 'proj-4',
  'trades-1', 'trades-2', 'trades-3', 'trades-4', 'trades-5', 'trades-6',
  'trades-reset-1', 'trades-reset-2', 'trades-reset-3',
  'trades-reset-4', 'trades-reset-5', 'trades-reset-6',
]

const retired = new Set(RETIRED_CURRICULUM_UNIT_IDS)

export function isRetiredCurriculumUnit(id: string | null | undefined): boolean {
  return id != null && retired.has(id)
}

export function isCatalogUnit(row: { id: string }): boolean {
  return !isRetiredCurriculumUnit(row.id)
}

export function isCatalogLesson(row: { unit_id?: string | null }): boolean {
  return !isRetiredCurriculumUnit(row.unit_id)
}
