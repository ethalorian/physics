import 'server-only'
import {mcasItem} from './bank'
import {mcasQuizQuestion} from './authoring'

// These are reviewable teaching drafts. Historical solutions below are independently
// worked teacher-draft guides, explicitly distinct from official DESE answer keys.
const definitions=[
  {id:'vectors-displacement',title:'MCAS · Vectors, distance & displacement',focus:'After position, vector direction, and distance versus displacement.',items:[
    ['2014-04','u1.vocab-position-distance-displacement','D','Teacher-draft solution: velocity includes both magnitude (90 km/hr) and direction (northeast); the other choices do not specify a vector. Award 1 point for D.'],
    ['2011-40','u1.vocab-position-distance-displacement','A','Teacher-draft solution: vectors include direction; both vectors and scalars can have magnitude and units. Award 1 point for A.'],
    ['2011-06','u1.vocab-position-distance-displacement','B','Teacher-draft solution: choose north as positive; 2.5 km − 1.0 km = 1.5 km north. Award 1 point for B.'],
    ['2014-29','u1.vocab-position-distance-displacement','C','Teacher-draft solution: the total distance is 6 km and final displacement is zero. Distance traveled is greater than the displacement magnitude. Award 1 point for C.'],
  ]},
  {id:'speed-velocity',title:'MCAS · Speed & velocity',focus:'After average speed, average velocity, elapsed time, and return trips.',items:[
    ['2016-05','u1.kinematics-language','D','Teacher-draft solution: average speed is a scalar with magnitude only; average velocity has magnitude and direction. Award 1 point for D.'],
    ['2015-20','u1.kinematics-language','D','Teacher-draft solution: total distance = 200 × 4.0 = 800 km. Average speed = 800 / 190 ≈ 4.2 km/min. Award 1 point for D.'],
    ['2024-14','u1.kinematics-language','',''],
    ['2013-32','u1.kinematics-language','','Teacher-draft rubric, 4 points: (a) 1200 m / 1080 s ≈ 1.11 m/s, or 66.7 m/min, with calculation and units (1); (b) equal average-velocity magnitudes but opposite directions: south outbound and north returning (1); (c) total distance 2400 m (1); (d) final displacement 0 m because the student returns to the starting position (1). Accept equivalent units and reasonable rounding.'],
  ]},
  {id:'motion-graphs',title:'MCAS · Reading position–time graphs',focus:'After graph scales, slope as velocity, and constant versus changing motion.',items:[
    ['2026-31','u1.capture-pt-graph','',''],
    ['2025-39','u1.capture-pt-graph','',''],
    ['2015-01','u1.capture-pt-graph','D','Teacher-draft solution: the position–time segment has a constant nonzero slope, so the car travels at constant speed. Award 1 point for D.'],
    ['2004-08','u1.capture-pt-graph','','Teacher-draft rubric, 4 points: (a) label time (s) horizontally and position (m) vertically with a consistent scale (1), and plot (0,75), (10,125), (20,175), (30,225), (40,275) on a straight line (1); (b) average speed = (275 − 75) m / 40 s = 5 m/s (1); (c) acceleration is zero because the velocity/slope remains constant (1).'],
  ]},
]
export function mcasPresets(){return definitions.map(p=>({id:p.id,title:p.title,focus:p.focus,questions:p.items.map(([suffix,targetSlug,key,guide])=>{const item=mcasItem('mcas-physics-'+suffix);if(!item)throw Error('Missing MCAS preset item');const q=mcasQuizQuestion(item);return {targetSlug,question:{...q,...(key?{correct_index:key.charCodeAt(0)-65}:{}),...(guide?{guide}: {})}}})}))}
