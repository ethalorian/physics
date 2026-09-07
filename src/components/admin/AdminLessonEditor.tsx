'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LessonEditorNav from './LessonEditorNav'
import LessonVideoManager from './LessonVideoManager'
import { validateBlockDocument } from '@/data/block-registry'
import type { BlockDocument } from '@/data/content-blocks'
import type { GlossaryEntry } from '@/components/MathMarkdown'
import type { LessonVideo } from '@/types/assignment'

interface SettingsLesson {
  id: string
  title: string
  slug: string
  unit_id: string
  unit?: string
  lesson_number?: number
  estimated_time?: number
  description?: string
  content?: string
  content_blocks?: BlockDocument
  objectives?: unknown
  key_terms?: unknown
  hero_image?: string
  videos?: unknown
  published: boolean
}
interface Props {
  lesson: SettingsLesson
  targetCount?: number
  targets?: { id: string; slug: string; statement: string }[]
  units?: { id: string; name: string; program: string | null }[]
  canPublish?: boolean
}
const field =
  'min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm'
const button =
  'min-h-11 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50'
function array(value: unknown): unknown[] {
  try {
    const v = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
export default function AdminLessonEditor({
  lesson,
  targetCount = 0,
  targets = [],
  units = [],
  canPublish = false,
}: Props) {
  const router = useRouter()
  const [form, setForm] = useState(() => ({
    title: lesson.title ?? '',
    slug: lesson.slug ?? '',
    unit_id: lesson.unit_id ?? '',
    lesson_number: lesson.lesson_number ?? 1,
    estimated_time: lesson.estimated_time ?? 30,
    description: lesson.description ?? '',
    content: lesson.content ?? '',
    objectives: array(lesson.objectives).filter(
      (x): x is string => typeof x === 'string',
    ),
    hero_image: lesson.hero_image ?? '',
    published: lesson.published,
  }))
  const [terms, setTerms] = useState<GlossaryEntry[]>(() =>
    array(lesson.key_terms).filter((t): t is GlossaryEntry =>
      Boolean(t && typeof t === 'object' && 'term' in t && 'definition' in t),
    ),
  )
  const [termsTouched, setTermsTouched] = useState(false)
  const [videos, setVideos] = useState(
    () => array(lesson.videos) as LessonVideo[],
  )
  const [saved, setSaved] = useState(() => JSON.stringify({ form, terms }))
  const [savedPublished, setSavedPublished] = useState(lesson.published)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [courseId, setCourseId] = useState('')
  const json = JSON.stringify({ form, terms }),
    dirty = json !== saved
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  useEffect(() => {
    setCourseId(new URLSearchParams(window.location.search).get('class') ?? '')
  }, [])
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    const leave = (e: MouseEvent) => {
      const a = (e.target as Element)?.closest?.('a')
      if (
        dirtyRef.current &&
        a &&
        a.target !== '_blank' &&
        !a.getAttribute('href')?.startsWith('#') &&
        !window.confirm('Leave without saving lesson settings?')
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', unload)
    document.addEventListener('click', leave, true)
    return () => {
      window.removeEventListener('beforeunload', unload)
      document.removeEventListener('click', leave, true)
    }
  }, [])
  const buildHref = `/admin/lessons/${lesson.id}/build${courseId ? '?class=' + encodeURIComponent(courseId) : ''}`
  const check = (publishing: boolean) => {
    const issues = validateBlockDocument(
      lesson.content_blocks ?? { schemaVersion: 1, blocks: [] },
      publishing,
    ).map((i) => i.message)
    if (!form.title.trim()) issues.push('Give the lesson a title.')
    if (!units.some((u) => u.id === form.unit_id))
      issues.push('Choose a valid curriculum unit.')
    if (publishing && !lesson.content_blocks?.blocks.length)
      issues.push('Add student activities in Content.')
    if (publishing && !targetCount)
      issues.push(
        'Choose an assessment target on a student activity in Content.',
      )
    if (
      termsTouched &&
      terms.some((t) => !t.term.trim() || !t.definition.trim())
    )
      issues.push(
        'Each glossary term needs a term and definition, or remove its row.',
      )
    return issues
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (pending.current) return
    const issues = check(form.published)
    if (issues.length) {
      setError(issues.join(' '))
      return
    }
    pending.current = true
    setBusy(true)
    setError('')
    setNotice('')
    const sent = json,
      published = form.published
    try {
      const body = {
        ...form,
        ...(!canPublish ? { published: undefined } : {}),
        ...(termsTouched ? { key_terms: terms } : {}),
        hero_image: form.hero_image || null,
      }
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Could not save settings.')
      setSaved(sent)
      setSavedPublished(published)
      setNotice('Lesson settings saved.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save settings.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  async function upload(file: File) {
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'heroes')
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Upload failed.')
      setForm((f) => ({ ...f, hero_image: d.url }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }
  async function saveVideos(next: LessonVideo[]) {
    const res = await fetch(`/api/lessons/${lesson.id}/videos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videos: next }),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error ?? 'Could not save videos.')
    setVideos(next)
    setNotice('Legacy videos saved separately from lesson settings.')
  }
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-5">
      <LessonEditorNav
        lessonId={lesson.id}
        title={form.title || lesson.title}
        unitId={form.unit_id}
        day={form.lesson_number}
        published={savedPublished}
        active="edit"
      >
        <button
          form="lesson-settings"
          type="submit"
          disabled={busy || uploading}
          className={button + ' bg-primary text-primary-foreground'}
        >
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </LessonEditorNav>
      <p role="status" className="mb-4 text-sm text-muted-foreground">
        {dirty ? 'Unsaved settings' : notice || 'Settings saved'}
        {dirty && notice ? ' · ' + notice : ''}
      </p>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive p-3 text-sm"
        >
          <p>{error}</p>
          <Link className="underline" href={buildHref}>
            Open Content to fix activities and targets
          </Link>
        </div>
      )}
      <form id="lesson-settings" onSubmit={save} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <section className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Lesson details</h2>
            <label className="block text-sm">
              Title
              <input
                className={field}
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Curriculum unit
                <select
                  aria-label="Curriculum unit"
                  className={field}
                  required
                  value={form.unit_id}
                  onChange={(e) =>
                    setForm({ ...form, unit_id: e.target.value })
                  }
                >
                  <option value="">Choose a unit</option>
                  {!units.some((u) => u.id === form.unit_id) &&
                    form.unit_id && (
                      <option value={form.unit_id}>
                        Unknown unit — choose a replacement
                      </option>
                    )}
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.program ?? 'physics'} · {u.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Lesson / day number
                <input
                  className={field}
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={form.lesson_number}
                  onChange={(e) =>
                    setForm({ ...form, lesson_number: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <label className="block text-sm">
              Short description
              <textarea
                className={field}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label className="block max-w-xs text-sm">
              Estimated minutes
              <input
                className={field}
                type="number"
                min={1}
                required
                value={form.estimated_time}
                onChange={(e) =>
                  setForm({ ...form, estimated_time: Number(e.target.value) })
                }
              />
            </label>
          </section>
          <section className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="font-semibold">
              Assessment targets · {targetCount}
            </h2>
            <p className="text-sm text-muted-foreground">
              These targets connect student work to mastery review. Shared
              targets referenced by activities count too.
            </p>
            {targets.length > 0 ? (
              <ul className="list-inside list-disc text-sm">
                {targets.map((t) => (
                  <li key={t.id}>{t.statement}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">
                {targetCount
                  ? 'This lesson references shared targets. See activity targets in Content.'
                  : 'No assessment targets yet.'}
              </p>
            )}
            <Link
              className="inline-flex min-h-11 items-center text-sm underline"
              href={buildHref}
            >
              Choose targets on activities in Content
            </Link>
            <details>
              <summary className="cursor-pointer text-sm">
                Optional introductory objectives
              </summary>
              <p className="my-2 text-xs text-muted-foreground">
                Descriptive notes only. These do not attach assessment targets.
              </p>
              {form.objectives.map((v, i) => (
                <div key={i} className="my-2 flex gap-2">
                  <input
                    aria-label={`Objective ${i + 1}`}
                    className={field}
                    value={v}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        objectives: form.objectives.map((x, j) =>
                          i === j ? e.target.value : x,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    className={button}
                    onClick={() =>
                      setForm({
                        ...form,
                        objectives: form.objectives.filter((_, j) => i !== j),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={button}
                onClick={() =>
                  setForm({ ...form, objectives: [...form.objectives, ''] })
                }
              >
                Add objective
              </button>
            </details>
          </section>
          <section className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Curriculum publication</h2>
            <p className="text-sm text-muted-foreground">
              Published means ready for teachers to release. Class opening and
              closing dates are managed in Class access.
            </p>
            {canPublish ? (
              <label className="block text-sm">
                Status after saving
                <select
                  className={field}
                  value={form.published ? 'published' : 'draft'}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      published: e.target.value === 'published',
                    })
                    setError('')
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            ) : (
              <p className="text-sm">
                {savedPublished ? 'Published' : 'Draft'} · Only an administrator
                can change publication.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Publication checks run on save and explain what to fix.
            </p>
          </section>
          <details className="space-y-3 rounded-xl border bg-card p-4">
            <summary className="cursor-pointer font-semibold">
              Reader extras · glossary and cover image
            </summary>
            <p className="text-sm text-muted-foreground">
              The vocabulary editor in Content supplies the main lesson
              glossary. These optional extra terms are saved with settings.
            </p>
            {terms.map((t, i) => (
              <fieldset key={i} className="space-y-2 rounded-lg border p-3">
                <legend className="text-sm">Extra term {i + 1}</legend>
                <label className="block text-sm">
                  Term
                  <input
                    className={field}
                    value={t.term}
                    onChange={(e) => {
                      setTermsTouched(true)
                      setTerms(
                        terms.map((x, j) =>
                          i === j ? { ...x, term: e.target.value } : x,
                        ),
                      )
                    }}
                  />
                </label>
                <label className="block text-sm">
                  Definition
                  <textarea
                    className={field}
                    value={t.definition}
                    onChange={(e) => {
                      setTermsTouched(true)
                      setTerms(
                        terms.map((x, j) =>
                          i === j ? { ...x, definition: e.target.value } : x,
                        ),
                      )
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={button}
                  onClick={() => {
                    setTermsTouched(true)
                    setTerms(terms.filter((_, j) => i !== j))
                  }}
                >
                  Remove term
                </button>
              </fieldset>
            ))}
            <button
              type="button"
              className={button}
              onClick={() => {
                setTermsTouched(true)
                setTerms([...terms, { term: '', definition: '' }])
              }}
            >
              Add glossary term
            </button>
            <label className="block text-sm">
              Cover image URL
              <input
                className={field}
                value={form.hero_image}
                onChange={(e) =>
                  setForm({ ...form, hero_image: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Upload cover image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                disabled={uploading || busy}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void upload(f)
                  e.target.value = ''
                }}
              />
            </label>
            {uploading && <p role="status">Uploading cover image…</p>}
          </details>
          <details className="space-y-3 rounded-xl border bg-card p-4">
            <summary className="cursor-pointer font-semibold">
              Advanced · URL and legacy content
            </summary>
            <label className="block text-sm">
              Lesson URL slug
              <input
                className={field}
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Changing the slug changes the student link. Legacy Markdown and
              videos below are retained for compatibility; student lessons use
              the activities in Content.
            </p>
            <label className="block text-sm">
              Legacy Markdown
              <textarea
                className={field}
                rows={8}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </label>
          </details>
          <button
            type="submit"
            disabled={busy || uploading}
            className={button + ' bg-primary text-primary-foreground'}
          >
            {busy ? 'Saving…' : 'Save settings'}
          </button>
        </fieldset>
      </form>
      <details>
        <summary className="cursor-pointer text-sm">
          Legacy videos · saved separately
        </summary>
        <LessonVideoManager
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          initialVideos={videos}
          onSave={saveVideos}
        />
      </details>
    </div>
  )
}
