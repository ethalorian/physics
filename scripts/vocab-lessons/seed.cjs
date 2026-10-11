// Generate an idempotent DML script. Run after the class-access code is deployed.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
(async()=>{const out='/private/tmp/vocab-lesson-work/video-vocabulary.cjs';await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/src/data/video-vocabulary.ts'],outfile:out,bundle:true,platform:'node',format:'cjs'});const bank=require(out).VIDEO_VOCABULARY;
const ids=['af2fb3d2-bd76-4afd-aac5-a0c9eecb0802','eaa95227-1bc7-41e8-af7c-192bdedc8303','fc67d63d-a011-426b-b9f3-fd8f1ea7f501','7456e6c4-fd01-455f-b0a2-e8e1a0f65304','df1acb44-9f62-45cf-9270-1f1a2d413505','c1f8c609-88ad-4d42-93ce-25ae2b0c8206','685abc3e-737c-4572-9be2-928f8fd7a707','f2770d7c-8494-4808-9ba2-fb463bd47508'];
const mapping=Object.entries(bank).map(([video,terms],i)=>({id:ids[i],video,terms}));
const sql=`do $seed$
declare item jsonb; l public.lessons; terms jsonb; result jsonb; set_id uuid; ids jsonb; blocks jsonb; inline_words jsonb;
begin
 for item in select value from jsonb_array_elements($bank$${JSON.stringify(mapping)}$bank$::jsonb) loop
  select * into strict l from public.lessons where id=(item->>'id')::uuid for update;
  if l.content_blocks->>'presentation'<>'physics-path' or not exists(select 1 from jsonb_array_elements(l.content_blocks->'blocks') b where b->>'youtubeId'=item->>'video') then raise exception 'Video lesson changed: %',l.id;end if;
  if exists(select 1 from public.vocabulary_sets where lesson_id=l.id::text) then continue;end if;
  select coalesce(jsonb_agg(t),'[]'::jsonb) into inline_words from jsonb_array_elements(l.content_blocks->'blocks') b cross join lateral jsonb_array_elements(coalesce(b->'terms','[]'::jsonb)) t where b->>'type'='vocab';
  select jsonb_agg(jsonb_build_object('tier',3)||w||coalesce((select t from jsonb_array_elements(inline_words) t where lower(t->>'term')=lower(w->>'term') limit 1),'{}'::jsonb)) into terms from jsonb_array_elements(item->'terms') w;
  terms:=terms||(select coalesce(jsonb_agg(t),'[]'::jsonb) from jsonb_array_elements(inline_words) t where not exists(select 1 from jsonb_array_elements(item->'terms') w where lower(w->>'term')=lower(t->>'term')));
  result:=public.save_lesson_vocabulary(l.id,null,terms,l.published);set_id:=(result->>'setId')::uuid;
  select jsonb_agg(id order by order_index) into ids from public.vocabulary_terms where vocabulary_set_id=set_id and not archived;
  select jsonb_agg(case when b->>'type'='vocab' then b||jsonb_build_object('terms','[]'::jsonb,'termIds',ids,'vocabularySetId',set_id) else b end order by ord) into blocks from jsonb_array_elements(l.content_blocks->'blocks') with ordinality a(b,ord);
  if not exists(select 1 from jsonb_array_elements(blocks) b where b->>'type'='vocab') then blocks:=blocks||jsonb_build_array(jsonb_build_object('id','vocabulary-'||(item->>'video'),'type','vocab','terms','[]'::jsonb,'termIds',ids,'vocabularySetId',set_id,'referencePanel',true));end if;
  update public.lessons set content_blocks=jsonb_set(content_blocks,'{blocks}',blocks),updated_at=now() where id=l.id;
  insert into public.vocab_target_terms(target_id,term_id) select t.id,w.id from public.learning_targets t cross join public.vocabulary_terms w where t.program='physics' and t.domain='knowledge' and w.vocabulary_set_id=set_id and not w.archived and l.content_blocks->'learningPath'->'targetSlugs' ? t.slug on conflict do nothing;
 end loop;
end $seed$;
select l.id,l.title,s.id as set_id,s.published,(select count(*) from public.vocabulary_terms t where t.vocabulary_set_id=s.id and not t.archived) as words,(select count(distinct v.target_id) from public.vocab_target_terms v join public.vocabulary_terms t on t.id=v.term_id where t.vocabulary_set_id=s.id) as targets from public.lessons l join public.vocabulary_sets s on s.lesson_id=l.id::text where l.id in (${ids.map(id=>`'${id}'`).join(',')}) order by l.lesson_number;`;
fs.writeFileSync(root+'/scripts/vocab-lessons/seed-video-vocabulary.sql',sql);console.log('Prepared '+mapping.length+' lesson vocabulary sets');})();
