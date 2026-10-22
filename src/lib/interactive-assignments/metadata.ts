import {INVESTIGATIONS} from './investigation-definitions'
// Lightweight homepage titles; full learning content stays in catalog.ts.
export const ASSIGNMENT_METADATA=[
  ...INVESTIGATIONS.map(lab=>({slug:'simulation-'+lab.id,day:lab.day,title:lab.title+' · '+lab.question})),
  {slug:"simulation-race-track", day:3, title:"Race Track · A full lap. How far did you go?"},
  {
    "slug": "day-1-the-briefing",
    "day": 1,
    "title": "Day 1 · The Briefing"
  },
  {
    "slug": "day-2-motion-language",
    "day": 2,
    "title": "Day 2 · How Do We Talk About Motion"
  },
  {
    "slug": "day-3-velocity",
    "day": 3,
    "title": "Day 3 · Velocity: motion with direction"
  },
  {
    "slug": "day-4-velocity-time-vectors",
    "day": 4,
    "title": "Day 4 · Velocity-Time Graphs and Vectors"
  },
  {
    "slug": "day-5-predicting-position",
    "day": 5,
    "title": "Day 5 · Predicting the Position"
  },
  {
    "slug": "day-6-vectors",
    "day": 6,
    "title": "Day 6 · Vector Addition and Decomposition"
  },
  {
    "slug": "day-7-acceleration",
    "day": 7,
    "title": "Day 7 · Acceleration"
  },
  {
    "slug": "day-8-kinematics-problems",
    "day": 8,
    "title": "Day 8 · Constant Acceleration Problem-Solving"
  },
  {
    "slug": "day-9-inertia",
    "day": 9,
    "title": "Day 9 · Newton’s 1st Law - Inertia"
  },
  {
    "slug": "day-10-forces",
    "day": 10,
    "title": "Day 10 · Forces"
  },
  {
    "slug": "day-11-vary-mass",
    "day": 11,
    "title": "Day 11 · Newton’s 2nd Law - Vary Mass"
  },
  {
    "slug": "day-12-vary-force",
    "day": 12,
    "title": "Day 12 · Newton’s 2nd Law - Vary Force"
  },
  {
    "slug": "day-13-fma-practice",
    "day": 13,
    "title": "Day 13 · F equals ma in Practice"
  },
  {
    "slug": "day-14-third-law",
    "day": 14,
    "title": "Day 14 · Newton’s 3rd Law"
  },
  {
    "slug": "day-15-force-diagrams",
    "day": 15,
    "title": "Day 15 · Free Body Diagrams Part 1"
  },
  {
    "slug": "day-16-net-force",
    "day": 16,
    "title": "Day 16 · Free Body Diagrams Part 2 - Net Force"
  },
  {
    "slug": "day-17-friction",
    "day": 17,
    "title": "Day 17 · Friction"
  },
  {
    "slug": "day-18-equilibrium",
    "day": 18,
    "title": "Day 18 · Equilibrium"
  },
  {
    "slug": "day-19-workshop-revision",
    "day": 19,
    "title": "Day 19 · Workshop and Revision"
  },
  {
    "slug": "day-20-synthesis",
    "day": 20,
    "title": "Day 20 · Synthesis"
  }
] as const
export const assignmentMetadata=(slug:string)=>ASSIGNMENT_METADATA.find(a=>a.slug===slug)??null
