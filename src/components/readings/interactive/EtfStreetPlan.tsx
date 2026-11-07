'use client'
import { useState } from 'react'
import s from './etf-edition.module.css'
const trips=[
  {name:'At the edge of town',shop:[310,70],route:'M65 150 H31 V40 H310 V68',blocks:8,note:'The shop is across town. Follow the street to the main crossing, then double back to the entrance.'},
  {name:'Nearby, across a barrier',shop:[175,150],route:'M65 150 H31 V40 H224 V150 H175',blocks:6,note:'The shop looks close on the plan, but the fenced road still forces a detour.'},
  {name:'Connected neighborhood',shop:[175,150],route:'M65 150 H175',blocks:2,note:'A pedestrian crossing connects the two entrances. The resident can now use the short route.'},
]
function House({x,y,shop=false}:{x:number;y:number;shop?:boolean}) {
  return <g transform={`translate(${x} ${y})`}><rect x="-16" y="-22" width="32" height="21" rx="2" fill={shop?'#ffd18a':'#bddbd2'} stroke="#254c48" strokeWidth="1.7"/>{shop?<path d="M-19 -23 H19 L16 -29 H-16Z" fill="#de9262" stroke="#254c48"/>:<path d="M-20 -22 L0 -38 L20 -22Z" fill="#709e89" stroke="#254c48"/>}<rect x="-3" y="-11" width="7" height="10" fill="#284841"/></g>
}
export default function EtfStreetPlan() {
  const [choice,setChoice]=useState(0),[run,setRun]=useState(0)
  const trip=trips[choice]
  return <section className={s.model}><p className={s.kicker}>Design experiment · Peter Park</p><h3>Can you walk to the shop?</h3><p>Keep the resident’s home fixed. Change the land use or the crossing and trace the trip between the two doors.</p>
    <div className={s.controls}>{trips.map((t,i)=><button type="button" key={t.name} aria-pressed={i===choice} onClick={()=>{setChoice(i);setRun(0)}}>{t.name}</button>)}</div>
    <svg viewBox="0 0 360 190" role="img" aria-label={'Street plan. '+trip.note}>
      <rect width="360" height="190" rx="8" fill="#e9f0df"/><g fill="#d5e1cc" stroke="#98b39e"><rect x="44" y="51" width="49" height="63" rx="5"/><rect x="136" y="51" width="71" height="63" rx="5"/><rect x="242" y="89" width="85" height="43" rx="5"/></g>
      <g fill="none" stroke="#fbfaf2" strokeWidth="12"><path d="M0 40H360 M0 150H360 M31 0V190 M224 0V190 M310 0V190"/></g><path d="M110 0V190" stroke="#b6b8ae" strokeWidth="15"/><path d="M110 0V190" stroke="#faf8e5" strokeDasharray="6 5"/>{choice===2?<path d="M103 150H117" stroke="#fff" strokeDasharray="2 2" strokeWidth="11"/>:<path d="M102 57V185" stroke="#645d54" strokeWidth="2" strokeDasharray="4 2"/>}
      <House x={65} y={150}/><House x={trip.shop[0]} y={trip.shop[1]} shop/><g fill="#193c36" fontSize="10" fontWeight="700"><text x="50" y="173">HOME</text><text x={trip.shop[0]-14} y={trip.shop[1]+23}>SHOP</text></g>
      <path d={trip.route} fill="none" stroke="#347f70" strokeWidth="3" strokeDasharray="4 3"/>{run>0&&<path key={choice+'-'+run} d={trip.route} pathLength="1" className={s.trace} fill="none" stroke="#bf561d" strokeWidth="5" strokeLinecap="round"/>}
    </svg><div className={s.modelFoot}><p aria-live="polite">{trip.note}</p><button type="button" onClick={()=>setRun(r=>r+1)}>Trace the walk</button></div><p className={s.credit}>Illustrative neighborhood for Task 2.1. Apply the comparison to your own site sketch.</p>
  </section>
}
