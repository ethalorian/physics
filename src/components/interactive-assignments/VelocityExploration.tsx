'use client'
import type {VelocityState} from '@/lib/interactive-assignments/velocity'
import VelocityAvatarLab from './VelocityAvatarLab'
import s from './assignment.module.css'
/** Keep the original persisted exploration model and question bindings. */
export default function VelocityExploration({part,state,onChange,readOnly=false}:{part:number;state:VelocityState;onChange:(state:VelocityState)=>void;readOnly?:boolean}){
 const change=(patch:Partial<VelocityState>)=>{if(!readOnly)onChange({...state,...patch})}
 if(part===1||part===2||part===4)return <VelocityAvatarLab part={part} state={state} onChange={onChange} readOnly={readOnly}/>
 if(part===3)return <div className={s.tryIt}><label htmlFor="conversion"><span>Try it · Convert </span><span translate="no">{`${state.conversion} km/h`}</span></label><input id="conversion" type="range" min="0" max="180" value={state.conversion} disabled={readOnly} onChange={e=>change({conversion:Number(e.target.value)})}/><p className={s.conversion} translate="no"><span>{state.conversion}</span> <s>km/h</s> × 1000 m/<s>km</s> × 1 <s>h</s>/3600 s = <b>{`${(state.conversion/3.6).toFixed(2)} m/s`}</b></p><p>km/h ÷ 3.6 = m/s. Going the other way, m/s × 3.6 = km/h.</p></div>

 return null
}
