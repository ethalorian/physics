/** Deterministic teaching models; units and assumptions are stated in the reader. */
export function logistic(r:number,initial:number,steps:number){const values=[initial];for(let i=0;i<steps;i++)values.push(r*values[i]*(1-values[i]));return values}
export function ringMatch(cycles:number){return {real:Math.cos(2*Math.PI*cycles),imaginary:Math.sin(2*Math.PI*cycles),matches:Math.abs(cycles-Math.round(cycles))<1e-9}}
export function hydrogenRadius(n:number,Z:number){return .05291772109*n*n/Z}
export function transmission(layers:number){return 2**(-layers)}
export function radiocarbonAge(fraction:number){return -5730*Math.log2(fraction)}
export function parentDaughter(halflives:number){const parent=2**(-halflives);return{parent,daughter:1-parent,ratio:(1-parent)/parent}}
export function datingAge(ratio:number,halfLife:number){return halfLife*Math.log2(1+ratio)}
export function tracer(t:number,transfer:number,halfLife:number){const total=2**(-t/halfLife),a=total*Math.exp(-transfer*t);return{a,b:total-a,total,decayed:1-total}}
export function isotopeLedger(A:number,Z:number,electrons:number){return{neutrons:A-Z,charge:Z-electrons}}
export const nitrogenReaction={incoming:[{name:'N-14',A:14,Z:7},{name:'He-4',A:4,Z:2}],outgoing:[{name:'O-17',A:17,Z:8},{name:'H-1',A:1,Z:1}]}
export const fissionReaction={incoming:[{name:'U-235',A:235,Z:92},{name:'n',A:1,Z:0}],outgoing:[{name:'Ba-141',A:141,Z:56},{name:'Kr-92',A:92,Z:36},{name:'3 n',A:3,Z:0}]}
export function ledger(items:{A:number;Z:number}[]){return items.reduce((sum,v)=>({A:sum.A+v.A,Z:sum.Z+v.Z}),{A:0,Z:0})}
