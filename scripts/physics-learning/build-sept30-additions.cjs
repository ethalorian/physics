// Materialize reviewed, individual video lessons. This only generates DML; it does not connect to a database.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'video-additions-'));
 await require('esbuild').build({stdin:{contents:"export {createVideoLesson} from './src/lib/video-lesson-authoring';export {PHYSICS_VIDEOS} from './src/data/physics-videos';export {validateBlockDocument} from './src/data/block-registry';",resolveDir:root,loader:'ts'},outfile:out+'/data.cjs',bundle:true,platform:'node',format:'cjs',packages:'external'});
 const {createVideoLesson,PHYSICS_VIDEOS,validateBlockDocument}=require(out+'/data.cjs');
 const additions=require('./sept30-additions.json');
 const payload=additions.map(item=>{const video=PHYSICS_VIDEOS.find(v=>v.youtubeId===item.youtubeId);const doc=createVideoLesson(item.youtubeId);const errors=validateBlockDocument(doc,true);if(errors.length)throw Error(JSON.stringify(errors));return {...item,title:video.title,slug:`video-${video.sequence}-`+video.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),duration:video.durationSeconds,description:video.focus,document:doc}});
 fs.writeFileSync(root+'/scripts/physics-learning/sept30-lessons.json',JSON.stringify(payload,null,2)+'\n');
 const sql=`-- Additions only: no existing lesson bodies, student work, ratings, or class releases are rewritten.
DO $install$
DECLARE item jsonb; target jsonb; l public.lessons; found_target public.learning_targets; existing_id uuid;
  result jsonb; set_id uuid; ids jsonb; blocks jsonb; terms jsonb; windows_before text; old_lessons_before text;
  additions jsonb := $payload$${JSON.stringify(payload)}$payload$::jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('physics-video-additions-2026-09-30'));
 SELECT md5(coalesce(jsonb_agg(to_jsonb(w) ORDER BY w.id)::text,'')) INTO windows_before FROM public.lesson_class_windows w;
 SELECT md5(coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id)::text,'')) INTO old_lessons_before FROM public.lessons x WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(additions) a WHERE (a->>'lessonId')::uuid=x.id);
 FOR item IN SELECT value FROM jsonb_array_elements(additions) LOOP
  target:=item->'target';
  INSERT INTO public.learning_targets(id,slug,statement,domain,unit_id,program,content_strand,order_index,lesson_id)
  VALUES((target->>'id')::uuid,target->>'slug',target->>'statement',target->>'domain','unit-1','physics','foundations',(target->>'order_index')::integer,item->>'lessonId') ON CONFLICT(slug) DO NOTHING;
  SELECT * INTO STRICT found_target FROM public.learning_targets WHERE slug=target->>'slug';
  IF found_target.statement<>target->>'statement' OR found_target.domain<>target->>'domain' OR found_target.unit_id<>'unit-1' OR found_target.program<>'physics' THEN RAISE EXCEPTION 'Target changed: %',target->>'slug'; END IF;
  SELECT id INTO existing_id FROM public.lessons WHERE content_blocks->>'presentation'='physics-path' AND content_blocks->'blocks' @> jsonb_build_array(jsonb_build_object('type','instruction_video','youtubeId',item->>'youtubeId')) LIMIT 1;
  IF existing_id IS NOT NULL AND existing_id<>(item->>'lessonId')::uuid THEN RAISE EXCEPTION 'Video already has a different lesson: %',item->>'youtubeId'; END IF;
  INSERT INTO public.lessons(id,title,slug,unit_id,unit,lesson_number,lesson_type,published,estimated_time,description,objectives,content_blocks)
  VALUES((item->>'lessonId')::uuid,item->>'title',item->>'slug','unit-1',(SELECT name FROM public.units WHERE id='unit-1'),99+(item->>'sequence')::integer,'video',true,18,item->>'description',ARRAY[target->>'slug'],item->'document') ON CONFLICT(id) DO NOTHING;
  SELECT * INTO STRICT l FROM public.lessons WHERE id=(item->>'lessonId')::uuid FOR UPDATE;
  IF l.unit_id<>'unit-1' OR l.content_blocks->>'presentation'<>'physics-path' OR NOT l.content_blocks->'learningPath'->'targetSlugs' ? (target->>'slug') OR NOT l.content_blocks->'blocks' @> jsonb_build_array(jsonb_build_object('type','instruction_video','youtubeId',item->>'youtubeId')) THEN RAISE EXCEPTION 'Lesson changed: %',l.id; END IF;
  INSERT INTO public.lesson_video_catalog(youtube_id,duration_seconds) VALUES(item->>'youtubeId',(item->>'duration')::integer) ON CONFLICT(youtube_id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM public.lesson_video_catalog WHERE youtube_id=item->>'youtubeId' AND duration_seconds=(item->>'duration')::integer) THEN RAISE EXCEPTION 'Video duration changed'; END IF;
  SELECT id INTO set_id FROM public.vocabulary_sets WHERE lesson_id=l.id::text;
  IF set_id IS NULL THEN
   SELECT jsonb_agg(t||jsonb_build_object('tier',3)) INTO terms FROM jsonb_array_elements(item->'document'->'blocks') b CROSS JOIN LATERAL jsonb_array_elements(coalesce(b->'terms','[]'::jsonb)) t WHERE b->>'type'='vocab';
   result:=public.save_lesson_vocabulary(l.id,null,terms,true);set_id:=(result->>'setId')::uuid;
   SELECT jsonb_agg(id ORDER BY order_index) INTO ids FROM public.vocabulary_terms WHERE vocabulary_set_id=set_id AND NOT archived;
   SELECT jsonb_agg(CASE WHEN b->>'type'='vocab' THEN b||jsonb_build_object('terms','[]'::jsonb,'termIds',ids,'vocabularySetId',set_id) ELSE b END ORDER BY ord) INTO blocks FROM jsonb_array_elements(l.content_blocks->'blocks') WITH ORDINALITY a(b,ord);
   UPDATE public.lessons SET content_blocks=jsonb_set(content_blocks,'{blocks}',blocks),updated_at=now() WHERE id=l.id;
  END IF;
  INSERT INTO public.vocab_target_terms(target_id,term_id) SELECT found_target.id,id FROM public.vocabulary_terms WHERE vocabulary_set_id=set_id AND NOT archived ON CONFLICT DO NOTHING;
 END LOOP;
 IF windows_before IS DISTINCT FROM (SELECT md5(coalesce(jsonb_agg(to_jsonb(w) ORDER BY w.id)::text,'')) FROM public.lesson_class_windows w) THEN RAISE EXCEPTION 'Class releases changed; retry without changing access'; END IF;
 IF old_lessons_before IS DISTINCT FROM (SELECT md5(coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id)::text,'')) FROM public.lessons x WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(additions) a WHERE (a->>'lessonId')::uuid=x.id)) THEN RAISE EXCEPTION 'An existing lesson changed; no additions saved'; END IF;
END $install$;
`;
 fs.writeFileSync(root+'/scripts/physics-learning/install-sept30-additions.sql',sql);console.log('Prepared 4 lessons, 4 targets, 4 vocabulary sets; class access remains teacher-controlled.');
})().catch(e=>{console.error(e);process.exitCode=1});
