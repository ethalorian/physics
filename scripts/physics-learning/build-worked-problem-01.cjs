// Generate reviewed lesson-content DML without connecting to a database.
// Usage: node scripts/physics-learning/build-worked-problem-01.cjs <fresh-lesson-snapshot.json>
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const root = path.resolve(__dirname, '../..');
(async () => {
  const source = process.argv[2];
  if (!source) throw Error('Provide a fresh snapshot of the two existing lesson rows.');
  const before = JSON.parse(fs.readFileSync(source, 'utf8'));
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'worked-problem-01-'));
  await require('esbuild').build({ stdin: { contents: "export * from './src/lib/worked-problem-authoring'; export {validateBlockDocument} from './src/data/block-registry';", resolveDir: root, loader: 'ts' }, outfile: temp + '/authoring.cjs', bundle: true, platform: 'node', format: 'cjs', packages: 'external' });
  const { addWorkedProblem01, WORKED_PROBLEM_LESSONS, WORKED_PROBLEM_01, validateBlockDocument } = require(temp + '/authoring.cjs');
  const payload = WORKED_PROBLEM_LESSONS.map(config => {
    const lesson = before.find(l => l.id === config.id);
    if (!lesson || lesson.slug !== config.slug || !lesson.published) throw Error('Lesson identity or publication changed.');
    const document = addWorkedProblem01(lesson.content_blocks, config.kind);
    const issues = validateBlockDocument(document, true);
    if (issues.length) throw Error(JSON.stringify(issues));
    return { id: lesson.id, slug: lesson.slug, title: lesson.title, before: lesson.content_blocks, document, estimatedTime: config.estimatedTime };
  });
  fs.writeFileSync(__dirname + '/worked-problem-01-lessons.json', JSON.stringify(payload, null, 2) + '\n');
  const sql = `-- Reviewed worked-problem content only; class releases and student records are untouched.
DO $install$
DECLARE item jsonb; lesson public.lessons; windows_before text;
  payload jsonb := $payload$${JSON.stringify(payload)}$payload$::jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('physics-worked-problem-01'));
  SELECT md5(coalesce(jsonb_agg(to_jsonb(w) ORDER BY w.id)::text,'')) INTO windows_before FROM public.lesson_class_windows w;
  FOR item IN SELECT value FROM jsonb_array_elements(payload) LOOP
    SELECT * INTO STRICT lesson FROM public.lessons WHERE id=(item->>'id')::uuid FOR UPDATE;
    IF lesson.slug<>item->>'slug' OR NOT lesson.published THEN RAISE EXCEPTION 'Lesson identity/publication changed'; END IF;
    IF lesson.content_blocks=item->'document' THEN CONTINUE; END IF;
    IF lesson.content_blocks IS DISTINCT FROM item->'before' THEN RAISE EXCEPTION 'Lesson changed since review: %',lesson.slug; END IF;
    UPDATE public.lessons SET content_blocks=item->'document',estimated_time=(item->>'estimatedTime')::integer,updated_at=now() WHERE id=lesson.id;
  END LOOP;
  INSERT INTO public.lesson_video_catalog(youtube_id,duration_seconds) VALUES('${WORKED_PROBLEM_01.youtubeId}',${WORKED_PROBLEM_01.durationSeconds}) ON CONFLICT(youtube_id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM public.lesson_video_catalog WHERE youtube_id='${WORKED_PROBLEM_01.youtubeId}' AND duration_seconds=${WORKED_PROBLEM_01.durationSeconds}) THEN RAISE EXCEPTION 'Reviewed video length differs'; END IF;
  IF windows_before IS DISTINCT FROM (SELECT md5(coalesce(jsonb_agg(to_jsonb(w) ORDER BY w.id)::text,'')) FROM public.lesson_class_windows w) THEN RAISE EXCEPTION 'Class releases changed'; END IF;
END $install$;
`;
  fs.writeFileSync(__dirname + '/install-worked-problem-01.sql', sql);
  console.log('Prepared 2 updated lessons, 5 new practice problems, worked video and references. No database writes performed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
