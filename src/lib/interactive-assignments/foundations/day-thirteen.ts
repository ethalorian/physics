import type {LessonAssignment, LessonQuestion, LessonSection} from '../catalog'
import c from '@/data/foundations/day-thirteen-copy.json'
export const DAY_THIRTEEN_FOUNDATION='day-13-foundation-net-force'
export const DAY_THIRTEEN_REVIEW='day-13-fma-practice'
export const DAY_THIRTEEN_SEQUENCE='unit-1-day-13'
const target='u1.fma-solve-net-force'
function question(id:string,part:number,prompt:string,explanation:string,hint:string,blooms:NonNullable<LessonQuestion['demand']>['blooms'],dok:1|2|3):LessonQuestion {
 return {id,part,prompt,explanation,hint,targets:[target],independent:part===4,demand:{blooms,dok,evidence:explanation}}
}
const sections:LessonSection[]=[
 {title:c.c1,stop:c.range1,learn:c.g11,questions:[question('f13-sum',1,c.q1,c.a1,c.g10,'Analyze',2)]},
 {title:c.c2,stop:c.range2,learn:c.g16,questions:[question('f13-pull',2,c.q2,c.a2,c.g17,'Analyze',2),question('f13-mass',2,c.q3,c.a3,c.g19,'Apply',1)]},
 {title:c.c3,stop:c.range3,learn:c.g20,questions:[question('f13-brake',3,c.q4,c.a4,c.g22,'Analyze',2)]},
 {title:c.c4,stop:c.range4,learn:c.g27,questions:[question('f13-exit',4,c.q5,c.a5,c.g3,'Apply',2)]},
]
export const DAY_THIRTEEN_LESSON:LessonAssignment={slug:DAY_THIRTEEN_FOUNDATION,day:13,unit:'unit-1',foundation:'day-thirteen',title:c.title,minutes:50,targets:[target],targetNote:'Look for a signed sum of forces on one object, correct units, and a direction that agrees with the net force.',sections,questions:sections.flatMap(s=>s.questions),toolHref:'/interactive-assignments/'+DAY_THIRTEEN_FOUNDATION}
