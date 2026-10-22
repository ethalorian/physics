/** Pure calculations behind the reader diagrams. Inputs are SI unless explicitly labeled. */
export const C = 299792458
export const G = 9.8
export function relativity(beta:number){if(Math.abs(beta)>=1)throw new RangeError('A massive clock needs |v/c| < 1');const gamma=1/Math.sqrt(1-beta*beta);return{gamma,properPerCoordinate:1/gamma,lengthRatio:1/gamma,momentumOverMc:gamma*beta,kineticOverMc2:gamma*gamma*beta*beta/(gamma+1)}}
export function addVelocity(u:number,v:number){if(Math.abs(u)>1||Math.abs(v)>=1)throw new RangeError('Velocities must be physical fractions of c');return(u+v)/(1+u*v)}
export function twinTrip(distanceLy:number,beta:number){const earth=2*distanceLy/beta;return{earth,traveler:earth/relativity(beta).gamma}}
export function hydrostatic(rho:number,depth:number,surface=101300){const gauge=rho*G*depth;return{gauge,absolute:surface+gauge}}
export function submergedForces(rhoFluid:number,volume:number,mass:number,fraction=1){const buoyancy=rhoFluid*G*volume*fraction,weight=mass*G;return{buoyancy,weight,netUp:buoyancy-weight}}
export function floating(rhoObject:number,rhoFluid:number){const ratio=rhoObject/rhoFluid;return{fraction:Math.min(ratio,1),sinks:ratio>1,neutral:ratio===1}}
export function hydraulic(force:number,areaRatio:number,inputTravel:number){return{outputForce:force*areaRatio,outputTravel:inputTravel/areaRatio,inputWork:force*inputTravel,outputWork:force*areaRatio*inputTravel/areaRatio}}
export function isothermal(volume:number,initialVolume=2,initialPressure=100){return{pressure:initialPressure*initialVolume/volume,product:initialVolume*initialPressure}}
export function pipeFlow(q:number,radius:number){return q/(Math.PI*radius*radius)}
export function bernoulli(p1:number,v1:number,v2:number,heightChange=0,rho=1000){return p1+.5*rho*(v1*v1-v2*v2)-rho*G*heightChange}
export function capillary(radius:number,angleDegrees:number,gamma=.072,rho=1000){return 2*gamma*Math.cos(angleDegrees*Math.PI/180)/(rho*G*radius)}
export function poiseuille(radius:number,deltaPressure:number,viscosity:number,length:number){const resistance=8*viscosity*length/(Math.PI*radius**4);return{flow:deltaPressure/resistance,resistance}}
export function reynolds(rho:number,speed:number,diameter:number,viscosity:number){return rho*Math.abs(speed)*diameter/viscosity}
export function stokesTerminal(radius:number,rhoSphere=2500,rhoFluid=1000,viscosity=1){const volume=4*Math.PI*radius**3/3,weight=rhoSphere*volume*G,buoyancy=rhoFluid*volume*G,speed=2*(rhoSphere-rhoFluid)*G*radius*radius/(9*viscosity);return{speed,weight,buoyancy,drag:6*Math.PI*viscosity*radius*speed,re:reynolds(rhoFluid,speed,2*radius,viscosity)}}
export function scaling(scale:number){return{area:scale**2,volume:scale**3,stress:scale,surfacePerVolume:1/scale}}
/** Deterministic illustrative walk: stepping is reproducible and does not pretend to be measured data. */
export function randomWalk(steps:number,seed=19){let state=seed;const points:[number,number][]=[[0,0]];for(let i=0;i<steps;i++){state=(Math.imul(1664525,state)+1013904223)>>>0;const a=state/4294967296*2*Math.PI;const last=points.at(-1)!;points.push([last[0]+Math.cos(a),last[1]+Math.sin(a)])}return points}
