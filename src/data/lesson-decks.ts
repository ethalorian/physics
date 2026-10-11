import { physicsExplainerBlocks } from '@/data/explainers/physics-explainers'
import type { BlockDocument } from '@/data/content-blocks'
import unit1TeachingDecks from './unit1-teaching-decks.json'
import unit1CpaDecks from './unit1-cpa-decks.json'
import worksheetDecks from './worksheet-decks.json'
import etfDecks from './trades-etf-decks.json'
import { withEtfWorkshopVisuals } from './etf-workshop'
import { coursePlanAssessment } from '@/lib/course-plan-assessment'

/** Authored lesson decks. Class context selects CPA; unscoped legacy links keep Honors. */
export interface DeckRef { src: string; title: string }
const CPA_DECKS: Record<number, DeckRef> = Object.fromEntries(unit1CpaDecks.map(deck => [deck.day, {src:deck.src, title:`CPA · Day ${deck.day} — ${deck.title}`}]))

const LESSON_DECKS: Record<string, Record<number, DeckRef>> = {
  ...Object.fromEntries([1,2,3,4].map(unit => [`trades-etf-${unit}`, Object.fromEntries(etfDecks.filter(deck=>deck.unit===unit).map(deck=>[deck.day,{src:deck.src,title:`ETF · Day ${deck.day} — ${deck.title}`}]))])),
  "proj-1": {
    "11": {
      "src": "/decks/project-physics/week-1-day-1.html",
      "title": "Week 1 · Day 1 — Walk the graph"
    },
    "13": {
      "src": "/decks/project-physics/week-1-day-3.html",
      "title": "Week 1 · Day 3 — Slope and area"
    }
  },
  "unit-1": Object.fromEntries(unit1TeachingDecks.map(deck => [deck.day, {src:deck.src, title:`Day ${deck.day} — ${deck.title}`} ])),
  "unit-2": {
    "1": {
      "src": "/decks/classroom/U2 Day 1 - Re-Anchoring.dc.html",
      "title": "Day 1 — Re-Anchoring"
    },
    "2": {
      "src": "/decks/classroom/U2 Day 2 - Free Fall.dc.html",
      "title": "Day 2 — Free Fall"
    },
    "3": {
      "src": "/decks/classroom/U2 Day 3 - Weight vs Mass.dc.html",
      "title": "Day 3 — Weight vs Mass"
    },
    "4": {
      "src": "/decks/classroom/U2 Day 4 - Universal Gravitation.dc.html",
      "title": "Day 4 — Universal Gravitation"
    },
    "5": {
      "src": "/decks/classroom/U2 Day 5 - Calculation Day.dc.html",
      "title": "Day 5 — Calculation Day"
    },
    "6": {
      "src": "/decks/classroom/U2 Day 6 - Gravitational Fields.dc.html",
      "title": "Day 6 — Gravitational Fields"
    },
    "7": {
      "src": "/decks/classroom/U2 Day 7 - g and Altitude.dc.html",
      "title": "Day 7 — g and Altitude"
    },
    "8": {
      "src": "/decks/classroom/U2 Day 8 - Measure g Lab.dc.html",
      "title": "Day 8 — Measure g Lab"
    },
    "9": {
      "src": "/decks/classroom/U2 Day 9 - Projectile Motion.dc.html",
      "title": "Day 9 — Projectile Motion"
    },
    "10": {
      "src": "/decks/classroom/U2 Day 10 - Horizontal Launches.dc.html",
      "title": "Day 10 — Horizontal Launches"
    },
    "11": {
      "src": "/decks/classroom/U2 Day 11 - Angled Launches.dc.html",
      "title": "Day 11 — Angled Launches"
    },
    "12": {
      "src": "/decks/classroom/U2 Day 12 - Circular Motion.dc.html",
      "title": "Day 12 — Circular Motion"
    },
    "13": {
      "src": "/decks/classroom/U2 Day 13 - Newton's Cannon.dc.html",
      "title": "Day 13 — Newton's Cannon"
    },
    "14": {
      "src": "/decks/classroom/U2 Day 14 - Kepler's Laws.dc.html",
      "title": "Day 14 — Kepler's Laws"
    },
    "15": {
      "src": "/decks/classroom/U2 Day 15 - When Does It Arrive.dc.html",
      "title": "Day 15 — When Does It Arrive"
    },
    "16": {
      "src": "/decks/classroom/U2 Day 16 - Transfer Task.dc.html",
      "title": "Day 16 — Transfer Task"
    }
  }
}

export const DECK_HUBS: Record<string, DeckRef> = {
 ...Object.fromEntries([1,2,3,4].map(unit=>[`trades-etf-${unit}`,{src:`/decks/trades-etf/unit-${unit}.html`,title:`ETF Unit ${unit} — Teaching decks`}])),
 'unit-1': { src: '/decks/unit-1-teaching/index.html', title: 'Unit 1 — Teaching decks' },
 'unit-2': { src: '/decks/classroom/Unit 2 - All Lesson Decks.dc.html', title: 'Unit 2 — All Lesson Decks' },
}

export function deckForDay(unit: string, day: number, track?: string | null): DeckRef | null {
 const assessment = coursePlanAssessment(unit, day)
 if (assessment) return {src: assessment.src, title: `Day ${day} — ${assessment.title}`}
 const worksheet = worksheetDecks.find(deck => deck.unit === unit && deck.day === day && deck.track === (track === 'cpa' || track === 'cpa-sei' ? 'cpa' : 'honors'))
 if (worksheet) return {src:worksheet.src, title:`${worksheet.track === 'cpa' ? 'CPA' : 'Honors'} · Day ${day} — ${worksheet.title}`}
 return (unit === 'unit-1' && track === 'cpa' ? CPA_DECKS[day] : LESSON_DECKS[unit]?.[day]) ?? null
}

// Single-day stored links resolve to the current edition. Combined files require lesson identity.
const UPDATED_DECKS: Record<string, string> = {
  "/decks/unit-1/U1 Day 1 - The Briefing.html": "/decks/classroom/U1 Day 1 - The Briefing.dc.html",
  "/decks/unit-1/Day 2 - Motion Vocabulary.dc.html": "/decks/classroom/U1 Day 2 - Talking About Motion.dc.html",
  "/decks/unit-1/Day 3 - Graphs as Claims.dc.html": "/decks/classroom/U1 Day 3 - Velocity.dc.html",
  "/decks/unit-1/Day 4 - Velocity-Time and Vectors.dc.html": "/decks/classroom/U1 Day 4 - Velocity-Time Graphs and Vectors.dc.html",
  "/decks/unit-1/Day 5 - Predicting Position.dc.html": "/decks/classroom/U1 Day 5 - The First Prediction.dc.html",
  "/decks/unit-1/Day 6 - Vector Addition.dc.html": "/decks/classroom/U1 Day 6 - Vector Addition.dc.html",
  "/decks/unit-1/Day 7 - Acceleration.dc.html": "/decks/classroom/U1 Day 7 - Acceleration.dc.html",
  "/decks/unit-1/Day 8 - Equations of Motion.dc.html": "/decks/classroom/U1 Day 8 - Choosing the Equation.dc.html",
  "/decks/unit-1/Day 9 - Newton's 1st Law.dc.html": "/decks/classroom/U1 Day 9 - Inertia.dc.html",
  "/decks/unit-1/Day 10 - Forces.dc.html": "/decks/classroom/U1 Day 10 - The Language of Force.dc.html",
  "/decks/unit-1/Day 13 - F=ma in Practice.dc.html": "/decks/classroom/U1 Day 13 - F=ma Fluency.dc.html",
  "/decks/unit-1/Day 14 - Newton's 3rd Law.dc.html": "/decks/classroom/U1 Day 14 - Action and Reaction.dc.html",
  "/decks/unit-1/Day 15 - Free Body Diagrams 1.dc.html": "/decks/classroom/U1 Day 15 - Free Body Diagrams I.dc.html",
  "/decks/unit-1/Day 16 - Free Body Diagrams 2.dc.html": "/decks/classroom/U1 Day 16 - Free Body Diagrams II.dc.html",
  "/decks/unit-1/Day 17 - Friction.dc.html": "/decks/classroom/U1 Day 17 - Friction.dc.html",
  "/decks/unit-1/Day 18 - Equilibrium.dc.html": "/decks/classroom/U1 Day 18 - Equilibrium.dc.html",
  "/decks/unit-1/Day 19 - Workshop.dc.html": "/decks/classroom/U1 Day 19 - Workshop.dc.html",
  "/decks/unit-1/Day 20 - Synthesis.dc.html": "/decks/classroom/U1 Day 20 - Synthesis.dc.html",
  "/decks/unit-1/Day 21-22 - Transfer Task.dc.html": "/decks/classroom/U1 Days 21-22 - Transfer Task.dc.html"
}

const TEACHING_DECK_ALIASES: Record<string,string> = {
  "/decks/classroom/U1 Day 1 - The Briefing.dc.html": "/decks/unit-1-teaching/day-01.html",
  "/decks/classroom/U1 Day 2 - Talking About Motion.dc.html": "/decks/unit-1-teaching/day-02.html",
  "/decks/classroom/U1 Day 3 - Velocity.dc.html": "/decks/unit-1-teaching/day-03.html",
  "/decks/classroom/U1 Day 4 - Velocity-Time Graphs and Vectors.dc.html": "/decks/unit-1-teaching/day-04.html",
  "/decks/classroom/U1 Day 5 - The First Prediction.dc.html": "/decks/unit-1-teaching/day-05.html",
  "/decks/classroom/U1 Day 6 - Vector Addition.dc.html": "/decks/unit-1-teaching/day-06.html",
  "/decks/classroom/U1 Day 7 - Acceleration.dc.html": "/decks/unit-1-teaching/day-07.html",
  "/decks/classroom/U1 Day 8 - Choosing the Equation.dc.html": "/decks/unit-1-teaching/day-08.html",
  "/decks/classroom/U1 Day 9 - Inertia.dc.html": "/decks/unit-1-teaching/day-09.html",
  "/decks/classroom/U1 Day 10 - The Language of Force.dc.html": "/decks/unit-1-teaching/day-10.html",
  "/decks/classroom/U1 Day 11 - Cart Lab I.dc.html": "/decks/unit-1-teaching/day-11.html",
  "/decks/classroom/U1 Day 12 - Cart Lab II.dc.html": "/decks/unit-1-teaching/day-12.html",
  "/decks/classroom/U1 Day 13 - F=ma Fluency.dc.html": "/decks/unit-1-teaching/day-13.html",
  "/decks/classroom/U1 Day 14 - Action and Reaction.dc.html": "/decks/unit-1-teaching/day-14.html",
  "/decks/classroom/U1 Day 15 - Free Body Diagrams I.dc.html": "/decks/unit-1-teaching/day-15.html",
  "/decks/classroom/U1 Day 16 - Free Body Diagrams II.dc.html": "/decks/unit-1-teaching/day-16.html",
  "/decks/classroom/U1 Day 17 - Friction.dc.html": "/decks/unit-1-teaching/day-17.html",
  "/decks/classroom/U1 Day 18 - Equilibrium.dc.html": "/decks/unit-1-teaching/day-18.html",
  "/decks/classroom/U1 Day 19 - Workshop.dc.html": "/decks/unit-1-teaching/day-19.html",
  "/decks/classroom/U1 Day 20 - Synthesis.dc.html": "/decks/unit-1-teaching/day-20.html"
}

export function resolveDeckSrc(src: string): string {
 const split = src.search(/[?#]/)
 const pathname = split < 0 ? src : src.slice(0, split)
 let decoded: string
 try { decoded = decodeURI(pathname) } catch { return src }
 const legacy = UPDATED_DECKS[decoded] ?? decoded
 return (TEACHING_DECK_ALIASES[legacy] ?? UPDATED_DECKS[decoded] ?? pathname) + (split < 0 ? '' : src.slice(split))
}

/** Resolve each canonical Unit 1 lesson, including formerly shared lab/transfer files.
 * Old slide indices cannot be reused after a content rebuild. Only authored,
 * validated anchors move student follow mode; supplemental deck exercises stay on paper.
 * This changes the teacher deck at read time without rewriting any evidence blocks.
 */
export function withLessonPresentationDeck(document: BlockDocument, lesson: {unit_id?: string | null; slug?: string; lesson_number?: unknown}, track?: string | null): BlockDocument {
 const etf = etfDecks.find(deck=>deck.slug===lesson.slug && deck.unitId===lesson.unit_id && (lesson.lesson_number == null || lesson.lesson_number===deck.day))
 if(etf){
   document = withEtfWorkshopVisuals(document, etf.slug)
   // Add the authored deck at read time; keep every saved response block intact.
   const id=`deck-${etf.slug}`, existing=document.blocks.find(block=>block.type==='deck')
   if(existing && existing.id!==id)return document
   const deck={id,type:'deck' as const,src:etf.src,title:etf.title,navigation:'manual' as const}
   return {...document,blocks:existing?document.blocks.map(block=>block.id===id?deck:block):[deck,...document.blocks]}
 }
 if (lesson.unit_id !== 'unit-1' || !/^u1-d(?:0[1-9]|1[0-9]|2[0-2])$/.test(lesson.slug ?? '')) return document
 const day = Number(lesson.slug!.slice(-2))
 if (lesson.lesson_number != null && lesson.lesson_number !== day) return document
 const ref = deckForDay('unit-1', day, track)
 if (!ref) return document
 return {...document, blocks:[...document.blocks.map(block => {
   if (block.type !== 'deck' || block.id !== `deck-u1-d${String(day).padStart(2,'0')}`) return block
   // Deliberately drop the old index map: new prompt/solution pairs change its meaning.
   const updated = {...block, ...ref, navigation:'manual' as const, note:`${track === 'cpa' ? 'CPA' : 'Honors'} teaching edition. Authored anchors link matching lesson sections; additional practice is completed in the notebook.`}
   delete updated.slideMap
   return updated
 }), ...physicsExplainerBlocks().filter(b => !document.blocks.some(existing => existing.id === b.id))] }
}
