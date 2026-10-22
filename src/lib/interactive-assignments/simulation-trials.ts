import { restoreRaceTrials, type RaceTrial } from '@/components/simulations/race-track/model'
import {raceMeasurement} from '@/components/simulations/race-track/model'
import {decodeLabTrials,investigationFrame,labTrialKey} from './investigation-model'
import {investigationById} from './investigation-definitions'
import type {VelocityState} from './velocity'
import {canvasSchema,canvasObservationKey,decodeCanvasObservations} from './canvas-observations'
/** Numeric exploration data uses the assignment's existing versioned save/snapshot contract. */
export function encodeRaceTrials(trials: RaceTrial[]): number[] {
  return trials.flatMap(t => [t.id, t.conditions.radius, t.conditions.speed, t.conditions.laps, t.conditions.direction === 'clockwise' ? 0 : 1])
}
export function decodeRaceTrials(values: number[] | undefined): RaceTrial[] {
  if (!values || values.length % 5) return []
  return restoreRaceTrials(Array.from({ length: values.length / 5 }, (_, i) => {
    const [id, radius, speed, laps, direction] = values.slice(i * 5, i * 5 + 5)
    return { id, conditions: { radius, speed, laps, direction: direction === 0 ? 'clockwise' : direction === 1 ? 'counterclockwise' : 'invalid' } }
  }))
}
export function recordedSimulationEvidence(id:string,state:VelocityState){
 if(canvasSchema(id))return decodeCanvasObservations(id,state.explorers?.[canvasObservationKey(id)]).map(t=>({trial:t.id,conditions:t.conditions,results:canvasSchema(id).readings.map(r=>({label:r.label,unit:r.unit,value:t.readings[r.key]})),complete:t.complete}))
 if(id==='race-track')return decodeRaceTrials(state.explorers?.['race-trials']).map(t=>({trial:t.id,conditions:t.conditions,results:raceMeasurement(t.conditions,1)}))
 return decodeLabTrials(id,state.explorers?.[labTrialKey(id)]).map(t=>({trial:t.id,conditions:t.parameters,results:investigationFrame(id,t.parameters,1).metrics}))
}
export function validateSimulationEvidence(id:string,state:VelocityState){
 if(canvasSchema(id)){
  const values=state.explorers?.[canvasObservationKey(id)]
  if(values?.length&&decodeCanvasObservations(id,values).length*(2+canvasSchema(id).params.length+canvasSchema(id).readings.length)!==values.length)throw Error('Some recorded observations are invalid. Remove that observation and record it again.')
  return
 }
 const key=id==='race-track'?'race-trials':labTrialKey(id),values=state.explorers?.[key]
 if(!values?.length)return
 const width=id==='race-track'?5:(investigationById(id)?.controls.length??0)+1
 if(recordedSimulationEvidence(id,state).length*width!==values.length)throw Error('Some recorded trial conditions are invalid. Remove that trial and run it again.')
}
