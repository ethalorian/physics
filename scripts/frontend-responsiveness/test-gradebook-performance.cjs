const assert = require('node:assert/strict')
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), vm = require('node:vm')
const { buildSync } = require('esbuild')
const root = path.resolve(__dirname, '../..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'gradebook-performance-'))
const clone = value => JSON.parse(JSON.stringify(value))
const log = value => console.log('PASS ' + value)
function source(entry, options = {}) { return buildSync({ absWorkingDir: root, entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent', ...options }).outputFiles[0].text }
function load(entry) { const file = path.join(out, path.basename(entry) + '.cjs'); fs.writeFileSync(file, source(entry)); return require(file) }
const schema = load('src/lib/browser-performance.ts'), grades = load('src/lib/assessment-results/gradebook.ts'), { gradebookSummaries } = load('src/lib/assessment-results/render-summaries.ts')
const students = [{ id: 'example-a', name: 'Example A' }, { id: 'example-b', name: 'Example B' }]
const activities = [
  { key: 'zero', kind: 'quiz', dueAt: '2026-10-28', dateOnly: true, cells: { 'example-a': { state: 'reviewed', grade: { earned: 0, possible: 10 }, needsReview: false }, 'example-b': { state: 'excused' } } },
  { key: 'half', kind: 'quiz', dueAt: '2026-10-29T01:00:00Z', cells: { 'example-a': { state: 'reviewed', grade: { earned: 3.5, possible: 5 } }, 'example-b': { state: 'submitted', needsReview: true } } },
  { key: 'paper', kind: 'worksheet', cells: { 'example-a': { state: 'complete' }, 'example-b': { state: 'missing' } } },
  { key: 'absent', kind: 'reading', dueAt: 'legacy-bad-date', cells: {} },
  { key: 'pending', kind: 'quiz', cells: { 'example-a': { state: 'reviewed', needsReview: true, grade: { earned: 2, possible: 4 } }, 'example-b': { state: 'returned' } } },
]
for (const data of [null, { warnings: [] }, { warnings: [{ source: 'Grading terms' }] }, { warnings: [], termQuizTotals: { 'example-a': { earned: 0, possible: 20, percent: 0, count: 2 } } }]) {
  const untouched = clone({ activities, students, data }), result = gradebookSummaries(activities.slice(0, 3), activities, students, data)
  for (const activity of activities.slice(0, 3)) assert.deepEqual(result.activities.get(activity.key), { ...grades.assignmentStats(activity), due: activity.dueAt ? new Date(activity.dateOnly ? activity.dueAt + 'T12:00:00' : activity.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—' })
  for (const student of students) assert.deepEqual(result.students.get(student.id), { done: grades.completion(activities, student.id), total: data?.termQuizTotals?.[student.id] ?? (data?.warnings.some(w => w.source === 'Grading terms') ? { earned: 0, possible: 0, percent: null, count: 0 } : grades.quizTotal(activities, student.id)) })
  assert.deepEqual({ activities, students, data }, untouched)
}
const refreshed = clone(activities); refreshed[0].cells['example-a'].grade.earned = 10
assert.notDeepEqual(gradebookSummaries(activities, activities, students).students, gradebookSummaries(refreshed, refreshed, students).students)
assert.equal(gradebookSummaries(activities, activities, []).students.size, 0)
log('grade/completion summaries preserve zeroes, half-points, missing/excused/returned work, term totals/warnings and refreshed grades without modifying inputs')

const valid = { version: 1, scope: 'document', route: 'results', viewport: 'large', metrics: [{ name: 'INP', value: 73.12345 }] }
assert.equal(schema.parseBrowserPerformance(valid).metrics[0].value, 73.1)
for (const invalid of [null, [], {}, { ...valid, student: 'private' }, { ...valid, route: '/home?student=private' }, { ...valid, metrics: [{ name: 'INP', value: 1, entries: ['private'] }] }, { ...valid, metrics: [{ name: 'INP', value: -1 }] }, { ...valid, metrics: [{ name: 'INP', value: Infinity }] }, { ...valid, metrics: [{ name: 'INP', value: 3600001 }] }, { ...valid, metrics: [...valid.metrics, ...valid.metrics] }, { ...valid, scope: 'view' }, { ...valid, metrics: [] }, { ...valid, metrics: [{ name: 'OTHER', value: 1 }] }]) assert.equal(schema.parseBrowserPerformance(invalid), null)
assert.equal(schema.parseBrowserPerformance({ ...valid, scope: 'view', metrics: [{ name: 'LONG_TASK_COUNT', value: 0.5 }] }), null)
assert.equal(schema.browserPerformanceRoute('/admin/control-room', '?view=results&student=private&class=secret'), 'results')
assert.equal(schema.browserPerformanceRoute('/admin/control-room', '?view=interactive'), null)
assert.equal(schema.browserPerformanceRoute('/admin/readings/syllabus', ''), 'reading-calendar')
assert.equal(schema.browserPerformanceRoute('/admin/readings', '?view=syllabus&course_id=private'), 'reading-calendar')
assert.equal(schema.browserPerformanceRoute('/admin/readings', '?view=syllabus&step_id=private'), null)
assert.equal(schema.browserPerformanceRoute('/admin/interactive-assignments/calendar', '?course_id=private'), 'assignment-calendar')
assert.equal(schema.browserPerformanceRoute('/home', '?private=secret'), 'home')
assert.equal(schema.browserPerformanceRoute('/home/gradebook', '?student=private'), 'student-gradebook')
assert.equal(schema.browserPerformanceRoute('/lesson/private', ''), null)
log('closed telemetry schema rejects private/unknown fields, invalid values and mixed scopes; route labels discard all identifiers')

const clientSource = source('src/lib/browser-performance-client.ts')
function client(options = {}) {
  let now = 100, nextTimer = 0
  const calls = [], observers = [], intervals = new Map(), microtasks = [], documentListeners = new Map(), windowListeners = new Map()
  const document = { cookie: options.cookie ?? '', visibilityState: options.hidden ? 'hidden' : 'visible', addEventListener: (k, v) => documentListeners.set(k, v), removeEventListener: k => documentListeners.delete(k) }
  const navigator = { doNotTrack: options.dnt, globalPrivacyControl: options.gpc }
  class Observer {
    static supportedEntryTypes = options.types ?? ['longtask', 'event']
    constructor(fn) { this.fn = fn; this.records = []; observers.push(this) }
    observe(arg) { this.type = arg.type }
    takeRecords() { const result = this.records; this.records = []; return result }
    disconnect() { this.disconnected = true }
    emit(entries) { this.fn({ getEntries: () => entries }) }
  }
  const sandbox = { exports: {}, module: { exports: {} }, document, navigator, innerWidth: 1400, performance: { now: () => now }, URLSearchParams, PerformanceObserver: options.unsupported ? undefined : Observer, queueMicrotask: fn => microtasks.push(fn), setInterval: fn => { intervals.set(++nextTimer, fn); return nextTimer }, clearInterval: id => intervals.delete(id), window: { addEventListener: (k, v) => windowListeners.set(k, v), removeEventListener: k => windowListeners.delete(k) }, fetch: (url, init) => { calls.push({ url, ...init, body: JSON.parse(init.body) }); if (options.fail === 'throw') throw Error('offline'); return options.fail ? Promise.reject(Error('offline')) : Promise.resolve({ status: 204 }) } }
  vm.runInNewContext(clientSource, sandbox)
  const flushTasks = () => { for (const fn of microtasks.splice(0)) fn() }
  return { start: sandbox.module.exports.startBrowserPerformance, calls, observers, intervals, documentListeners, windowListeners, document, advance: ms => { now += ms }, tick: () => { for (const fn of intervals.values()) fn() }, hide: () => { document.visibilityState = 'hidden'; documentListeners.get('visibilitychange')?.() }, show: () => { document.visibilityState = 'visible'; documentListeners.get('visibilitychange')?.() }, pagehide: () => windowListeners.get('pagehide')?.(), flushTasks }
}
for (const blocked of [{ dnt: '1' }, { gpc: true }, { cookie: 'experience_preview=1' }]) {
  const fixture = client(blocked)
  // Resolve the exact marker from the app, not a duplicated cookie name.
  if (blocked.cookie) { const { EXPERIENCE_MARKER } = load('src/lib/experience.ts'); fixture.document.cookie = EXPERIENCE_MARKER + '=1' }
  assert.equal(fixture.start({ route: 'results', scope: 'view' }), null); assert.equal(fixture.observers.length, 0); assert.equal(fixture.calls.length, 0)
}
log('DNT, Global Privacy Control and role-preview sessions create no observers or telemetry requests')
const f = client(), view = f.start({ route: 'results', scope: 'view' })
f.observers[0].emit([{ entryType: 'longtask', startTime: 110, duration: 80 }])
f.observers[1].emit([{ entryType: 'event', startTime: 115, duration: 24, interactionId: 10, name: 'private-element' }, { entryType: 'event', startTime: 116, duration: 64, interactionId: 10 }])
f.advance(1000); f.hide(); f.pagehide(); f.flushTasks()
assert.equal(f.calls.length, 1)
const values = Object.fromEntries(f.calls[0].body.metrics.map(m => [m.name, m.value]))
assert.deepEqual(values, { OBSERVED_MS: 1000, LONG_TASK_COUNT: 1, LONG_TASK_TOTAL: 80, LONG_TASK_MAX: 80, INTERACTION_COUNT: 1, INTERACTION_MAX: 64 })
assert.equal(f.calls[0].credentials, 'omit'); assert.equal(f.calls[0].referrerPolicy, 'no-referrer'); assert.equal(f.calls[0].keepalive, true)
assert(!JSON.stringify(f.calls).includes('private-element')); assert(schema.parseBrowserPerformance(clone(f.calls[0].body)))
f.advance(60000); f.show(); f.advance(500); f.tick(); assert.equal(f.calls[1].body.metrics[0].value, 500)
f.hide(); f.flushTasks(); f.advance(60000); view.stop(); f.flushTasks(); assert.equal(f.calls.length, 2)
assert.equal(f.intervals.size, 0); assert.equal(f.documentListeners.size, 0); assert.equal(f.windowListeners.size, 0); assert(f.observers.every(o => o.disconnected))
log('visible windows aggregate long tasks and unique interactions, exclude hidden time, coalesce exit events and clean up completely')
const bounded = client(), boundedView = bounded.start({ route: 'home', scope: 'view' })
for (let n = 0; n < 30; n++) { bounded.advance(30000); bounded.tick() }
assert.equal(bounded.calls.length, 12); assert.equal(bounded.intervals.size, 0); assert(bounded.observers.every(o => o.disconnected)); boundedView.stop()
const unsupported = client({ unsupported: true }), unsupportedView = unsupported.start({ route: 'home', scope: 'view' }); unsupported.advance(30000); unsupported.tick(); unsupportedView.stop(); assert.equal(unsupported.calls.length, 0)
for (const fail of ['reject', 'throw']) { const offline = client({ fail }), reporter = offline.start({ route: 'results', scope: 'document' }); reporter.record({ name: 'INP', value: 64, entries: ['private'] }); offline.tick(); offline.tick(); reporter.stop(); assert.equal(offline.calls.length, 1) }
log('bounded traffic stops after 12 view batches; unsupported APIs and offline reporting never disrupt the app or retry')
const d = client(), doc = d.start({ route: 'home', scope: 'document' })
doc.record({ name: 'LCP', value: 125 }); doc.record({ name: 'LCP', value: 250 }); doc.record({ name: 'LONG_TASK_COUNT', value: 1 }); d.tick()
doc.record({ name: 'LCP', value: 999 }); doc.record({ name: 'INP', value: 56 }); d.hide(); d.flushTasks(); doc.stop()
assert.equal(d.calls.length, 2); assert.deepEqual(clone(d.calls[0].body.metrics), [{ name: 'LCP', value: 250 }]); assert.deepEqual(clone(d.calls[1].body.metrics), [{ name: 'INP', value: 56 }]); assert(d.calls.every(c => c.body.route === 'home' && c.body.scope === 'document'))
log('Web Vitals retain initial document attribution, take the latest pending value and send each metric once')
const late = client(), lateDoc = late.start({ route: 'results', scope: 'document' })
for (const name of ['TTFB', 'FCP', 'FID', 'LCP', 'CLS', 'INP']) { lateDoc.record({ name, value: 1 }); late.tick() }
assert.equal(late.calls.length, 6); assert.equal(late.calls.at(-1).body.metrics[0].name, 'INP'); assert.equal(late.intervals.size, 0); lateDoc.stop()
log('late CLS and INP reports are retained even when every Web Vital arrives in a separate batch')

const responseShim = path.join(out, 'next-server.cjs'); fs.writeFileSync(responseShim, 'exports.NextResponse=Response')
const apiSource = source('src/app/api/browser-performance/route.ts', { alias: { 'next/server': responseShim } }), messages = []
let apiNow = 100000
const apiSandbox = { module: { exports: {} }, exports: {}, Response, TextDecoder, Date: { now: () => apiNow }, console: { info: (...args) => messages.push(args) } }
vm.runInNewContext(apiSource, apiSandbox)
const post = (body = valid, headers = {}) => { const request = new Request('https://example.invalid/api/browser-performance', { method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }); request.nextUrl = new URL(request.url); return apiSandbox.module.exports.POST(request) }
;(async () => {
  assert.equal((await post()).status, 204); assert.equal(messages.length, 1); assert.deepEqual(JSON.parse(messages[0][1]), { ...schema.parseBrowserPerformance(valid), sampleRate: 1 })
  for (const [body, headers, status] of [[valid, { origin: 'https://other.invalid' }, 403], [valid, { 'content-type': 'text/plain' }, 415], ['x'.repeat(2049), {}, 413], ['bad json', {}, 400], [{ ...valid, grades: ['private'] }, {}, 400]]) assert.equal((await post(body, headers)).status, status)
  assert.equal(messages.length, 1)
  for (let n = 0; n < 150; n++) await post()
  assert.equal(messages.length, 120); apiNow += 60000; assert.equal((await post()).status, 204); assert.equal(messages.length, 121)
  assert.equal((await post()).headers.get('Cache-Control'), 'no-store')
  log('actual telemetry route enforces origin, content type, 2 KiB body, strict schema and 120 accepted batches per instance/minute without logging rejected content')
  console.log('8 focused groups passed; fictional data only, no external requests.')
})().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => fs.rmSync(out, { recursive: true, force: true }))
