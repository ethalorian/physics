-- Applied to PhysicsAPP 2026-09-04 as "vocab_assignments_and_attempts".
-- Vocabulary sets assigned to a class, and per-WORD attempts from the arcade with the SEI
-- support state that was on at the time. Additive; nothing here touches mastery.

create table if not exists public.vocab_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  vocabulary_set_id uuid not null references public.vocabulary_sets(id) on delete cascade,
  assigned_by text not null,
  due_on date,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (course_id, vocabulary_set_id)
);
create index if not exists idx_vocab_assignments_course on public.vocab_assignments(course_id) where active;
comment on table public.vocab_assignments is 'A vocabulary set assigned to a class. Students in the class see it first in the arcade; the competency grid reads attempts against it.';

create table if not exists public.vocab_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  term_id uuid not null references public.vocabulary_terms(id) on delete cascade,
  vocabulary_set_id uuid references public.vocabulary_sets(id) on delete set null,
  game text not null,
  correct boolean not null,
  -- SEI state when the word was attempted: was the Spanish clue showing, and what support level was on.
  l1_shown boolean not null default false,
  support_level text not null default 'bare' check (support_level in ('full', 'partial', 'bare')),
  response_ms integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_vocab_attempts_term on public.vocab_attempts(term_id);
create index if not exists idx_vocab_attempts_user on public.vocab_attempts(user_id, created_at desc);
create index if not exists idx_vocab_attempts_set on public.vocab_attempts(vocabulary_set_id, created_at desc);
comment on table public.vocab_attempts is 'One row per word attempt in any vocabulary game. supported = l1_shown or support_level <> bare. Competency = accuracy over attempts; the split tells whether the word was known with or without the SEI route.';

create or replace view public.vocab_competency as
select
  a.user_id,
  a.term_id,
  t.vocabulary_set_id,
  count(*)::int as attempts,
  count(*) filter (where a.correct)::int as correct,
  round(100.0 * count(*) filter (where a.correct) / count(*))::int as accuracy,
  count(*) filter (where a.l1_shown or a.support_level <> 'bare')::int as attempts_supported,
  count(*) filter (where a.correct and (a.l1_shown or a.support_level <> 'bare'))::int as correct_supported,
  count(*) filter (where not a.l1_shown and a.support_level = 'bare')::int as attempts_bare,
  count(*) filter (where a.correct and not a.l1_shown and a.support_level = 'bare')::int as correct_bare,
  max(a.created_at) as last_at
from public.vocab_attempts a
join public.vocabulary_terms t on t.id = a.term_id
group by a.user_id, a.term_id, t.vocabulary_set_id;
comment on view public.vocab_competency is 'Per (student, word): attempts, accuracy, and the with-supports / without-supports split.';
