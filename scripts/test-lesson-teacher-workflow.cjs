const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..'),
  esbuild = require(path.join(root, 'node_modules/esbuild'))
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-teacher-'))
let state
class Query {
  constructor(table) {
    this.table = table
    this.filters = []
    this.singleRow = false
    this.action = null
  }
  select() {
    return this
  }
  eq(k, v) {
    this.filters.push((r) => r[k] === v)
    return this
  }
  in(k, v) {
    this.filters.push((r) => v.includes(r[k]))
    return this
  }
  order() {
    return this
  }
  maybeSingle() {
    this.singleRow = true
    return this
  }
  single() {
    this.singleRow = true
    return this
  }
  delete() {
    this.action = 'delete'
    return this
  }
  upsert(rows) {
    this.action = 'upsert'
    this.rows = Array.isArray(rows) ? rows : [rows]
    return this
  }
  then(resolve, reject) {
    try {
      if (
        state.fail === this.table ||
        state.fail === `${this.table}:${this.action}`
      )
        return Promise.resolve({
          data: null,
          error: new Error('Simulated database failure'),
        }).then(resolve, reject)
      const table = state.tables[this.table] ?? []
      let rows = table.filter((r) => this.filters.every((f) => f(r)))
      if (this.action === 'delete') {
        state.tables[this.table] = table.filter((r) => !rows.includes(r))
        state.writes++
        rows = []
      }
      if (this.action === 'upsert') {
        for (const row of this.rows) {
          const i = table.findIndex(
            (x) =>
              x.course_id === row.course_id && x.lesson_id === row.lesson_id,
          )
          if (i < 0) table.push(row)
          else table[i] = { ...table[i], ...row }
        }
        state.tables[this.table] = table
        state.writes++
        rows = this.rows
      }
      return Promise.resolve({
        data: this.singleRow ? (rows[0] ?? null) : rows,
        error: null,
      }).then(resolve, reject)
    } catch (e) {
      return Promise.reject(e).then(resolve, reject)
    }
  }
}
global.__release = { from: (t) => new Query(t) }
const plugin = {
  name: 'fixture',
  setup(b) {
    const mocks = {
      '@/lib/supabase':
        'export const supabaseAdmin={from:t=>global.__release.from(t)};',
      '@/lib/content-access': 'export const canEditArea=async()=>false;',
      '@/lib/api-auth': `const wrap=fn=>async(req,ctx)=>{try{return await fn(req,ctx)}catch{return new Response(JSON.stringify({error:'Database operation failed'}),{status:500})}};export const withAuth=wrap;export const withRole=(_roles,fn)=>wrap(async(req,ctx)=>['teacher','admin'].includes(ctx.role)?fn(req,ctx):new Response('{}',{status:403}));`,
      'next/server': `export const NextResponse={json:(d,o)=>new Response(JSON.stringify(d),{status:o?.status??200,headers:{'Content-Type':'application/json'}})};`,
    }
    b.onResolve({ filter: /.*/ }, (a) =>
      mocks[a.path] ? { path: a.path, namespace: 'mock' } : undefined,
    )
    b.onLoad({ filter: /.*/, namespace: 'mock' }, (a) => ({
      contents: mocks[a.path],
      loader: 'js',
    }))
  },
}
async function bundle(file, name) {
  const out = path.join(dir, name + '.cjs')
  await esbuild.build({
    entryPoints: [path.join(root, file)],
    outfile: out,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    plugins: [plugin],
    logLevel: 'silent',
  })
  return require(out)
}
const course = (
  id,
  program = 'physics',
  track = 'cpa',
  teacher_email = 'teacher@test',
) => ({ id, name: id, section: null, program, track, teacher_email })
const lesson = (id, unit_id = 'u1', n = 1, extra = {}) => ({
  id,
  title: id,
  slug: id,
  unit_id,
  unit: 'Legacy name',
  lesson_number: n,
  published: true,
  ...extra,
})
function reset() {
  state = {
    fail: null,
    writes: 0,
    tables: {
      courses: [
        course('cpa'),
        course('honors', 'physics', 'honors'),
        course('trades', 'trades'),
        course('other', 'physics', 'cpa', 'other@test'),
      ],
      units: [
        { id: 'u1', name: 'Motion', program: 'physics', order_index: 1 },
        { id: 'u2', name: 'Energy', program: 'physics', order_index: 2 },
        { id: 't1', name: 'Measuring', program: 'trades', order_index: 1 },
      ],
      lessons: [
        lesson('last', 'u2', 1),
        lesson('next', 'u1', 2),
        lesson('first'),
        lesson('honors-only', 'u1', 3, { visibility_track: 'honors' }),
        lesson('trades', 't1'),
        lesson('draft', 'u1', 4, { published: false }),
        lesson('orphan', 'missing'),
      ],
      lesson_class_windows: [],
    },
  }
}
const teacher = {
  role: 'teacher',
  realRole: 'teacher',
  scopeEmail: 'teacher@test',
  email: 'teacher@test',
}
const ctx = (courseId = 'cpa') => ({
  ...teacher,
  params: Promise.resolve({ courseId }),
})
const req = (body) =>
  new Request('http://local/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
let passed = 0
async function check(name, fn) {
  reset()
  await fn()
  passed++
  console.log('PASS ' + name)
}
;(async () => {
  const lib = await bundle('src/lib/lesson-release.ts', 'lib'),
    windows = await bundle(
      'src/app/api/classes/[courseId]/windows/route.ts',
      'windows',
    ),
    all = await bundle('src/app/api/lessons/[id]/open-all/route.ts', 'all'),
    board = await bundle('src/app/api/lesson-access/route.ts', 'board'),
    plans = await bundle('src/app/api/teacher/lesson-plans/route.ts', 'plans')
  await check('class board is owned, canonical and ordered', async () => {
    const d = await (await board.GET(req({}), teacher)).json()
    assert.equal(d.classes.length, 3)
    assert.equal(d.lessons.find((l) => l.id === 'first').unit, 'Motion')
    assert.ok(
      d.lessons.findIndex((l) => l.id === 'first') <
        d.lessons.findIndex((l) => l.id === 'next'),
    )
    assert.ok(
      d.lessons.findIndex((l) => l.id === 'next') <
        d.lessons.findIndex((l) => l.id === 'last'),
    )
    assert.equal(
      d.lessons.some((l) => l.id === 'draft'),
      false,
    )
  })
  await check(
    'next skips other curricula, expired and scheduled lessons',
    async () => {
      const d = await (await board.GET(req({}), teacher)).json()
      d.windows = {
        'cpa|first': {
          open_at: '2025-01-01T00:00:00Z',
          close_at: '2025-02-01T00:00:00Z',
        },
        'cpa|next': { open_at: '2099-01-01T00:00:00Z', close_at: null },
      }
      assert.equal(lib.releaseSummary(d, d.classes[0]).next.id, 'last')
      assert.equal(
        lib.releaseSummary(
          d,
          d.classes.find((c) => c.id === 'trades'),
        ).next.id,
        'trades',
      )
    },
  )
  await check('local schedule survives a round trip in Eastern time', () => {
    process.env.TZ = 'America/New_York'
    for (const iso of [
      '2026-09-08T12:00:00.000Z',
      '2026-01-08T13:00:00.000Z',
    ]) {
      const input = lib.toLocalDateTime(iso)
      assert.equal(input.slice(11), '08:00')
      assert.equal(new Date(input).toISOString(), iso)
    }
  })
  await check('all-null legacy windows match server open semantics', () =>
    assert.equal(lib.releaseStatus({ open_at: null, close_at: null }), 'open'),
  )
  await check(
    'cross-curriculum, hidden-track, orphan and draft releases never write',
    async () => {
      for (const id of ['trades', 'honors-only', 'orphan', 'draft'])
        assert.equal(
          (
            await windows.POST(
              req({ lesson_id: id, open_at: '2026-09-08T12:00:00Z' }),
              ctx(),
            )
          ).status,
          422,
        )
      assert.equal(state.writes, 0)
    },
  )
  await check('non-owner cannot open or close another class', async () => {
    for (const open_at of [null, '2026-09-08T12:00:00Z'])
      assert.equal(
        (await windows.POST(req({ lesson_id: 'first', open_at }), ctx('other')))
          .status,
        403,
      )
    assert.equal(state.writes, 0)
  })
  await check(
    'malformed timestamps and reversed windows rejected',
    async () => {
      for (const open_at of ['garbage', true, 12, '2026-09-08T08:00'])
        assert.equal(
          (await windows.POST(req({ lesson_id: 'first', open_at }), ctx()))
            .status,
          422,
        )
      assert.equal(
        (
          await windows.POST(
            req({
              lesson_id: 'first',
              open_at: '2026-09-09T12:00:00Z',
              close_at: '2026-09-08T12:00:00Z',
            }),
            ctx(),
          )
        ).status,
        422,
      )
      assert.equal(state.writes, 0)
    },
  )
  await check('open and close persist the selected class only', async () => {
    assert.equal(
      (
        await windows.POST(
          req({ lesson_id: 'first', open_at: '2026-09-08T12:00:00Z' }),
          ctx(),
        )
      ).status,
      200,
    )
    assert.equal(state.tables.lesson_class_windows.length, 1)
    assert.equal(state.tables.lesson_class_windows[0].course_id, 'cpa')
    assert.equal(
      (
        await windows.POST(
          req({ lesson_id: 'first', open_at: null, close_at: null }),
          ctx(),
        )
      ).status,
      200,
    )
    assert.equal(state.tables.lesson_class_windows.length, 0)
  })
  await check('failed delete is an error, not success', async () => {
    state.fail = 'lesson_class_windows:delete'
    assert.equal(
      (await windows.POST(req({ lesson_id: 'first' }), ctx())).status,
      500,
    )
    assert.equal(state.writes, 0)
  })
  await check(
    'board query failures are errors, not empty classes',
    async () => {
      state.fail = 'courses'
      assert.equal((await board.GET(req({}), teacher)).status, 500)
    },
  )
  await check('open-all releases only matching owned classes', async () => {
    const response = await all.POST(req({ action: 'open' }), {
      ...teacher,
      params: Promise.resolve({ id: 'honors-only' }),
    })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).count, 1)
    assert.equal(state.tables.lesson_class_windows[0].course_id, 'honors')
  })
  await check('invalid bulk action and draft rejected', async () => {
    for (const [id, action, code] of [
      ['first', 'oops', 400],
      ['draft', 'open', 422],
    ])
      assert.equal(
        (
          await all.POST(req({ action }), {
            ...teacher,
            params: Promise.resolve({ id }),
          })
        ).status,
        code,
      )
    assert.equal(state.writes, 0)
  })
  await check(
    'workflow links encode and carry class, lesson, unit and day',
    () => {
      const url = new URL(
        lib.lessonContextHref('/admin/teacher/plans', {
          class: 'class & 1',
          lesson: 'a',
          unit: 'u1',
          day: 2,
        }),
        'http://local',
      )
      assert.equal(url.searchParams.get('class'), 'class & 1')
      assert.equal(url.searchParams.get('lesson'), 'a')
      assert.equal(url.searchParams.get('day'), '2')
    },
  )
  await check(
    'teacher plans use selected class track and enforce ownership',
    async () => {
      const get = (id) =>
        plans.GET(
          new Request(
            'http://local/api/teacher/lesson-plans?unit_id=unit-1&course_id=' +
              id,
          ),
          teacher,
        )
      const own = await get('cpa')
      assert.equal(own.status, 200)
      assert.deepEqual((await own.json()).tracks, ['cpa'])
      const other = state.tables.courses.find(
        (c) => c.teacher_email !== 'teacher@test',
      )
      assert.ok(other)
      assert.equal((await get(other.id)).status, 403)
      assert.equal((await get('missing')).status, 404)
      state.fail = 'courses'
      assert.equal((await get('cpa')).status, 500)
      assert.equal(state.writes, 0)
    },
  )
  console.log(`${passed} teacher workflow regression scenarios passed.`)
})()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => fs.rmSync(dir, { recursive: true, force: true }))
