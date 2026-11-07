import type {LessonAssignment, LessonQuestion, LessonSection} from '../catalog'
import c from '@/data/foundations/day-fifteen-copy.json'
export const DAY_FIFTEEN_FOUNDATION='day-15-foundation-free-body-diagrams'
export const DAY_FIFTEEN_REVIEW='day-15-force-diagrams'
export const DAY_FIFTEEN_SEQUENCE='unit-1-day-15'
const target='u1.draw-fbd'
function question(id:string,part:number,prompt:string,explanation:string,hint:string,blooms:NonNullable<LessonQuestion['demand']>['blooms'],dok:1|2|3,diagram=false):LessonQuestion {
 return {id,part,diagram,prompt,explanation,hint,targets:[target],independent:part===4,demand:{blooms,dok,evidence:explanation}}
}
const sections:LessonSection[]=[
 {title:c.c1,stop:c.range1,learn:c.g10,questions:[question('f15-book',1,c.q1,c.a1,c.g10,'Apply',2,true)]},
 {title:c.c2,stop:c.range2,learn:c.g17,questions:[question('f15-release',2,c.q2,c.a2,c.g16,'Analyze',2),question('f15-ball',2,c.q3,c.a3,c.g5,'Analyze',2)]},
 {title:c.c3,stop:c.range3,learn:c.g23,questions:[question('f15-turn',3,c.q4,c.a4,c.g23,'Evaluate',3)]},
 {title:c.c4,stop:c.range4,learn:c.g27,questions:[question('f15-exit',4,c.q5,c.a5,c.g24,'Apply',2,true)]},
]
export const DAY_FIFTEEN_LESSON:LessonAssignment={slug:DAY_FIFTEEN_FOUNDATION,day:15,unit:'unit-1',foundation:'day-fifteen',title:c.title,minutes:50,targets:[target],targetNote:'Check that every arrow acts on the chosen object, names an external source, and has a direction and length supported by the model.',sections,questions:sections.flatMap(s=>s.questions),toolHref:'/interactive-assignments/'+DAY_FIFTEEN_FOUNDATION}
