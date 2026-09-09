const fs = require("node:fs"),
  path = require("node:path"),
  { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const fixture = `begin;
create table public.students(id uuid primary key);
create table public.learning_targets(id uuid primary key);
create table public.lessons(id uuid primary key);
create table public.lesson_submissions(id uuid primary key,user_id uuid,lesson_id uuid);
create table public.mastery_records(id uuid primary key default gen_random_uuid(),user_id uuid,target_id uuid,level smallint,rated_by text,evidence_source text);
create table public.teacher_feedback(id uuid primary key default gen_random_uuid(),user_id text,teacher_email text,target_id uuid,message text check(length(message)<=2000),submission_id uuid);
create table public.lesson_reviews(id uuid primary key default gen_random_uuid(),user_id text,lesson_id uuid,submission_id uuid unique,reviewer_email text);
do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role;end if;end $$;
insert into students values('00000000-0000-0000-0000-000000000001');
insert into learning_targets values('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');
insert into lessons values('00000000-0000-0000-0000-000000000004');
insert into lesson_submissions values('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004');
`;
const tests = `
do $$ declare result jsonb; n integer; begin
result:=public.submit_mastery_evidence_review('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','teacher@test','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','[{"key":"a","level":2,"submissionId":"00000000-0000-0000-0000-000000000005"},{"key":"b","level":3,"submissionId":"00000000-0000-0000-0000-000000000005"}]','Overall 3. Good explanation.',array['00000000-0000-0000-0000-000000000005']::uuid[],array['00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003']::uuid[]);
if result->>'level'<>'3' or (result->>'mean')::numeric<>2.5 then raise exception 'Incorrect average';end if;
if (select count(*) from teacher_feedback)<>1 or (select count(*) from mastery_records)<>1 then raise exception 'Missing atomic output';end if;
if exists(select 1 from lesson_reviews) then raise exception 'Premature lesson completion';end if;
perform public.submit_mastery_evidence_review('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','teacher@test','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','[]','Retry','{}','{}');
if (select count(*) from teacher_feedback)<>1 then raise exception 'Duplicate feedback on retry';end if;
result:=public.submit_mastery_evidence_review('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','teacher@test','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','[{"key":"a","level":null,"reason":"Group work"},{"key":"b","level":3,"submissionId":"00000000-0000-0000-0000-000000000005"}]','Overall 3.',array['00000000-0000-0000-0000-000000000005']::uuid[],array['00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003']::uuid[]);
if (result->>'mean')::numeric<>3 or (select count(*) from lesson_reviews)<>1 then raise exception 'Exclusion or completion incorrect';end if;
begin
perform public.submit_mastery_evidence_review('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','teacher@test','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','[{"key":"c","level":1}]',repeat('x',2001),'{}','{}');
raise exception 'Expected failure';
exception when check_violation then null;end;
if (select count(*) from mastery_records)<>2 or (select count(*) from mastery_evidence_reviews)<>2 then raise exception 'Partial write escaped failed transaction';end if;
if has_table_privilege('anon','public.mastery_evidence_reviews','SELECT') or has_function_privilege('authenticated','public.submit_mastery_evidence_review(uuid,uuid,text,uuid,uuid,jsonb,text,uuid[],uuid[])','EXECUTE') then raise exception 'Exposed privileged review API';end if;
end $$;
rollback;
`;
execFileSync(
  "/opt/homebrew/bin/psql",
  [
    "postgresql://craigantocci@127.0.0.1:55439/review_desk_test",
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
  ],
  {
    input:
      fixture +
      fs.readFileSync(
        path.join(
          root,
          "supabase/migrations/20260909042350_evidence_review_desk.sql",
        ),
        "utf8",
      ) +
      tests,
    stdio: ["pipe", "inherit", "inherit"],
  },
);
console.log(
  "PASS: atomic feedback + ratings, idempotency, exclusions, target-complete lesson review, failure rollback, and service-only permissions",
);
