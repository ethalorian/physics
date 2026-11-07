import type {LessonAssignment, LessonQuestion, LessonSection} from '../catalog'
import c from '@/data/foundations/day-sixteen-copy.json'
export const DAY_SIXTEEN_FOUNDATION='day-16-foundation-net-force-from-diagrams'
export const DAY_SIXTEEN_REVIEW='day-16-net-force'
export const DAY_SIXTEEN_SEQUENCE='unit-1-day-16'
const target='u1.net-force-from-fbd'
function question(id:string,part:number,prompt:string,explanation:string,hint:string,blooms:NonNullable<LessonQuestion['demand']>['blooms'],dok:1|2|3,diagram=false):LessonQuestion {
 return {id,part,diagram,prompt,explanation,hint,targets:[target],independent:part===4,demand:{blooms,dok,evidence:explanation}}
}
const sections:LessonSection[]=[
 {title:c.c1,stop:c.range1,learn:c.g11,questions:[question('f16-floor',1,c.q1,c.a1,c.g8,'Apply',2)]},
 {title:c.c2,stop:c.range2,learn:c.g16,questions:[question('f16-arrows',2,c.q2,c.a2,c.g9,'Apply',2,true),question('f16-slope',2,c.q3,c.a3,c.g14,'Analyze',2)]},
 {title:c.c3,stop:c.range3,learn:c.g20,questions:[question('f16-thrust',3,c.q4,c.a4,c.g10,'Evaluate',3)]},
 {title:c.c4,stop:c.range4,learn:c.g27,questions:[question('f16-exit',4,c.q5,c.a5,c.g26,'Analyze',2)]},
]
export const DAY_SIXTEEN_LESSON:LessonAssignment={slug:DAY_SIXTEEN_FOUNDATION,day:16,unit:'unit-1',foundation:'day-sixteen',title:c.title,minutes:50,targets:[target],targetNote:'Check the chosen axes, signed component sums, net force and acceleration. Look for direction, units and a distinction between motion and acceleration.',sections,questions:sections.flatMap(s=>s.questions),toolHref:'/interactive-assignments/'+DAY_SIXTEEN_FOUNDATION}
