'use client'
import { readingState, type ReadingWork } from '@/lib/textbook-assignments'
import styles from './readings.module.css'

export async function readingFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error ?? (r.status === 401 ? 'Sign in to continue.' : 'Could not load this reading. Please retry.'))
  return data as T
}
export function ReadingStatus({ work }: { work?: ReadingWork | null }) {
  return <span className={styles.badge} data-state={work?.state}>{readingState(work)}</span>
}
export function dueLabel(due: string | null) {
  return due ? `Due ${new Date(due).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'No due date'
}
export const RATING_LABELS = ['Not yet', 'Almost', 'Got it']
