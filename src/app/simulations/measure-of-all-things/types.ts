// Shared state, persistence, and chapter metadata for
// "The Measure of All Things" — an immersive metric-system quest.

export const SIM_SLUG = 'measure-of-all-things'
export const SAVE_KEY = 'measure-of-all-things-save-v1'
export const MASTERY_THRESHOLD = 80 // % on the final mission for the mastery badge

export interface GameState {
  version: 1
  /** Index of the chapter the student is currently on (0–5). */
  current: number
  /** Completion flags per chapter. */
  done: boolean[]
  /** Best score (0–100) on the final mission, or null if not attempted. */
  missionBest: number | null
  startedAt: number
}

export const CHAPTER_COUNT = 6

export interface ChapterMeta {
  id: number
  year: string
  title: string
  subtitle: string
}

export const CHAPTERS: ChapterMeta[] = [
  { id: 0, year: '1789', title: 'A Kingdom of Confusion', subtitle: 'Why France needed one measure' },
  { id: 1, year: '1792', title: 'Measuring the Earth', subtitle: 'Where the meter comes from' },
  { id: 2, year: '1795', title: 'The Ladder of Ten', subtitle: 'Prefixes and the power of the decimal' },
  { id: 3, year: '1795', title: 'Water Ties It Together', subtitle: 'The liter, the gram, the kilogram' },
  { id: 4, year: '1793', title: 'The Clock That Failed', subtitle: 'Decimal time, the second, and speed' },
  { id: 5, year: '1799', title: 'The Final Mission', subtitle: 'Prove yourself a citizen-inspector' },
]

export function freshGame(): GameState {
  return {
    version: 1,
    current: 0,
    done: new Array(CHAPTER_COUNT).fill(false),
    missionBest: null,
    startedAt: Date.now(),
  }
}

export function loadGame(): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (parsed.version !== 1 || !Array.isArray(parsed.done)) return null
    // Defensive: pad/trim the done array if chapter count changed between versions.
    const done = new Array(CHAPTER_COUNT).fill(false).map((_, i) => Boolean(parsed.done[i]))
    return { ...parsed, done, current: Math.min(Math.max(0, parsed.current), CHAPTER_COUNT - 1) }
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked — gameplay continues, resume just won't work.
  }
}

export function clearGame(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(SAVE_KEY)
  } catch {
    // ignore
  }
}
