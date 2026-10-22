'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type {InvestigationMission} from '@/lib/avatar/investigation-missions'
import AvatarInvestigation from '@/components/avatar/AvatarInvestigation'
import AvatarCharacter from '@/components/avatar/AvatarCharacter'
import styles from './assignment-avatar.module.css'
import { useAvatarPortrait } from '@/hooks/useAvatarPortrait'
import type { StoryLanguage } from '@/components/readings/interactive/reader-story-content'
import type { MeBundle } from '@/app/api/avatar/me/route'

type Classroom = { language: StoryLanguage; setLanguage: (value: StoryLanguage) => void; workVisible: boolean; portrait: MeBundle | null; sample: boolean; active: string | null; setActive: (id: string | null) => void }
const ClassroomContext = createContext<Classroom | null>(null)

/** One portrait and one active experiment for the entire assignment. Answers remain in its existing store. */
export function AssignmentAvatarProvider({ children, sample = false, workVisible = true }: { children: ReactNode; sample?: boolean; workVisible?: boolean }) {
  const { portrait } = useAvatarPortrait(!sample)
  const [language, setLanguage] = useState<StoryLanguage>('en')
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const pause = () => { if (document.hidden) setActive(null) }
    document.addEventListener('visibilitychange', pause)
    return () => document.removeEventListener('visibilitychange', pause)
  }, [])
  return <ClassroomContext.Provider value={{ portrait, sample, active, setActive, language, setLanguage, workVisible }}>{children}</ClassroomContext.Provider>
}

export function useAssignmentAvatar() { return useContext(ClassroomContext) }

const ExperimentContext = createContext(false)

/** Model controls retain their existing handlers and persisted values. */
export function AssignmentExperiment({ id, title, focus, children, readOnly = false, actorInModel = false, interactive = true, visible = true, mission }: {
  mission?: InvestigationMission; id: string; title: string; focus: string; children?: ReactNode; readOnly?: boolean; actorInModel?: boolean; interactive?: boolean; visible?: boolean
}) {
  const classroom = useAssignmentAvatar()
  if (!classroom) return <>{children}</>
  const active = classroom.active === id && visible
  return <ExperimentContext.Provider value={active}><AvatarInvestigation mission={mission} id={id} title={title} focus={focus} portrait={classroom.portrait} sample={classroom.sample} language={classroom.language} onLanguageChange={classroom.setLanguage} active={active} onActiveChange={value => classroom.setActive(value ? id : null)} actorInModel={actorInModel} interactive={interactive} readOnly={readOnly}>{children}</AvatarInvestigation></ExperimentContext.Provider>
}

export function AssignmentModelActor({ x, y }: { x: number; y: number }) {
  const classroom = useAssignmentAvatar(), active = useContext(ExperimentContext)
  const previous=useRef({x,y}),[moving,setMoving]=useState(false),[facing,setFacing]=useState(1)
  useEffect(()=>{
    const last=previous.current;previous.current={x,y}
    if(last.x===x&&last.y===y)return
    if(last.x!==x)setFacing(x<last.x?-1:1)
    setMoving(true)
    const timer=window.setTimeout(()=>setMoving(false),540)
    return ()=>window.clearTimeout(timer)
  },[x,y])
  if (!classroom) return <circle cx={x} cy={y} r="6" fill="currentColor" />
  return <>{!active&&<circle cx={x} cy={y} r="6" fill="currentColor" />}<g className={styles.gridActor} data-active={active} style={{transform:`translate(${x}px,${y}px)`}}><foreignObject x={-14} y={-45} width={28} height={48} pointerEvents="none" aria-hidden="true"><div style={{height:'100%',transform:`scaleX(${facing})`}}><AvatarCharacter portrait={classroom.portrait} sampleStudent={classroom.sample} pose={active&&moving?'walking':'side'} /></div></foreignObject></g></>
}

export function AssignmentClassroomScene({ title, focus, expanded = false, mission }: { title: string; focus: string; expanded?: boolean; mission?: InvestigationMission }) {
  return <details open={expanded || undefined} className="my-4 min-w-0 rounded-xl border border-border bg-card px-3">
    <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold">Learn with your avatar</summary>
    <AssignmentExperiment mission={mission} id={title} title={title} focus={focus} interactive={false} />
  </details>
}
