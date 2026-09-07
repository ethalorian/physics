'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  appliesToClass,
  classLabel,
  lessonLabel,
  lessonContextHref,
  releaseStatus,
  releaseSummary,
  toLocalDateTime,
  validateReleaseWindow,
  type ReleaseClass,
  type ReleaseLesson,
} from '@/lib/lesson-release'
import { useLessonRelease } from './useLessonRelease'

const button =
  'inline-flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50'
const field =
  'min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm'
export default function LessonReleasePanel({
  courseId: fixedClass,
  compact = false,
}: {
  courseId?: string
  compact?: boolean
}) {
  const { data, error, setError, busy, now, load, save } = useLessonRelease()
  const [courseId, setCourseId] = useState(fixedClass ?? '')
  const [lessonId, setLessonId] = useState('')
  const [requestedPlan, setRequestedPlan] = useState<{
    unit: string | null
    day: number | null
  }>({ unit: null, day: null })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [matrix, setMatrix] = useState(false)
  const [schedule, setSchedule] = useState<{
    course: ReleaseClass
    lesson: ReleaseLesson
    open: string
    close: string
    originalOpen: string | null
    originalClose: string | null
  } | null>(null)
  const [notice, setNotice] = useState('')
  const [timezone, setTimezone] = useState('local time')
  const [batch, setBatch] = useState<
    { course: ReleaseClass; lesson: ReleaseLesson }[] | null
  >(null)
  const [batchBusy, setBatchBusy] = useState(false)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    setCourseId(fixedClass ?? sp.get('class') ?? '')
    setLessonId(sp.get('lesson') ?? '')
    setRequestedPlan({
      unit: sp.get('unit'),
      day: sp.has('day') ? Number(sp.get('day')) : null,
    })
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [fixedClass])
  const course =
    data?.classes.find((c) => c.id === courseId) ??
    (!courseId ? data?.classes[0] : undefined)
  const summary = data && course ? releaseSummary(data, course, now) : null
  const selected =
    summary?.lessons.find((l) => l.id === lessonId) ??
    (!lessonId
      ? requestedPlan.unit && requestedPlan.day !== null
        ? summary?.lessons.find(
            (l) =>
              l.unit_id === requestedPlan.unit &&
              l.lesson_number === requestedPlan.day,
          )
        : (summary?.open.at(-1) ?? summary?.next ?? summary?.lessons[0])
      : undefined)
  const ctx = {
    class: course?.id,
    lesson: selected?.id,
    unit: selected?.unit_id,
    day: selected?.lesson_number,
  }
  const href = (path: string) => lessonContextHref(path, ctx)
  const choose = (id: string, cid = course?.id ?? '') => {
    setCourseId(cid)
    setLessonId(id)
    setRequestedPlan({ unit: null, day: null })
    setNotice('')
    const lesson = data?.lessons.find((l) => l.id === id)
    const url = lessonContextHref(window.location.pathname, {
      class: cid,
      lesson: id,
      unit: lesson?.unit_id,
      day: lesson?.lesson_number,
    })
    const old = new URLSearchParams(window.location.search)
    const next = new URL(url, window.location.origin)
    if (old.has('tab')) next.searchParams.set('tab', old.get('tab')!)
    window.history.replaceState(null, '', next.pathname + next.search)
  }
  const editSchedule = (c: ReleaseClass, l: ReleaseLesson) => {
    setNotice('')
    setError('')
    const w = data?.windows[`${c.id}|${l.id}`]
    setSchedule({
      course: c,
      lesson: l,
      open: toLocalDateTime(w?.open_at ?? null),
      close: toLocalDateTime(w?.close_at ?? null),
      originalOpen: w?.open_at ?? null,
      originalClose: w?.close_at ?? null,
    })
  }
  async function setAccess(c: ReleaseClass, l: ReleaseLesson, open: boolean) {
    setNotice('')
    if (
      await save(c.id, l.id, {
        open_at: open ? new Date().toISOString() : null,
        close_at: null,
      })
    )
      setNotice(
        `${lessonLabel(l)} is ${open ? 'open' : 'closed'} for ${classLabel(c)}.`,
      )
  }
  async function saveSchedule() {
    if (!schedule) return
    // Preserve seconds and the original DST offset when a field is unchanged.
    const convert = (input: string, original: string | null) =>
      input === toLocalDateTime(original)
        ? original
        : input && Number.isFinite(Date.parse(input))
          ? new Date(input).toISOString()
          : input
            ? 'invalid'
            : null
    const open_at = convert(schedule.open, schedule.originalOpen),
      close_at = convert(schedule.close, schedule.originalClose)
    const invalid = validateReleaseWindow(open_at, close_at)
    if (invalid) {
      setError(invalid)
      return
    }
    if (
      await save(schedule.course.id, schedule.lesson.id, { open_at, close_at })
    ) {
      setNotice('Access schedule saved.')
      setSchedule(null)
    }
  }
  async function runBatch() {
    if (!batch || batchBusy) return
    setBatchBusy(true)
    const failures: typeof batch = []
    let count = 0
    for (const item of batch) {
      if (
        await save(item.course.id, item.lesson.id, {
          open_at: new Date().toISOString(),
          close_at: null,
        })
      )
        count++
      else failures.push(item)
    }
    setBatchBusy(false)
    setBatch(failures.length ? failures : null)
    setNotice(
      `Opened ${count} ${count === 1 ? 'class' : 'classes'}.${failures.length ? ` ${failures.length} failed; retry the remaining classes below.` : ''}`,
    )
  }
  if (!data)
    return (
      <section className="rounded-xl border bg-card p-5">
        <p role={error ? 'alert' : 'status'}>
          {error || 'Loading lesson access…'}
        </p>
        {error && (
          <button className={button} onClick={() => void load()}>
            Retry
          </button>
        )}
      </section>
    )
  if (!data.classes.length)
    return (
      <section className="rounded-xl border p-5">
        No classes found.{' '}
        <Link className="underline" href="/admin/roster">
          Open roster and classes
        </Link>
      </section>
    )
  const locked = busy || batchBusy
  return (
    <section
      aria-label="Class lesson workflow"
      className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {compact ? 'Teach a lesson' : 'Lesson access'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose a lesson, check its student view, then open it for your
            class.
          </p>
        </div>
        {compact && (
          <Link href={href('/admin/lesson-access')} className={button}>
            Full access board
          </Link>
        )}
      </div>
      {error && !schedule && (
        <p role="alert" className="text-sm text-destructive">
          {error}{' '}
          <button
            className="underline"
            disabled={locked}
            onClick={() => void load()}
          >
            Refresh access
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg bg-secondary p-3 text-sm">
          {notice}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Class
          <select
            className={field}
            disabled={Boolean(fixedClass) || locked}
            value={course?.id ?? courseId}
            onChange={(e) => choose('', e.target.value)}
          >
            <option value="" disabled>
              Choose a class
            </option>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {classLabel(c)} · {c.program ?? 'physics'} · {c.track ?? 'CPA'}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Lesson
          <select
            className={field}
            disabled={locked}
            value={selected?.id ?? lessonId}
            onChange={(e) => choose(e.target.value)}
          >
            <option value="" disabled>
              Choose a lesson
            </option>
            {summary?.lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.unit} · {lessonLabel(l)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!course && (
        <p role="alert">
          This class is not available in your current teacher scope. Choose one
          of your classes.
        </p>
      )}
      {course && !selected && (
        <p role="status">
          This lesson is not available for this class. Choose a published lesson
          above.
        </p>
      )}
      {course && selected && (
        <>
          <div>
            <h3 className="text-lg font-semibold">{lessonLabel(selected)}</h3>
            <p className="text-sm text-muted-foreground">
              {selected.unit} · {course.program ?? 'physics'} ·{' '}
              {course.track ?? 'CPA'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border px-3 py-1">
              Curriculum: Published
            </span>
            <span className="rounded-full border px-3 py-1 capitalize">
              This class:{' '}
              {releaseStatus(data.windows[`${course.id}|${selected.id}`], now)}
            </span>
            <span className="px-1 py-1 text-muted-foreground">
              {summary?.open.length} lessons open
            </span>
          </div>
          {(() => {
            const win = data.windows[`${course.id}|${selected.id}`]
            return (
              win && (
                <p className="text-sm">
                  {win.open_at
                    ? `Opens ${new Date(win.open_at).toLocaleString()}`
                    : 'Open immediately'}
                  {win.close_at
                    ? ` · Closes ${new Date(win.close_at).toLocaleString()}`
                    : ' · No closing date'}{' '}
                  ({timezone})
                </p>
              )
            )
          })()}
          <div className="flex flex-wrap gap-2">
            <Link
              className={button}
              href={href(`/admin/lessons/${selected.id}/preview`)}
            >
              Student preview
            </Link>
            <Link className={button} href={href('/admin/teacher/plans')}>
              Teacher plan
            </Link>
            {releaseStatus(data.windows[`${course.id}|${selected.id}`], now) ===
            'scheduled' ? (
              <button
                className={button}
                disabled={locked}
                onClick={() => editSchedule(course, selected)}
              >
                Change schedule
              </button>
            ) : (
              <button
                className={`${button} bg-primary text-primary-foreground`}
                disabled={locked}
                onClick={() =>
                  void setAccess(
                    course,
                    selected,
                    releaseStatus(
                      data.windows[`${course.id}|${selected.id}`],
                      now,
                    ) !== 'open',
                  )
                }
              >
                {busy
                  ? 'Saving…'
                  : releaseStatus(
                        data.windows[`${course.id}|${selected.id}`],
                        now,
                      ) === 'open'
                    ? 'Close for this class'
                    : 'Open for this class'}
              </button>
            )}
            <button
              className={button}
              disabled={locked}
              onClick={() => editSchedule(course, selected)}
            >
              Schedule access
            </button>
            <Link className={button} href={href('/admin/command-center')}>
              Teach
            </Link>
            <Link className={button} href={href('/admin/control-room')}>
              Review submissions
            </Link>
            {data.canEdit && (
              <Link
                className={button}
                href={href(`/admin/lessons/${selected.id}/build`)}
              >
                Edit lesson
              </Link>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Published means ready for teachers to release. Students also need
            enrollment in a matching curriculum and track.
          </p>
          {summary?.next && (
            <button
              className="min-h-11 text-left text-sm underline"
              disabled={locked}
              onClick={() => choose(summary.next!.id)}
            >
              Suggested next: {lessonLabel(summary.next)} — select
            </button>
          )}
        </>
      )}
      {!compact && (
        <details
          open={matrix}
          onToggle={(e) => setMatrix(e.currentTarget.open)}
          className="border-t pt-4"
        >
          <summary className="cursor-pointer font-medium">
            All classes and lessons
          </summary>
          {matrix && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <input
                  aria-label="Search lessons"
                  placeholder="Search lessons or units…"
                  className={field + ' sm:max-w-sm'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  aria-label="Access status"
                  className={field + ' sm:max-w-48'}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {['all', 'open', 'scheduled', 'closed', 'ended'].map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'All statuses' : s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Published lessons and access by matching class
                  </caption>
                  <thead>
                    <tr>
                      <th className="p-3">Lesson</th>
                      {data.classes.map((c) => (
                        <th key={c.id} className="min-w-40 p-3">
                          {classLabel(c)}
                        </th>
                      ))}
                      <th className="p-3">Matching classes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lessons
                      .filter(
                        (l) =>
                          `${l.unit} ${lessonLabel(l)}`
                            .toLowerCase()
                            .includes(query.toLowerCase()) &&
                          (filter === 'all' ||
                            data.classes.some(
                              (c) =>
                                appliesToClass(l, c) &&
                                releaseStatus(
                                  data.windows[`${c.id}|${l.id}`],
                                  now,
                                ) === filter,
                            )),
                      )
                      .map((l) => (
                        <tr key={l.id} className="border-t">
                          <th className="min-w-64 p-3 font-medium">
                            {lessonLabel(l)}
                            <span className="block text-xs text-muted-foreground">
                              {l.program ?? 'Unit needs repair'} · {l.unit}
                            </span>
                          </th>
                          {data.classes.map((c) => (
                            <td key={c.id} className="p-2">
                              {appliesToClass(l, c) ? (
                                <button
                                  className={button + ' capitalize'}
                                  disabled={locked}
                                  onClick={() => editSchedule(c, l)}
                                  aria-label={`${lessonLabel(l)}, ${classLabel(c)}: ${releaseStatus(data.windows[`${c.id}|${l.id}`], now)}. Schedule access`}
                                >
                                  {releaseStatus(
                                    data.windows[`${c.id}|${l.id}`],
                                    now,
                                  )}
                                </button>
                              ) : (
                                <span aria-label="Not in this class’s curriculum or track">
                                  —
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="p-2">
                            <button
                              className={button}
                              disabled={
                                locked ||
                                !data.classes.some((c) => appliesToClass(l, c))
                              }
                              onClick={() =>
                                setBatch(
                                  data.classes
                                    .filter((c) => appliesToClass(l, c))
                                    .map((course) => ({ course, lesson: l })),
                                )
                              }
                            >
                              Open for matching classes (
                              {
                                data.classes.filter((c) => appliesToClass(l, c))
                                  .length
                              }
                              )
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </details>
      )}
      {batch && (
        <div
          className="space-y-3 rounded-xl border p-4"
          role="region"
          aria-label="Confirm class release"
        >
          <p className="font-medium">
            Open {batch[0]?.lesson.title} now for these classes?
          </p>
          <p className="text-sm">
            This replaces their current opening and closing dates.
          </p>
          <ul className="list-inside list-disc text-sm">
            {batch.map((x) => (
              <li key={x.course.id}>{classLabel(x.course)}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              className={button}
              disabled={locked}
              onClick={() => void runBatch()}
            >
              {batchBusy ? 'Opening…' : 'Open listed classes'}
            </button>
            <button
              className={button}
              disabled={locked}
              onClick={() => setBatch(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {schedule && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !locked) setSchedule(null)
          }}
        >
          <DialogContent className="max-w-md">
            <DialogTitle>Schedule access</DialogTitle>
            <DialogDescription>
              {lessonLabel(schedule.lesson)} · {classLabel(schedule.course)}
            </DialogDescription>
            <p className="text-xs text-muted-foreground">
              Times in {timezone}. Blank opening means now; both blank closes
              access.
            </p>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <label className="block text-sm">
              Opens
              <input
                type="datetime-local"
                className={field}
                disabled={locked}
                value={schedule.open}
                onChange={(e) =>
                  setSchedule({ ...schedule, open: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Closes
              <input
                type="datetime-local"
                className={field}
                disabled={locked}
                value={schedule.close}
                onChange={(e) =>
                  setSchedule({ ...schedule, close: e.target.value })
                }
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className={button + ' bg-primary text-primary-foreground'}
                disabled={locked}
                onClick={() => void saveSchedule()}
              >
                {busy ? 'Saving…' : 'Save schedule'}
              </button>
              <button
                className={button}
                disabled={locked}
                onClick={async () => {
                  if (
                    await save(schedule.course.id, schedule.lesson.id, {
                      open_at: null,
                      close_at: null,
                    })
                  ) {
                    setSchedule(null)
                    setNotice('Access closed.')
                  }
                }}
              >
                Close access
              </button>
              <button
                className={button}
                disabled={locked}
                onClick={() => {
                  setSchedule(null)
                  setError('')
                }}
              >
                Cancel
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}
