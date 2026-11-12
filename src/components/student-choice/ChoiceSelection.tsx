'use client'
import { useState } from 'react'
import { useAssignmentLeaveGuard } from '@/hooks/useAssignmentLeaveGuard'
import { choicePracticePrintPath, type BinderDay, type StudentChoiceSelection } from '@/lib/student-choice'
import { choiceFetch } from './shared'
import ChoiceCarousel from './ChoiceCarousel'
import s from '@/components/quizzes/Quiz.module.css'
import c from './StudentChoice.module.css'

export default function ChoiceSelection({ id, packet, selection, locked, required, reload }: { id: string; packet: BinderDay; selection?: StudentChoiceSelection; locked: boolean; required: number; reload: () => Promise<void> }) {
  const [saved, setSaved] = useState(selection), [selected, setSelected] = useState<number[]>(selection?.option_numbers ?? [])
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const dirty = selected.join(',') !== (saved?.option_numbers ?? []).join(',')
  useAssignmentLeaveGuard(dirty)
  const printPath = saved && (saved.option_numbers.length === required || locked) ? choicePracticePrintPath(packet, saved.option_numbers) : null
  function toggle(option: number) { setNotice(''); setSelected(items => items.includes(option) ? items.filter(n => n !== option) : items.length < required ? [...items, option].sort((a, b) => a - b) : items) }
  async function save() {
    if (selected.length !== required || locked || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await choiceFetch<{ selection: StudentChoiceSelection }>(`/api/student-choice-assignments/${id}`, { action: 'select', option_numbers: selected, version: saved?.version ?? 0 })
      setSaved(result.selection); setSelected(result.selection.option_numbers); setNotice('Your choices are saved. Print and complete the pages, then bring your paper to your teacher.')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <div className={s.stack}>
    <ChoiceCarousel packet={packet} required={required} selected={selected} onToggle={toggle} disabled={locked || busy} />
    <section className={`${s.stack} ${c.selection}`} aria-label="Your practice choices"><h3>Your practice choices <span className={s.muted}>· {selected.length} of {required}</span></h3>
      {selected.length ? <ul className={c.selectedList}>{selected.map(n => <li key={n}><span><strong>Option {n}</strong> · {packet.options[n - 1].title}</span><button type="button" className={s.link} disabled={locked || busy} onClick={() => toggle(n)} aria-label={`Remove option ${n} from your choices`}>Remove</button></li>)}</ul> : <p>Browse the {packet.options.length} pages and choose {required}.</p>}
      {saved && saved.option_numbers.length !== required && <p role="status">Your teacher now requires {required} practice {required === 1 ? "page" : "pages"}. Your {saved.option_numbers.length} saved choices are still here.{locked ? " Your teacher has already recorded your paper." : " Update your choices and save again."}</p>}{error && <p className={s.error} role="alert">{error} <button onClick={() => void reload()}>Reload assignment</button></p>}{notice && <p role="status" className={s.notice}>{notice}</p>}
      {locked ? <p>Your choices are read-only while this assignment is archived or your teacher has recorded your paper.</p> : <div className={s.actions}><button className={s.button} disabled={busy || selected.length !== required || !dirty} onClick={() => void save()}>{busy ? 'Saving…' : `Save my ${required} ${required === 1 ? 'choice' : 'choices'}`}</button><span role="status">{dirty ? 'Unsaved choices' : saved ? `${saved.option_numbers.length} choices saved` : `Choose ${required} to save`}</span></div>}
      {printPath && <a className={s.button} href={printPath} download>Download my {saved?.option_numbers.length} saved practice {saved?.option_numbers.length === 1 ? 'page' : 'pages'} (PDF)</a>}
      {saved && <p className={s.muted}>Saved options: {saved.option_numbers.join(', ')}.{dirty ? ' Save your changes to update the print packet.' : ''} Your teacher reviews the paper and chooses your letter grade.</p>}
    </section>
  </div>
}
