-- Run against the isolated schema fixture (uses synthetic records only). No data survives.
begin;
do $$
declare c uuid:=gen_random_uuid(); otherc uuid:=gen_random_uuid(); alice uuid:=gen_random_uuid(); bob uuid:=gen_random_uuid(); t uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); v uuid:=gen_random_uuid(); q uuid:=gen_random_uuid(); readid uuid:=gen_random_uuid(); lid uuid:=gen_random_uuid(); sessionid uuid:=gen_random_uuid(); pulse uuid:=gen_random_uuid(); m uuid:=gen_random_uuid(); before_roster jsonb; u text:='unit-1'; task record; n int;
begin
 insert into public.courses(id,program) values(c,'physics'),(otherc,'physics');
 insert into public.students(id,name,email,is_active) values(alice,'Example A','a@example.invalid',true),(bob,'Example B','b@example.invalid',true);
 insert into public.course_students(course_id,student_id,enrollment_state,enrolled_at) values(c,alice,'ACTIVE',now()-interval '2 days'),(c,bob,'ACTIVE',now()-interval '2 days');
 insert into public.units(id,program) values(u,'physics');
 insert into public.learning_targets(id,unit_id,program) values(t,u,'physics');
 insert into public.interactive_assignments(id,course_id,slug,due_on) values(a,c,'day-1-foundation-briefing',current_date),(b,c,'day-2-foundation-motion',current_date),
 (gen_random_uuid(),c,'day-3-foundation-velocity',current_date),(gen_random_uuid(),c,'day-21-transfer-plan',current_date),(gen_random_uuid(),c,'day-1-the-briefing',null);
 insert into public.interactive_assignments(id,course_id,slug,due_on) values(gen_random_uuid(),otherc,'day-1-foundation-briefing',current_date);
 insert into public.textbook_assignments(id,course_id,title,status,due_at,questions) values(readid,c,'Reading','published',now(),jsonb_build_array(jsonb_build_object('target_id',t)));
 insert into public.textbook_reading_exemptions(assignment_id,user_id) values(readid,bob);
 insert into public.vocab_tasks(id,course_id,title,target_id,student_ids,due_on,active,task_kind,quiz_format) values
 (v,c,'Practice',t,array[alice],current_date,true,'practice',null),(q,c,'Checkpoint',t,array[alice,bob],current_date,true,'quiz','checkpoint');
 insert into public.lessons(id,unit_id,title,slug,published,content_blocks) values(lid,u,'Reflection','test-reflection',true,'{"reflection":{"kind":"graphic-novel"}}');
 insert into public.lesson_class_windows(lesson_id,course_id,due_at) values(lid::text,c::text,now());
 if (select count(*) from public.mastery_xp_work(c,alice))<>5 or (select count(*) from public.mastery_xp_work(c,bob))<>3 then raise exception 'wrong personal denominator'; end if;
 if exists(select from public.mastery_xp_work(otherc,alice)) then raise exception 'cross-class opportunity'; end if;
 -- Old paid reading (5) should be topped up only once (5 more).
 alter table public.economy_point_grants disable trigger mastery_xp_legacy;
 insert into public.economy_point_grants(user_id,source,reference,points,dedupe_key) values(alice,'reading-assignment',readid::text,5,'reading-assignment:'||readid||':'||alice);
 alter table public.economy_point_grants enable trigger mastery_xp_legacy;
 insert into public.interactive_assignment_submissions(id,assignment_id,user_id,submitted_at) values(gen_random_uuid(),a,alice,now());
 if exists(select from public.mastery_xp_receipts) then raise exception 'course was not enabled'; end if;
 perform public.enable_mastery_xp(c,'example teacher'); perform public.enable_mastery_xp(c,'example teacher');
 insert into public.textbook_submissions(id,assignment_id,user_id,submitted_at) values(gen_random_uuid(),readid,alice,now()),(gen_random_uuid(),readid,alice,now());
 insert into public.interactive_assignment_submissions(id,assignment_id,user_id,submitted_at) values(gen_random_uuid(),a,alice,now()),(gen_random_uuid(),b,alice,now()),(gen_random_uuid(),a,alice,now());
 insert into public.vocab_checks(id,task_id,user_id,items,result,completed_at) values(gen_random_uuid(),v,alice,'[{}]','[{}]',now()),(gen_random_uuid(),q,alice,'[{}]','[{}]',now());
 insert into public.economy_point_grants(user_id,source,reference,points,dedupe_key) values(alice,'vocab-assignment',q::text,10,'vocab-assignment:'||q||':'||alice);
 perform public.credit_mastery_xp(c,alice); perform public.credit_mastery_xp(c,alice);
 if (select count(*) from public.mastery_xp_receipts where user_id=alice)<>4 or (select sum(points) from public.economy_point_grants where user_id=alice)<>40 then raise exception 'lost or duplicate wallet grant'; end if;
 insert into public.course_grading_settings(course_id,terms) values(c,'[{"id":"t1"}]');
 before_roster:=public.mastery_xp_preview(c,u);
 if has_function_privilege('authenticated','public.release_mastery_xp(uuid,text,text,text,jsonb)','execute') or has_table_privilege('authenticated','public.mastery_xp_results','select') then raise exception 'browser role could post or read private grades'; end if;
 begin perform public.release_mastery_xp(c,u,'t1','teacher','[]'); raise exception 'stale preview accepted'; exception when raise_exception then if sqlerrm not like 'Assigned work changed.%' then raise; end if; end;
 perform public.release_mastery_xp(c,u,'t1','teacher',before_roster);
 if not exists(select from public.mastery_xp_results where course_id=c and user_id=alice and assigned=5 and completed=4) then raise exception '4/5 not posted'; end if;
 -- New submissions fund the wallet but never silently rewrite the posted grade.
 insert into public.lesson_submissions(id,lesson_id,user_id,submitted_at) values(gen_random_uuid(),lid,alice,now());
 if (select completed from public.mastery_xp_results where user_id=alice)<>4 or (select count(*) from public.mastery_xp_receipts where user_id=alice)<>5 then raise exception 'posted grade changed or lesson not credited'; end if;
 -- A graded lab cannot earn indirectly from a lesson block, live pulse, or saved video.
 update public.lessons set lesson_type='lab' where id=lid;
 if exists(select from public.mastery_xp_work(c,alice) where work_key='lesson:'||lid) then raise exception 'lab counted for XP'; end if;
 insert into public.economy_point_grants(user_id,source,reference,points,dedupe_key) values(alice,'lesson-block',lid||':test',10,'test-lab-block');
 if exists(select from public.economy_point_grants where dedupe_key='test-lab-block') then raise exception 'lab paid wallet XP'; end if;
 -- A choice with its own grade takes ownership of the native activity.
 insert into public.choice_sections(id,course_id,published,points_per_choice,options) values(gen_random_uuid(),c,true,10,jsonb_build_array(jsonb_build_object('steps',jsonb_build_array(jsonb_build_object('kind','interactive','sourceId',a)))));
 if exists(select from public.mastery_xp_work(c,alice) where work_key='interactive:'||a) then raise exception 'graded choice counted'; end if;
 insert into public.present_sessions(id,course_id) values(sessionid,c);
 insert into public.present_pulses(id,session_id,kind,target_id,prompt,required,anonymous,created_at) values(pulse,sessionid,'exit_ticket',t,'Explain',true,false,now());
 insert into public.present_ticket_responses(id,pulse_id,user_id,response,created_at) values(gen_random_uuid(),pulse,alice,'My explanation',now());
 insert into public.math_mission_assignments(id,user_id,xp_course_id,xp_unit_id,title,due_at) values(m,alice,c,u,'Assigned mission',now());
 insert into public.math_mission_sessions(id,user_id,assignment_id,status,staff,completed_at) values(gen_random_uuid(),alice,m,'completed',false,now()),(gen_random_uuid(),alice,null,'completed',false,now());
 if (select count(*) from public.mastery_xp_receipts where user_id=alice)<>7 then raise exception 'missing classroom/mission grant or optional work counted'; end if;
 -- A restored exemption affects only its student and reconciles past submitted work.
 insert into public.textbook_submissions(id,assignment_id,user_id,submitted_at) values(gen_random_uuid(),readid,bob,now());
 if exists(select from public.mastery_xp_receipts where user_id=bob) then raise exception 'excused work paid'; end if;
 delete from public.textbook_reading_exemptions where assignment_id=readid and user_id=bob;
 if not exists(select from public.mastery_xp_receipts where user_id=bob and work_key='reading:'||readid) then raise exception 'restored assignment missing receipt'; end if;
 if (public.student_mastery_xp(c,alice)->'posted'->0->>'completed')::int<>4 then raise exception 'student release mismatch'; end if;
end $$;
rollback;
