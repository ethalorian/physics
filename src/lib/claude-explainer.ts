/** Only the original exports' finite model state crosses the classroom command channel. */
export type ClaudeValue = number | boolean | string | null | ClaudeValue[] | { [key:string]:ClaudeValue }
export interface ClaudeSnapshot { values:Record<string,ClaudeValue>; offset:number }
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
const num=(v:unknown,lo=-100000,hi=100000)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi
const integer=(v:unknown,lo:number,hi:number)=>num(v,lo,hi)&&Number.isInteger(v)
const bool=(v:unknown)=>typeof v==='boolean'
const choices=(...items:(string|null)[])=>(v:unknown)=>items.includes(v as string|null)
const answers=(v:unknown)=>record(v)&&Object.entries(v).every(([k,x])=>/^[0-5]$/.test(k)&&integer(x,0,3))
const optionalNumber=(v:unknown)=>v===null||num(v,0,100)
const specs:Record<string,Record<string,(v:unknown)=>boolean>>={
 course:{unit:v=>integer(v,0,7),dUnit:v=>integer(v,0,7),dPlaying:bool,oT:v=>num(v,0,4),oPlaying:bool},
 vectors:{path:choices('lap','outback','L','straight'),s:v=>num(v,0,100),playing:bool,astV:v=>num(v,4,12),pushV:v=>num(v,0,4),pushDeg:v=>num(v,0,360),sorts:answers,answers},
 kinematics:{x0:v=>num(v,-20,20),v0:v=>num(v,-20,20),a:v=>num(v,-10,10),t:v=>num(v,0,15),playing:bool,preset:choices(null,'brake','cruise','toss','reverse'),node:choices('kin','dyn','energy','mom','rot','osc','grav','waves','fluids','em','modern'),answers},
 derivatives:{t0:v=>num(v,.5,6),dtU:v=>num(v,0,1),showTan:bool,shrinking:bool,fn:choices('brake','toss','cruise','elevator','spring'),tc:v=>num(v,0,8),traceT:optionalNumber,drawing:bool,seq:v=>integer(v,0,1),frame:v=>integer(v,0,5),algPlaying:bool,answers},
 units:{exps:v=>record(v)&&Object.keys(v).length===3&&['L','M','T'].every(k=>integer(v[k],-3,3)),cand:v=>integer(v,0,3),answers},
 uam:{h:v=>num(v,1,20),push:bool,run:v=>record(v)&&Object.keys(v).sort().join(',')==='T,aTrue,h,n,pts,push,v0'&&num(v.h,1,20)&&bool(v.push)&&num(v.aTrue,.01,2)&&num(v.v0,0,1)&&num(v.T,.01,20)&&integer(v.n,0,100000)&&Array.isArray(v.pts)&&v.pts.length>2&&v.pts.length<=500&&v.pts.every(p=>record(p)&&Object.keys(p).sort().join(',')==='t,v,x'&&Object.values(p).every(n=>num(n,-100,100))),playT:v=>num(v,0,20),playing:bool,seed:v=>integer(v,0,100000),step:v=>integer(v,0,3),frame:v=>integer(v,0,8),algPlaying:bool,tStar:optionalNumber,answers},
}
export function validClaudeSnapshot(id:string,value:unknown):value is ClaudeSnapshot {
 if(!record(value)||Object.keys(value).sort().join(',')!=='offset,values'||!num(value.offset,0,1)||!record(value.values))return false
 const spec=specs[id],values=value.values
 return !!spec&&Object.keys(values).length===Object.keys(spec).length&&Object.entries(values).every(([k,v])=>!!spec[k]&&spec[k](v))
}
