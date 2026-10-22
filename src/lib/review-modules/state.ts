export type ReviewField = { id: string; screen: number; label: string; kind: string }
export type ReviewManifest = { slug: string; title: string; total: number; fields: ReviewField[] }
export type ReviewState = { i: number; ans: Record<string, number | boolean>; num: Record<string, string>; done: Record<string, boolean>; responses: Record<string, string> }
export const emptyReviewState = (): ReviewState => ({ i: 0, ans: {}, num: {}, done: {}, responses: {} })
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
export function validateReviewState(value: unknown, manifest: ReviewManifest): value is ReviewState {
 if (!record(value) || !Number.isInteger(value.i) || Number(value.i) < 0 || Number(value.i) >= manifest.total) return false
 if (JSON.stringify(value).length > 180000 || Object.keys(value).some(k => !['i','ans','num','done','responses'].includes(k))) return false
 const fields = new Set(manifest.fields.map(f => f.id))
 for (const key of ['ans','num','done','responses']) {
  const map = value[key]; if (!record(map) || Object.keys(map).length > 40) return false
  for (const [id,v] of Object.entries(map)) {
   if (key === 'responses') { if (!fields.has(id) || typeof v !== 'string' || v.length > 12000) return false }
   else {
    if (!/^q([1-9]|1[0-8])$/.test(id)) return false
    if (key === 'num' && (typeof v !== 'string' || v.length > 200)) return false
    if (key === 'done' && typeof v !== 'boolean') return false
    if (key === 'ans' && typeof v !== 'boolean' && !(Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 3)) return false
   }
  }
 }
 return true
}
export function missingReviewFields(state: ReviewState, manifest: ReviewManifest) {
 return manifest.fields.filter(f => !state.responses[f.id]?.trim())
}
