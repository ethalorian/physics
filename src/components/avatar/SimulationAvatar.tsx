'use client'

import {useEffect,useState,type ReactNode} from 'react'
import {useAvatarPortrait} from '@/hooks/useAvatarPortrait'
import AvatarInvestigation from './AvatarInvestigation'
import {useInvestigationParticipation} from './InvestigationParticipation'
import {simulationMission} from '@/lib/avatar/investigation-missions'
import type {StoryLanguage} from '@/components/readings/interactive/reader-story-content'

/** Embedded assignments already own the portrait and active experiment. */
export default function SimulationAvatar({id,title,question,children,actorInModel=false}:{id:string;title:string;question:string;children:ReactNode;actorInModel?:boolean}){
 const parent=useInvestigationParticipation()
 return parent?<>{children}</>:<Standalone id={id} title={title} question={question} actorInModel={actorInModel}>{children}</Standalone>
}
function Standalone({id,title,question,children,actorInModel}:{id:string;title:string;question:string;children:ReactNode;actorInModel:boolean}){
 const {portrait}=useAvatarPortrait(),[active,setActive]=useState(false),[language,setLanguage]=useState<StoryLanguage>('en')
 useEffect(()=>{const pause=()=>{if(document.hidden)setActive(false)};document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause)},[])
 return <AvatarInvestigation id={id} title={title} focus={question} mission={simulationMission(id,question)} portrait={portrait} active={active} onActiveChange={setActive} language={language} onLanguageChange={setLanguage} actorInModel={actorInModel}>{children}</AvatarInvestigation>
}
