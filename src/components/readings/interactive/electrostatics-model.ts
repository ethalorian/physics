export const K=8.9875517923e9
export const EPS0=1/(4*Math.PI*K)
export const ELEMENTARY=1.602176634e-19
export function transferElectrons(n:number){return {a:n*ELEMENTARY,b:-n*ELEMENTARY,total:0}}
export function contactCharges(a:number,b:number){return {each:(a+b)/2,total:a+b}}
export function coulomb(a:number,b:number,r:number,kappa=1){if(r<=0||kappa<=0)throw new RangeError('Positive separation and permittivity required');return K*a*b/(kappa*r*r)}
export function pointField(q:number,x:number,y:number){const r=Math.hypot(x,y);if(r<1e-12)return null;const scale=K*q/(r*r*r);return {x:scale*x,y:scale*y,v:K*q/r}}
export function pairField(q1:number,q2:number,x:number,y:number){const a=pointField(q1,x+.5,y),b=pointField(q2,x-.5,y);if(!a||!b)return null;return {x:a.x+b.x,y:a.y+b.y,v:a.v+b.v}}
export function sphere(q:number,radius:number,r:number){if(radius<=0||r<0)throw new RangeError('Invalid sphere geometry');return {v:K*q/Math.max(radius,r),e:r<radius?0:K*q/(r*r)}}
export function electricEnergy(q:number,initial:number,final:number){const deltaU=q*(final-initial);return {deltaU,fieldWork:-deltaU}}
export function uniformField(va:number,vb:number,d:number){if(d<=0)throw new RangeError('Positive plate gap required');return (va-vb)/d}
export function capacitance(area:number,gap:number,kappa:number){if(area<=0||gap<=0||kappa<=0)throw new RangeError('Invalid capacitor geometry');return EPS0*kappa*area/gap}
export function plateCapacitor(area:number,gap:number,kappa:number,initialVoltage:number,isolated:boolean){const c0=capacitance(area,gap,1),c=c0*kappa,q=(isolated?c0:c)*initialVoltage,v=q/c;return {c,q,v,e:v/gap,u:.5*c*v*v}}
export function capacitorEnergy(c:number,v:number){return {q:c*v,u:.5*c*v*v}}
export function capacitorPair(c1:number,c2:number,v:number,series:boolean){if(c1<=0||c2<=0)throw new RangeError('Positive capacitances required');const c=series?c1*c2/(c1+c2):c1+c2,q=c*v,v1=series?q/c1:v,v2=series?q/c2:v;return {c,q,v1,v2,q1:c1*v1,q2:c2*v2,u:.5*c*v*v}}
export function dipoleForces(source:number,pole:number,near:number,separation:number){return {near:Math.abs(coulomb(source,pole,near)),far:Math.abs(coulomb(source,pole,near+separation)),net:Math.abs(coulomb(source,pole,near))-Math.abs(coulomb(source,pole,near+separation))}}
export function deflection(q:number,mass:number,field:number,vx:number,length:number){if(mass<=0||vx<=0||length<0)throw new RangeError('Invalid flight inputs');const a=q*field/mass,t=length/vx;return {a,t,y:.5*a*t*t}}
