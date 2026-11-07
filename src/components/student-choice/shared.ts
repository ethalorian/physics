'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

export async function choiceFetch<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' })
  const data = await response.json()
  if (!response.ok) throw Error(data.error ?? 'Could not load Student Choice. Please try again.')
  return data
}

export function useChoiceData<T>(url: string) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const request = useRef(0)
  const load = useCallback(async () => {
    const current = ++request.current
    setLoading(true); setError('')
    try { const result = await choiceFetch<T>(url); if (current === request.current) setData(result) }
    catch (e) { if (current === request.current) setError((e as Error).message) }
    finally { if (current === request.current) setLoading(false) }
  }, [url])
  useEffect(() => {
    setData(null); void load()
    // Invalidate any in-flight response, including a manual reload after the effect started.
    const invalidate = () => { request.current++ }
    return invalidate
  }, [load])
  return { data, error, loading, load }
}
