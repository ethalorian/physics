'use client'
import {useEffect} from 'react'
import {useLearningResource} from '@/app/home/useLearningWeek'
import s from './ResultsWorkspace.module.css'
type Status={enabled:boolean;waiting:number;retrying:number;attention:number;lastStartedAt:string|null}
export default function AutomaticGradingStatus(){
 const {data,error,refresh}=useLearningResource<Status>('/api/assessment-results/automatic')
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')refresh()},30000);return()=>clearInterval(timer)},[refresh])
 if(error)return <p role="status">Automatic grading status is unavailable. <button onClick={refresh}>Check again</button></p>
 if(!data)return null
 const stale=data.enabled&&(!data.lastStartedAt||Date.now()-Date.parse(data.lastStartedAt)>5*60000)
 return <aside className={s.suggestions} aria-label="Automatic grading status"><strong>{data.enabled?'Automatic grading across your active classes':'Automatic grading is not enabled for this account'}</strong>{data.enabled&&<p>{data.waiting?`${data.waiting} submissions preparing suggestions · ${data.retrying} retrying · ${data.attention} need attention.`:'All eligible submitted work has private suggestions.'}{stale?' The background worker has not checked in recently.':''}</p>}{data.attention>0&&<p>Some submissions still need attention after six attempts. Open their review to retry or make your own decisions.</p>}<p>Scores, mastery suggestions and feedback stay private until you choose and release them. Paper-only work needs recorded evidence.</p></aside>
}
