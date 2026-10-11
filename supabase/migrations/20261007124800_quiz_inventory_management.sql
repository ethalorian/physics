-- Atomic, teacher-scoped quiz removal. Existing mastery judgments remain append-only (M-1).
-- Preview and delete use the same impact fingerprint; a new save/review invalidates confirmation.
create function public.manage_quiz_inventory(p_quiz uuid,p_owner text,p_action text,p_version integer default null,p_title text default null,p_fingerprint text default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.quiz_assignments; impact jsonb; fingerprint text; w jsonb; s jsonb; r jsonb; d jsonb; copies jsonb; g jsonb;
begin
 if p_action is null or p_action not in ('preview','rename','delete') then raise exception 'Invalid quiz management action.';end if;
 -- Generation completion acquires its job before the assignment. Use that same order.
 perform 1 from public.quiz_generations where id=p_quiz for update;
 select q.* into a from public.quiz_assignments q join public.courses c on c.id=q.course_id
 where q.id=p_quiz and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for update of q;
 if not found then raise exception 'Quiz unavailable for this account. Refresh the inventory.';end if;
 if p_action='rename' then
  if a.deleted_at is not null then raise exception 'Restore this draft before renaming it.';end if;
  if p_title is null or length(btrim(p_title)) not between 1 and 160 then raise exception 'Enter a title between 1 and 160 characters.';end if;
  if a.version is distinct from p_version then raise exception 'Quiz changed. Refresh before saving.';end if;
  update public.quiz_assignments set title=btrim(p_title),version=version+1,updated_at=now() where id=a.id returning * into a;
  return jsonb_build_object('id',a.id,'title',a.title,'version',a.version);
 end if;
 select coalesce(jsonb_agg(jsonb_build_array(user_id,version,state,submission_id) order by user_id),'[]') into w from public.quiz_work where quiz_id=a.id;
 select coalesce(jsonb_agg(id order by id),'[]') into s from public.quiz_submissions where quiz_id=a.id;
 select coalesce(jsonb_agg(r0.id order by r0.id),'[]') into r from public.quiz_reviews r0 join public.quiz_submissions s0 on s0.id=r0.submission_id where s0.quiz_id=a.id;
 select coalesce(jsonb_agg(jsonb_build_array(d0.submission_id,d0.version) order by d0.submission_id),'[]') into d from public.quiz_review_drafts d0 join public.quiz_submissions s0 on s0.id=d0.submission_id where s0.quiz_id=a.id;
 select coalesce(jsonb_agg(jsonb_build_array(id,version) order by id),'[]') into copies from public.quiz_assignments where source_quiz_id=a.id;
 select coalesce(jsonb_agg(jsonb_build_array(id,status,completed_at) order by id),'[]') into g from public.quiz_generations where id=a.id;
 impact:=jsonb_build_object('work',jsonb_array_length(w),'submissions',jsonb_array_length(s),'reviews',jsonb_array_length(r),'reviewDrafts',jsonb_array_length(d),'copies',jsonb_array_length(copies),'generations',jsonb_array_length(g));
 fingerprint:=md5(jsonb_build_array(a.id,a.version,a.title,a.status,a.deleted_at,w,s,r,d,copies,g)::text);
 if p_action='preview' then return jsonb_build_object('id',a.id,'title',a.title,'version',a.version,'status',a.status,'deleted_at',a.deleted_at,'impact',impact,'fingerprint',fingerprint);end if;
 if a.version is distinct from p_version or a.title is distinct from p_title or fingerprint is distinct from p_fingerprint then raise exception 'Quiz or student work changed. Reload the deletion preview and confirm again.';end if;
 -- Foreign keys intentionally do not cascade: every affected record is explicit here.
 delete from public.quiz_review_drafts where submission_id in (select id from public.quiz_submissions where quiz_id=a.id);
 delete from public.quiz_reviews where submission_id in (select id from public.quiz_submissions where quiz_id=a.id);
 update public.quiz_work set submission_id=null where quiz_id=a.id;
 delete from public.quiz_submissions where quiz_id=a.id;
 delete from public.quiz_work where quiz_id=a.id;
 update public.quiz_assignments set source_quiz_id=null,version=version+1,updated_at=now() where source_quiz_id=a.id;
 delete from public.quiz_generations where id=a.id;
 delete from public.quiz_assignments where id=a.id;
 return jsonb_build_object('id',a.id,'deleted',true,'impact',impact);
end $$;
revoke all on function public.manage_quiz_inventory(uuid,text,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.manage_quiz_inventory(uuid,text,text,integer,text,text) to service_role;
grant delete on public.quiz_assignments,public.quiz_work,public.quiz_submissions,public.quiz_reviews,public.quiz_review_drafts to service_role;
