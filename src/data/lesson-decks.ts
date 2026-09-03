/**
 * Lesson slide decks — unit/day → deck file mapping.
 *
 * The decks are self-contained HTML bundles in /public/decks/<unit>/ (see
 * docs/Deck-Integration-Handoff.md). This map is the single source of truth
 * for which deck belongs to which teaching day; the teacher plans page uses it
 * to offer a per-day "Present deck" launch. Multi-day decks are shared:
 * days 11+12 present the same F=ma deck, days 21+22 the transfer-task deck,
 * and day 1 uses the Day 1–2 anchor (day 2 has its own vocabulary deck).
 *
 * Adding a new unit (per the handoff, §5): drop the exported files into
 * /public/decks/<unit>/ and add its day map here. Nothing else changes.
 */

export interface DeckRef {
  src: string    // static asset path under /public
  title: string  // presenter-card / button label
}

const U1 = '/decks/unit-1'

const UNIT1_DECKS: Record<number, DeckRef> = {
  1: { src: `${U1}/U1 Day 1 - The Briefing.html`, title: 'Day 1 — The Briefing: Something Is Coming' },
  2: { src: `${U1}/Day 2 - Motion Vocabulary.dc.html`, title: 'Day 2 — Motion Vocabulary' },
  3: { src: `${U1}/Day 3 - Graphs as Claims.dc.html`, title: 'Day 3 — Graphs as Claims' },
  4: { src: `${U1}/Day 4 - Velocity-Time and Vectors.dc.html`, title: 'Day 4 — Velocity-Time and Vectors' },
  5: { src: `${U1}/Day 5 - Predicting Position.dc.html`, title: 'Day 5 — Predicting Position' },
  6: { src: `${U1}/Day 6 - Vector Addition.dc.html`, title: 'Day 6 — Vector Addition' },
  7: { src: `${U1}/Day 7 - Acceleration.dc.html`, title: 'Day 7 — Acceleration' },
  8: { src: `${U1}/Day 8 - Equations of Motion.dc.html`, title: 'Day 8 — Equations of Motion' },
  9: { src: `${U1}/Day 9 - Newton's 1st Law.dc.html`, title: "Day 9 — Newton's 1st Law" },
  10: { src: `${U1}/Day 10 - Forces.dc.html`, title: 'Day 10 — Forces' },
  11: { src: `${U1}/Day 11-12 - Derive F=ma.dc.html`, title: 'Day 11–12 — Derive F=ma' },
  12: { src: `${U1}/Day 11-12 - Derive F=ma.dc.html`, title: 'Day 11–12 — Derive F=ma' },
  13: { src: `${U1}/Day 13 - F=ma in Practice.dc.html`, title: 'Day 13 — F=ma in Practice' },
  14: { src: `${U1}/Day 14 - Newton's 3rd Law.dc.html`, title: "Day 14 — Newton's 3rd Law" },
  15: { src: `${U1}/Day 15 - Free Body Diagrams 1.dc.html`, title: 'Day 15 — Free Body Diagrams 1' },
  16: { src: `${U1}/Day 16 - Free Body Diagrams 2.dc.html`, title: 'Day 16 — Free Body Diagrams 2' },
  17: { src: `${U1}/Day 17 - Friction.dc.html`, title: 'Day 17 — Friction' },
  18: { src: `${U1}/Day 18 - Equilibrium.dc.html`, title: 'Day 18 — Equilibrium' },
  19: { src: `${U1}/Day 19 - Workshop.dc.html`, title: 'Day 19 — Workshop' },
  20: { src: `${U1}/Day 20 - Synthesis.dc.html`, title: 'Day 20 — Synthesis' },
  21: { src: `${U1}/Day 21-22 - Transfer Task.dc.html`, title: 'Day 21–22 — Transfer Task' },
  22: { src: `${U1}/Day 21-22 - Transfer Task.dc.html`, title: 'Day 21–22 — Transfer Task' },
}

/** The hub page linking every deck in a unit (kept with the deck files). */
export const DECK_HUBS: Record<string, DeckRef> = {
  'unit-1': { src: `${U1}/Unit 1 - All Lesson Decks.dc.html`, title: 'Unit 1 — All Lesson Decks' },
}

const LESSON_DECKS: Record<string, Record<number, DeckRef>> = {
  'unit-1': UNIT1_DECKS,
}

/** The deck for a given unit + teaching day, if one exists. */
export function deckForDay(unit: string, day: number): DeckRef | null {
  return LESSON_DECKS[unit]?.[day] ?? null
}
