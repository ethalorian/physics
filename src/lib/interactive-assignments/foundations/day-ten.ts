import type {LessonAssignment, LessonQuestion, LessonSection} from '../catalog'
import copy from '@/data/foundations/day-ten-copy.json'
export const DAY_TEN_FOUNDATION = 'day-10-foundation-forces'
export const DAY_TEN_REVIEW = 'day-10-forces'
export const DAY_TEN_SEQUENCE = 'unit-1-day-10'
const target = 'u1.identify-forces'
function written(id:string,part:number,prompt:string,explanation:string,independent=false):LessonQuestion {
  return {id,part,prompt,explanation,independent,hint:copy.h,targets:[target],demand:{blooms:'Analyze',dok:2,evidence:explanation}}
}
const sections:LessonSection[] = [
  {title:copy.c1,stop:'Slides 1–12',learn:copy.g3,questions:[
    {id:'f10-source',part:1,prompt:copy.q1,options:[copy.o1,copy.o2,copy.o3],correct:0,hint:copy.h,explanation:copy.b4,targets:[target],demand:{blooms:'Understand',dok:1,evidence:'Identifies gravity as an interaction with Earth.'}},
    written('f10-bag',1,copy.sensor,copy.sensorGuide),
  ]},
  {title:copy.c2,stop:'Slides 13–24',learn:copy.g6,questions:[written('f10-ramp',2,copy.q3,copy.b7),written('f10-weight',2,copy.qWeight,copy.aWeight)]},
  {title:copy.c3,stop:'Slides 25–33',learn:copy.g9,questions:[written('f10-contact',3,copy.q4,copy.r10)]},
  {title:copy.c4,stop:'Slide 34 · Independent',learn:copy.g11,questions:[written('f10-sign',4,copy.labExit,copy.exitGuide,true)]},
]
export const DAY_TEN_LESSON:LessonAssignment = {slug:DAY_TEN_FOUNDATION,day:10,unit:'unit-1',foundation:'day-ten',lab:true,title:copy.labTitle,minutes:50,targets:[target],targetNote:'Use the four lab dimensions for sourced trials, sign interpretation, clear diagrams and transfer to the car. Distinguish supplied from measured data.',sections,questions:sections.flatMap(s=>s.questions),toolHref:'/interactive-assignments/'+DAY_TEN_FOUNDATION}
