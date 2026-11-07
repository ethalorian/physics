const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { AsyncLocalStorage } = require('node:async_hooks');
const root = path.resolve(__dirname, '../..');
const { build } = require(root + '/node_modules/esbuild');
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const fx = global.backendFixture = { rows: {}, calls: [], fail: new Set(), context: new AsyncLocalStorage(), lesson: null };
function query(table) {
  let fields = '*', head = false, filters = [], sort = [], start = 0, end = Infinity, single = false;
  const conditions = [];
  const q = {
    select(value = '*', options = {}) { fields = value; head = !!options.head; return q; },
    eq(k, v) { conditions.push(['eq', k, v]); if (!k.startsWith('courses.course_students.')) filters.push(r => r[k] === v); return q; },
    neq(k, v) { filters.push(r => r[k] !== v); return q; },
    is(k, v) { filters.push(r => (r[k] ?? null) === v); return q; },
    in(k, vs) { conditions.push(['in', k, vs]); filters.push(r => vs.includes(r[k])); return q; },
    contains(k, vs) { filters.push(r => vs.every(v => (r[k] ?? []).includes(v))); return q; },
    or(expression) {
      if (expression !== 'published.eq.true,published_at.not.is.null') throw Error('Unsupported fixture expression: ' + expression);
      filters.push(r => r.published === true || r.published_at != null); return q;
    },
    order(k, options = {}) { sort.push([k, options.ascending !== false]); return q; },
    range(a, b) { start = a; end = b + 1; return q; },
    limit(n) { end = n; return q; },
    maybeSingle() { single = true; return q; },
    single() { single = true; return q; },
    then(resolve, reject) {
      try {
        fx.calls.push({ table, fields, conditions: structuredClone(conditions), start, end });
        const joinedMembership = table === 'present_sessions' && fields.includes('courses!inner(course_students!inner(student_id))');
        if (fx.fail.has(table) || (joinedMembership && (fx.fail.has('courses') || fx.fail.has('course_students')))) return Promise.resolve({ data: null, count: null, error: { message: 'Injected database failure' } }).then(resolve, reject);
        let rows = (fx.rows[table] ?? []).filter(r => filters.every(f => f(r)));
        if (table === 'course_students' && fields.includes('courses(')) rows = rows.map(r => {
          const course = fx.rows.courses?.find(c => c.id === r.course_id);
          const embed = c => course ? { ...course, ...c } : c;
          return { ...r, courses: Array.isArray(r.courses) ? r.courses.map(embed) : r.courses ? embed(r.courses) : course ?? null };
        });
        if (joinedMembership) rows = rows.flatMap(r => {
          const course = fx.rows.courses?.find(c => c.id === r.course_id);
          const memberFilters = conditions.filter(([, k]) => k.startsWith('courses.course_students.'));
          const members = (fx.rows.course_students ?? []).filter(m => m.course_id === r.course_id && memberFilters.every(([, k, v]) => m[k.split('.').at(-1)] === v));
          return course && members.length ? [{ ...r, courses: { course_students: members.map(m => ({ student_id: m.student_id })) } }] : [];
        });
        const count = rows.length;
        rows = rows.toSorted((a, b) => { for (const [k, asc] of sort) { const c = String(a[k] ?? '').localeCompare(String(b[k] ?? '')); if (c) return asc ? c : -c; } return 0; }).slice(start, end);
        // Split top-level projection columns while preserving embedded relations.
        const columns = fields.split(/,(?![^()]*\))/).map(c => c.trim());
        const project = r => fields === '*' ? structuredClone(r) : Object.fromEntries(columns.map(c => {
          if (c === 'draft:response->>draft') return ['draft', r.response?.draft == null ? null : String(r.response.draft)];
          const k = c.split('(')[0].replace('!inner', ''); return [k, structuredClone(r[k])];
        }));
        const data = head ? null : single ? rows[0] ? project(rows[0]) : null : rows.map(project);
        const call = fx.calls.at(-1); call.bytes = Buffer.byteLength(JSON.stringify(data));
        return Promise.resolve(fx.onRead?.(call)).then(() => ({ data, count, error: null })).then(resolve, reject);
      } catch (error) { return Promise.reject(error).then(resolve, reject); }
    },
  };
  return q;
}
fx.db = { from: query, async rpc(name, args) {
  assertReadRpc(name);
  const call = { table: name, fields: 'read-only RPC', conditions: args, bytes: 0 }; fx.calls.push(call);
  if (fx.fail.has(name)) return { data: null, error: Error('Injected RPC failure') };
  await fx.onRead?.(call);
  return { data: structuredClone(fx.rows[name] ?? []), error: null };
} };
function assertReadRpc(name) {
  if (!['daily_review_missing', 'daily_lesson_missing'].includes(name)) throw Error('Unexpected RPC: ' + name);
}
const mocks = {
  'server-only': '',
  '@/lib/supabase': 'export const supabaseAdmin={from:(...args)=>global.backendFixture.db.from(...args),rpc:(...args)=>global.backendFixture.db.rpc(...args)};',
  '@/lib/lookup-database': 'export const lookupDatabase={from:(...args)=>global.backendFixture.db.from(...args)};',
  'next/server': `export class NextRequest extends Request {constructor(url, options){super(url,options);this.nextUrl=new URL(url)}};export const NextResponse={json:(value,options)=>Response.json(value,options)};export const after=()=>{throw Error('Unexpected background mutation in read-only fixture')};`,
  '@/lib/auth': 'export const auth=async()=>global.backendFixture.context.getStore()?.session??null;',
  '@/lib/effective-context': `export const getEffectiveContext=async()=>{const ctx=global.backendFixture.context.getStore();if(ctx.failContext)throw Error('Injected context failure');return ctx};`,
  '@/lib/content-access': 'export const canEditArea=async()=>false;',
  '@/lib/mastery-student-work': `export const getMasteryStudentWork=async()=>Response.json(global.backendFixture.masteryWork??{work:[],targets:[]});`,
  '@/lib/present-server': 'export const classLesson=async()=>structuredClone(global.backendFixture.lesson);',
  '@/lib/review-modules/server': `export const REVIEW_SLUGS=['review-test'];export const canAccessReview=async()=>true;export const reviewManifest=async()=>({fields:[{id:'q',label:'Explain'}]});`,
  '@/lib/review-modules/rubric-server': `export const reviewCriteria=()=>[{id:'q',expected:'A reason'}];`,
  '@/lib/assessment-results/suggestions-server': `export const suggestionEvidence=async()=>({targetIds:[]});`,
};
async function bundle(name, contents, baseline) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'backend-performance-'));
  const outfile = path.join(out, name + '.cjs');
  await build({ stdin: { contents, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', outfile, plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /.*/ }, a => {
      const key = /(?:^|\/)supabase$/.test(a.path) ? '@/lib/supabase' : a.path;
      return Object.hasOwn(mocks, key) ? { path: key, namespace: 'fixture' } : undefined;
    });
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: mocks[a.path], loader: 'js' }));
    if (baseline) b.onLoad({ filter: /\.(ts|tsx)$/ }, a => {
      const old = path.join(baseline, path.relative(root, a.path));
      return fs.existsSync(old) ? { contents: fs.readFileSync(old, 'utf8'), loader: a.path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: path.dirname(a.path) } : undefined;
    });
  } }] });
  return require(outfile);
}
function reset(rows = {}) { fx.rows = structuredClone(rows); fx.calls = []; fx.fail.clear(); }
function context(user = uuid(2), role = 'student') {
  return { userId: user, email: role === 'student' ? 'student@example.test' : 'teacher@example.test', scopeEmail: 'teacher@example.test', role, realRole: role, viewingAsTeacher: false, session: { user: { id: user, email: role === 'student' ? 'student@example.test' : 'teacher@example.test', name: 'Fictional Student' } }, params: Promise.resolve({}) };
}
module.exports = { fx, root, uuid, bundle, reset, context };
