/** SI units. These deliberately small models state their assumptions in the reader. */
export const g = 9.8
export function frictionState(pull:number,mass:number,muStatic:number,muKinetic:number,sliding=false) {
  const normal=mass*g,limit=muStatic*normal
  const moves=sliding||Math.abs(pull)>limit
  const friction=moves?-muKinetic*normal: -pull // sliding mode is explicitly rightward
  return {normal,limit,friction,acceleration:(pull+friction)/mass,moves}
}
export function quadraticFall(mass:number,area:number,time:number,rho=1.2,coefficient=1) {
  const terminal=Math.sqrt(2*mass*g/(rho*coefficient*area)),v=terminal*Math.tanh(g*time/terminal)
  const drag=.5*rho*coefficient*area*v*v
  return {terminal,v,drag,weight:mass*g,acceleration:g-drag/mass}
}
export function towing(drive:number,resistance:number,driveMass=4,trailerMass=2) {
  const acceleration=(drive-resistance)/(driveMass+trailerMass)
  return {acceleration,tension:resistance+trailerMass*acceleration}
}
export function collision1D(m1:number,m2:number,u1:number,u2:number,restitution:number) {
  const momentum=m1*u1+m2*u2,total=m1+m2
  const v1=(momentum-m2*restitution*(u1-u2))/total,v2=(momentum+m1*restitution*(u1-u2))/total
  return {v1,v2,momentum,before:.5*m1*u1*u1+.5*m2*u2*u2,after:.5*m1*v1*v1+.5*m2*v2*v2}
}
export function energyDescent(mass:number,height:number,dropFraction:number,thermalFraction:number) {
  const total=mass*g*height,potential=total*(1-dropFraction),thermal=total*dropFraction*thermalFraction,kinetic=total-potential-thermal
  return {total,potential,thermal,kinetic,speed:Math.sqrt(Math.max(0,2*kinetic/mass))}
}
export function circularMotion(radius:number,speed:number,mass=1) {
  return {omega:speed/radius,period:2*Math.PI*radius/speed,acceleration:speed*speed/radius,force:mass*speed*speed/radius}
}
/** Elliptical two-body orbit: a=1, GM=1; timeFraction spans one period. */
export function keplerPosition(eccentricity:number,timeFraction:number) {
  const mean=2*Math.PI*timeFraction
  let eccentric=mean
  for(let i=0;i<12;i++)eccentric-=(eccentric-eccentricity*Math.sin(eccentric)-mean)/(1-eccentricity*Math.cos(eccentric))
  const x=Math.cos(eccentric)-eccentricity,y=Math.sqrt(1-eccentricity**2)*Math.sin(eccentric),radius=Math.hypot(x,y)
  return {x,y,radius,speed:Math.sqrt(2/radius-1),eccentric,mean}
}
