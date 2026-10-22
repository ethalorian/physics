/** SI quantities unless a function explicitly declares normalized variables. */
export const TAU = 2 * Math.PI
export const pendulumPeriod = (length:number,g:number) => TAU*Math.sqrt(length/g)
export function oscillator(mass:number,k:number,amplitude:number,phase:number) {
 const omega=Math.sqrt(k/mass),x=amplitude*Math.cos(TAU*phase),v=-amplitude*omega*Math.sin(TAU*phase)
 return {omega,period:TAU/omega,x,v,a:-(omega**2)*x,force:-k*x,potential:.5*k*x*x,kinetic:.5*mass*v*v,total:.5*k*amplitude**2}
}
export const waveDisplacement=(x:number,wavelength:number,phase:number,amplitude=1)=>amplitude*Math.sin(TAU*(x/wavelength-phase))
export const soundSpeed=(celsius:number)=>331+.6*celsius
export const bulkSoundSpeed=(bulkModulus:number,density:number)=>Math.sqrt(bulkModulus/density)
/** Positive source velocity is toward a stationary observer; subsonic domain. */
export const sourceDoppler=(frequency:number,speed:number,sourceVelocity:number)=>frequency*speed/(speed-sourceVelocity)
export const machAngle=(mach:number)=>mach>=1?Math.asin(1/mach):null
export const beatFrequency=(a:number,b:number)=>Math.abs(a-b)
export const soundLevel=(intensity:number,reference=1e-12)=>10*Math.log10(intensity/reference)
export const intensityRatio=(dbDifference:number)=>10**(dbDifference/10)
export const sphericalIntensity=(power:number,radius:number)=>power/(4*Math.PI*radius**2)
export const resonanceAmplitude=(ratio:number,zeta:number)=>1/Math.hypot(1-ratio**2,2*zeta*ratio)
/** x/A at normalized time s=omega0*t, x(0)=A, v(0)=0. */
export function dampedDisplacement(s:number,zeta:number) {
 if(zeta<1){const wd=Math.sqrt(1-zeta*zeta);return Math.exp(-zeta*s)*(Math.cos(wd*s)+zeta/wd*Math.sin(wd*s))}
 if(zeta===1)return (1+s)*Math.exp(-s)
 const root=Math.sqrt(zeta*zeta-1),r1=-zeta+root,r2=-zeta-root
 return (-r2*Math.exp(r1*s)+r1*Math.exp(r2*s))/(r1-r2)
}
export function airColumn(length:number,speed:number,mode:number,closed:boolean) {
 const harmonic=closed?2*mode-1:mode,wavelength=(closed?4:2)*length/harmonic
 return {harmonic,wavelength,frequency:speed/wavelength}
}
export const echoDepth=(seconds:number,speed=1540)=>seconds*speed/2
export const reflectionFraction=(z1:number,z2:number)=>((z2-z1)/(z2+z1))**2
