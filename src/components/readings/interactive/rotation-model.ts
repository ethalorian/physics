/** SI quantities unless explicitly normalized; all models state their physical assumptions in the reader. */
export const gravity = 9.8
export function torque(force:number,radius:number,degrees:number){return force*radius*Math.sin(degrees*Math.PI/180)}
export function centerOfMass(m1:number,x1:number,m2:number,x2:number){return (m1*x1+m2*x2)/(m1+m2)}
export function beamReactions(length:number,beamWeight:number,load:number,position:number){const right=(beamWeight*length/2+load*position)/length;return {left:beamWeight+load-right,right}}
export function spinState(radius:number){const inertia=1+2*radius*radius,angularMomentum=4,omega=angularMomentum/inertia;return {inertia,angularMomentum,omega,energy:.5*inertia*omega*omega}}
export function rollingState(shape:number,height:number){const speed=Math.sqrt(2*gravity*height/(1+shape));return {speed,translation:.5*speed*speed,rotation:.5*shape*speed*speed,total:gravity*height}}
export function tiltState(width:number,height:number,degrees:number){const a=degrees*Math.PI/180;return {x:-width/2*Math.cos(a)+height/2*Math.sin(a),y:width/2*Math.sin(a)+height/2*Math.cos(a),critical:Math.atan(width/height)*180/Math.PI}}
export function angularMotion(alpha:number,time:number,initial=0){return {omega:initial+alpha*time,angle:initial*time+.5*alpha*time*time}}
export function impactState(r:number){const mass=.2,speed=3,rodMass=1.2,length=1,inertia=rodMass*length*length/3+mass*r*r,L=mass*speed*r,omega=L/inertia;const momentum=(rodMass*length/2+mass*r)*omega;return {inertia,L,omega,initialEnergy:.5*mass*speed*speed,finalEnergy:.5*inertia*omega*omega,pivotImpulse:momentum-mass*speed}}
export function interiorField(radius:number){return radius<=1?radius:1/(radius*radius)}
export function tideState(distance:number){const center=1/(distance*distance);return {near:1/(distance-1)**2-center,far:1/(distance+1)**2-center,center}}
export function orbitEnergy(radius:number,semimajor=1){return {potential:-1/radius,kinetic:1/radius-1/(2*semimajor),total:-1/(2*semimajor)}}
