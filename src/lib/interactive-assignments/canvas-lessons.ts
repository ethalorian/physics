import {demand,type AssessmentDemand} from '@/lib/assessment-demand'
import type {LessonAssignment,LessonQuestion,LessonSection} from './catalog'

type Draft=Omit<LessonQuestion,'id'|'part'>
type Section=Omit<LessonSection,'questions'>&{questions:Draft[]}
const written=(prompt:string,explanation:string,blooms:AssessmentDemand['blooms']='Analyze',dok:AssessmentDemand['dok']=2):Draft=>({prompt,explanation,hint:'Name the conditions and use measurements with units to support your reasoning.',demand:demand(blooms,dok,explanation)})
const number=(prompt:string,answer:number,unit:string,explanation:string,tolerance=.03):Draft=>({...written(prompt,explanation,'Apply',2),answer,unit,tolerance})
const choice=(prompt:string,options:string[],correct:number,explanation:string,blooms:AssessmentDemand['blooms']='Understand'):Draft=>({...written(prompt,explanation,blooms,1),options,correct})
const prediction=(prompt:string):Section=>({title:'Predict before you test',stop:'Predict',learn:'Your avatar is the investigator. Make a prediction with a reason, then use the model to find evidence. Predictions are diagnostic, not scored right or wrong.',questions:[{...written(prompt,'A prediction and an initial physical explanation; compare with the later evidence.','Understand',2),reflection:true}]})
const investigate=(learn:string,questions:Draft[]):Section=>({title:'Run, record & compare',stop:'Investigate',learn:learn+' Open Change trial conditions. Run each trial to the end, then Record observation before resetting. Compare the saved observations in Notebook.',questions})
const transfer=(learn:string,questions:Draft[]):Section=>({title:'Apply it to a new situation',stop:'Independent transfer',learn,questions:questions.map(q=>({...q,independent:true,hint:''}))})
function lesson(id:string,title:string,unit:LessonAssignment['unit'],day:number,targets:string[],sections:Section[]):LessonAssignment{
 const complete=sections.map((section,i)=>({...section,questions:section.questions.map((q,j)=>({...q,id:`${i+1}${String.fromCharCode(97+j)}`,part:i+1,targets}))}))
 return {slug:'simulation-'+id,simulation:id,title,unit,day,targets,minutes:25,investigationGroup:id==='dart-deflection'?'Mission':id==='riverboat-crossing-3d'?'Vectors':id==='picket-fence-g'?'Measurement':'Forces',toolHref:'/simulations/'+id,sections:complete,questions:complete.flatMap(s=>s.questions),targetNote:'Review predictions, controlled observations, independent transfer and the extended design–test–revise investigation separately. Simulation completion is not a mastery rating. Saved observations are student evidence, not an automatically verified answer key.'}
}

// The common design sequence appends the existing extended DOK 4 investigation.
// Existing assignments and their question IDs are untouched.
export const CANVAS_ASSIGNMENTS:LessonAssignment[]=[
 lesson('cart-collisions','Cart Collisions · What survives a collision?','unit-3',7,['u3.k4-collision-types','u3.s2-inelastic-solve'],[
  prediction('Two 1 kg carts: A moves at +2 m/s and B is at rest. Predict the final velocities if they bounce elastically, then if they stick. Which total quantities should stay the same?'),
  investigate('Set both masses to 1 kg, A velocity +2 m/s and B velocity 0 m/s. Compare bounciness e = 1, 0.5 and 0. Keep all other settings fixed. Positive is right. Read cart velocities from the graph or trial data.',[
   choice('Which expression defines the signed total momentum of these two carts?',['m₁v₁ + m₂v₂','½m₁v₁² + ½m₂v₂²','m₁v₁ − m₂v₂, regardless of direction'],0,'Add each mass times its signed velocity.','Remember'),
   number('Before each collision, what is the total momentum?',2,'kg·m/s','1×2 + 1×0 = +2 kg·m/s.'),
   written('Compare total momentum and kinetic energy before and after all three collisions. Cite the recorded numbers. Classify each collision and explain where reduced kinetic energy can go.','Momentum is +2 throughout. Initial KE is 2 J; final KE is 2, 1.25 and 1 J for e = 1, 0.5 and 0. Elastic, inelastic and perfectly inelastic respectively. Other energy forms include deformation, thermal energy and sound.'),
   written('A classmate says momentum is conserved only when the carts bounce. Use your three trials to judge that claim. State the system boundary and the external-impulse assumption.','Use the two-cart system and all three momentum comparisons. Negligible external impulse permits momentum conservation even when kinetic energy decreases.','Evaluate',3),
  ]),
  transfer('Two different carts stick: 2 kg at +3 m/s and 1 kg at −2 m/s. Solve before testing those settings.',[
   number('Find their common final velocity.',4/3,'m/s','Total momentum = 6 − 2 = 4 kg·m/s; divide by 3 kg.'),
   written('Calculate initial and final kinetic energy. Explain why losing kinetic energy does not contradict conservation of momentum.','Initial KE = 11 J; final KE = 8/3 J. The signed total momentum stays +4 kg·m/s while energy changes form.'),
  ]),
 ]),
 lesson('impulse-momentum','Impulse & Momentum · Design a gentler stop','unit-3',4,['u3.k2-impulse-theorem','u3.r1-extend-time'],[
  prediction('A 1 kg cart approaches at 3 m/s and rebounds at half that speed. Predict what doubling the bumper contact time changes: impulse, peak force, or both. Explain.'),
  investigate('Use mass 1 kg, impact speed 3 m/s and rebound e = 0.5. Compare contact times 50, 100 and 200 ms. The model displays impulse and momentum-change magnitudes; take the incoming direction as positive in your signed calculations. The ideal force pulse is a half-sine curve.',[
   choice('Impulse is represented on a force–time graph by its…',['slope','signed area','maximum height alone'],1,'The time integral of force is impulse.'),
   number('What is the signed momentum change if the cart goes from +3 to −1.5 m/s?',-4.5,'kg·m/s','Δp = m(vf − vi) = 1(−1.5 − 3) = −4.5 kg·m/s.'),
   written('Compare the three pulse areas and peak forces with units. Explain how the same impulse can accompany different peak forces.','Each area magnitude is 4.5 N·s. Peaks are approximately 141.37, 70.69 and 35.34 N. A wider half-sine pulse needs a lower peak for the same area.'),
   written('Would a lower peak force alone prove a safer real collision? Use your controlled comparison, then name an omitted feature that could matter.','At fixed mass, incoming speed and rebound, extending the pulse lowers peak force. Injury or damage also depends on details such as force distribution, material and available stopping distance.','Evaluate',3),
  ]),
  transfer('A 2 kg cart is brought from +4 m/s to rest in 0.20 s. This question asks for average force, not peak force.',[
   number('Find the signed impulse.',-8,'N·s','Δp = 2(0 − 4) = −8 kg·m/s.'),
   number('Find the signed average stopping force.',-40,'N','Favg = −8 / 0.20 = −40 N.'),
   written('If the same cart instead rebounds at −4 m/s in the same time, explain how the impulse and average force change.','Both magnitudes double: Δp = −16 N·s and Favg = −80 N. Reversing motion requires a greater momentum change than stopping.'),
  ]),
 ]),
 lesson('dart-deflection','Kinetic Impactor · Test a deflection plan','unit-3',15,['u3.r3-deflection'],[
  prediction('If the same impactor strikes the same asteroid twice as early, predict what changes in asteroid Δv and the modeled miss distance. Explain using momentum and motion.'),
  investigate('Use asteroid diameter 300 m, impactor mass 20,000 kg, speed 10 km/s and momentum boost β = 3.6. Compare lead times 10, 20 and 40 years. This classroom model assumes a spherical asteroid of density 3,500 kg/m³, a transverse impulse and constant subsequent Δv. It is not an orbital impact forecast.',[
   choice('In this model, asteroid velocity change is…',['βmv / M','½mv² / M','M / (βmv)'],0,'Momentum given is βmv; divide by asteroid mass M.'),
   number('Calculate the momentum delivered by the stated impactor. Convert km/s to m/s.',720000000,'kg·m/s','3.6×20,000×10,000 = 720,000,000 kg·m/s.',1),
   written('Compare the three lead-time trials. Which results change and which stay fixed? Support the relationship with your recorded values.','Δp, asteroid mass and Δv stay fixed. Miss distance is proportional to lead time, so 20 and 40 years give twice and four times the 10-year distance.'),
   written('Judge the claim “A modeled miss means this mission will certainly protect Earth.” Use one result and two model assumptions to explain the limits of that conclusion.','A positive modeled clearance is conditional on the simplified transverse impulse and constant-velocity propagation, the assumed mass and β, and an initially central encounter. Real orbits and uncertainties require additional analysis.','Evaluate',3),
  ]),
  transfer('A fictional 1×10¹⁰ kg asteroid receives 5×10⁷ kg·m/s of transverse momentum. Use 3.15576×10⁷ seconds per year and ignore gravity in this estimate.',[
   number('Find the asteroid velocity change.',.005,'m/s','Δv = Δp/M = 0.005 m/s.',.00001),
   number('Estimate the sideways displacement after 10 years.',1577.88,'km','0.005×10×3.15576e7 / 1000 = 1577.88 km.',.1),
   written('At unchanged density, doubling asteroid diameter multiplies mass by eight. Explain what this does to Δv and displacement for the same impactor and lead time.','Both fall to one eighth because mass grows with diameter cubed. A larger target needs more momentum or more lead time to obtain the same displacement.'),
  ]),
 ]),
 lesson('riverboat-crossing-3d','Riverboat Crossing · Heading is not the path','unit-1',6,['u1.vectors-tip-to-tail'],[
  prediction('Your avatar plans a crossing of a 100 m wide river. The boat travels at 5 m/s through the water, aimed straight across, while the current is 2 m/s downstream. Predict whether the bow and actual path point in the same direction.'),
  investigate('Set boat speed 5 m/s and heading 90° (straight across). Compare currents 0, 1 and 2 m/s. Run each crossing without changing its conditions. Switch between the chase camera and top-down map to compare heading and path; camera choice does not change the physics.',[
   choice('Which vector sum gives the boat velocity relative to the bank?',['Boat relative to water + water relative to bank','Boat relative to water − water relative to bank','The direction of the bow alone'],0,'Relative velocities add with their directions.'),
   number('At heading 90° and speed 5 m/s, how long does a 100 m crossing take?',20,'s','Across component is 5 m/s; t = 100/5 = 20 s.',.1),
   written('Compare downstream drift and crossing time at all three currents. Why can drift change while crossing time remains the same?','Crossing time stays approximately 20 s; downstream drift is approximately 0, 20 and 40 m. The current changes only the downstream component.'),
   written('Return current to 2 m/s. Compare headings 60°, 65° and 90°. Choose the tested heading that lands closest to the target dock and defend the choice using drift and crossing time.','At 65°, downstream velocity is about −0.113 m/s and drift about −2.50 m; at 60°, drift about −11.55 m; at 90°, drift +40 m. 65° is closest among these tested headings, but not exactly zero drift. Aiming upstream reduces the across component and increases time.','Evaluate',3),
  ]),
  transfer('A boat travels at 4 m/s through still water, aimed straight across a 120 m river. A uniform current of 3 m/s flows downstream.',[
   number('Find the crossing time.',30,'s','t = 120/4 = 30 s.'),
   number('Find the downstream drift.',90,'m','Drift = 3×30 = 90 m.'),
   written('Find the speed over ground and explain why dividing river width by that speed gives an incorrect crossing time.','Resultant speed is √(4²+3²) = 5 m/s. Only the 4 m/s across component reduces the distance to the far bank; the ground path is longer than the width.'),
  ]),
 ]),
 lesson('picket-fence-g','Photogate · Find gravity in the graph','unit-2',3,['u2.free-fall-g'],[
  prediction('Two strips with the same band spacing but masses 50 g and 150 g fall through a photogate. Predict whether their velocity–time slopes differ in an ideal model without air resistance.'),
  investigate('Use band spacing 5 cm and release height 10 cm. Compare strip masses 50, 100 and 150 g. Then keep mass 50 g and compare release heights 10 and 30 cm. Each interval’s velocity is spacing divided by interval time, plotted at the interval midpoint. Inspect the graph and trial data.',[
   choice('On a velocity–time graph, constant gravitational acceleration is represented by…',['the line’s slope','the first point’s height','the area under the line'],0,'Acceleration is change in velocity per unit time.'),
   number('A 5 cm interval passes the gate in 0.025 s. What is its average velocity magnitude?',2,'m/s','0.05 m / 0.025 s = 2 m/s.'),
   written('Compare measured slopes across the three masses. Then describe how raising release height changes the velocity values without changing the slope. Cite your observations.','Ideal slopes remain 9.8 m/s². A higher release makes the strip reach the gate faster, while acceleration remains g. The ideal model has no measurement noise or drag.'),
   written('Does exactly matching 9.8 in every simulation run establish the precision of a real photogate? Explain and propose one real measurement check.','No: the ideal model generates exact constant-g timing. Real checks include spacing calibration, gate alignment or timing resolution; repeated deterministic runs do not establish experimental uncertainty.','Evaluate',3),
  ]),
  transfer('In a new experiment, downward velocity is 1.40 m/s at 0.10 s and 3.36 m/s at 0.30 s. Take downward as positive.',[
   number('Find the average acceleration between those measurements.',9.8,'m/s²','(3.36−1.40)/(0.30−0.10) = 9.8 m/s².'),
   written('Would those two points alone prove acceleration was constant throughout the interval? Explain what additional evidence you would collect.','Two points give an average rate. Collect intermediate velocity measurements and inspect residuals from a linear fit, considering measurement uncertainty.'),
  ]),
 ]),
]
