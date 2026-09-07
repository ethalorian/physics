/** Shared source decks, imported September 7, 2026. Open as standalone documents. */
export interface DeckRef { src: string; title: string }

const LESSON_DECKS: Record<string, Record<number, DeckRef>> = {
  "unit-1": {
    "1": {
      "src": "/decks/classroom/U1 Day 1 - The Briefing.dc.html",
      "title": "Day 1 — The Briefing"
    },
    "2": {
      "src": "/decks/classroom/U1 Day 2 - Talking About Motion.dc.html",
      "title": "Day 2 — Talking About Motion"
    },
    "3": {
      "src": "/decks/classroom/U1 Day 3 - Velocity.dc.html",
      "title": "Day 3 — Velocity"
    },
    "4": {
      "src": "/decks/classroom/U1 Day 4 - Velocity-Time Graphs and Vectors.dc.html",
      "title": "Day 4 — Velocity-Time Graphs and Vectors"
    },
    "5": {
      "src": "/decks/classroom/U1 Day 5 - The First Prediction.dc.html",
      "title": "Day 5 — The First Prediction"
    },
    "6": {
      "src": "/decks/classroom/U1 Day 6 - Vector Addition.dc.html",
      "title": "Day 6 — Vector Addition"
    },
    "7": {
      "src": "/decks/classroom/U1 Day 7 - Acceleration.dc.html",
      "title": "Day 7 — Acceleration"
    },
    "8": {
      "src": "/decks/classroom/U1 Day 8 - Choosing the Equation.dc.html",
      "title": "Day 8 — Choosing the Equation"
    },
    "9": {
      "src": "/decks/classroom/U1 Day 9 - Inertia.dc.html",
      "title": "Day 9 — Inertia"
    },
    "10": {
      "src": "/decks/classroom/U1 Day 10 - The Language of Force.dc.html",
      "title": "Day 10 — The Language of Force"
    },
    "11": {
      "src": "/decks/classroom/U1 Day 11 - Cart Lab I.dc.html",
      "title": "Day 11 — Cart Lab I"
    },
    "12": {
      "src": "/decks/classroom/U1 Day 12 - Cart Lab II.dc.html",
      "title": "Day 12 — Cart Lab II"
    },
    "13": {
      "src": "/decks/classroom/U1 Day 13 - F=ma Fluency.dc.html",
      "title": "Day 13 — F=ma Fluency"
    },
    "14": {
      "src": "/decks/classroom/U1 Day 14 - Action and Reaction.dc.html",
      "title": "Day 14 — Action and Reaction"
    },
    "15": {
      "src": "/decks/classroom/U1 Day 15 - Free Body Diagrams I.dc.html",
      "title": "Day 15 — Free Body Diagrams I"
    },
    "16": {
      "src": "/decks/classroom/U1 Day 16 - Free Body Diagrams II.dc.html",
      "title": "Day 16 — Free Body Diagrams II"
    },
    "17": {
      "src": "/decks/classroom/U1 Day 17 - Friction.dc.html",
      "title": "Day 17 — Friction"
    },
    "18": {
      "src": "/decks/classroom/U1 Day 18 - Equilibrium.dc.html",
      "title": "Day 18 — Equilibrium"
    },
    "19": {
      "src": "/decks/classroom/U1 Day 19 - Workshop.dc.html",
      "title": "Day 19 — Workshop"
    },
    "20": {
      "src": "/decks/classroom/U1 Day 20 - Synthesis.dc.html",
      "title": "Day 20 — Synthesis"
    },
    "21": {
      "src": "/decks/classroom/U1 Days 21-22 - Transfer Task.dc.html",
      "title": "Day 21 — Transfer Task"
    },
    "22": {
      "src": "/decks/classroom/U1 Days 21-22 - Transfer Task.dc.html",
      "title": "Day 22 — Transfer Task"
    }
  },
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
 'unit-1': { src: '/decks/classroom/Unit 1 - All Lesson Decks.dc.html', title: 'Unit 1 — All Lesson Decks' },
 'unit-2': { src: '/decks/classroom/Unit 2 - All Lesson Decks.dc.html', title: 'Unit 2 — All Lesson Decks' },
}

export function deckForDay(unit: string, day: number): DeckRef | null { return LESSON_DECKS[unit]?.[day] ?? null }

// Existing lesson blocks retain their stored paths. Multi-day legacy decks stay intact.
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

export function resolveDeckSrc(src: string): string {
 const split = src.search(/[?#]/)
 const pathname = split < 0 ? src : src.slice(0, split)
 let decoded: string
 try { decoded = decodeURI(pathname) } catch { return src }
 return (UPDATED_DECKS[decoded] ?? pathname) + (split < 0 ? '' : src.slice(split))
}
