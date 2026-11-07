import type {LessonAssignment, LessonQuestion, LessonSection} from '../catalog'
import c from '@/data/foundations/day-twelve-copy.json'
export const DAY_TWELVE_FOUNDATION='day-12-foundation-vary-force'
export const DAY_TWELVE_REVIEW='day-12-vary-force'
export const DAY_TWELVE_SEQUENCE='unit-1-day-12'
const target='u1.lab-accel-vs-force'
function written(id:string,part:number,prompt:string,guide:string,hint:string,independent=false):LessonQuestion {
  return {id,part,prompt,explanation:guide,hint,independent,targets:[target],demand:{blooms:part===3?'Evaluate':'Analyze',dok:part===3?3:2,evidence:guide}}
}
const sections:LessonSection[]=[
 {title:c.c1,stop:c.range1,learn:c.g10,questions:[
  {id:'f12-control',part:1,prompt:c.q1,options:[c.o2,c.o1,c.o3],correct:1,explanation:c.g13,hint:c.g16,targets:[target],demand:{blooms:'Understand',dok:1,evidence:'Identifies a force change at fixed total moving mass.'}},
  written('f12-predict',1,c.q2,c.a2,c.g14)]},
 {title:c.c2,stop:c.range2,learn:c.g20,questions:[written('f12-record',2,c.q3,c.g20,c.g25),written('f12-drive',2,c.q4,c.a4,c.g18)]},
 {title:c.c3,stop:c.range3,learn:c.g23,questions:[written('f12-evidence',3,c.q5,c.g22,c.g26)]},
 {title:c.c4,stop:c.range4,learn:c.g30,questions:[written('f12-exit',4,c.q6,c.a6,c.g14,true)]},
]
export const DAY_TWELVE_LESSON:LessonAssignment={slug:DAY_TWELVE_FOUNDATION,day:12,unit:'unit-1',foundation:'day-twelve',lab:true,title:c.labTitle,minutes:50,targets:[target],targetNote:'Use the four lab dimensions to judge the student’s prediction, sourced trials, slope reasoning, and transfer. Distinguish hanger weight, cart tension and whole-system net force. Keep calculated and collected evidence identifiable.',sections,questions:sections.flatMap(s=>s.questions),toolHref:'/interactive-assignments/'+DAY_TWELVE_FOUNDATION}
