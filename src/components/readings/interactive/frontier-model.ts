export const HBAR_C=197.3269804 // MeV fm
export function yukawaScale(massMeV:number){return massMeV===0?Infinity:HBAR_C/massMeV}
export function yukawaFactor(rFm:number,massMeV:number){return Math.exp(-rFm/yukawaScale(massMeV))}
export function collisionEnergy(kineticGeV:number,massGeV=.938272088){const E=massGeV+kineticGeV;return{E,collider:2*E,fixed:Math.sqrt(2*massGeV*massGeV+2*massGeV*E)}}
type Particle={name:string;Q:number;B:number;L:number}
export const decayChannels:{name:string;incoming:Particle[];outgoing:Particle[]}[]=[
{name:'Neutron',incoming:[{name:'n',Q:0,B:1,L:0}],outgoing:[{name:'p',Q:1,B:1,L:0},{name:'e−',Q:-1,B:0,L:1},{name:'anti-νe',Q:0,B:0,L:-1}]},
{name:'Muon minus',incoming:[{name:'μ−',Q:-1,B:0,L:1}],outgoing:[{name:'e−',Q:-1,B:0,L:1},{name:'anti-νe',Q:0,B:0,L:-1},{name:'νμ',Q:0,B:0,L:1}]},
{name:'Pion plus',incoming:[{name:'π+',Q:1,B:0,L:0}],outgoing:[{name:'μ+',Q:1,B:0,L:-1},{name:'νμ',Q:0,B:0,L:1}]}]
export function particleLedger(particles:Particle[]){return particles.reduce((s,p)=>({Q:s.Q+p.Q,B:s.B+p.B,L:s.L+p.L}),{Q:0,B:0,L:0})}
export const hadrons=[{name:'Proton',quarks:['u','u','d']},{name:'Neutron',quarks:['u','d','d']},{name:'Pion +',quarks:['u','anti-d']},{name:'Omega −',quarks:['s','s','s']},{name:'Antiproton',quarks:['anti-u','anti-u','anti-d']}]
export function quarkLedger(quarks:string[]){return quarks.reduce((s,q)=>{const anti=q.startsWith('anti-'),flavor=q.replace('anti-',''),sign=anti?-1:1;return{Q:s.Q+sign*(['u','c','t'].includes(flavor)?2/3:-1/3),B:s.B+sign/3}},{Q:0,B:0})}
export function redshift(scaleRatio:number){return scaleRatio-1}
export function lensImages(beta:number){const d=Math.sqrt(beta*beta+4);return{plus:(beta+d)/2,minus:(beta-d)/2}}
export function schwarzschildKm(solarMasses:number){return 2*6.67430e-11*1.98847e30*solarMasses/(299792458**2)/1000}
export function mechanicalMode(n:number,x:number){return Math.sin(n*Math.PI*x)}
export function rotation(r:number,halo:number){const luminous=r**3/(1+r*r)**1.5,extended=halo*r**3/(1+r*r);return{visible:Math.sqrt(luminous/r),total:Math.sqrt((luminous+extended)/r),mass:luminous+extended}}
export function idealResistivity(ratio:number){return ratio<1?0:.25+.75*ratio}
