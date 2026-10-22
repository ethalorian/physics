'use client'
import dynamic from 'next/dynamic'
import type {ComponentType,ComponentProps} from 'react'
import type CanvasExperiment from './CanvasExperiment'
type Props=Omit<ComponentProps<typeof CanvasExperiment>,'def'>
const load=(definition:()=>Promise<unknown>,name:string)=>dynamic<Props>(async()=>{
 const [{default:Experiment},module]=await Promise.all([import('./CanvasExperiment'),definition()])
 const def=(module as Record<string,ComponentProps<typeof CanvasExperiment>['def']>)[name]
 return function Model(props:Props){return <Experiment {...props} def={def}/>}
},{ssr:false,loading:()=> <p role="status">Loading the experiment…</p>})
const models:Record<string,ComponentType<Props>>={
 'cart-collisions':load(()=>import('@/app/simulations/cart-collisions/def'),'cartCollisionsDef'),
 'impulse-momentum':load(()=>import('@/app/simulations/impulse-momentum/def'),'impulseMomentumDef'),
 'dart-deflection':load(()=>import('@/app/simulations/dart-deflection/def'),'dartDeflectionDef'),
 'riverboat-crossing-3d':load(()=>import('@/app/simulations/riverboat-crossing-3d/def'),'riverboatCrossing3DDef'),
 'picket-fence-g':load(()=>import('@/app/simulations/picket-fence-g/def'),'picketFenceGDef'),
}
export default function CanvasExperimentLoader({id,...props}:Props&{id:string}){const Model=models[id];return Model?<Model {...props}/>:<p role="alert">This experiment is unavailable.</p>}
