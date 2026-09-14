-- Every vocabulary authoring surface advances the same optimistic version.
create or replace function public.vocabulary_term_integrity() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if (TG_OP = 'DELETE' or (TG_OP = 'UPDATE' and NEW.archived and not OLD.archived)) then
    if exists (select 1 from public.lessons l cross join lateral jsonb_array_elements(coalesce(l.content_blocks->'blocks','[]'::jsonb)) b where b->'termIds' ? OLD.id::text) then
      raise exception 'This word is selected in a lesson. Remove its block selection before archiving the word.';
    end if;
  end if;
  update public.vocabulary_sets set updated_at=clock_timestamp() where id=case when TG_OP='DELETE' then OLD.vocabulary_set_id else NEW.vocabulary_set_id end;
  if TG_OP='DELETE' then return OLD; end if;
  return NEW;
end $$;
create trigger vocabulary_term_integrity before insert or update or delete on public.vocabulary_terms for each row execute function public.vocabulary_term_integrity();

create table public.lesson_plan_links (
  lesson_id uuid primary key references public.lessons(id),
  unit_id text not null,
  plan_day integer not null,
  plan_fingerprint text not null,
  content_fingerprint text not null,
  verified_at timestamptz not null default now(),
  verified_by text not null
);
alter table public.lesson_plan_links enable row level security;
revoke all on public.lesson_plan_links from public, anon, authenticated;
grant all on public.lesson_plan_links to service_role;
