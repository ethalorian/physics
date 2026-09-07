-- Rollback-only integration assertions for the shared group RPC. All classes,
-- learners, lessons, lobbies, responses and review markers here are synthetic.
begin;
create temporary table lobby_integrity_test_results(test text, passed boolean) on commit drop;
do $$
declare
 reporter uuid:=gen_random_uuid(); mate uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid();
 course uuid:=gen_random_uuid(); lesson uuid:=gen_random_uuid(); lobby uuid:=gen_random_uuid(); grp uuid:=gen_random_uuid();
 result jsonb; denied boolean; artifact_key text;
 doc jsonb:='{"schemaVersion":1,"blocks":[{"id":"audit-q","type":"exit_ticket","capture":true,"prompt":"Individual task"}]}'::jsonb;
begin
 insert into public.students(id,email,name) values
 (reporter,'rollback-lobby-'||reporter||'@example.invalid','Rollback reporter'),
 (mate,'rollback-lobby-'||mate||'@example.invalid','Rollback groupmate'),
 (outsider,'rollback-lobby-'||outsider||'@example.invalid','Rollback outsider');
 insert into public.courses(id,google_course_id,name,teacher_email) values(course,'rollback-lobby-'||course,'Rollback-only class','rollback-audit@example.invalid');
 insert into public.course_students(course_id,student_id) values(course,reporter),(course,mate);
 insert into public.lessons(id,title,slug,published,content_blocks) values(lesson,'Rollback-only lobby lesson','audit-lobby-rollback-'||lesson,false,doc);
 insert into public.lobby_sessions(id,course_id,created_by,code,status,group_size,lesson_id,block_id)
 values(lobby,course,'rollback-audit@example.invalid','rollback-'||lobby,'open',3,lesson,'audit-q');
 insert into public.lobby_groups(id,session_id,label,passphrase) values(grp,lobby,'Rollback group',array['mass','force']);
 insert into public.lobby_members(session_id,group_id,user_id,phrase_completed_at,joined_at) values
 (lobby,grp,reporter,null,clock_timestamp()-interval '3 seconds'),
 (lobby,grp,mate,clock_timestamp(),clock_timestamp()-interval '2 seconds');
 artifact_key:='lobby:'||lobby::text||':audit-q';
 denied:=false;
 begin perform public.submit_lobby_group_artifact(lobby,reporter::text,'{"text":"early"}','exit_ticket');
 exception when others then if sqlerrm like '%passphrase%' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Incomplete group entry unexpectedly submitted'; end if;
 insert into lobby_integrity_test_results values('Incomplete passphrase cannot submit',true);
 update public.lobby_members set phrase_completed_at=clock_timestamp() where session_id=lobby and user_id=reporter;
 denied:=false;
 begin perform public.submit_lobby_group_artifact(lobby,outsider::text,'{"text":"outsider"}','exit_ticket');
 exception when others then if sqlerrm like '%passphrase%' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Unaffiliated outsider unexpectedly submitted'; end if;
 insert into lobby_integrity_test_results values('User outside the lobby cannot submit',true);
 insert into public.lobby_members(session_id,group_id,user_id,phrase_completed_at) values(lobby,grp,outsider,clock_timestamp());
 denied:=false;
 begin perform public.submit_lobby_group_artifact(lobby,outsider::text,'{"text":"outsider"}','exit_ticket');
 exception when others then if sqlerrm like '%not enrolled%' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Unenrolled group member unexpectedly submitted'; end if;
 insert into lobby_integrity_test_results values('Group membership cannot bypass class enrollment',true);
 insert into public.block_responses(user_id,lesson_id,block_id,block_type,response,evidence_source) values
 (reporter,lesson,'audit-q','exit_ticket','{"text":"Reporter individual response"}','exit_ticket'),
 (mate,lesson,'audit-q','exit_ticket','{"text":"Groupmate individual response"}','exit_ticket');
 insert into public.lesson_submissions(user_id,lesson_id,content_snapshot) values(reporter,lesson,doc),(mate,lesson,doc);
 select public.submit_lobby_group_artifact(lobby,reporter::text,'{"text":"First shared artifact"}','exit_ticket') into result;
 if (result->>'members')::integer <> 2 then raise exception 'Shared artifact did not credit both enrolled members: %',result; end if;
 if (select count(*) from public.block_responses where session_id=lobby and block_id=artifact_key and response->>'text'='First shared artifact' and evidence_source='lobby') <> 2 then raise exception 'Missing per-member evidence'; end if;
 if (select count(distinct role) from public.block_responses where session_id=lobby and block_id=artifact_key) <> 2 then raise exception 'Distinct member roles missing'; end if;
 if (select count(*) from public.block_responses where session_id=lobby and user_id=outsider) <> 0 then raise exception 'Unenrolled member received evidence'; end if;
 if (select count(*) from public.lobby_group_artifacts where group_id=grp and submitted_by=reporter::text and response->>'text'='First shared artifact') <> 1 then raise exception 'Group does not have one shared artifact'; end if;
 insert into lobby_integrity_test_results values('One reporter submit writes one shared artifact and credits both enrolled members',true),('Per-member evidence carries distinct roles and excludes removed enrollment',true);
 if (select count(*) from public.block_responses where lesson_id=lesson and block_id='audit-q' and evidence_source='exit_ticket') <> 2 then raise exception 'Group task changed individual reader evidence'; end if;
 if exists(select 1 from public.lesson_submissions where lesson_id=lesson and (jsonb_array_length(response_snapshot)<>1 or response_snapshot->0->>'block_id'<>'audit-q')) then raise exception 'Group submission contaminated individual snapshots'; end if;
 insert into lobby_integrity_test_results values('Synthetic lobby block IDs preserve individual answers and submitted snapshots',true),('Pending individual lesson does not block a separate group artifact',true);
 insert into public.lesson_evidence_reviews(response_id,reviewer_email) select id,'rollback-audit@example.invalid' from public.block_responses where session_id=lobby and block_id=artifact_key;
 perform public.submit_lobby_group_artifact(lobby,mate::text,'{"text":"Revised shared artifact"}','exit_ticket');
 if (select count(*) from public.block_responses where session_id=lobby and block_id=artifact_key and response->>'text'='Revised shared artifact') <> 2 then raise exception 'Group revision did not synchronize each member'; end if;
 if exists(select 1 from public.lesson_evidence_reviews r join public.block_responses b on b.id=r.response_id where b.session_id=lobby) then raise exception 'Group edit failed to clear stale evidence reviews'; end if;
 if (select count(*) from public.lobby_group_artifacts where group_id=grp and submitted_by=mate::text and response->>'text'='Revised shared artifact') <> 1 then raise exception 'Second reporter created duplicate or stale group artifact'; end if;
 insert into lobby_integrity_test_results values('Groupmate edits synchronize the one shared artifact without duplicate evidence',true),('Group edits clear earlier evidence review markers',true);
 update public.lobby_sessions set status='closed' where id=lobby;
 denied:=false;
 begin perform public.submit_lobby_group_artifact(lobby,reporter::text,'{"text":"too late"}','exit_ticket');
 exception when others then if sqlerrm like '%not open%' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Closed lobby unexpectedly accepted artifact'; end if;
 insert into lobby_integrity_test_results values('Closed lobby rejects new artifacts',true);
end $$;
select test,passed from lobby_integrity_test_results;
rollback;
