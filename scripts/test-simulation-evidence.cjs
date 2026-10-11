/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."),
  out = fs.mkdtempSync(path.join(os.tmpdir(), "sim-evidence-"));
const fixture = (global.simEvidenceFixture = {
  tables: {},
  optional: false,
  lessonAllowed: true,
  owner: "teacher@test",
  role: "student",
  fail: false,
  inserted: [],
  calls: [],
});
class Query {
  constructor(t) {
    this.t = t;
    this.filters = [];
    this.one = false;
  }
  select() {
    return this;
  }
  eq(k, v) {
    this.filters.push((r) => r[k] === v);
    return this;
  }
  in(k, v) {
    this.filters.push((r) => v.includes(r[k]));
    return this;
  }
  is(k, v) {
    return this.eq(k, v);
  }
  order() {
    return this;
  }
  limit(n) {
    this.n = n;
    return this;
  }
  maybeSingle() {
    this.one = true;
    return this;
  }
  single() {
    this.one = true;
    return this;
  }
  update(v) {
    this.change = v;
    return this;
  }
  insert(v) {
    fixture.inserted.push([this.t, v]);
    return this;
  }
  then(resolve, reject) {
    let rows = (fixture.tables[this.t] ?? []).filter((r) =>
      this.filters.every((f) => f(r)),
    );
    if (this.change) rows.forEach((r) => Object.assign(r, this.change));
    if (this.n) rows = rows.slice(0, this.n);
    return Promise.resolve({
      data: this.one ? (rows[0] ?? null) : rows,
      error: fixture.fail ? new Error("Read failed") : null,
    }).then(resolve, reject);
  }
}
fixture.db = { from: (t) => new Query(t) };
const mocks = {
  "next/server": `export const NextResponse={json:(d,o)=>Response.json(d,o)};`,
  "@/lib/supabase": `export const supabaseAdmin=global.simEvidenceFixture.db;export const supabase=supabaseAdmin;`,
  "@/lib/api-auth": `export const withAuth=f=>f;export const withRole=(roles,f)=>async(req,ctx)=>roles.includes(ctx.role)?f(req,ctx):Response.json({error:'Forbidden'},{status:403});`,
  "@/lib/teacher-scope": `export const getStudentCourseIds=async()=>['c'];export const getCourseOwnerEmail=async()=>global.simEvidenceFixture.owner;export const resolveTargetStudent=async x=>x.role==='student'?{ok:true,userId:x.selfId}:x.scopeEmail===global.simEvidenceFixture.owner?{ok:true,userId:x.requestedUserId||x.selfId}:{ok:false};`,
  "@/lib/lesson-evidence-links": `export const evidenceWithLinks=async rows=>rows;`,
  "@/lib/lesson-access": `export const authorizeLesson=async()=>({ok:global.simEvidenceFixture.lessonAllowed,document:global.simEvidenceFixture.doc});`,
};
async function bundle(file, name, extra = {}) {
  const map = { ...mocks, ...extra };
  map["./supabase"] = map["@/lib/supabase"];
  map["./teacher-scope"] = map["@/lib/teacher-scope"];
  const p = path.join(out, name + ".cjs");
  await require(root + "/node_modules/esbuild").build({
    absWorkingDir: root,
    entryPoints: [path.join(root, file)],
    outfile: p,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent",
    plugins: [
      {
        name: "fixture",
        setup(b) {
          b.onResolve({ filter: /.*/ }, (a) =>
            map[a.path] ? { path: a.path, namespace: "fixture" } : undefined,
          );
          b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
            contents: map[a.path],
            loader: "js",
          }));
        },
      },
    ],
  });
  return require(p);
}
(async () => {
  const author = await bundle(
      "src/lib/simulation-investigation-authoring.ts",
      "author",
    ),
    { getMasteryStudentWork } = await bundle(
      "src/lib/mastery-student-work.ts",
      "work",
    ),
    { canExploreSimulations } = await bundle(
      "src/lib/simulation-access.ts",
      "access",
    ),
    classApi = await bundle("src/app/api/simulations/access/route.ts", "class"),
    activityApi = await bundle(
      "src/app/api/simulations/activity/route.ts",
      "activity",
    );
  const doc = author.investigationDocument("distance-displacement"),
    target = doc.learningPath.targetSlugs[0],
    lessonId = "11111111-1111-1111-1111-111111111111";
  fixture.doc = doc;
  const captures = doc.blocks.filter((b) => b.capture),
    teacher = {
      role: "teacher",
      realRole: "teacher",
      scopeEmail: "teacher@test",
      userId: "t",
      email: "teacher@test",
    },
    student = {
      ...teacher,
      role: "student",
      realRole: "student",
      userId: "s",
      email: "student@test",
    };
  fixture.tables = {
    units: [{ id: "unit-1", name: "Motion" }],
    lessons: [
      {
        id: lessonId,
        title: "The route and the result",
        unit: "Motion",
        content_blocks: doc,
      },
    ],
    learning_targets: [
      {
        id: "target-id",
        slug: target,
        statement: "Describe motion",
        unit_id: "unit-1",
      },
    ],
    block_responses: captures.map((b, i) => ({
      id: "r" + i,
      user_id: "s",
      lesson_id: lessonId,
      target_id: "target-id",
      block_id: b.id,
      block_type: b.type,
      response:
        b.type === "lab_notebook"
          ? {
              fields: Object.fromEntries(
                b.fields.map((f) => [f, "Measured with units"]),
              ),
            }
          : { text: "Explanation based on the measurements" },
      created_at: "2026-09-27T12:00:00Z",
    })),
    lesson_submissions: [],
    lesson_reviews: [],
    mastery_records: [],
    courses: [
      {
        id: "c",
        name: "Physics",
        course_state: "ACTIVE",
        archived_at: null,
        teacher_email: "teacher@test",
        simulation_exploration_enabled: false,
      },
    ],
  };
  const request = new Request(
    "http://fixture/api/mastery/student-work?unit_id=unit-1&user_id=s&target_id=target-id&mode=evidence",
  );
  let work = await (await getMasteryStudentWork(request, teacher)).json();
  assert.equal(work.work.length, 4);
  assert(work.work.every((w) => w.targetLinked && w.teacherGuidance));
  assert.equal(fixture.tables.mastery_records.length, 0);
  fixture.tables.lesson_submissions = [
    {
      id: "sub",
      user_id: "s",
      lesson_id: lessonId,
      submitted_at: "2026-09-27T13:00:00Z",
      response_snapshot: fixture.tables.block_responses,
      content_snapshot: {
        ...doc,
        blocks: doc.blocks.map(b => {const copy={...b};delete copy.note;return copy}),
      },
    },
  ];
  work = await (
    await getMasteryStudentWork(
      new Request(
        "http://fixture/api/mastery/student-work?unit_id=unit-1&user_id=s&target_id=target-id&submission_id=sub",
      ),
      teacher,
    )
  ).json();
  assert.equal(work.work.length, 4);
  assert(work.work.every((w) => w.teacherGuidance && w.submissionId === "sub"));
  work = await (await getMasteryStudentWork(request, student)).json();
  assert(work.work.every((w) => !w.teacherGuidance));
  assert.equal(await canExploreSimulations("s", "student"), false);
  assert.equal(await canExploreSimulations("a", "admin"), true);
  const setting = (enabled) => ({
    json: async () => ({ courseId: "c", enabled }),
  });
  assert.equal((await classApi.PUT(setting(true), student)).status, 403);
  assert.equal(
    (
      await classApi.PUT(setting(true), {
        ...teacher,
        scopeEmail: "other@test",
      })
    ).status,
    403,
  );
  assert.equal((await classApi.PUT(setting(true), teacher)).status, 200);
  assert.equal(await canExploreSimulations("s", "student"), true);
  fixture.tables.courses[0].archived_at = "today";
  assert.equal(await canExploreSimulations("s", "student"), false);
  fixture.tables.courses[0].archived_at = null;
  fixture.tables.courses[0].simulation_exploration_enabled = false;
  fixture.tables.simulations = [{ id: "sim", slug: "distance-displacement" }];
  const start = (lesson) => ({
    json: async () => ({ simulation_id: "sim", lesson_id: lesson }),
  });
  assert.equal((await activityApi.POST(start(null), student)).status, 403);
  fixture.lessonAllowed = false;
  assert.equal((await activityApi.POST(start(lessonId), student)).status, 403);
  fixture.lessonAllowed = true;
  assert.equal((await activityApi.POST(start(lessonId), student)).status, 201);
  assert.equal(fixture.inserted.at(-1)[1].lesson_id, lessonId);
  fixture.tables.simulation_activity = [
    { id: "own", student_id: "s" },
    { id: "other", student_id: "another" },
  ];
  const history = await (
    await activityApi.GET(
      new Request("http://fixture/api/simulations/activity?student_id=another"),
      student,
    )
  ).json();
  assert.deepEqual(
    history.activities.map((a) => a.id),
    ["own"],
  );
  fixture.fail = true;
  await assert.rejects(() => canExploreSimulations("s", "student"));
  console.log(
    "PASS: four target-linked captures feed live and submitted mastery work, private look-fors stay teacher-only, no automatic rating, class opt-in and owner scope, assigned access, own-only activity and failure handling.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
