import type { InteractiveQuestionBlock } from '@/data/content-blocks'
import type { InteractivePart, InteractiveTask } from '@/lib/interactive-question'
import { demand } from '@/lib/assessment-demand'
import { VIDEO_TRANSFERS } from '@/data/video-transfer-questions'
import { videoDesignQuestion } from './video-design-questions'

interface LessonQuestions {
  title: string
  concept: [string, [string,string,string,string], number, string]
  application: string
  numbers: [string,string,number,string][]
  model: string
  explain: string
}
/** Authored question sets, not conversions of the old open-response boxes. */
export const VIDEO_QUESTION_SETS: Record<string, LessonQuestions> = {
  Z1qFlfqlS_E: {
    title: 'What does a measurement tell us?',
    concept: ['A digital balance displays 24.6 g. Its display changes in steps of 0.1 g. Which report preserves the measured quantity and the supported precision?', ['The mass is 24.600 g.', 'The mass is 24.6 g.', 'The weight is 24.6 m.', 'The mass is 24.6, with no unit.'], 1, 'The balance measures mass in grams. Extra decimal places would claim information the display did not provide.'],
    application: 'A digital length sensor displays 6.40 cm. Its last displayed digit represents 0.01 cm. A student copies the reading as 6.4 cm and says nothing about the reported precision has changed.',
    numbers: [['digits','How many significant figures are recorded in 6.40 cm?',3,'significant figures']],
    model: 'Represent 6.40 cm and 6.4 cm on a place-value chart or in words. Identify the place of the last reported digit in each.',
    explain: 'Evaluate the student’s claim. Explain what stays equal and what information about reporting precision is lost. Do not claim that a display alone proves absolute accuracy.',
  },
  vf7X7mmJfsE: {
    title: 'What changes on a bend?',
    concept: ['A toy car follows a circular track at a constant speed of 2 m/s. Which statement describes its motion?', ['Its velocity is constant because its speed is constant.', 'Its position is constant because it returns each lap.', 'Its velocity changes direction, so it accelerates.', 'Its acceleration must point along its velocity.'],2,'Velocity has a direction. The direction changes around the circle even at steady speed.'],
    application: 'A toy car moves at 2 m/s for 6 s. During the first 3 s it follows a straight line; during the next 3 s it follows a curved track at the same speed.',
    numbers: [['distance','How much distance does the car travel during the entire 6 s?',12,'m']],
    model: 'Draw or describe two velocity arrows on the straight section and two on the bend. Use equal arrow lengths for equal speeds.',
    explain: 'Identify where velocity changes and where acceleration is nonzero. Explain why the total distance does not determine the final displacement.',
  },
  u0V8uJ5KTvo: {
    title: 'Distance or displacement?',
    concept: ['A cart moves along a line from x = −2 m to x = +7 m, then back to x = +3 m. Which pair describes the entire trip?', ['Distance 5 m; displacement +13 m.', 'Distance 13 m; displacement +3 m.', 'Distance 9 m; displacement −4 m.', 'Distance 13 m; displacement +5 m.'],3,'The two legs are 9 m and 4 m. Displacement uses only the endpoints: 3 − (−2) = +5 m.'],
    application: 'A robot starts at x = +2 m, travels to +11 m, and returns to −1 m. Right is positive.',
    numbers: [['distance','Find the total distance traveled.',21,'m'],['change','Find the signed displacement.',-3,'m']],
    model: 'Draw or describe the ordered stops on one labeled number line. Mark each leg and the start-to-finish arrow.',
    explain: 'Explain why the two answers differ and identify which would change if the robot added an out-and-back trip before ending at −1 m.',
  },
  djR8sAAi740: {
    title: 'Read the coordinates',
    concept: ['A lift moves from (2, −1, 3) m to (−2, 5, 3) m. Which displacement describes the move?', ['(−4, +6, 0) m', '(0, +4, +6) m', '(−2, +5, +3) m', '(+4, −6, 0) m'],0,'Subtract the initial coordinate from the final coordinate on each matching axis.'],
    application: 'A camera moves from (−1, 2, 4) m to (3, −4, 4) m. Positive x is east, positive y north, and positive z up.',
    numbers: [['x','Find the x-component of displacement.',4,'m'],['y','Find the y-component of displacement.',-6,'m']],
    model: 'Organize the initial and final coordinates by axis. Show the full three-component displacement, including z.',
    explain: 'Interpret the negative component and the zero component. Does zero change in z prove the camera never moved vertically between these readings? Explain.',
  },
  FshpPgPAeWM: {
    title: 'Locate the object',
    concept: ['Two objects are at (−6, 8) m and (6, −8) m relative to the same origin. Which comparison is correct?', ['They have the same position vector.', 'Both are 10 m from the origin but in different directions.', 'One is −10 m from the origin.', 'Both are 14 m from the origin.'],1,'The magnitudes are equal, but the signed components identify different locations.'],
    application: 'A locator places a package 8 m west and 15 m north of an origin. East is +x and north is +y.',
    numbers: [['magnitude','Find its distance from the origin.',17,'m']],
    model: 'Give its signed position components and a labeled sketch or direction description.',
    explain: 'Give another position with the same magnitude. Explain what information the scalar distance loses.',
  },
  'maoz-9mGWyk': {
    title: 'Separate position from motion',
    concept: ['An elevator is at y = −8 m and later at y = −3 m. Up is positive. Which statement follows from these readings?', ['Its position magnitude increased by 5 m.', 'It must have moved down throughout the interval.', 'Its net displacement is +5 m, while both positions are below the origin.', 'Its net displacement is −11 m.'],2,'The displacement is −3 − (−8) = +5 m. Negative coordinates locate the elevator below the origin.'],
    application: 'A cart is recorded at −9 m, then −4 m, then −7 m. Right is positive.',
    numbers: [['first','Find the displacement from the first reading to the second.',5,'m'],['second','Find the displacement from the second reading to the third.',-3,'m']],
    model: 'Mark all three positions on a number line and show the direction of each change.',
    explain: 'Use both changes to challenge the claim that a negative position means an object is moving left.',
  },
  YViTBR_aygk: {
    title: 'Use change over time',
    concept: ['At clock time 2 s a cart is at x = 3 m. At clock time 6 s it is at x = 15 m. What is its average velocity?', ['2 m/s', '2.5 m/s', '4.5 m/s', '3 m/s'],3,'Use (15−3)/(6−2), so both numerator and denominator are changes.'],
    application: 'A cart is at x = −2 m when the clock reads 4 s and at x = 18 m when the clock reads 9 s. Right is positive.',
    numbers: [['rate','Find its average velocity over the observed interval.',4,'m/s']],
    model: 'Label the initial and final values and calculate displacement and elapsed time separately.',
    explain: 'Explain the meaning of your result and why dividing 18 by 9 would answer a different question. State what the two readings cannot tell you about instantaneous velocity.',
  },
  hj8usnvYrRo: {
    title: 'Compare two averages',
    concept: ['A runner travels 60 m east and then 20 m west in 10 s total. East is positive. Which pair is correct?', ['Average speed 8 m/s; average velocity +4 m/s.', 'Average speed 4 m/s; average velocity +8 m/s.', 'Average speed 8 m/s; average velocity +8 m/s.', 'Average speed 4 m/s; average velocity −4 m/s.'],0,'Distance is 80 m; displacement is +40 m. Both averages use the same 10 s interval.'],
    application: 'A walker travels 90 m north, then 30 m south, in 30 s total. North is positive.',
    numbers: [['speed','Find average speed.',4,'m/s'],['velocity','Find average velocity.',2,'m/s']],
    model: 'Show which parts of the route contribute to distance and which endpoints determine displacement.',
    explain: 'Explain why the answers differ. Can either answer establish the walker’s speed at exactly 15 s? Defend your answer.',
  },
  fmjVsKsU9Sw: {
    title: 'Choose a readable scale',
    concept: ['Data extend from 0 to 4.2 s horizontally and 0 to 2.7 m vertically. There are 30 squares across and 20 up. Which pair of uniform scales fits all the data?', ['0.1 s/square and 0.1 m/square', '0.2 s/square and 0.2 m/square', '0.2 s/square and 0.1 m/square', '0.1 s/square and 0.2 m/square'],1,'The selected scales cover 6 s and 4 m. Each other pair leaves at least one axis too short.'],
    application: 'A graph uses 0.25 s per square horizontally and 0.20 m per square vertically. The origin is (0 s, 0 m). Locate the measured point (3.0 s, 1.4 m).',
    numbers: [['across','How many squares across is the point?',12,'squares'],['up','How many squares up is the point?',7,'squares']],
    model: 'Sketch or describe both labeled axes and the point. Keep the intervals uniform.',
    explain: 'A second graph uses twice as many seconds per square. Explain how the point’s horizontal placement changes and why the measured time does not change.',
  },
  lZIZ8jByakc: {
    title: 'Compare powers of ten',
    concept: ['Which normalized scientific-notation expression equals 0.00056 s?', ['56 × 10⁻⁵ s', '5.6 × 10⁴ s', '5.6 × 10⁻⁴ s', '0.56 × 10⁻³ s'],2,'All normalized coefficients must be at least 1 and less than 10; 5.6×10⁻⁴ restores the original value.'],
    application: 'Sensor A records 6 × 10⁻⁴ s. Sensor B records 3 × 10⁻³ s.',
    numbers: [['ratio','How many times longer is B’s recorded duration than A’s?',5,'times']],
    model: 'Rewrite the durations with a common exponent or as decimals and show your ratio.',
    explain: 'Explain why comparing 6 with 3 alone gives the wrong order. What does the negative exponent mean here?',
  },
  VQlq7_OtDF8: {
    title: 'Decode a prefix',
    concept: ['Which expression represents the same duration as 3.2 ms?', ['3.2 × 10³ s', '3.2 × 10⁻⁶ s', '320 s', '3.2 × 10⁻³ s'],3,'Milli means 10⁻³. The unit changes size while the physical duration stays the same.'],
    application: 'A sensor reports a delay of 4.5 ms. A second display must report that same delay in microseconds. Use milli = 10⁻³ and micro = 10⁻⁶.',
    numbers: [['micro','What number should the second display show?',4500,'µs']],
    model: 'Use seconds as an intermediate unit or write a ratio showing how many microseconds make a millisecond.',
    explain: 'Explain why the larger number is not a longer delay. Describe what would be wrong with replacing ms by Ms while keeping 4.5.',
  },
  SE8M273AKXw: {
    title: 'Cancel the units',
    concept: ['A vehicle travels at 72 km/h. Use 1 km = 1000 m and 1 h = 3600 s. Which value is equivalent?', ['20 m/s', '259.2 m/s', '72 000 m/s', '0.020 m/s'],0,'72×1000/3600 = 20; both distance and time units must be converted.'],
    application: 'A conveyor moves at 2.4 m/s. Its control panel requires a value in km/h. Use 1 km = 1000 m and 1 h = 3600 s.',
    numbers: [['speed','Enter the equivalent speed for the panel.',8.64,'km/h']],
    model: 'Write the conversion as a product of equal-quantity fractions and show which units cancel.',
    explain: 'Explain why the numerical value increases. Reverse your conversion to check that it describes the same motion.',
  },
  E0CpXzmViwQ: {
    title: 'Build a resultant',
    concept: ['A robot moves 5 m east, 12 m north, then 5 m west. Which resultant arrow describes its displacement?', ['22 m north', '12 m north', '13 m northeast', '0 m, because east and west cancel'],1,'The east and west components cancel, leaving the 12 m northward displacement.'],
    application: 'A route goes 9 m east and then 12 m north. A diagram uses one square for 3 m.',
    numbers: [['resultant','Find the magnitude of the resultant displacement.',15,'m']],
    model: 'Draw or describe the tip-to-tail route using the stated scale. Connect the original tail to the final tip and label the resultant direction.',
    explain: 'Compare the resultant with the 21 m path length. Explain which features change if the route is taken north first.',
  },
  'uH-NE-LlybM': {
    title: 'Keep matching components together',
    concept: ['A = (−2, 5) m and B = (8, 3) m. Which result gives A + B?', ['(−10, 2) m', '(6, 2) m', '(6, 8) m', '(10, 8) m'],2,'Add x to x and y to y, retaining each sign: (−2+8, 5+3) = (6,8).'],
    application: 'A = (−4, 6) m and B = (10, 2) m. East is +x and north is +y.',
    numbers: [['magnitude','Find the magnitude of A + B.',10,'m']],
    model: 'Calculate the two resultant components and draw or describe their quadrant.',
    explain: 'A student adds the magnitudes of A and B instead. Explain why that method is not valid for this pair. Identify a special arrangement where adding magnitudes would work.',
  },
  pwbD3H8R0BU: {
    title: 'Choose the vector product',
    concept: ['A = (2, 0) m and B = (0, 5) m. Positive z points out of the page. Which statement describes A·B and A×B?', ['Both are scalars equal to 10 m².', 'Both are zero.', 'The dot product is 10 m²; the cross product is zero.', 'The dot product is zero; the cross product is +10 m² in the z-direction.'],3,'Perpendicular vectors have zero dot product; x crossed with y points along positive z.'],
    application: 'Let A = (3, 2) m and B = (1, 4) m in the xy plane. Positive z points out of the page.',
    numbers: [['dot','Calculate A·B.',11,'m²'],['cross','Calculate the signed z-component of A×B.',10,'m²']],
    model: 'Show the component products used in each calculation. Identify which result is a scalar and which belongs to a vector.',
    explain: 'Predict what changes when the order becomes B·A and B×A, then check your prediction. Interpret the cross-product direction.',
  },
  B51oRJa9MSM: {
    title: 'Choose the correct travel report',
    concept: ['A student walks from −4 m to +6 m, then to +2 m. Right is positive. Which report is correct?', ['Distance 14 m; displacement +6 m.', 'Distance 6 m; displacement +14 m.', 'Distance 14 m; displacement +2 m.', 'Distance 10 m; displacement −4 m.'],0,'Add 10 m and 4 m for path length; subtract endpoints for the +6 m displacement.'],
    application: 'A camera moves along a rail from −5 m to +7 m and then to +1 m. Right is positive.',
    numbers: [['distance','Find its total travel.',18,'m'],['displacement','Find its signed displacement.',6,'m']],
    model: 'Show the two legs and the single start-to-finish displacement on a number line.',
    explain: 'Compare the purpose of a travel log for wear on the rail with a position-change report. Explain why each needs a different number.',
  },
}

const response = (id:string,label:string,prompt:string,hint?:string):InteractivePart => ({id,kind:'reasoning',label,prompt,...(hint?{hint}:{})})
export function videoInteractiveQuestions(youtubeId:string,targetId?:string):InteractiveQuestionBlock[] {
  const q=VIDEO_QUESTION_SETS[youtubeId], transfer=VIDEO_TRANSFERS[youtubeId], design=videoDesignQuestion(youtubeId,targetId)
  if(!q||!transfer||!design) throw Error(`Missing interactive questions for ${youtubeId}`)
  const wrap=(suffix:string,task:InteractiveTask):InteractiveQuestionBlock=>({id:`iq3-${youtubeId}-${suffix}`,type:'interactive_question',capture:true,targetId,task,demand:task.demand,workshop:{stage:task.title,pageBreakBefore:true}})
  return [
    wrap('concept',{title:q.title,format:'concept',prompt:q.concept[0],demand:youtubeId==='VQlq7_OtDF8'?demand('Remember',1,'Recall the SI prefix milli and its power of ten.'):demand('Understand',2,'Distinguish the relevant quantities or representations and reject a concrete misconception.'),parts:[{id:'choice',kind:'choice',label:'Choose the best answer',prompt:'Select one answer.',options:q.concept[1].map((text,i)=>({id:String.fromCharCode(65+i),text})),answer:String.fromCharCode(65+q.concept[2]),explanation:q.concept[3]}]}),
    wrap('apply',{title:'Model, calculate & explain',format:'application',prompt:q.application,demand:demand('Apply',2,'Represent the given situation, compute the requested quantities, and interpret the result.'),parts:[response('model','Model',q.model),...q.numbers.map(([id,prompt,answer,unit],i):InteractivePart=>({id,kind:'number',label:q.numbers.length===1?'Calculate':`Calculate ${i+1}`,prompt,answer,unit,tolerance:0.000001})),response('explain','Explain & check',q.explain)]}),
    {...wrap('transfer',{title:`Transfer · ${transfer.title}`,format:'transfer',prompt:`${transfer.scenario}\n\n**Your challenge:** ${transfer.question}`,demand:demand(['Z1qFlfqlS_E','YViTBR_aygk','hj8usnvYrRo','SE8M273AKXw','uH-NE-LlybM'].includes(youtubeId)?'Evaluate':'Analyze',3,'Connect a new context to the video model and justify a conclusion using scenario evidence.'),parts:transfer.steps.map((step,i)=>response(`transfer-${i+1}`,['Represent','Use evidence','Defend a conclusion'][i],step))}),note:`Teacher review guide: ${transfer.teacher}`},
    {...wrap('design',{title:'Design, test & defend',format:'design',prompt:design.prompt.split('\n\n**Build your response:**')[0],demand:design.demand,parts:[response('design','Build your model','Create the requested example. State your values, directions, units, and choices. Draw or describe a model that someone else could use.'),response('test','Test the constraints','Check each requirement in the challenge with a calculation, measurement plan, or explicit comparison. Show enough evidence to detect an error.'),response('defend','Defend & revise','Explain why your design works. Identify a plausible mistake or competing solution, test it against your evidence, and explain what you would revise if a constraint failed.')]}),note:design.note},
  ]
}
