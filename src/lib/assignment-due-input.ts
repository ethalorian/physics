export interface DueDateDraft { date: string; time: string }

/** Keep unfinished date/time edits out of the persisted ISO timestamp. */
export function dueDateDraft(value?: string | null): DueDateDraft {
  if (!value) return { date: '', time: '23:59' }
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return { date: '', time: '23:59' }
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
  return { date: local.slice(0, 10), time: local.slice(11, 16) }
}

export function dueDateValue({ date, time }: DueDateDraft): string | null {
  if (!date) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw Error('Choose a complete due date and time.')
  const [year, month, day] = date.split('-').map(Number), [hour, minute] = time.split(':').map(Number)
  const d = new Date(`${date}T${time}:00`)
  if (year < 2000 || year > 2100 || !Number.isFinite(d.getTime()) || d.getFullYear() !== year || d.getMonth() + 1 !== month || d.getDate() !== day || d.getHours() !== hour || d.getMinutes() !== minute) throw Error('Choose a valid due date and time in your time zone.')
  return d.toISOString()
}

export function dueDatePreview(value: DueDateDraft): string | null {
  try { return dueDateValue(value) } catch { return null }
}
