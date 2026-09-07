-- Rollback-only integration assertions. Creates two unpublished fixture lessons,
-- references one existing student inside this transaction, and leaves no records.
-- It does not claim multi-session concurrency stress coverage.
begin;
create temporary table lesson_integrity_test_results(test text, passed boolean) on commit drop;
do $$
declare
 learner uuid; lesson_a uuid := gen_random_uuid(); lesson_b uuid := gen_random_uuid();
 sub_a uuid; sub_b uuid; revised uuid; answer_a uuid; denied boolean;
 doc jsonb := '{"schemaVersion":1,"blocks":[{"id":"audit-q","type":"exit_ticket","capture":true,"prompt":"Original task"}]}'::jsonb;
 snap jsonb;
begin
 select id into learner from public.students limit 1;
 if learner is null then raise exception 'No student available for rollback-only fixture'; end if;
 insert into public.lessons(id,title,slug,published,content_blocks) values
 (lesson_a,'Rollback-only audit fixture A','audit-rollback-'||lesson_a,false,doc),
 (lesson_b,'Rollback-only audit fixture B','audit-rollback-'||lesson_b,false,doc);
 insert into public.block_responses(user_id,lesson_id,block_id,block_type,response,evidence_source,created_at)
 values(learner,lesson_a,'audit-q','exit_ticket','{"text":"older"}','exit_ticket',clock_timestamp()-interval '2 seconds');
 insert into public.block_responses(user_id,lesson_id,block_id,block_type,response,evidence_source,created_at)
 values(learner,lesson_a,'audit-q','exit_ticket','{"text":"submitted"}','exit_ticket',clock_timestamp()) returning id into answer_a;
 insert into public.block_responses(user_id,lesson_id,block_id,block_type,response,evidence_source)
 values(learner,lesson_a,'hidden-q','exit_ticket','{"text":"wrong track"}','exit_ticket'),
       (learner,lesson_a,'audit-q','question','{"text":"group answer"}','lobby');
 insert into public.block_drafts(user_id,lesson_id,block_id,response) values(learner,lesson_a,'audit-q','{"text":"unsaved"}');
 denied := false;
 begin
   insert into public.lesson_submissions(user_id,lesson_id,content_snapshot) values(learner,lesson_a,doc);
 exception when sqlstate 'P0001' then
   if sqlerrm like '%draft%' then denied := true; else raise; end if;
 end;
 if not denied then raise exception 'Unsaved draft failed to block submission'; end if;
 insert into lesson_integrity_test_results values('Unsaved visible draft blocks submit',true);
 delete from public.block_drafts where user_id=learner and lesson_id=lesson_a;
 insert into public.block_drafts(user_id,lesson_id,block_id,response) values(learner,lesson_a,'hidden-q','{"text":"old track draft"}');
 insert into public.lesson_submissions(user_id,lesson_id,content_snapshot) values(learner,lesson_a,doc) returning id,response_snapshot into sub_a,snap;
 if jsonb_array_length(snap) <> 1 or snap->0->'response'->>'text' <> 'submitted' then raise exception 'Snapshot did not isolate latest individual visible response: %',snap; end if;
 if not exists(select 1 from public.lesson_submissions where id=sub_a and review_policy='explicit' and content_snapshot=doc) then raise exception 'Exact supplied content snapshot not retained'; end if;
 insert into lesson_integrity_test_results values('Snapshot isolates latest individual visible response and original document',true),('Obsolete hidden draft does not block submit',true);
 denied := false;
 begin
   insert into public.block_responses(user_id,lesson_id,block_id,block_type,response,evidence_source) values(learner,lesson_a,'audit-q','exit_ticket','{"text":"forbidden"}','exit_ticket');
 exception when sqlstate 'P0001' then if sqlerrm like '%locked%' then denied := true; else raise; end if; end;
 if not denied then raise exception 'Pending submission accepted a new individual answer'; end if;
 insert into lesson_integrity_test_results values('Pending submission freezes individual inserts',true);
 denied := false;
 begin update public.block_responses set response='{"text":"forbidden edit"}' where id=answer_a;
 exception when sqlstate 'P0001' then if sqlerrm like '%locked%' then denied := true; else raise; end if; end;
 if not denied then raise exception 'Pending submission accepted an individual update'; end if;
 insert into lesson_integrity_test_results values('Pending submission freezes individual updates',true);
 denied := false;
 begin insert into public.block_drafts(user_id,lesson_id,block_id,response) values(learner,lesson_a,'audit-q','{"text":"forbidden draft"}');
 exception when sqlstate 'P0001' then if sqlerrm like '%locked%' then denied := true; else raise; end if; end;
 if not denied then raise exception 'Pending submission accepted a draft'; end if;
 insert into lesson_integrity_test_results values('Pending submission freezes drafts',true);
 denied := false;
 begin insert into public.lesson_submissions(user_id,lesson_id,content_snapshot) values(learner,lesson_a,doc);
 exception when sqlstate 'P0001' then if sqlerrm like '%locked%' then denied := true; else raise; end if; end;
 if not denied then raise exception 'Pending submission accepted a duplicate submission'; end if;
 insert into lesson_integrity_test_results values('Pending submission rejects repeat submission',true);
 insert into public.block_responses(user_id,lesson_id,block_id,block_type,response,evidence_source) values(learner,lesson_a,'audit-q','question','{"text":"live participation"}','live_poll');
 if (select response_snapshot from public.lesson_submissions where id=sub_a) <> snap then raise exception 'Live participation altered snapshot'; end if;
 insert into lesson_integrity_test_results values('Later live participation leaves submitted snapshot unchanged',true);
 insert into public.lesson_submissions(user_id,lesson_id,content_snapshot) values(learner,lesson_b,doc) returning id into sub_b;
 insert into public.lesson_reviews(user_id,lesson_id,submission_id,reviewer_email) values(learner::text,lesson_a,sub_a,'rollback-audit@example.invalid');
 insert into public.block_responses(user_id,lesson_id,block_id,block_type,response,evidence_source,created_at) values(learner,lesson_a,'audit-q','exit_ticket','{"text":"revision"}','exit_ticket',clock_timestamp());
 insert into public.lesson_submissions(user_id,lesson_id,content_snapshot) values(learner,lesson_a,doc) returning id into revised;
 if revised=sub_a then raise exception 'Revision did not append'; end if;
 if (select response_snapshot from public.lesson_submissions where id=sub_a) <> snap then raise exception 'Revision altered original snapshot'; end if;
 insert into lesson_integrity_test_results values('Exact review unlocks revision and appends an independent snapshot',true);
 denied := false;
 begin insert into public.block_responses(user_id,lesson_id,block_id,block_type,response,evidence_source) values(learner,lesson_b,'audit-q','exit_ticket','{"text":"B still pending"}','exit_ticket');
 exception when sqlstate 'P0001' then if sqlerrm like '%locked%' then denied := true; else raise; end if; end;
 if not denied then raise exception 'Reviewing A incorrectly unlocked B'; end if;
 insert into lesson_integrity_test_results values('Reviewing A leaves B pending',true);
 update public.lessons set content_blocks='{"schemaVersion":1,"blocks":[{"id":"audit-q","type":"exit_ticket","prompt":"Changed task"}]}' where id=lesson_a;
 if (select content_snapshot from public.lesson_submissions where id=sub_a) <> doc then raise exception 'Content edit changed the snapshot'; end if;
 insert into lesson_integrity_test_results values('Subsequent lesson edits leave the original submitted document unchanged',true);
end $$;
select test,passed from lesson_integrity_test_results;
rollback;
