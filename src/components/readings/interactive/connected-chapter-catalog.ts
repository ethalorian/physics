import {frontierChapters} from './frontier-chapters'
import {modernChapters} from './modern-chapters'
import {nuclearChapters} from './nuclear-chapters'
import {quantumChapters} from './quantum-chapters'
import {foundationChapters} from './foundations-chapters'
import {magneticChapters} from './magnetism-chapters'
import {circuitChapters} from './circuits-chapters'
import {electrostaticChapters} from './electrostatics-chapters'
import {waveOpticsChapters} from './wave-optics-chapters'
import {opticsChapters} from './optics-chapters'
import { inertiaDefinition, inertiaLessons, newtonDefinition, newtonLessons } from './connected-chapters'
import { lightChapters } from './light-chapters'
import { waveChapters } from './wave-chapters'
import { thermalChapters } from './thermal-chapters'
import { matterFluidChapters } from './matter-fluid-chapters'
import { rotationChapters } from './rotation-chapters'
import { mechanicsChapters } from './mechanics-chapters'
import { motionChapters } from './motion-chapters'
import type { ConnectedChapter } from './lesson-contract'
export const CONNECTED_CHAPTERS: readonly ConnectedChapter[] = [
  {definition:inertiaDefinition,lessons:inertiaLessons,intro:{headline:['A world','in motion.'],invitation:'A coin keeps up with a moving train. A puck coasts across the ice. A loaded cart resists your push. Connect these experiences through inertia.',bigIdea:'Explain changes in motion by looking for a net force.',detail:'A force is an interaction. Inertia is a property. Velocity describes motion. Keep their roles distinct.'}},
  ...motionChapters,
  ...mechanicsChapters,
  ...rotationChapters,
  ...matterFluidChapters,
  ...thermalChapters,
  ...waveChapters,
  ...lightChapters,
  ...opticsChapters,
  ...waveOpticsChapters,
  ...electrostaticChapters,
  ...circuitChapters,
  ...magneticChapters,
  ...foundationChapters,
  ...quantumChapters,
  ...nuclearChapters,
  ...modernChapters,
  ...frontierChapters,
  {definition:newtonDefinition,lessons:newtonLessons,intro:{headline:['One system.','Three laws.'],invitation:'Before using an equation, decide what you are studying. Draw the interactions, combine the forces, and explain what happens to velocity.',bigIdea:'The system boundary comes before the equation.',detail:'Forces on the same system combine. Interaction partners act on different systems.'}},
]
export function connectedChapter(book:string,chapter:number) {return CONNECTED_CHAPTERS.find(c=>c.definition.book===book&&c.definition.chapter===chapter)}
