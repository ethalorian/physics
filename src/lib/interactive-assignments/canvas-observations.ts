import schemas from './canvas-observation-schema.json'

export type CanvasObservation = {id:number;complete:boolean;conditions:Record<string,number>;readings:Record<string,number>}
export const canvasSchema=(id:string)=>schemas[id as keyof typeof schemas]
export const canvasObservationKey=(id:string)=>'observations-'+id
export function encodeCanvasObservations(id:string,trials:CanvasObservation[]):number[]{
 const schema=canvasSchema(id)
 return schema?trials.flatMap(t=>[t.id,Number(t.complete),...schema.params.map(p=>t.conditions[p.key]),...schema.readings.map(r=>t.readings[r.key])]):[]
}
/** Captured observations, not a calculated answer key. Keep settings with each measurement. */
export function decodeCanvasObservations(id:string,values:number[]|undefined):CanvasObservation[]{
 const schema=canvasSchema(id);if(!schema||!values?.length)return []
 const width=2+schema.params.length+schema.readings.length
 if(values.length%width||values.length>width*12||values.some(v=>!Number.isFinite(v)||Math.abs(v)>1e9))return []
 const trials:CanvasObservation[]=[],ids=new Set<number>()
 for(let i=0;i<values.length;i+=width){
  const row=values.slice(i,i+width),trialId=row[0]
  if(!Number.isInteger(trialId)||trialId<1||ids.has(trialId)||![0,1].includes(row[1]))return []
  ids.add(trialId)
  const conditions:Record<string,number>={},readings:Record<string,number>={}
  for(const [j,p] of schema.params.entries()){
   const v=row[j+2]
   if(v<p.min||v>p.max||Math.abs((v-p.min)/p.step-Math.round((v-p.min)/p.step))>1e-7)return []
   conditions[p.key]=v
  }
  schema.readings.forEach((r,j)=>{readings[r.key]=row[2+schema.params.length+j]})
  trials.push({id:trialId,complete:row[1]===1,conditions,readings})
 }
 return trials
}
