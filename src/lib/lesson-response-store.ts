/** One student's lesson state. Kept outside React so request ordering and recovery are testable. */
import type { BlockResponseMap, SaveMeta } from '@/components/blocks/useBlockResponses'

export const draftStorageKey = (studentId: string, lessonId: string) =>
  `lesson-drafts:v2:${encodeURIComponent(studentId)}:${encodeURIComponent(lessonId)}`
type Draft = { response: unknown; block_type: string; updated_at: string }
type Drafts = Record<string, Draft>
export type ResponseSnapshot = { responses: BlockResponseMap; loaded: boolean; loadError: string | null; xpEarned: number; draftState: 'idle' | 'dirty' | 'saving' | 'saved' | 'offline' }
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

export class LessonResponseStore {
  private state: ResponseSnapshot = { responses: {}, loaded: false, loadError: null, xpEarned: 0, draftState: 'idle' }
  private listeners = new Set<() => void>()
  private pending: Drafts = {}
  private revisions: Record<string, number> = {}
  private queue: Promise<unknown> = Promise.resolve()
  private debounce?: ReturnType<typeof setTimeout>
  private maxWait?: ReturnType<typeof setTimeout>
  private controller = new AbortController()
  private loadNumber = 0
  private active = true
  constructor(readonly studentId: string, readonly lessonId: string,
    private isCurrent: () => boolean = () => true,
    private request: typeof fetch = (...args) => fetch(...args),
    private storage: () => Storage = () => localStorage) {}
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private current = () => this.active && this.isCurrent()
  private update(patch: Partial<ResponseSnapshot>) {
    if (!this.current()) return
    this.state = { ...this.state, ...patch }; this.listeners.forEach((f) => f())
  }
  private read(): Drafts {
    try {
      const raw: unknown = JSON.parse(this.storage().getItem(draftStorageKey(this.studentId, this.lessonId)) ?? '{}')
      if (!record(raw)) return {}
      return Object.fromEntries(Object.entries(raw).filter(([, d]) => record(d) && typeof d.block_type === 'string' && typeof d.updated_at === 'string' && Number.isFinite(Date.parse(d.updated_at)) && d.response !== undefined)) as Drafts
    } catch { return {} }
  }
  private write(drafts: Drafts) {
    try {
      const key = draftStorageKey(this.studentId, this.lessonId)
      if (Object.keys(drafts).length) this.storage().setItem(key, JSON.stringify(drafts))
      else this.storage().removeItem(key)
    } catch { /* Keep the in-memory draft if browser storage is unavailable. */ }
  }
  activate() { this.active = true; if (this.controller.signal.aborted) this.controller = new AbortController() }
  dispose() { this.active = false; this.loadNumber++; this.clearTimers(); this.controller.abort() }
  private clearTimers() { clearTimeout(this.debounce); clearTimeout(this.maxWait); this.debounce = undefined; this.maxWait = undefined }
  load = async () => {
    if (!this.current()) return
    const n = ++this.loadNumber
    this.update({ loaded: false, loadError: null })
    try {
      const query = new URLSearchParams({ lesson_id: this.lessonId, expected_user_id: this.studentId })
      const [a, b] = await Promise.all(['blocks', 'drafts'].map(async (kind) => {
        const r = await this.request(`/api/lessons/${kind}?${query}`, { signal: this.controller.signal, cache: 'no-store' })
        if (!r.ok) throw new Error('load')
        return r.json()
      }))
      if (!this.current() || n !== this.loadNumber) return
      if (!record(a.responses) || !record(b.drafts)) throw new Error('shape')
      const merged = { ...a.responses } as BlockResponseMap
      const at = (s?: string) => s ? Date.parse(s) || 0 : 0
      for (const [id, raw] of Object.entries(b.drafts)) {
        if (!record(raw) || typeof raw.updated_at !== 'string') throw new Error('shape')
        if (at(raw.updated_at) > at(merged[id]?.created_at)) merged[id] = { response: raw.response, created_at: raw.updated_at, draft: true }
      }
      // The server's visible capture IDs retire drafts from removed blocks or a prior track.
      const validIds = Array.isArray(b.valid_block_ids) ? new Set(b.valid_block_ids.filter((id: unknown): id is string => typeof id === 'string')) : null
      const recovered = this.read()
      // Never read the old, lesson-only key: its author cannot be established.
      for (const [id, d] of Object.entries(recovered)) {
        if (validIds && !validIds.has(id)) { delete recovered[id]; delete this.pending[id]; delete merged[id]; continue }
        if (at(d.updated_at) > at(merged[id]?.created_at)) {
          merged[id] = { response: d.response, created_at: d.updated_at, draft: true }
          this.pending[id] = d
        }
      }
      if (validIds) this.write(recovered)
      this.update({ responses: merged, loaded: true })
      if (Object.keys(this.pending).length) this.schedule()
    } catch {
      if (n === this.loadNumber) this.update({ loaded: false, loadError: 'Couldn’t load your saved work. Retry before editing.' })
    }
  }
  private schedule() {
    clearTimeout(this.debounce)
    this.debounce = setTimeout(() => { void this.flush() }, 1500)
    if (!this.maxWait) this.maxWait = setTimeout(() => { void this.flush() }, 6000)
  }
  draft = (id: string, blockType: string, response: unknown) => {
    if (!this.current() || !this.state.loaded || response === undefined || response === null) return
    this.revisions[id] = (this.revisions[id] ?? 0) + 1
    const d: Draft = { response, block_type: blockType, updated_at: new Date().toISOString() }
    this.pending[id] = d
    this.write({ ...this.read(), [id]: d })
    this.update({ responses: { ...this.state.responses, [id]: { response, created_at: d.updated_at, draft: true } }, draftState: 'dirty' })
    this.schedule()
  }
  flush = () => {
    this.clearTimers()
    const task = this.queue.then(async () => {
      if (!this.current()) return
      // The API accepts at most 40 rows. Keep large sketches out of keepalive's small body budget.
      const entries = Object.entries(this.pending).slice(0, 40)
      if (!entries.length) return
      this.update({ draftState: 'saving' })
      try {
        const body = JSON.stringify({ lesson_id: this.lessonId, expected_user_id: this.studentId, drafts: entries.map(([block_id, d]) => ({ block_id, block_type: d.block_type, response: d.response })) })
        const r = await this.request('/api/lessons/drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: this.controller.signal, keepalive: new TextEncoder().encode(body).length < 60000 })
        if (!r.ok || (await r.json()).saved !== entries.length) throw new Error('draft')
        if (!this.current()) return
        const local = this.read()
        for (const [id, d] of entries) {
          if (this.pending[id] === d) delete this.pending[id]
          if (JSON.stringify(local[id]) === JSON.stringify(d)) delete local[id]
        }
        this.write(local)
        this.update({ draftState: Object.keys(this.pending).length ? 'dirty' : 'saved' })
        if (Object.keys(this.pending).length) this.schedule()
      } catch { this.update({ draftState: 'offline' }) }
    })
    this.queue = task.catch(() => {})
    return task
  }
  save = (id: string, blockType: string, response: unknown, meta?: SaveMeta): Promise<boolean> => {
    if (!this.current() || !this.state.loaded) return Promise.resolve(false)
    this.draft(id, blockType, response)
    const revision = this.revisions[id]
    const task = this.queue.then(async () => {
      if (!this.current()) return false
      try {
        const r = await this.request('/api/lessons/blocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: this.controller.signal,
          body: JSON.stringify({ lesson_id: this.lessonId, expected_user_id: this.studentId, block_id: id, block_type: blockType, response, ...meta }) })
        if (!r.ok) return false
        const d = await r.json()
        if (!this.current()) return false
        if (typeof d.xp_awarded === 'number' && d.xp_awarded > 0) this.update({ xpEarned: this.state.xpEarned + d.xp_awarded })
        if (this.revisions[id] !== revision) return false
        delete this.pending[id]
        const local = this.read(); delete local[id]; this.write(local)
        this.update({ responses: { ...this.state.responses, [id]: { response: d.response ?? response, created_at: d.created_at ?? new Date().toISOString() } }, draftState: Object.keys(this.pending).length ? 'dirty' : 'saved' })
        return true
      } catch { return false }
    })
    this.queue = task.catch(() => {})
    return task
  }
}
