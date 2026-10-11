const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const ids={position:'fc67d63d-a011-426b-b9f3-fd8f1ea7f501',foundations:'af2fb3d2-bd76-4afd-aac5-a0c9eecb0802',intro:'eaa95227-1bc7-41e8-af7c-192bdedc8303'};
const target='u1.vocab-position-distance-displacement';
const baseSource='fe529665-a1df-4f80-a5cc-df0d09b95210';
const frames=(text,words,visual)=>({visual:{src:visual,alt:'A labeled diagram supporting this physics question.'},frames:[{level:1,text},{level:2,text},{level:3,text:'My evidence is ___, which means ___.'}],wordBank:words,modes:['text','sketch']});
const stage=(name)=>({stage:name,pageBreakBefore:true});
const prose=(id,markdown,name)=>({id,type:'prose',markdown,...(name?{workshop:stage(name)}:{})});
const video=(id,title,youtubeId,summary)=>({id,type:'instruction_video',title,youtubeId,summary,workshop:stage('Learn')});
const picture=(id,src,alt)=>({id,type:'figure',src,alt});
const geo='/learning/position-line.svg';
const precision='/learning/measurement.svg';
const acceleration='/learning/acceleration.svg';
const newTargets=[
 {slug:'foundations.units-quantities',statement:'I can distinguish a physical quantity from its unit and report a measurement with a number and an appropriate unit.',domain:'knowledge',content_strand:'foundations',order_index:0},
 {slug:'foundations.measurement-precision',statement:'I can report measured and calculated quantities with precision supported by the measurements.',domain:'skill',content_strand:'foundations',order_index:0},
 {slug:'u1.kinematics-language',statement:'I can explain how position, velocity, and acceleration describe motion, including changes in direction.',domain:'knowledge',content_strand:'motion-kinematics',order_index:0},
];
const check=(id,targetId,prompt,options,correctOptionId)=>({id,type:'question',capture:true,targetId,evidenceRole:'practice',question:{prompt,options:options.map(([id,text,feedback])=>({id,text,feedback})),correctOptionId},workshop:stage('Check your thinking')});
const lessons=[
 {id:ids.position,slug:'position-and-displacement',title:'Position & displacement',unit_id:'unit-1',unit:'Unit 1: Motion & Forces (Asteroid 2026-XJ)',lesson_number:102,estimated_time:16,published:true,lesson_type:'video',description:'Choose a reference point, compare distance and displacement, and explain the sign of a change in position.',objectives:[target],videos:[{id:'position-video',title:'1D Position & Displacement on a Number Line',youtubeId:'u0V8uJ5KTvo'}],content_blocks:{schemaVersion:1,presentation:'physics-path',dayType:'STANDARD',learningPath:{version:1,kind:'lesson',focus:'Describe where an object is and how its position changes. Compare distance and displacement, and distinguish scalars from vectors.',targetSlugs:[target],sourceLessonId:baseSource},blocks:[
   video('position-video','Position & displacement on a number line','u0V8uJ5KTvo','Position is a location relative to a chosen origin. In this lesson, right is positive. Displacement is final position minus initial position: $\\Delta x=x_f-x_i$. Distance adds the lengths of all parts of a journey. A negative displacement tells you a direction; it is not a negative distance.'),
   prose('position-language','**Position** describes a location. **Displacement** describes a change in location.\n\nA **scalar** has magnitude only: distance is a scalar. A **vector** has magnitude and direction: displacement is a vector. In one dimension, the sign tells you the direction.'),
   check('position-check',target,'A cart returns to where it started. Which statement must be true?',[
    ['zero-displacement','Its displacement is zero.','Displacement compares final and initial position. The path can still have a nonzero length.'],
    ['zero-distance','Its distance traveled is zero.','Distance adds the lengths traveled. Returning does not erase the outward trip.'],
    ['negative-distance','Its distance is negative on the return trip.','Distance is a nonnegative length. A direction can make displacement negative, not distance.']
   ],'zero-displacement'),
   prose('position-model-title','Choose right as positive. A cart starts at −2 m, travels to +4 m, then returns to +1 m.','See it worked'),
   picture('position-example-diagram',geo,'Number line showing the path from minus 2 meters to plus 4 meters, then back to plus 1 meter.'),
   {id:'position-worked',type:'worked_example',prompt:'Find the total distance and the displacement for the trip.',given:'Initial: −2 m. Turn: +4 m. Final: +1 m.',equation:'$\\Delta x=x_f-x_i$; distance = sum of segment lengths.',work:'First segment: $|4-(-2)|=6$ m. Return segment: $|1-4|=3$ m.\n\nDistance: $6+3=9$ m.\n\nDisplacement: $1-(-2)=+3$ m.',answer:'Distance = 9 m. Displacement = +3 m: 3 m to the right. The return trip increases distance while reducing the final displacement.'},
   prose('position-explore-title','Change one position at a time. Try an out-and-back trip, then try moving only to the left.','Explore'),
   {id:'position-explorer',type:'position_explorer',title:'Distance and displacement explorer'},
   prose('position-practice-title','Use a new trip. Show your reasoning; the example above uses different numbers.','Try it'),
   picture('position-practice-diagram','/learning/position-practice.svg','A number line from minus 8 to plus 8 meters, with a cart starting at plus 6 and finishing at minus 2.'),
   {id:'position-practice',type:'gewa',targetId:target,prompt:'A cart moves directly from +6 m to −2 m. Find its displacement and distance traveled. State the direction of its displacement.',givenHint:'Record the initial and final positions with their signs.',equationHint:'Displacement = final position − initial position. Distance is the length traveled.',sei:frames('The displacement is ___ m because ___. The distance is ___ m.',['initial','final','negative','left','distance','displacement'],'/learning/position-practice.svg')},
   prose('position-explain-title','Explain the idea without another calculation.','Explain'),
   {id:'position-explain',type:'exit_ticket',targetId:target,prompt:'An object travels away from its starting point and comes back. Explain why its displacement can be zero while its distance is not. Identify which quantity is a scalar and which is a vector.',sei:frames('The displacement is ___ because ___. The distance is ___ because ___.',['start','finish','path','scalar','vector'],geo)},
   {id:'position-reading',type:'reading',chapter:5,sectionIds:['5.1'],focus:'Read section 5.1 on page 69. Use the distinction between scalars and vectors to explain distance and displacement. Answer the three checks in your own words, then submit for teacher review.',essential:true,workshop:{stage:'Read & respond',pageBreakBefore:true},assignmentChecks:[
    {reference:'1 · Explain the distinction',prompt:'What information does a vector include that a scalar does not? Use distance and displacement as your examples.',targetId:target},
    {reference:'2 · Apply the idea',prompt:'A student walks 3 m east, then 3 m west. Find the total distance and displacement. Explain why the two answers differ, and identify which quantity is a scalar and which is a vector.',targetId:target},
    {reference:'3 · Evaluate a claim',prompt:'A classmate says, “If displacement is zero, the object could not have moved.” Do you agree? Use a possible trip to support your reasoning.',targetId:target}
   ]},
   prose('position-transfer-title','**Fictional training data for 2026-XJ.** This is a one-dimensional coordinate model, not a claim about the asteroid’s real orbit.','Apply to 2026-XJ'),
   picture('position-mission-diagram','/learning/asteroid-position.svg','Earth at the origin. Two fictional asteroid positions on the same axis: plus 12 million kilometers and plus 9 million kilometers.'),
   {id:'position-transfer',type:'exit_ticket',targetId:target,prompt:'Along a chosen axis, Earth is at 0. The asteroid’s position changes from +12 million km to +9 million km. Report its displacement and explain the sign. Can those two positions alone tell you its total distance traveled? Explain.',evidenceRole:'exit',sei:frames('Its displacement is ___ million km. The sign means ___. The two positions [do / do not] determine distance because ___.',['reference','toward','initial','final','path'],'/learning/asteroid-position.svg')},
   {id:'position-vocabulary',type:'vocab',terms:[{term:'position',definition:'Location relative to a chosen origin.',cognate:'ES posición · PT posição'},{term:'displacement',definition:'Final position minus initial position; a vector.',cognate:'ES desplazamiento · PT deslocamento'},{term:'distance',definition:'Total length traveled; a scalar.',cognate:'ES distancia · PT distância'},{term:'vector',definition:'A quantity with magnitude and direction.',cognate:'ES vector · PT vetor'}],referencePanel:true},
 ]}},
 {id:ids.foundations,slug:'units-quantities-and-precision',title:'Units, quantities & precision',unit_id:'unit-1',unit:'Unit 1: Motion & Forces (Asteroid 2026-XJ)',lesson_number:100,estimated_time:14,published:true,lesson_type:'video',description:'Give measurements meaning with quantities and units, then report only the precision your measurements support.',objectives:['foundations.units-quantities','foundations.measurement-precision'],videos:[{id:'foundations-video',title:'Units, Physical Quantities & Significant Figures',youtubeId:'Z1qFlfqlS_E'}],content_blocks:{schemaVersion:1,presentation:'physics-path',dayType:'STANDARD',learningPath:{version:1,kind:'lesson',focus:'Report a physical quantity with a useful unit and precision supported by the measurement.',targetSlugs:['foundations.units-quantities','foundations.measurement-precision'],sourceLessonId:baseSource},blocks:[
 video('foundations-video','Units, quantities & significant figures','Z1qFlfqlS_E','A physical quantity is something measurable, such as length or time. A unit is the agreed reference used to express it, such as the meter or second. A useful measurement includes a numerical value and unit. Significant figures communicate measurement precision. Keep extra digits during a calculation and round the reported result at the end.'),
 check('foundations-check','foundations.units-quantities','In the measurement “2.40 s,” which is the physical quantity?',[
  ['time','Time','Time is the property being measured; seconds are the unit.'],
  ['seconds','Seconds','Seconds are the unit used to express the measured quantity, time.'],
  ['number','2.40','2.40 is the numerical value. The quantity names what was measured.']
 ],'time'),
 prose('foundations-model','A rectangular card measures 12.4 cm by 3.2 cm. We want its area.','See it worked'),
 picture('foundations-figure',precision,'A rectangle labeled 12.4 centimeters long and 3.2 centimeters wide.'),
 {id:'foundations-worked',type:'worked_example',prompt:'Calculate and report the area of the card.',given:'Length = 12.4 cm; width = 3.2 cm.',equation:'$A=lw$',work:'$A=(12.4\\,\\mathrm{cm})(3.2\\,\\mathrm{cm})=39.68\\,\\mathrm{cm^2}$.\n\nThe measured width has two significant figures. For this multiplication, report two significant figures.',answer:'$A=4.0\\times10^1\\,\\mathrm{cm^2}$. Writing 4.0 × 10¹ makes the two significant figures clear.'},
 prose('foundations-try','Name the quantity, the numerical value, and the unit separately.','Try it'),
 {id:'foundations-quantity',type:'exit_ticket',targetId:'foundations.units-quantities',prompt:'A sensor reports a travel time of 2.40 s. Identify the physical quantity, numerical value, and unit. Explain why “2.40” alone is incomplete.',sei:frames('The quantity is ___. The value is ___. The unit is ___.',['time','second','value','measurement'],precision)},
 prose('foundations-precision-title','Calculate first, then decide how to report the result.','Use the precision'),
 {id:'foundations-practice',type:'gewa',requireCompleteWork:true,targetId:'foundations.measurement-precision',prompt:'A different card measures 8.6 cm by 2.3 cm. Calculate its area, report it with appropriate significant figures, and explain your rounding.',givenHint:'Both lengths are measured values.',equationHint:'Area = length × width.',sei:frames('The unrounded area is ___. I report ___ because ___.',['area','square centimeters','two','significant figures'],'/learning/measurement-practice.svg')},
 prose('foundations-report-title','A calculator can display more digits than a measurement supports.','Explain'),
 {id:'foundations-exit',type:'exit_ticket',targetId:'foundations.measurement-precision',prompt:'A classmate reports the first card’s area as 39.680000 cm². Explain what is misleading about that report and how you would fix it.',sei:frames('The extra digits suggest ___. I would report ___ because ___.',['precision','measurement','calculated','round'],precision)},
 {id:'foundations-vocab',type:'vocab',terms:[{term:'quantity',definition:'A measurable property.',cognate:'ES cantidad · PT quantidade'},{term:'unit',definition:'An agreed reference for expressing a quantity.',cognate:'ES unidad · PT unidade'},{term:'precision',definition:'The detail supported by a measurement.',cognate:'ES precisión · PT precisão'}],referencePanel:true},
 ]}},
 {id:ids.intro,slug:'kinematics-the-language-of-motion',title:'Kinematics: the language of motion',unit_id:'unit-1',unit:'Unit 1: Motion & Forces (Asteroid 2026-XJ)',lesson_number:101,estimated_time:8,published:true,lesson_type:'video',description:'Meet position, velocity, and acceleration—and see why describing motion comes before explaining it.',objectives:['u1.kinematics-language'],videos:[{id:'kinematics-video',title:'What Is Kinematics? The Language of Motion',youtubeId:'vf7X7mmJfsE'}],content_blocks:{schemaVersion:1,presentation:'physics-path',dayType:'STANDARD',learningPath:{version:1,kind:'lesson',focus:'Explain what kinematics describes. Recognize that changing direction is acceleration even at constant speed.',targetSlugs:['u1.kinematics-language'],sourceLessonId:baseSource},blocks:[
 video('kinematics-video','What is kinematics?','vf7X7mmJfsE','Kinematics describes motion without explaining its causes. Position tells us where something is relative to a reference. Velocity tells us how fast position changes and in what direction. Acceleration means velocity is changing: speeding up, slowing down, or changing direction—even at a constant speed.'),
 check('kinematics-check','u1.kinematics-language','A bicycle turns along a curved path at constant speed. Is it accelerating?',[
  ['yes','Yes, because its direction changes.','Velocity includes direction. Changing direction is acceleration even with constant speed.'],
  ['no','No, because its speed stays constant.','Constant speed is only part of constant velocity. The direction is changing.'],
  ['only-faster','Only if it starts moving faster.','Acceleration includes speeding up, slowing down, and changing direction.']
 ],'yes'),
 prose('kinematics-model','A runner moves around a circular track at steady speed. At two different points, the runner is moving in different directions. The speed is unchanged, but the velocity has changed: the runner is accelerating.','See the idea'),
 picture('kinematics-figure',acceleration,'Two equal-length tangent velocity arrows at different positions around a circular track. The speed is the same but the directions differ.'),
 prose('kinematics-try','Compare a straight path with a turning path.','Explain'),
 {id:'kinematics-exit',type:'exit_ticket',targetId:'u1.kinematics-language',prompt:'A cart moves straight at constant speed. Another cart turns a corner at the same constant speed. Which cart is accelerating? Explain using velocity and direction.',sei:frames('The ___ cart is accelerating because its ___ changes, even though its ___ stays the same.',['velocity','direction','speed','turning','straight'],acceleration)},
 prose('kinematics-connection','To describe 2026-XJ, we need a reference for its position and information about how its velocity changes. Later lessons will build those tools. This introduction does not yet let us predict an orbit or an impact.','Connect'),
 {id:'kinematics-vocab',type:'vocab',terms:[{term:'kinematics',definition:'The description of motion.',cognate:'ES cinemática · PT cinemática'},{term:'velocity',definition:'Rate of change of position, including direction.',cognate:'ES velocidad · PT velocidade'},{term:'acceleration',definition:'Rate of change of velocity; speed, direction, or both can change.',cognate:'ES aceleración · PT aceleração'}],referencePanel:true},
 ]}},
];
const dir=path.join(root,'scripts/physics-learning');fs.mkdirSync(dir,{recursive:true});
for(const l of lessons){
 l.content_blocks.blocks=l.content_blocks.blocks.filter(b=>!['position-example-diagram','position-practice-diagram','foundations-figure'].includes(b.id));
 for(const b of l.content_blocks.blocks){
  if(b.type==='gewa'){
   b.responseFormat='problem-workspace';b.requireCompleteWork=true;b.capture=true;
   b.stageHints=b.id==='position-practice'?{
    model:'Mark +6 m and −2 m relative to the origin. State which direction you chose as positive.',
    plan:'Displacement compares the endpoints. Distance adds the lengths traveled. This trip has one direct segment.',
    work:'Write (final position) − (initial position) before combining the signed numbers. Keep the unit with your calculation.',
    answer:'Explain what the sign tells you. Report distance and displacement separately.'
   }:{model:'Identify the two measured lengths and their unit. State what the rectangle represents.',plan:'Area combines two perpendicular lengths. What relationship connects them, and what happens to the units?',work:'Keep the unrounded product while you work. Decide the reporting precision after the calculation.',answer:'Count the significant figures in each measured length. Scientific notation can make the precision of your final result clear.'};
   b.sei.visual={src:b.id==='position-practice'?'/learning/position-model.svg':'/learning/measurement-model.svg',alt:b.id==='position-practice'?'Reference number line: start at plus 6 meters, finish at minus 2 meters; right is positive.':'Rectangle with measured sides 8.6 cm and 2.3 cm.'};
  }
  if(b.type==='worked_example'){
   b.format='problem-workspace';
   const position=b.id==='position-worked';
   b.given += position?' Model the trip on one straight number line, with right positive.':' Model the card as a rectangle. The given lengths are measurements, not exact counts.';
   b.equation += position?' Use the endpoints for displacement and add each segment length for distance, because the cart changes direction.':' Multiply length by width because the card is rectangular. Report the result to the precision allowed by the measurements.';
   b.sei={visual:{src:position?'/learning/position-worked-model.svg':'/learning/measurement-worked-model.svg',alt:position?'Reference: start minus 2 meters, turn at plus 4 meters, finish at plus 1 meter.':'Rectangle with measured sides 12.4 cm and 3.2 cm.'}};
  }
 }
}
fs.writeFileSync(path.join(dir,'seed.json'),JSON.stringify({lessons,targets:newTargets},null,2));
const catalogFile=path.join(root,'src/data/physics-learning-catalog.json');let catalog=JSON.parse(fs.readFileSync(catalogFile));catalog=catalog.filter(e=>!Object.values(ids).includes(e.id));
for(const l of lessons){const ts=l.objectives.map(slug=>newTargets.find(t=>t.slug===slug)||{slug:target,statement:'I can use precise vocabulary (position, distance, displacement) to describe motion, and I can tell the difference between scalar and vector quantities.',domain:'knowledge'});catalog.unshift({id:l.id,slug:l.slug,title:l.title,unitId:l.id===ids.foundations?'foundations':'unit-1',kind:'lesson',targets:ts.map(t=>({slug:t.slug,statement:t.statement,domain:t.domain})),readings:l.content_blocks.blocks.filter(b=>b.type==='reading').map(b=>({chapter:b.chapter,sectionIds:b.sectionIds})),hasSimulation:l.id===ids.position,hasWorkedExample:l.id!==ids.intro,videoIds:l.videos.map(v=>v.youtubeId),source:'new',...(l.id===ids.position?{replaces:baseSource}:{})});}
catalog.sort((a,b)=>a.unitId===b.unitId?((a.source==='new'?0:1)-(b.source==='new'?0:1))||Object.values(ids).indexOf(b.id)-Object.values(ids).indexOf(a.id):0);
fs.writeFileSync(catalogFile,JSON.stringify(catalog,null,2));
console.log(JSON.stringify({lessons:lessons.map(l=>({id:l.id,slug:l.slug,pages:l.content_blocks.blocks.filter(b=>b.workshop?.pageBreakBefore).length})),targets:newTargets.length}));
