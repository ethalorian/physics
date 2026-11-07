import type {LessonAssignment, LessonQuestion, LessonSection} from '../catalog'
import c from '@/data/foundations/day-eleven-copy.json'
export const DAY_ELEVEN_FOUNDATION='day-11-foundation-vary-mass'
export const DAY_ELEVEN_REVIEW='day-11-vary-mass'
export const DAY_ELEVEN_SEQUENCE='unit-1-day-11'
const target='u1.lab-accel-vs-mass'
function written(id:string,part:number,prompt:string,guide:string,hint:string,independent=false):LessonQuestion {
  return {id,part,prompt,explanation:guide,hint,independent,targets:[target],demand:{blooms:part===3?'Evaluate':'Analyze',dok:part===3?3:2,evidence:guide}}
}
const sections:LessonSection[]=[
 {title:c.c1,stop:c.range1,learn:c.g10,questions:[
  {id:'f11-control',part:1,prompt:c.q1,options:[c.o2,c.o1,c.o3],correct:1,explanation:c.g13,hint:c.g16,targets:[target],demand:{blooms:'Understand',dok:1,evidence:'Identifies a fair change in mass.'}},
  written('f11-predict',1,c.q2,c.a2,c.g14)]},
 {title:c.c2,stop:c.range2,learn:c.g17,questions:[written('f11-record',2,c.q3,c.g24,c.g28),written('f11-slope',2,c.q4,c.a4,c.g25)]},
 {title:c.c3,stop:c.range3,learn:c.g21,questions:[written('f11-evidence',3,c.q5,c.g22,c.g29)]},
 {title:c.c4,stop:c.range4,learn:c.g30,questions:[written('f11-exit',4,c.q6,c.a6,c.g14,true)]},
]
export const DAY_ELEVEN_LESSON:LessonAssignment={slug:DAY_ELEVEN_FOUNDATION,day:11,unit:'unit-1',foundation:'day-eleven',lab:true,title:c.labTitle,minutes:50,targets:[target],targetNote:'Use the four lab dimensions to judge the student’s prediction, sourced trials, slope reasoning, and transfer. Distinguish cart-only film data from whole-system measurements or model data.',sections,questions:sections.flatMap(s=>s.questions),toolHref:'/interactive-assignments/'+DAY_ELEVEN_FOUNDATION}
