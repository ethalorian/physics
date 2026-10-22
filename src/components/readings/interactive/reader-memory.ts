import type { InteractiveChapterDefinition } from './reader-contract'

export type CheckAttempt = { choice: number; firstChoice: number; attempts: number; hinted: boolean; correct: boolean }
export type ReaderMemory = { version: 1; notes: Record<string, string>; checks: Record<string, CheckAttempt>; last: string; size: 'normal' | 'large'; reflection: string }
export const emptyMemory = (): ReaderMemory => ({ version: 1, notes: {}, checks: {}, last: 'opening', size: 'normal', reflection: '' })
/** Browser storage is optional and untrusted. It never supplies graded answers or mastery ratings. */
export function parseMemory(raw: string | null, chapter: InteractiveChapterDefinition): ReaderMemory {
  try {
    const x = JSON.parse(raw || 'null')
    if (!x || x.version !== 1) return emptyMemory()
    const result = emptyMemory()
    result.size = x.size === 'large' ? 'large' : 'normal'
    result.last = ['opening', 'synthesis', ...chapter.sections.map(s => s.id)].includes(x.last) ? x.last : 'opening'
    result.reflection = typeof x.reflection === 'string' ? x.reflection.slice(0, 4000) : ''
    for (const s of chapter.sections) {
      if (typeof x.notes?.[s.id] === 'string') result.notes[s.id] = x.notes[s.id].slice(0, 4000)
      const c = x.checks?.[s.id], max = s.check.options.length
      if (c && Number.isInteger(c.choice) && c.choice >= 0 && c.choice < max && Number.isInteger(c.firstChoice) && c.firstChoice >= 0 && c.firstChoice < max && Number.isInteger(c.attempts) && c.attempts > 0) result.checks[s.id] = { choice: c.choice, firstChoice: c.firstChoice, attempts: c.attempts, hinted: c.hinted === true, correct: c.choice === s.check.correct }
    }
    return result
  } catch { return emptyMemory() }
}
