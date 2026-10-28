/** Teaching moves, not extra answers. The reviewed worksheet remains authoritative. */
export const roles={retrieve:'Recall & connect',worked:'Think aloud',model:'Read the model',practice:'Try it',reason:'Explain why',mixed:'Connect ideas',exit:'Independent check',stretch:'Go further'};
const pairs={
 motion:['Choose an origin and a positive direction. Mark what changes from start to finish.','Does the sign describe where the object is, which way it moves, or how its velocity changes?'],
 graph:['Read the axes and units. Mark the interval you are using before choosing a coordinate, slope, or area.','Point to the exact part of the graph that supports your answer. What do its units tell you?'],
 vector:['Choose axes. Keep each arrow’s length and direction when you move it tip to tail.','Does your resultant join the starting point to the final tip? Check components and direction.'],
 force:['Name the object or system. Label each force with the object that exerts it.','Are these forces on the same object? Explain what the net force says about acceleration.'],
 gravity:['Distinguish height above a surface from distance to a center. Label the geometry first.','Does your distance match the relationship you chose? Check how changing the distance changes the result.'],
 momentum:['Draw before and after. Keep the same system and positive direction in both pictures.','What crosses the system boundary? Explain whether negligible external impulse is a reasonable assumption.'],
 energy:['Name the system, initial state and final state. Track storage and transfers separately.','Where did the energy go? Explain whether a change in kinetic energy is a change in total energy.'],
 thermal:['Label the initial and final temperatures or phases. Separate stages before calculating.','Does this stage change temperature, phase, or both? Match each energy transfer to that change.'],
 projectile:['Separate horizontal and vertical motion. Use the same flight time in both directions.','Which velocity component changes? Check launch height, signs, and the assumptions about air resistance.'],
 circular:['Mark the center of the path and draw the velocity tangent to it.','Can direction change while speed stays constant? Point to the inward acceleration and its cause.'],
 echo:['Draw the complete signal path. Match the measured time to one-way or round-trip distance.','Does the clock measure one leg or both? Explain the distance used in your speed calculation.'],
 wave:['Decide whether the horizontal variable is time or distance. Mark one cycle or the full signal path.','Distinguish time from distance, and motion of the wave pattern from motion of the medium. Which labels support your answer?'],
 ray:['Draw the normal or optical axis. Label the object, surfaces and ray directions.','Which ray rule justifies each line? Check where the rays, or their backward extensions, meet.'],
 circuit:['Trace the wires and mark shared nodes. Identify each series or parallel group before reducing it.','Check current at junctions and voltage around a loop. Is a value across a component or through it?'],
 field:['Separate the source, the field, and the object experiencing a force. Mark the signs or current direction.','Would reversing the charge or current reverse the field, the force, or both? Explain for this situation.'],
 design:['Mark the requirement and the measurement that will test it. Change one feature at a time.','Which measured evidence supports the design choice? Identify what remains an assumption.'],
 evidence:['Separate the observation from the explanation. Select a specific measurement or feature as evidence.','What does your evidence establish, and what would require another measurement?'],
};
export function guidance(day,q){
 // Spaced review teaches its earlier topic, not the unit containing the review.
 const unit=q.priorSource?.unit??q.reviewVariant?.family?.[0]??day.unit;
 const kind=q.visual?.kind||'',s=(q.prompt+' '+q.title).toLowerCase();
 const family=/graph|axes_blank|timelines/.test(kind)||/slope|area under|graph/.test(s)?'graph'
 :/vector_grid/.test(kind)||/tip.to.tail|resultant/.test(s)?'vector'
 :/circuit/.test(kind)||/resistor|circuit|ohm|junction/.test(s)?'circuit'
 :/projectile/.test(kind)||/horizontal launch|projectile|launch angle/.test(s)?'projectile'
 :/orbit|curved_path/.test(kind)||/centripetal|circular motion/.test(s)?'circular'
 :kind==='echo'||/echo|round.trip|sound speed/.test(s)?'echo'
 :/mirror|lens|refraction/.test(kind)||/refraction|principal ray|image distance/.test(s)?'ray'
 :/forces|cart_hanger|suspension/.test(kind)||/net force|free.body|tension|friction/.test(s)?'force'
 :/thermal|heating|particle|convection/.test(kind)||unit===5?'thermal'
 :/wave|pulse|echo|tube|boundary|doppler|spectrum|radial/.test(kind)||unit===6?'wave'
 :/before_after|collision/.test(kind)||unit===3?'momentum'
 :/energy|work_blank|spring|two_paths/.test(kind)||unit===4?'energy'
 :/altitude|orbit|ellipse/.test(kind)||unit===2?'gravity'
 :/field|wire|flux|magnet|coil|potential/.test(kind)||unit===7?'field'
 :unit===8?'design':/motion|velocity|acceleration|distance|position/.test(s)?'motion':'evidence';
 const [move,check]=pairs[family];
 const entry=q.role==='exit'?'Work independently. Keep your reasoning visible so your teacher can see how you decided.'
 :q.role==='retrieve'?'Start from memory. Make a first attempt before using the reference.'
 :q.role==='worked'?'Read the worked example. Explain what each step represents before applying the model.'
 :q.role==='stretch'?'Choose a model and state your assumptions. More than one justified approach may work.'
 :q.role==='reason'?'Make a claim and point to evidence. Be ready to explain the connection.'
 :q.role==='mixed'?'Choose the idea that fits this situation. Explain why it applies before calculating.'
 :'Make a first attempt. Use the model or sketch to explain how you will start.';
 return {family,entry,move,check,teacher:(q.diagnostic||'')+(q.diagnostic?'\n\n':'')+'Ask: '+check+'\nIf students are stuck: '+move+'\nBefore revealing: ask for two approaches and a reason for choosing each. '+(q.role==='exit'?'Collect independent responses first.':'Accept any scientifically valid method.')};
}
