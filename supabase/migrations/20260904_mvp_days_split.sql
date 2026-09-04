-- MVP Physics: each week's days become discrete lessons (decision 2026-09-04).
--
-- The week row (pp-wNN) stays as the authoring shell the generator writes into
-- (scripts/gen_mvp_weeks.py); it is unpublished and numbered week*10. Day rows
-- pp-wNN-dK are materialised from it by split_mvp_week(slug), numbered
-- week*10 + K (the same grain as the teacher day plans in proj-1-lesson-plans.json).
-- Re-running the split rewrites a day's blocks/title from the week row but keeps
-- its id and its published flag, so student work saved on a day row survives.
--
-- A day carries: its targets' `target` blocks, the asteroid thread, the language
-- objective, the vocab block, a "Day K of N" orientation callout, the week's
-- "This week" prose on Day 1 only, then the day's own blocks. Targets stay
-- week-grain; their lesson_id is re-pointed to the first day that captures them
-- and every other day reaches them through its blocks (lib/lesson-targets.ts).

create or replace function public.split_mvp_week(week_slug text)
returns int
language plpgsql
as $$
declare
  w          public.lessons%rowtype;
  blocks     jsonb;
  n_blocks   int;
  week_no    int;
  hdr_end    int := 0;                -- index (1-based) of the last header block
  starts     int[] := '{}';           -- block index where each day starts
  day_nos    int[] := '{}';
  i          int;
  k          int;
  n_days     int;
  b          jsonb;
  title_en   text;
  title_es   text;
  day_title  text;
  wk_en      text;
  wk_es      text;
  day_blocks jsonb;
  hdr        jsonb;
  slugs      text[];
  tgt_blocks jsonb;
  objs       text[];
  d_slug     text;
  d_id       uuid;
  lo         int;
  hi         int;
  m          text[];
  made       int := 0;
begin
  select * into w from public.lessons where slug = week_slug;
  if not found then raise exception 'no week lesson %', week_slug; end if;
  blocks := coalesce(w.content_blocks->'blocks', '[]'::jsonb);
  n_blocks := jsonb_array_length(blocks);
  week_no := (regexp_match(week_slug, 'pp-w(\d+)'))[1]::int;

  -- header = leading run of target / thread / language / vocab / week callout / overview prose
  for i in 1..n_blocks loop
    b := blocks->(i-1);
    exit when not (b->>'id' in ('a1','l1','v1','c1','p1') or b->>'type' = 'target');
    hdr_end := i;
  end loop;

  -- day starts: "Day K" callouts (ids wNNdK); if the first body block is not one, it opens Day 1
  for i in hdr_end+1..n_blocks loop
    b := blocks->(i-1);
    m := regexp_match(b->>'id', '^w\d\dd(\d+)$');
    if m is not null and b->>'type' = 'callout' then
      starts := starts || i; day_nos := day_nos || m[1]::int;
    elsif i = hdr_end+1 then
      starts := starts || i; day_nos := day_nos || 1;
    end if;
  end loop;
  n_days := coalesce(array_length(starts, 1), 0);
  if n_days = 0 then
    update public.lessons set lesson_number = week_no*10 where id = w.id and lesson_number <> week_no*10;
    return 0;
  end if;

  -- week title halves: "Week 0 · The briefing · Predict… / La sesión… · Predice…"
  wk_en := trim(split_part(w.title, ' / ', 1));
  wk_es := trim(split_part(w.title, ' / ', 2));

  for k in 1..n_days loop
    lo := starts[k];
    hi := case when k < n_days then starts[k+1] - 1 else n_blocks end;

    -- the day's own blocks
    select coalesce(jsonb_agg(x.b order by x.o), '[]'::jsonb) into day_blocks
    from jsonb_array_elements(blocks) with ordinality x(b, o) where x.o between lo and hi;

    -- title from the Day callout when there is one, else from the week title
    b := blocks->(lo-1);
    if (b->>'title') ~ '^Day \d+ ·' then
      title_en := trim(split_part(b->>'title', ' · Día ', 1));                       -- "Day 2 · The detector · first touch"
      title_es := 'Día ' || trim(split_part(b->>'title', ' · Día ', 2));             -- "Día 2 · El detector · primer contacto"
    else
      title_en := format('Day %s · %s', day_nos[k], split_part(regexp_replace(wk_en, '^Week \d+ · ', ''), ' · ', 1));
      title_es := format('Día %s · %s', day_nos[k], split_part(wk_es, ' · ', 1));
    end if;
    day_title := format('Week %s · %s / %s', week_no, title_en, title_es);

    -- targets this day captures against
    select coalesce(array_agg(distinct s), '{}') into slugs from (
      select x.b->>'targetId' s from jsonb_array_elements(day_blocks) x(b) where x.b ? 'targetId'
      union all
      select jsonb_array_elements_text(x.b->'targetIds') from jsonb_array_elements(day_blocks) x(b) where jsonb_typeof(x.b->'targetIds') = 'array'
      union all
      select jsonb_array_elements_text(x.b->'targets') from jsonb_array_elements(day_blocks) x(b) where jsonb_typeof(x.b->'targets') = 'array'
    ) q where s is not null;

    -- the week's target blocks whose statement matches one of those targets
    select coalesce(jsonb_agg(x.b order by x.o), '[]'::jsonb), coalesce(array_agg(x.b->>'statement' order by x.o), '{}')
      into tgt_blocks, objs
    from jsonb_array_elements(blocks) with ordinality x(b, o)
    where x.o <= hdr_end and x.b->>'type' = 'target'
      and exists (select 1 from public.learning_targets t where t.slug = any(slugs) and position(t.statement in x.b->>'statement') = 1);

    -- header for this day
    hdr := tgt_blocks;
    for i in 1..hdr_end loop
      b := blocks->(i-1);
      if b->>'id' in ('a1','l1','v1') then hdr := hdr || jsonb_build_array(b); end if;
      if b->>'id' = 'c1' then
        hdr := hdr || jsonb_build_array(jsonb_build_object(
          'id', 'c1', 'type', 'callout', 'variant', 'note',
          'title', format('Day %s of %s this week · Día %s de %s esta semana · %s', day_nos[k], n_days, day_nos[k], n_days, coalesce(b->>'title', '')),
          'markdown', '**Predict. Build. Measure. Explain.** The app is your packet — every segment ends with something saved here. / La app es tu paquete — cada segmento termina con algo guardado aquí.'));
      end if;
      if b->>'id' = 'p1' and k = 1 then hdr := hdr || jsonb_build_array(b); end if;
    end loop;

    d_slug := format('%s-d%s', week_slug, day_nos[k]);
    select id into d_id from public.lessons where slug = d_slug;
    if d_id is null then
      insert into public.lessons (title, slug, content, description, published, unit, lesson_number, videos, estimated_time, objectives,
                                  lesson_type, content_blocks, planned_days, hero_image, unit_id, visibility_track, transfer_core)
      values (day_title, d_slug, '', w.description, w.published, w.unit, week_no*10 + day_nos[k], w.videos, 100, objs,
              w.lesson_type, jsonb_build_object('blocks', hdr || day_blocks), round(w.planned_days / n_days, 2), w.hero_image, w.unit_id, w.visibility_track, w.transfer_core);
    else
      update public.lessons set title = day_title, description = w.description, unit = w.unit, lesson_number = week_no*10 + day_nos[k],
        estimated_time = 100, objectives = objs, content_blocks = jsonb_build_object('blocks', hdr || day_blocks),
        planned_days = round(w.planned_days / n_days, 2), unit_id = w.unit_id, visibility_track = w.visibility_track,
        transfer_core = w.transfer_core, updated_at = now()
      where id = d_id;
    end if;
    made := made + 1;

    -- a target belongs to the first day that captures it (the publish guardrail; the rest reach it via blocks)
    update public.learning_targets t set lesson_id = (select id::text from public.lessons where slug = d_slug)
    where t.slug = any(slugs) and (t.lesson_id = w.id::text or t.lesson_id is null
      or t.lesson_id in (select id::text from public.lessons where slug like week_slug || '-d%' and lesson_number > week_no*10 + day_nos[k]));
  end loop;

  -- the week row becomes the unpublished authoring shell
  update public.lessons set published = false, lesson_number = week_no*10, updated_at = now() where id = w.id;
  return made;
end;
$$;

comment on function public.split_mvp_week(text) is 'Materialise pp-wNN-dK day lessons from the pp-wNN week row (MVP Physics). Idempotent; keeps day ids and published flags.';

-- every week row → its days (weeks with no day markers yet just get renumbered)
select slug, public.split_mvp_week(slug) as days from public.lessons where slug ~ '^pp-w\d\d$' order by slug;

-- 2026-09-04 (later): the self-rating closes each DAY on the targets that day captured
-- (Craig: "self rate on the close of the day's target"). Week-end rate blocks
-- w00-rate / w01-rate were replaced by wNNdK-rate on the week rows and the weeks
-- re-split; gen_mvp_weeks.close_days() now emits them. Day 1 of Week 0 (the
-- hybrid, seeded in 20260903_pp_w00_day1_hybrid.sql) had its marzano d1-rate
-- widened to a self_assessment on both targets it captures.
