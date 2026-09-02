// Conceptual Physics (Hewitt) — chapter map for the /textbook reader.
//
// Chapter files live in the PRIVATE `textbook` Supabase bucket as chNN.pdf and
// are served only through /api/textbook/[chapter] (session-gated). Titles were
// read off the chapter openers; part groupings follow the book's own table of
// contents so the sidebar reads like the printed TOC. Chapter 1 ("About
// Science") is not in the source folder, so it is intentionally absent.
//
// To (re)upload chapters: `npm run textbook:upload -- "/path/to/folder"`
// (see scripts/upload-textbook.ts).

export interface TextbookChapter {
  n: number
  title: string
}

export interface TextbookPart {
  part: string
  chapters: TextbookChapter[]
}

export const TEXTBOOK_TITLE = 'Conceptual Physics'
export const TEXTBOOK_BUCKET = 'textbook'

export const TEXTBOOK_PARTS: TextbookPart[] = [
  {
    part: 'Mechanics',
    chapters: [
      { n: 2, title: 'Mechanical Equilibrium' },
      { n: 3, title: "Newton's First Law of Motion—Inertia" },
      { n: 4, title: 'Linear Motion' },
      { n: 5, title: 'Projectile Motion' },
      { n: 6, title: "Newton's Second Law of Motion—Force and Acceleration" },
      { n: 7, title: "Newton's Third Law of Motion—Action and Reaction" },
      { n: 8, title: 'Momentum' },
      { n: 9, title: 'Energy' },
      { n: 10, title: 'Circular Motion' },
      { n: 11, title: 'Rotational Equilibrium' },
      { n: 12, title: 'Rotational Motion' },
      { n: 13, title: 'Universal Gravitation' },
      { n: 14, title: 'Satellite Motion' },
      { n: 15, title: 'Special Relativity—Space and Time' },
      { n: 16, title: 'Relativity—Momentum, Mass, Energy, and Gravity' },
    ],
  },
  {
    part: 'Properties of Matter',
    chapters: [
      { n: 17, title: 'The Atomic Nature of Matter' },
      { n: 18, title: 'Solids' },
      { n: 19, title: 'Liquids' },
      { n: 20, title: 'Gases' },
    ],
  },
  {
    part: 'Heat',
    chapters: [
      { n: 21, title: 'Temperature, Heat, and Expansion' },
      { n: 22, title: 'Heat Transfer' },
      { n: 23, title: 'Change of Phase' },
      { n: 24, title: 'Thermodynamics' },
    ],
  },
  {
    part: 'Sound and Light',
    chapters: [
      { n: 25, title: 'Vibrations and Waves' },
      { n: 26, title: 'Sound' },
      { n: 27, title: 'Light' },
      { n: 28, title: 'Color' },
      { n: 29, title: 'Reflection and Refraction' },
      { n: 30, title: 'Lenses' },
      { n: 31, title: 'Diffraction and Interference' },
    ],
  },
  {
    part: 'Electricity and Magnetism',
    chapters: [
      { n: 32, title: 'Electrostatics' },
      { n: 33, title: 'Electric Fields and Potential' },
      { n: 34, title: 'Electric Current' },
      { n: 35, title: 'Electric Circuits' },
      { n: 36, title: 'Magnetism' },
      { n: 37, title: 'Electromagnetic Induction' },
    ],
  },
  {
    part: 'Atomic and Nuclear Physics',
    chapters: [
      { n: 38, title: 'The Atom and the Quantum' },
      { n: 39, title: 'The Atomic Nucleus and Radioactivity' },
      { n: 40, title: 'Nuclear Fission and Fusion' },
    ],
  },
]

export const TEXTBOOK_CHAPTERS: TextbookChapter[] = TEXTBOOK_PARTS.flatMap((p) => p.chapters)

export function textbookChapter(n: number): TextbookChapter | undefined {
  return TEXTBOOK_CHAPTERS.find((c) => c.n === n)
}

/** Object key inside the `textbook` bucket for a chapter. */
export function textbookObjectPath(n: number): string {
  return `ch${String(n).padStart(2, '0')}.pdf`
}
