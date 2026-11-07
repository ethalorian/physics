import type {LessonAssignment, LessonQuestion, LessonSection} from '../catalog'
import c from '@/data/foundations/day-fourteen-copy.json'
export const DAY_FOURTEEN_FOUNDATION='day-14-foundation-action-reaction'
export const DAY_FOURTEEN_REVIEW='day-14-third-law'
export const DAY_FOURTEEN_SEQUENCE='unit-1-day-14'
const target='u1.third-law-pairs'
function question(id:string,part:number,prompt:string,explanation:string,hint:string,blooms:NonNullable<LessonQuestion['demand']>['blooms'],dok:1|2|3):LessonQuestion {
 return {id,part,prompt,explanation,hint,targets:[target],independent:part===4,demand:{blooms,dok,evidence:explanation}}
}
const sections:LessonSection[]=[
 {title:c.c1,stop:c.range1,learn:c.g9,questions:[question('f14-predict',1,c.q1,c.a1,c.g5,'Apply',2),question('f14-pair',1,c.q2,c.a2,c.g14,'Analyze',2)]},
 {title:c.c2,stop:c.range2,learn:c.g21,questions:[question('f14-readings',2,c.q3,c.a3,c.g25,'Apply',2)]},
 {title:c.c3,stop:c.range3,learn:c.g23,questions:[question('f14-revise',3,c.q4,c.a4,c.g21,'Evaluate',3),question('f14-impact',3,c.q5,c.a5,c.g12,'Analyze',2)]},
 {title:c.c4,stop:c.range4,learn:c.g30,questions:[question('f14-exit',4,c.q6,c.a6,c.g17,'Apply',2)]},
]
export const DAY_FOURTEEN_LESSON:LessonAssignment={slug:DAY_FOURTEEN_FOUNDATION,day:14,unit:'unit-1',foundation:'day-fourteen',lab:true,title:c.title,minutes:50,targets:[target],targetNote:'Use the four lab dimensions to assess the prediction, sourced paired readings, uncertainty, and transfer to the impact.',sections,questions:sections.flatMap(s=>s.questions),toolHref:'/interactive-assignments/'+DAY_FOURTEEN_FOUNDATION}
