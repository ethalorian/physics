'use client'
import {simulationMission} from '@/lib/avatar/investigation-missions'
import {useMemo} from 'react'
import {AssignmentExperiment,useAssignmentAvatar} from './AssignmentAvatar'
import RaceTrackLab from '@/components/simulations/race-track/RaceTrackLab'
import {SimEmbedContext} from '@/components/simulations/embed-context'
import {decodeRaceTrials,encodeRaceTrials} from '@/lib/interactive-assignments/simulation-trials'
import type {LessonAssignment} from '@/lib/interactive-assignments/catalog'
import type {VelocityState} from '@/lib/interactive-assignments/velocity'
import s from './assignment.module.css'
import InvestigationLab from '@/components/simulations/investigations/InvestigationLab'
import {decodeLabTrials,encodeLabTrials,labTrialKey} from '@/lib/interactive-assignments/investigation-model'
import {investigationById} from '@/lib/interactive-assignments/investigation-definitions'
import CanvasExperimentLoader from '@/components/simulations/lab/CanvasExperimentLoader'
import {canvasSchema,canvasObservationKey,decodeCanvasObservations,encodeCanvasObservations} from '@/lib/interactive-assignments/canvas-observations'

export default function AssignmentSimulation({lesson,state,onChange,readOnly,visible,toolId="assignment-teaching-tool"}: {toolId?:string;lesson:LessonAssignment;state:VelocityState;onChange:(state:VelocityState)=>void;readOnly:boolean;visible:boolean}) {
  const classroom=useAssignmentAvatar(),experimentId='simulation-'+lesson.simulation
  const runningVisible=visible&&(!classroom||classroom.active===experimentId)
  const trials = useMemo(() => decodeRaceTrials(state.explorers?.['race-trials']), [state.explorers])
  const labId=lesson.simulation??'',lab=investigationById(labId)
  const labTrials=useMemo(()=>decodeLabTrials(labId,state.explorers?.[labTrialKey(labId)]),[labId,state.explorers])
  const observations=useMemo(()=>decodeCanvasObservations(labId,state.explorers?.[canvasObservationKey(labId)]),[labId,state.explorers])
  if(canvasSchema(labId))return <section id={toolId} tabIndex={-1} className={s.simulationTool} aria-label={`${lesson.title} simulation`}><AssignmentExperiment mission={simulationMission(labId,lesson.title)} id={experimentId} title={lesson.title} focus={lesson.sections[0]?.questions[0]?.prompt||lesson.title} visible={visible}><SimEmbedContext.Provider value={true}><CanvasExperimentLoader id={labId} trackActivity={false} visible={runningVisible} readOnly={readOnly} savedObservations={observations} onObservationsChange={next=>onChange({...state,explorers:{...state.explorers,[canvasObservationKey(labId)]:encodeCanvasObservations(labId,next)}})}/></SimEmbedContext.Provider></AssignmentExperiment></section>
  if(lab)return <section id={toolId} tabIndex={-1} className={s.simulationTool} aria-label={`${lab.title} simulation`}><AssignmentExperiment actorInModel={true} mission={simulationMission(labId,lab.question)} id={experimentId} title={lesson.title} focus={lesson.sections[0]?.questions[0]?.prompt || lesson.title} visible={visible}><SimEmbedContext.Provider value={true}><InvestigationLab id={labId} visible={runningVisible} savedTrials={labTrials} readOnly={readOnly} onTrialsChange={next=>onChange({...state,explorers:{...state.explorers,[labTrialKey(labId)]:encodeLabTrials(labId,next)}})}/></SimEmbedContext.Provider></AssignmentExperiment></section>
  if (lesson.simulation !== 'race-track') return <p role="alert">This simulation is unavailable.</p>
  return <section id={toolId} tabIndex={-1} className={s.simulationTool} aria-label="Race Track simulation">
    <AssignmentExperiment actorInModel={true} mission={simulationMission(labId,lesson.title)} id={experimentId} title={lesson.title} focus={lesson.sections[0]?.questions[0]?.prompt || lesson.title} visible={visible}><SimEmbedContext.Provider value={true}><RaceTrackLab visible={runningVisible} savedTrials={trials} readOnly={readOnly} onTrialsChange={next => onChange({...state,explorers:{...state.explorers,'race-trials':encodeRaceTrials(next)}})}/></SimEmbedContext.Provider></AssignmentExperiment>
  </section>
}
