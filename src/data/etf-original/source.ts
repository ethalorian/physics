import chapters from './chapters.json'
export const etfSectionId = (chapter: number) => 'etf-' + chapter + '.1'
export const etfPageSpan = (n: number, from: number, to: number) => n === 2 ? '12–14' : n === 10 ? '83–87' : from + '–' + to
export const etfChapter = (chapter: number, sections: readonly string[]) => sections.length === 1 && sections[0] === etfSectionId(chapter) ? chapters.find(c => c.number === chapter) : undefined
export function etfPages(c: typeof chapters[number]) { return etfPageSpan(c.number, c.from, c.to) }
export function etfPdf(c: typeof chapters[number]) { return c.url + '#page=' + (c.number === 2 ? 12 - c.from + 1 : 1) }
