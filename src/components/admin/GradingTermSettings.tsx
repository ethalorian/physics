'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, CalendarRange, ListFilter, Plus, Trash2 } from 'lucide-react'
import { useLearningResource } from '@/app/home/useLearningWeek'
import { assignedGradingTerm, assignmentTermDay, gradingSettingsError, termDateLabel, type GradingSettings, type GradingTerm } from '@/lib/grading-terms'
import { RESULT_KINDS, type ResultActivity } from '@/lib/assessment-results/types'
import { useAssessmentReviewGuard } from './useAssessmentReviewGuard'
import s from './GradingTermSettings.module.css'

type TermActivity = Pick<ResultActivity, 'key' | 'title' | 'kind' | 'unitIds' | 'dueAt' | 'archived'>
type TermData = { courseId: string; settings: GradingSettings; activities: TermActivity[]; units: { id: string; name: string }[]; warnings: { source: string; message: string }[] }
export default function GradingTermSettings({ classId }: { classId: string | null }) {
  if (!classId) return <section className={s.empty}><h2>Choose a class to set its grading terms</h2><p>Each class has its own term dates and assignment placement.</p></section>
  return <TermEditor key={classId} classId={classId}/>
}
function TermEditor({ classId }: { classId: string }) {
  const resource = useLearningResource<TermData>('/api/grading-terms?class=' + encodeURIComponent(classId))
  const { data: session } = useSession(), readOnly = !!session?.experience
  const [draft, setDraft] = useState<GradingSettings | null>(null), [saved, setSaved] = useState<GradingSettings | null>(null)
  const [tab, setTab] = useState<'dates' | 'placement'>('dates'), [query, setQuery] = useState(''), [page, setPage] = useState(0)
  const [saving, setSaving] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved)
  useAssessmentReviewGuard(dirty || saving)
  useEffect(() => { if (resource.data && !dirty && !saving) { setDraft(resource.data.settings); setSaved(resource.data.settings) } }, [resource.data, dirty, saving])
  const activities = resource.data?.activities ?? []
  const filtered = activities.filter(a => (a.title + ' ' + RESULT_KINDS[a.kind]).toLowerCase().includes(query.trim().toLowerCase()))
  const pages = Math.max(1, Math.ceil(filtered.length / 25)), currentPage = Math.min(page, pages - 1)
  function editTerm(id: string, field: keyof Omit<GradingTerm, 'id'>, value: string) {
    setDraft(old => old && ({ ...old, terms: old.terms.map(t => t.id === id ? { ...t, [field]: value } : t) })); setError(''); setNotice('')
  }
  function removeTerm(id: string) {
    if (!draft) return
    const removed = Object.values(draft.placements).filter(term => term === id).length
    setDraft({ ...draft, terms: draft.terms.filter(t => t.id !== id), placements: Object.fromEntries(Object.entries(draft.placements).filter(([, term]) => term !== id)) })
    setNotice(removed ? `${removed} assignment placements will return to Automatic when you save.` : 'Term removed from this draft. Save to apply.'); setError('')
  }
  function addTerm() {
    if (!draft) return
    let number = 1; while (draft.terms.some(t => t.name === 'Term ' + number)) number++
    setDraft({ ...draft, terms: [...draft.terms, { id: crypto.randomUUID(), name: 'Term ' + number, start: '', end: '' }] }); setNotice(''); setError('')
  }
  async function save() {
    if (!draft || saving) return
    const validation = gradingSettingsError(draft)
    if (validation) { setError(validation); return }
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/grading-terms', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: classId, settings: draft }) })
      const result = await response.json()
      if (!response.ok) throw Error(result.error || 'Could not save grading terms.')
      setSaved(result.settings); setDraft(result.settings)
      resource.setData(old => old && ({ ...old, settings: result.settings }))
      setNotice('Grading terms saved. Gradebooks now use these dates and placements.')
    } catch (failure) { setError((failure as Error).message) }
    finally { setSaving(false) }
  }
  return <section className={s.workspace} aria-label="Grading terms">
    <header className={s.heading}><div><h2>Grading terms</h2><p>Define the grading periods for this class.</p></div><Link href={'/admin/control-room?' + new URLSearchParams({ view: 'results', resultView: 'gradebook', class: classId, unit: 'all' })}><ArrowLeft size={15}/> Back to gradebook</Link></header>
    <nav className={s.tabs} aria-label="Grading term settings"><button type="button" aria-current={tab === 'dates' ? 'page' : undefined} onClick={() => setTab('dates')}><CalendarRange size={16}/> Term dates</button><button type="button" aria-current={tab === 'placement' ? 'page' : undefined} onClick={() => setTab('placement')}><ListFilter size={16}/> Assignment placement</button></nav>
    <p className={s.intro}>Start and end dates are included, using Eastern time. Due dates choose the default term; you can place an assignment in a different term without changing its deadline.</p>
    {readOnly && <p className={s.notice}>Preview only. Grading settings cannot be changed in this view.</p>}
    {resource.error && <p role="alert" className={s.error}>Grading settings could not load. <button onClick={resource.refresh}>Try again</button></p>}
    {resource.data?.warnings.map(w => <p key={w.source} role="alert" className={s.error}>{w.source}: assignment placement may be incomplete. <button onClick={resource.refresh}>Refresh assignments</button></p>)}
    {!draft ? <p role="status">{resource.loading ? 'Loading grading terms…' : 'No grading settings loaded.'}</p> : <form onSubmit={event => { event.preventDefault(); void save() }}>
      <fieldset disabled={saving || readOnly}>
        <div className={s.bar}><span>{tab === 'dates' ? 'Grading periods' : 'Assignment placement · All units'}</span><span>{dirty ? 'Unsaved changes' : 'Saved settings'}</span></div>
        {tab === 'dates' ? <>
          {!draft.terms.length && <div className={s.empty}><h3>No grading terms yet</h3><p>Add your first term and choose its dates. Students can view all released scores until terms are set.</p></div>}
          {draft.terms.map(term => <div className={s.term} key={term.id}>
            <label>Term name<input value={term.name} maxLength={60} onChange={e => editTerm(term.id, 'name', e.target.value)} required/></label>
            <label>Start date<input type="date" min="2000-01-01" max="2199-12-31" value={term.start} onChange={e => editTerm(term.id, 'start', e.target.value)} required/></label>
            <label>End date<input type="date" min={term.start || '2000-01-01'} max="2199-12-31" value={term.end} onChange={e => editTerm(term.id, 'end', e.target.value)} required/></label>
            <button type="button" className={s.remove} aria-label={'Remove ' + term.name} onClick={() => removeTerm(term.id)}><Trash2 size={16}/></button>
            <p className={s.preview}>{activities.filter(a => assignedGradingTerm(a, draft)?.id === term.id).length} assignments in this term</p>
          </div>)}
        </> : <>
          <label className={s.search}>Find an assignment<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0) }} placeholder="Title or assignment type"/></label>
          <div className={s.tableWrap}><table><thead><tr><th>Assignment</th><th>Due date</th><th>Grading term</th></tr></thead><tbody>{filtered.slice(currentPage * 25, currentPage * 25 + 25).map(a => {
            const automatic = assignedGradingTerm(a, { ...draft, placements: {} })
            return <tr key={a.key}><td><strong>{a.title}</strong><small>{RESULT_KINDS[a.kind]}{a.archived ? ' · Archived' : ''}</small></td><td>{a.dueAt ? termDateLabel(assignmentTermDay(a.dueAt) ?? '') : 'No due date'}</td><td><label><span className="sr-only">Grading term for {a.title}</span><select value={draft.placements[a.key] ?? 'auto'} onChange={e => { const placements = { ...draft.placements }; if (e.target.value === 'auto') delete placements[a.key]; else placements[a.key] = e.target.value; setDraft({ ...draft, placements }); setNotice(''); setError('') }}><option value="auto">Automatic · {automatic?.name ?? 'No matching term'}</option>{draft.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><small>{draft.placements[a.key] ? 'Teacher placement · Due date unchanged' : 'Uses the assignment due date'}</small></td></tr>
          })}</tbody></table></div>
          {!filtered.length && <p className={s.empty}>No assignments match this search.</p>}
          {pages > 1 && <div className={s.pagination}><button type="button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</button><span role="status">Page {currentPage + 1} of {pages}</span><button type="button" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>Next</button></div>}
        </>}
        <div className={s.actions}>{tab === 'dates' && <button type="button" className={s.link} onClick={addTerm} disabled={draft.terms.length >= 40}><Plus size={16}/> Add term</button>}<div><button type="button" onClick={() => { setDraft(saved); setError(''); setNotice('') }} disabled={!dirty}>Cancel</button><button className={s.primary} type="submit" disabled={!dirty}>{saving ? 'Saving…' : 'Save grading terms'}</button></div></div>
      </fieldset>
      {error && <p role="alert" className={s.error}>{error} <button type="button" onClick={() => { if (!dirty || window.confirm('Discard these edits and load the saved settings?')) { setDraft(null); setSaved(null); resource.setData(null); resource.refresh(); setError('') } }}>Reload saved settings</button></p>}
      {notice && <p role="status" className={s.notice}>{notice}</p>}
    </form>}
    <p className={s.rule}>Quiz scores use total earned points divided by possible points from released quizzes in the term, across all units. Late submissions stay with their assigned term. Unreleased scores are excluded.</p>
  </section>
}
