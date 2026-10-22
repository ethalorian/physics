export type ReadingSectionRect = { id: string; top: number; bottom: number }
/** Recompute from every section, not only the entries changed in an observer callback. */
export function sectionAtReadingLine(sections: ReadingSectionRect[], line: number): string {
  return sections.find(s => s.bottom > line)?.id ?? sections.at(-1)?.id ?? 'opening'
}
