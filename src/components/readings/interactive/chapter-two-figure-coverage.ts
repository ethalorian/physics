import type { SourceFigureCoverage } from './reader-contract'

/** Tracks visual teaching purposes, not a claim to reproduce publisher artwork. */
export const chapterTwoFigureCoverage: readonly SourceFigureCoverage[] = [
  { sourceLabel: '2.1', printedPage: 13, section: '2.1', treatment: 'adapted', anchors: ['figure-force-directions'], note: 'Same, opposite, and balanced forces on a common arrow scale.' },
  { sourceLabel: '2.2', printedPage: 13, section: '2.1', treatment: 'adapted', anchors: ['opening', 'figure-spring-scale'], note: 'Balanced upward support and downward weight, illustrated with a book and bag instead of a hand-held rock.' },
  { sourceLabel: '2.3', printedPage: 14, section: '2.1', treatment: 'adapted', anchors: ['figure-spring-scale'], note: 'A physical spring scale is paired with an isolated-object force diagram.' },
  { sourceLabel: '2.4', printedPage: 14, section: '2.1', treatment: 'adapted', anchors: ['figure-force-directions'], note: 'Relative arrow length encodes magnitude; not a physical centimetre ruler.' },
  { sourceLabel: '2.5', printedPage: 16, section: '2.2', treatment: 'adapted', anchors: ['figure-scaffold'], note: 'Move a painter; tensions change while their sum remains fixed. Exact shares also use rotational balance.' },
  { sourceLabel: '2.6a', printedPage: 17, section: '2.3', treatment: 'adapted', anchors: ['opening', 'figure-normal-direction'], note: 'A table supports a book; the normal direction follows the surface. The support exploration also shows exaggerated deformation.' },
  { sourceLabel: '2.6b', printedPage: 17, section: '2.3', treatment: 'pdf-only', anchors: [], note: 'The separate hand-on-compressed-spring picture remains in the source PDF. The spring analogy is explained in the HTML prose.' },
  { sourceLabel: '2.7', printedPage: 17, section: '2.3', treatment: 'adapted', anchors: ['figure-two-scales'], note: 'The bathroom-scale concept and two-scale question are combined into a person/support-force comparison.' },
  { sourceLabel: '2.8', printedPage: 18, section: '2.4', treatment: 'adapted', anchors: ['figure-steady-forces'], note: 'A pulled cart replaces the desk; a velocity picture is paired with a complete force diagram.' },
  { sourceLabel: '2.9', printedPage: 19, section: '2.5', treatment: 'adapted', anchors: ['figure-rope-cases'], note: 'One rope and two equally loaded vertical ropes support the same weight.' },
  { sourceLabel: '2.10', printedPage: 20, section: '2.5', treatment: 'adapted', anchors: ['figure-rope-resultant'], note: 'Angled tension vectors combine to balance weight.' },
  { sourceLabel: '2.11', printedPage: 21, section: '2.5', treatment: 'adapted', anchors: ['figure-vector-construction', 'figure-rope-resultant'], note: 'A stepwise vector construction introduces the rule; the rope diagram applies it to equilibrium.' },
  { sourceLabel: '2.12', printedPage: 21, section: '2.5', treatment: 'adapted', anchors: ['figure-rope-resultant'], note: 'The live angle control changes tension-vector lengths while the upward resultant remains 300 N.' },
  { sourceLabel: '2.13', printedPage: 22, section: '2.5', treatment: 'adapted', anchors: ['figure-rope-cases'], note: 'An explicit 30°/60° example shows unequal tensions and unequal upward contributions.' },
  { sourceLabel: '2.14', printedPage: 22, section: '2.5', treatment: 'pdf-only', anchors: [], note: 'The clothesline illustration remains in the PDF. The shallow-rope limit is explored and explained in HTML.' },
]
