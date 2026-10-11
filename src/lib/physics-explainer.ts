/** Canonical teaching-tool frames live on the lesson block, shared by reader and projector. */
export type PhysicsModel = 'motion' | 'walk' | 'deflection' | 'derivative' | 'dimensions' | 'ramp'
export interface ExplainerFrame {
  title: string
  body: string
  prompt: string
  reasoning?: string
  model?: PhysicsModel
  discussion?: { prompt: string; debrief: string }
}
export interface PhysicsExplainerDescriptor { kind: 'physics-explainer'; version: 1; frames: ExplainerFrame[]; source?: {id:string;src:string} }
export interface PhysicsControls {
  time?: number; x0?: number; v0?: number; acceleration?: number; interval?: number
  path?: 'straight' | 'return' | 'square'; burn?: number; angle?: number; height?: number
  massPower?: number; lengthPower?: number; timePower?: number
}
export const PHYSICS_DEFAULTS = { time: 2, x0: 0, v0: 2, acceleration: 1, interval: 1, path: 'return' as const, burn: 1, angle: 90, height: 5, massPower: 0, lengthPower: 1, timePower: -1 }
export const PHYSICS_RANGES: Record<Exclude<keyof PhysicsControls, 'path'>, readonly [number, number]> = {
  time:[0,8],x0:[-20,20],v0:[-20,20],acceleration:[-10,10],interval:[0.01,2],burn:[0,4],angle:[-180,180],height:[1,20],massPower:[-3,3],lengthPower:[-3,3],timePower:[-3,3],
}
export function validPhysicsPatch(p: Record<string, unknown>): boolean {
  return Object.entries(p).every(([k,v]) => {
    if (k === 'frame') return typeof v === 'number' && Number.isInteger(v) && v >= 0
    if (k === 'show') return typeof v === 'boolean'
    if (k === 'path') return ['straight','return','square'].includes(String(v))
    const range = PHYSICS_RANGES[k as keyof typeof PHYSICS_RANGES]
    return !!range && typeof v === 'number' && Number.isFinite(v) && v >= range[0] && v <= range[1] && (!k.endsWith('Power') || Number.isInteger(v))
  })
}
export function motionAt(t:number,x0:number,v0:number,a:number) { return {x:x0+v0*t+0.5*a*t*t,v:v0+a*t,a} }
export function walkAt(time:number,path:PhysicsControls['path']) {
  const distance = 4*time
  if(path==='straight')return {x:distance,y:0,distance,vx:4,vy:0}
  if(path==='return')return {x:time<=4?distance:32-distance,y:0,distance,vx:time<4?4:-4,vy:0}
  const s=Math.min(3,Math.floor(time/2)), d=distance-s*8
  const segment=[{x:d,y:0,vx:4,vy:0},{x:8,y:d,vx:0,vy:4},{x:8-d,y:8,vx:-4,vy:0},{x:0,y:8-d,vx:0,vy:-4}][s]
  return {...segment,distance}
}
/** Toy straight-line flyby: initial separation 20 Earth radii, speed 8 km/s, Earth fixed, gravity ignored. */
export function deflection(burn:number,angle:number) {
  const vx=8+burn*Math.cos(angle*Math.PI/180),vy=burn*Math.sin(angle*Math.PI/180)
  const speed=Math.hypot(vx,vy), closest=20*Math.abs(vy)/speed
  return {vx,vy,speed,closest,hit:closest<=1,heading:Math.atan2(vy,vx)*180/Math.PI}
}
export function dimensionName(m:number,l:number,t:number) {
  return ({'0,1,0':'length','0,0,1':'time','1,0,0':'mass','0,1,-1':'velocity / speed','0,1,-2':'acceleration','1,1,-2':'force','1,2,-2':'energy / work','1,1,-1':'momentum','1,2,-3':'power','0,0,0':'dimensionless ratio'} as Record<string,string>)[`${m},${l},${t}`] ?? 'a dimension combination — identify its physical meaning'
}
