'use client'

import {createContext, useContext, type ReactNode} from 'react'
import AvatarCharacter from './AvatarCharacter'
import type {MeBundle} from '@/app/api/avatar/me/route'

export type Participation = {active: boolean; portrait: MeBundle | null; sample: boolean}
export const InvestigationParticipation = createContext<Participation | null>(null)
export const useInvestigationParticipation = () => useContext(InvestigationParticipation)

/** Coordinates come from the original model. An avatar never adds mass or a force. */
export function InvestigationActor({x,y,height=90,width=height*.5,pose='side',facing=1,fallback=null}: {
  x:number; y:number; height?:number; width?:number; pose?:'side'|'walking'|'standing'|'head'; facing?:number; fallback?:ReactNode
}) {
  const participation=useInvestigationParticipation()
  if(!participation?.active)return <>{fallback}</>
  return <foreignObject data-investigation-actor={pose} x={x-width/2} y={y-height+(pose==='head'?0:height*.0625)} width={width} height={height} pointerEvents="none" aria-hidden="true">
    <div style={{width:'100%',height:'100%',transform:`scaleX(${facing<0?-1:1})`}}><AvatarCharacter portrait={participation.portrait} sampleStudent={participation.sample} pose={pose}/></div>
  </foreignObject>
}
