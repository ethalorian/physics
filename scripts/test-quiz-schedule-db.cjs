const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..');
// Run the existing real PostgreSQL sequence/Undo fixtures first, then migrate
// that database state to the new weekday rules in the same rolled-back transaction.
const migration = fs.readFileSync(root + '/supabase/migrations/20261017120000_quiz_weekday_schedule.sql', 'utf8');
const extra = `
alter table vocab_tasks add column task_kind text not null default 'practice';
${migration}
do $$ declare prior jsonb; v integer; r jsonb; begin
 select jsonb_agg(to_jsonb(w)) into prior from quiz_work w;
 -- Assignment deadlines remain valid on Saturday and Sunday.
 update textbook_assignments set due_at='2026-10-25 03:59Z',opens_at=null where id='00000000-0000-4000-8000-000000000010';
 if (select due_at from textbook_assignments where id='00000000-0000-4000-8000-000000000010') <> '2026-10-25 03:59Z'::timestamptz then raise exception 'Saturday reading shifted'; end if;
 if (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000030') <> '2026-10-27 03:59Z'::timestamptz then raise exception 'Reading quiz must move to Monday'; end if;
 if (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000031') <> '2026-10-28 03:59Z'::timestamptz then raise exception 'Vocabulary quiz must move to Tuesday'; end if;
 begin update quiz_assignments set due_at='2026-10-28 03:59Z' where id='00000000-0000-4000-8000-000000000030'; raise exception 'FAILED invalid regular date'; exception when check_violation then null; end;
 begin update quiz_assignments set due_at='2026-10-29 03:59Z' where id='00000000-0000-4000-8000-000000000031'; raise exception 'FAILED invalid vocabulary date'; exception when check_violation then null; end;
 update quiz_assignments set due_at='2026-10-29 03:59Z' where id='00000000-0000-4000-8000-000000000030';
 update quiz_assignments set due_at='2026-10-30 03:59Z' where id='00000000-0000-4000-8000-000000000031';
 -- Vocabulary tasks also distinguish practice from quizzes.
 insert into vocab_tasks(id,course_id,task_kind,due_on,active,student_ids,term_ids) values('00000000-0000-4000-8000-000000000091','00000000-0000-4000-8000-000000000001','practice','2026-10-25',true,'{}','{}');
 begin update vocab_tasks set task_kind='quiz' where id='00000000-0000-4000-8000-000000000091'; raise exception 'FAILED invalid kind change'; exception when check_violation then null; end;
 update vocab_tasks set task_kind='quiz',due_on='2026-10-27' where id='00000000-0000-4000-8000-000000000091';
 begin update vocab_tasks set due_on='2026-10-28' where id='00000000-0000-4000-8000-000000000091'; raise exception 'FAILED invalid vocab task'; exception when check_violation then null; end;
 if reading_vocabulary_quiz_due('2026-10-30') <> '2026-11-04 04:59Z'::timestamptz or reading_vocabulary_quiz_due('2026-03-06') <> '2026-03-11 03:59Z'::timestamptz then raise exception 'DST/next eligible date failed'; end if;
 -- A real sequence assignment and exact Undo still work with separate quiz dates.
 select version into v from textbook_assignments where id='00000000-0000-4000-8000-000000000010';
 r:=assign_reading_sequence('00000000-0000-4000-8000-000000000010','2026-10-26 03:59Z',null,v,'teacher@test','teacher@test');
 perform undo_reading_sequence_assignment('00000000-0000-4000-8000-000000000010',(r->>'version')::int,'teacher@test','teacher@test');
 if (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000030') <> '2026-10-29 03:59Z'::timestamptz then raise exception 'Undo lost teacher regular date'; end if;
 if (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000031') <> '2026-10-30 03:59Z'::timestamptz then raise exception 'Undo lost teacher vocab date'; end if;
 if prior is distinct from (select jsonb_agg(to_jsonb(w)) from quiz_work w) then raise exception 'Student work changed'; end if;
 if has_function_privilege('authenticated','quiz_schedule_due(timestamptz,boolean)','EXECUTE') or has_function_privilege('anon','enforce_quiz_schedule()','EXECUTE') then raise exception 'Schedule function exposed'; end if;
end $$;
`;
let source = fs.readFileSync(root + '/scripts/test-reading-planner-db.cjs', 'utf8');
source = source.replace("+assignSql+'rollback;`'", () => "+assignSql+" + JSON.stringify(extra) + "+'rollback;`'");
const mod = new Module(__filename, module); mod.filename = __filename; mod.paths = module.paths; mod._compile(source, __filename);
console.log('PASS: new migration on existing sequences; regular/vocabulary weekday guards; practice weekends; Saturday reading unchanged; linked quiz dates; DST; exact Undo; student work preserved; private functions.');
