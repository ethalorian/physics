import { TEXTBOOK_CHAPTERS } from '@/data/textbook'
import { TEXTBOOK_SECTIONS } from '@/data/textbook-sections'
import honorsChapters from '@/data/honors-textbook-chapters.json'
import openstax from '@/data/openstax-physics-sections.json'
import { INTERACTIVE_CHAPTERS } from './registry'
import type { TextbookId } from './reader-contract'

/** Source inventory stays comprehensive; only reviewed sections become available. */
export const conversionCatalog = [
  ...TEXTBOOK_CHAPTERS.map(c => ({ book: 'hewitt' as TextbookId, chapter: c.n, title: c.title, sections: TEXTBOOK_SECTIONS[c.n]?.sections.map(s => s.id) ?? [], pdfUrl: `/textbook?ch=${c.n}&lang=en` })),
  ...honorsChapters.map(c => ({ book: 'openstax' as TextbookId, chapter: c.number, title: c.title, sections: openstax.sections.filter(s => Number(s.id.split('.')[0]) === c.number).map(s => s.id), pdfUrl: `/textbook/honors?page=${c.from}` })),
].map(c => {
  const definition = INTERACTIVE_CHAPTERS.find(d => d.book === c.book && d.chapter === c.chapter && d.language === 'en')
  const ready = definition?.sections.map(s => s.number) ?? []
  return { ...c, ready, remaining: c.sections.filter(s => !ready.includes(s)), status: ready.length === 0 ? 'planned' as const : c.sections.every(s => ready.includes(s)) ? 'ready' as const : 'partial' as const, href: definition ? `/textbook/interactive/${c.book}/${c.chapter}` : null }
})
