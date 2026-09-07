'use client'

import type { InlineQuestion, SeiScaffold } from '@/data/content-blocks'
const input = 'w-full min-w-0 rounded-lg border bg-background p-2 text-sm'
const languages = { es: 'Spanish', pt: 'Portuguese', ht: 'Haitian Creole', ar: 'Arabic', zh: 'Chinese', vi: 'Vietnamese', fr: 'French' }

export function QuestionEditor({ value, onChange }: { value: unknown; onChange: (v: InlineQuestion) => void }) {
  const q = (value && typeof value === 'object' ? value : { prompt: '' }) as InlineQuestion
  const options = q.options ?? []
  return <div className="space-y-3">
    <label className="block text-sm">Question prompt<textarea aria-label="Question prompt" className={input} rows={3} value={q.prompt ?? ''} onChange={(e) => onChange({ ...q, prompt: e.target.value })} /></label>
    <label className="block text-sm">Explanation prompt (optional)<input className={input} value={q.explain ?? ''} onChange={(e) => onChange({ ...q, explain: e.target.value })} /></label>
    <p className="text-xs text-muted-foreground">Leave choices empty for a written answer. Add choices for multiple choice.</p>
    {options.map((option, i) => <fieldset key={option.id} className="rounded-lg border p-2 space-y-2">
      <legend className="text-sm">Choice {i + 1}</legend>
      <label className="block text-sm">Answer text<input className={input} value={option.text} onChange={(e) => onChange({ ...q, options: options.map((o) => o.id === option.id ? { ...o, text: e.target.value } : o) })} /></label>
      <label className="block text-sm">Feedback<textarea className={input} value={option.feedback ?? ''} onChange={(e) => onChange({ ...q, options: options.map((o) => o.id === option.id ? { ...o, feedback: e.target.value } : o) })} /></label>
      <label className="flex gap-2 text-sm"><input type="radio" name={`correct-${options.map((o) => o.id).join('-')}`} checked={q.correctOptionId === option.id} onChange={() => onChange({ ...q, correctOptionId: option.id })} />Correct answer</label>
      <button type="button" className="text-sm underline" onClick={() => onChange({ ...q, correctOptionId: q.correctOptionId === option.id ? undefined : q.correctOptionId, options: options.filter((o) => o.id !== option.id) })}>Remove choice {i + 1}</button>
    </fieldset>)}
    <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => onChange({ ...q, options: [...options, { id: crypto.randomUUID(), text: '', feedback: '' }] })}>Add answer choice</button>
  </div>
}

export function BlockSettingsEditor({ data, capture, onPatch, targets = [] }: { targets?: {id:string;slug:string;statement:string}[]; data: Record<string, unknown>; capture: boolean; onPatch: (patch: Record<string, unknown>) => void }) {
  const sei = (data.sei ?? {}) as SeiScaffold
  const updateSei = (patch: Partial<SeiScaffold>) => onPatch({ sei: { ...sei, ...patch } })
  return <div className="space-y-3">
    <details open><summary className="cursor-pointer text-sm font-semibold">Learning target and checkpoint</summary>
      <div className="mt-2 space-y-2">
        <label className="block text-sm">Assessment target<select className={input} value={String(data.targetId ?? '')} onChange={e => onPatch({targetId:e.target.value||undefined})}><option value="">Choose a target</option>{data.targetId && !targets.some(t => t.slug === data.targetId || t.id === data.targetId) ? <option value={String(data.targetId)}>Shared target: {String(data.targetId)}</option> : null}{targets.map(t => <option key={t.id} value={data.targetId === t.id ? t.id : t.slug}>{t.statement}</option>)}</select></label><details><summary className="cursor-pointer text-xs">Advanced target reference</summary><label className="block text-sm">Target ID or slug<input className={input} value={String(data.targetId ?? '')} onChange={e => onPatch({targetId:e.target.value||undefined})}/></label></details>
        {capture && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={data.gate === true} onChange={(e) => onPatch({ gate: e.target.checked })} />Require this answer before the next section</label>}
        {capture && <label className="block text-sm">XP for completing this answer<input className={input} type="number" min={0} value={typeof data.xp === 'number' ? data.xp : ''} onChange={(e) => onPatch({ xp: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })} /></label>}
      </div>
    </details>
    {capture && <details><summary className="cursor-pointer text-sm font-semibold">Language support</summary>
      <div className="mt-2 space-y-3">
        {([1, 2, 3] as const).map((level) => <label key={level} className="block text-sm">Sentence frame — level {level}<textarea className={input} rows={2} value={sei.frames?.find((f) => f.level === level)?.text ?? ''} onChange={(e) => updateSei({ frames: [...(sei.frames ?? []).filter((f) => f.level !== level), ...(e.target.value ? [{ level, text: e.target.value }] : [])] })} /></label>)}
        <label className="block text-sm">Word bank (one word or phrase per line)<textarea className={input} rows={3} value={(sei.wordBank ?? []).join('\n')} onChange={(e) => updateSei({ wordBank: e.target.value.split('\n') })} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={sei.talkFirst === true} onChange={(e) => updateSei({ talkFirst: e.target.checked })} />Partner rehearsal before answering</label>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">Translated prompts</legend>
          {Object.entries(languages).map(([lang, name]) => <label key={lang} className="block text-sm">{name}<textarea className={input} rows={2} value={sei.prompt_l1?.[lang as keyof typeof languages] ?? ''} onChange={(e) => updateSei({ prompt_l1: { ...sei.prompt_l1, [lang]: e.target.value } })} /></label>)}
        </fieldset>
        <label className="block text-sm">Support image URL<input className={input} value={sei.visual && 'src' in sei.visual ? sei.visual.src : ''} onChange={(e) => updateSei({ visual: e.target.value ? { src: e.target.value, alt: sei.visual && 'alt' in sei.visual ? sei.visual.alt : '' } : undefined })} /></label>
        {sei.visual && 'src' in sei.visual && <label className="block text-sm">Support image description<input className={input} value={sei.visual.alt} onChange={(e) => { if (sei.visual && 'src' in sei.visual) updateSei({ visual: { ...sei.visual, alt: e.target.value } }) }} /></label>}
      </div>
    </details>}
  </div>
}
