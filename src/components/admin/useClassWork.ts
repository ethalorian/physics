'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { quizScheduleError } from '@/lib/quiz-schedule'
import type { ClassWorkData, ClassWorkItem } from '@/lib/class-work'

export async function classWorkRequest(url: string, body?: unknown, method = 'POST', signal?: AbortSignal) {
  const res = await fetch(url, { method: body === undefined ? 'GET' : method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), signal: signal ?? AbortSignal.timeout(20000) })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data) throw Error(data?.error ?? 'Could not save. Your changes are still here; please retry.')
  return data
}
export function useClassWork(classId: string | null) {
  const [data,setData] = useState<ClassWorkData|null>(null),[error,setError] = useState(''),[loading,setLoading] = useState(false)
  const request = useRef(0)
  const load = useCallback(async () => {
    if (!classId) return
    const version = ++request.current
    setLoading(true);setError('')
    try { const next = await classWorkRequest(`/api/class-work?class=${encodeURIComponent(classId)}`);if(version===request.current)setData(next) }
    catch(e) {if(version===request.current)setError((e as Error).message)}
    finally {if(version===request.current)setLoading(false)}
  },[classId])
  const invalidate=useCallback(()=>{request.current++},[])
  useEffect(()=>{void load();return invalidate},[load,invalidate])
  return {data:data?.courseId===classId?data:null,error,loading,load}
}
export async function saveClassWork(item:ClassWorkItem,classId:string,action:'due'|'close'|'open'|'schedule',fields:{due_at?:string|null;open_at?:string|null;close_at?:string|null;access?:string},request:typeof classWorkRequest=classWorkRequest) {
  if (action === 'due' && item.quizSchedule) { const error = quizScheduleError(fields.due_at ?? null, item.quizSchedule); if (error) throw Error(error) }
  if(item.kind==='homework'||item.kind==='lesson')return request(`/api/classes/${encodeURIComponent(classId)}/windows`,{lesson_id:item.sourceId,expected:item.window??null,...fields})
  if(item.kind==='interactive')return request('/api/interactive-assignments',{action:'calendar',course_id:classId,slug:item.sourceId,due_on:fields.due_at})
  if(item.kind==='quiz')return action==='due'?request(`/api/quizzes/${item.sourceId}/due-date`,{due_at:fields.due_at,version:item.version}):request(`/api/quizzes/${item.sourceId}`,{action:action==='open'?'reopen':'archive',version:item.version})
  if(item.kind==='reading')return request(`/api/readings/${item.sourceId}`,{action:action==='due'?'due-date':action==='open'?'reopen':'archive',version:item.version,...(action==='due'?{due_at:fields.due_at}:{})})
  if(item.kind==='vocabulary')return request('/api/vocab/tasks',{id:item.sourceId,...(action==='due'?{due_on:fields.due_at}:{active:action==='open'})},'PATCH')
  return request('/api/class-work',{courseId:classId,kind:item.kind,id:item.sourceId,action,due_at:fields.due_at,expectedDue:item.dueAt,expectedAccess:item.access},'PATCH')
}
