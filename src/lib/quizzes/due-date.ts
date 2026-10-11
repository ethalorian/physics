export interface QuizDueDateChange { due_at: string | null; version: number }

/** Dates arrive as UTC instants from the teacher's local date/time control. */
export function quizDueDateChange(value: unknown): QuizDueDateChange {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Choose a due date or clear it.')
  const v = value as Record<string, unknown>
  if (Object.keys(v).some(key => !['due_at', 'version'].includes(key))) throw Error('This editor changes only the due date.')
  if (!Number.isInteger(v.version) || Number(v.version) < 1 || Number(v.version) >= 2147483647) throw Error('Reload the quiz before editing its due date.')
  if (v.due_at !== null) {
    if (typeof v.due_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v.due_at)) throw Error('Enter a valid due date and time.')
    const date = new Date(v.due_at)
    if (!Number.isFinite(date.getTime()) || date.toISOString() !== v.due_at) throw Error('Enter a valid due date and time.')
  }
  return {due_at: v.due_at as string | null, version: Number(v.version)}
}

export function sameQuizDueDate(a: string | null, b: string | null): boolean {
  return a === b || a !== null && b !== null && Date.parse(a) === Date.parse(b)
}

export function localQuizDueDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
