drop function public.rate_interactive_assignment(uuid,uuid,text,smallint,text);
drop function public.reopen_interactive_assignment(uuid,uuid,integer,text);
create function public.rate_interactive_assignment(p_id uuid,p_submission uuid,p_reviewer text,p_level smallint,p_feedback text,p_admin boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare s interactive_assignment_submissions; a interactive_assignments; r interactive_assignment_reviews; record uuid; w interactive_assignment_work;
begin
 if p_level not between 1 and 3 or length(p_feedback)>1600 then raise exception 'Invalid rating'; end if;
 select * into s from interactive_assignment_submissions where id=p_submission;
 if not found then raise exception 'Submission unavailable'; end if;
 select * into a from interactive_assignments where id=s.assignment_id;
 if not exists(select 1 from courses c join course_students cs on cs.course_id=c.id where c.id=a.course_id and (p_admin or lower(c.teacher_email)=lower(p_reviewer)) and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE') then raise exception 'Only the teacher of this class can rate this work'; end if;
 select * into w from interactive_assignment_work where assignment_id=s.assignment_id and user_id=s.user_id for update;
 select * into r from interactive_assignment_reviews where submission_id=p_submission;
 if found then
  if r.id=p_id and r.reviewer_email=p_reviewer then return to_jsonb(r); end if;
  raise exception 'This submission already has a rating. Reload to see it.';
 end if;
 if w.status<>'submitted' or w.version<>s.version then raise exception 'A newer revision exists. Review the current submission.'; end if;
 insert into mastery_records(user_id,target_id,level,rated_by,evidence_source)
 values(s.user_id,a.target_id,p_level,p_reviewer,'Interactive lesson assignment · Day 3 Velocity · submission '||s.id::text) returning id into record;
 insert into interactive_assignment_reviews(id,submission_id,level,feedback,reviewer_email,record_id) values(p_id,s.id,p_level,p_feedback,p_reviewer,record) returning * into r;
 return to_jsonb(r);
end $$;

create function public.reopen_interactive_assignment(p_assignment uuid,p_user uuid,p_version integer,p_reviewer text,p_admin boolean default false)
returns void language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id where a.id=p_assignment and (p_admin or lower(c.teacher_email)=lower(p_reviewer)) and cs.student_id=p_user and cs.enrollment_state='ACTIVE') then raise exception 'Only the teacher of this class can return this work'; end if;
 update interactive_assignment_work set status='draft',version=version+1,updated_at=now() where assignment_id=p_assignment and user_id=p_user and version=p_version and status='submitted';
 if not found then raise exception 'Work changed. Reload before returning it.'; end if;
end $$;
revoke all on function public.write_interactive_assignment(uuid,uuid,integer,jsonb,uuid),public.rate_interactive_assignment(uuid,uuid,text,smallint,text,boolean),public.reopen_interactive_assignment(uuid,uuid,integer,text,boolean) from public,anon,authenticated;
grant execute on function public.write_interactive_assignment(uuid,uuid,integer,jsonb,uuid),public.rate_interactive_assignment(uuid,uuid,text,smallint,text,boolean),public.reopen_interactive_assignment(uuid,uuid,integer,text,boolean) to service_role;
