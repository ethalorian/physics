/** SI inputs. Linear, nonrelativistic idealizations; domains are qualitative. */
export const MU0=4*Math.PI*1e-7
export const E_CHARGE=1.602176634e-19
export const PROTON_MASS=1.67262192369e-27
export const rad=(degrees:number)=>degrees*Math.PI/180
export type Vector=[number,number,number]
export function cross(a:Vector,b:Vector):Vector{return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
export function magneticForce(q:number,v:Vector,b:Vector):Vector{return cross(v,b).map(n=>q*n) as Vector}
export function orbit(m:number,q:number,b:number,vperp:number,vparallel:number){const period=2*Math.PI*m/(Math.abs(q*b));return {radius:m*Math.abs(vperp)/(Math.abs(q*b)),period,pitch:vparallel*period,energy:0.5*m*(vperp*vperp+vparallel*vparallel)}}
export function wireField(i:number,r:number){return MU0*i/(2*Math.PI*r)}
export function loopField(i:number,n:number,r:number){return MU0*n*i/(2*r)}
export function solenoidField(i:number,n:number,length:number){return MU0*n*i/length}
export function wireForce(i:number,length:number,b:number,angle:number){return i*length*b*Math.sin(rad(angle))}
export function loopTorque(n:number,i:number,area:number,b:number,angle:number){return n*i*area*b*Math.sin(rad(angle))}
export function parallelForce(i1:number,i2:number,d:number){return MU0*i1*i2/(2*Math.PI*d)}
/** Vtop - Vbottom for conventional current +x, field +z, a single carrier type. */
export function hallVoltage(carrierSign:number,driftMagnitude:number,b:number,width:number){return -carrierSign*driftMagnitude*b*width}
export function flux(b:number,area:number,angle:number){return b*area*Math.cos(rad(angle))}
export function inducedEmf(n:number,area:number,rate:number){return -n*area*rate}
export function generator(n:number,area:number,b:number,f:number,angle:number){return {flux:flux(b,area,angle),emf:n*b*area*2*Math.PI*f*Math.sin(rad(angle)),peak:n*b*area*2*Math.PI*f}}
export function transformer(vp:number,np:number,ns:number,resistance:number){const vs=vp*ns/np,is=vs/resistance,power=vs*is;return {vs,is,ip:power/vp,power}}
export function transmission(power:number,receivingVoltage:number,resistance:number){const current=power/receivingVoltage,loss=current*current*resistance;return {current,loss,sendingVoltage:receivingVoltage+current*resistance,input:power+loss}}
export function motional(b:number,length:number,v:number,resistance:number,closed:boolean){const emf=b*length*v,current=closed?emf/resistance:0,drag=current*length*b;return {emf,current,drag,input:drag*v,heat:current*current*resistance}}
export function motor(v:number,back:number,r:number){const current=(v-back)/r;return {current,input:v*current,heat:current*current*r,mechanical:back*current}}
export function inductance(n:number,area:number,length:number){return MU0*n*n*area/length}
export function inductor(l:number,i:number,rate:number){return {energy:0.5*l*i*i,emf:-l*rate}}
export function rl(v:number,r:number,l:number,t:number,decay:boolean){const tau=l/r,final=v/r,e=Math.exp(-t/tau),current=final*(decay?e:1-e);return {tau,current,energy:0.5*l*current*current,voltage:decay?-v*e:v*e}}
export function reactance(f:number,l:number,c:number){return {xl:2*Math.PI*f*l,xc:1/(2*Math.PI*f*c)}}
export function rlc(v:number,r:number,l:number,c:number,f:number){const {xl,xc}=reactance(f,l,c),z=Math.hypot(r,xl-xc),current=v/z;return {xl,xc,z,current,phase:Math.atan2(xl-xc,r),factor:r/z,power:current*current*r,resonance:1/(2*Math.PI*Math.sqrt(l*c))}}
