/** Introductory nuclear models. Inputs use the units specified in each function. */
export const LN2=Math.log(2),U=1.66053906892e-27,U_MEV=931.49410372
export function survival(time:number,halfLife:number){return 2**(-time/halfLife)}
export function activity(count:number,halfLifeSeconds:number){return LN2*count/halfLifeSeconds}
export function ageFromFraction(fraction:number,halfLife:number){return -Math.log2(fraction)*halfLife}
export function syntheticSurvivors(count:number,halfLives:number){let state=123456789;return Array.from({length:count},()=>{state=(1664525*state+1013904223)>>>0;return -Math.log2((state+.5)/4294967296)}).filter(t=>t>halfLives).length}
export function counter(sourceBq:number,efficiency:number,background:number,seconds:number){const source=sourceBq*efficiency*seconds,bg=background*seconds,total=source+bg;return{source,background:bg,total,sigma:Math.sqrt(total),relative:total>0?1/Math.sqrt(total):null}}
export function nuclearSize(A:number){const radiusFm=1.2*Math.cbrt(A),volume=4*Math.PI/3*(radiusFm*1e-15)**3;return{radiusFm,volume,density:A*U/volume}}
export type DecayExample={label:string;parent:string;daughter:string;A:number;Z:number;daughterA:number;daughterZ:number;particleA:number;particleCharge:number;incomingCharge:number;products:string;explanation:string}
export const decays:DecayExample[]=[
 {label:'Alpha',parent:'²¹⁰Po',daughter:'²⁰⁶Pb',A:210,Z:84,daughterA:206,daughterZ:82,particleA:4,particleCharge:2,incomingCharge:0,products:'⁴He',explanation:'Two protons and two neutrons leave together.'},
 {label:'Beta minus',parent:'¹⁴C',daughter:'¹⁴N',A:14,Z:6,daughterA:14,daughterZ:7,particleA:0,particleCharge:-1,incomingCharge:0,products:'e⁻ + ν̄ₑ',explanation:'A neutron becomes a proton; electron and antineutrino are created.'},
 {label:'Beta plus',parent:'²²Na',daughter:'²²Ne*',A:22,Z:11,daughterA:22,daughterZ:10,particleA:0,particleCharge:1,incomingCharge:0,products:'e⁺ + νₑ',explanation:'A proton becomes a neutron; positron and neutrino are created. The excited daughter can later emit a gamma.'},
 {label:'Electron capture',parent:'⁷Be + e⁻',daughter:'⁷Li',A:7,Z:4,daughterA:7,daughterZ:3,particleA:0,particleCharge:0,incomingCharge:-1,products:'νₑ',explanation:'An atomic electron is absorbed. This example shows the ground-state daughter branch.'},
 {label:'Gamma',parent:'⁶⁰Ni*',daughter:'⁶⁰Ni',A:60,Z:28,daughterA:60,daughterZ:28,particleA:0,particleCharge:0,incomingCharge:0,products:'γ',explanation:'A nuclear excitation decreases; the nucleus recoils. A and Z are unchanged.'}
]
export const bindingNuclides=[{name:'²H',Z:1,N:1,mass:2.01410177812},{name:'⁴He',Z:2,N:2,mass:4.00260325413},{name:'¹²C',Z:6,N:6,mass:12},{name:'⁵⁶Fe',Z:26,N:30,mass:55.93493633},{name:'⁶²Ni',Z:28,N:34,mass:61.92834537},{name:'²⁰⁸Pb',Z:82,N:126,mass:207.9766525}]
export function binding(index:number){const n=bindingNuclides[index],parts=n.Z*1.00782503223+n.N*1.00866491595,defect=parts-n.mass,total=defect*U_MEV;return{...n,A:n.Z+n.N,parts,defect,total,per:total/(n.Z+n.N)}}
/** Electron, equal zero potentials outside a rectangular barrier; 0 < E < V, width in nm. */
export function tunnel(energyEV:number,widthNM:number,barrierEV=5){const k=Math.sqrt(2*9.1093837139e-31*1.602176634e-19*(barrierEV-energyEV))/1.054571817e-34;const z=k*widthNM*1e-9,T=1/(1+barrierEV**2*Math.sinh(z)**2/(4*energyEV*(barrierEV-energyEV)));return{T,R:1-T,kNM:k*1e-9,envelope:Math.exp(-z)}}
/** Chord through (x,0) in a circle, all coordinates in illustration units. */
export function responseLine(x:number,angle:number,radius=110){const ux=Math.cos(angle),uy=Math.sin(angle),b=x*ux,disc=Math.sqrt(b*b+radius*radius-x*x),a=-b-disc,c=-b+disc;return{x1:x+a*ux,y1:a*uy,x2:x+c*ux,y2:c*uy}}
export function absorbedDose(energyJ:number,massKG:number){return energyJ/massKG}
export function survivingFraction(dose:number,decimalDose:number){return 10**(-dose/decimalDose)}
export function conversion(thermal:number,efficiency:number){return{electric:thermal*efficiency,rejected:thermal*(1-efficiency)}}
export function plantBalance(fusion:number,driver:number,efficiency:number,other:number){const c=conversion(fusion,efficiency);return{...c,net:c.electric-driver-other,targetGain:fusion/driver}}
