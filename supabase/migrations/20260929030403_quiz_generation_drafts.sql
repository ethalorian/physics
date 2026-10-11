-- Generation jobs are private server records. Quiz assignments remain the student-facing resource.
create table public.quiz_generations (
 id uuid primary key,
 course_id uuid not null references public.courses(id),
 created_by text not null,
 request jsonb not null,
 status text not null default 'pending' check(status in ('pending','ready','failed')),
 quiz_payload jsonb,
 model text,
 input_tokens integer,
 output_tokens integer,
 estimated_cost_usd numeric,
 error text,
 created_at timestamptz not null default now(),
 completed_at timestamptz
);
create index quiz_generations_actor_time on public.quiz_generations(created_by,created_at desc);
alter table public.quiz_generations enable row level security;
revoke all on public.quiz_generations from public,anon,authenticated;
grant all on public.quiz_generations to service_role;

create function public.reserve_quiz_generation(p_request jsonb,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare g public.quiz_generations;
begin
 perform pg_advisory_xact_lock(hashtextextended('quiz-generation:'||lower(p_actor),0));
 if not exists(select 1 from public.courses where id=(p_request->>'course_id')::uuid and lower(teacher_email)=lower(p_owner) and archived_at is null) then raise exception 'Choose your own active class.';end if;
 select * into g from public.quiz_generations where id=(p_request->>'id')::uuid;
 if found then
  if g.created_by<>lower(p_actor) or g.request<>p_request then raise exception 'This generation request changed. Start a new draft.';end if;
  if g.status='pending' and g.quiz_payload is null and g.created_at<now()-interval '3 minutes' then
   update public.quiz_generations set status='failed',error='Generation was interrupted. Start a new draft.',completed_at=now() where id=g.id returning * into g;
  end if;
  return jsonb_build_object('created',false,'generation',to_jsonb(g));
 end if;
 if exists(select 1 from public.quiz_assignments where id=(p_request->>'id')::uuid) then raise exception 'Start a new draft with a new request.';end if;
 if exists(select 1 from public.quiz_generations where created_by=lower(p_actor) and status='pending' and created_at>now()-interval '3 minutes') then raise exception 'A quiz is already generating. Wait for it to finish.';end if;
 if (select count(*) from public.quiz_generations where created_by=lower(p_actor) and created_at>now()-interval '1 hour')>=20 then raise exception 'You have generated 20 quizzes this hour. Please try again later.';end if;
 insert into public.quiz_generations(id,course_id,created_by,request) values((p_request->>'id')::uuid,(p_request->>'course_id')::uuid,lower(p_actor),p_request) returning * into g;
 return jsonb_build_object('created',true,'generation',to_jsonb(g));
end $$;

create function public.finish_quiz_generation(p_id uuid,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare g public.quiz_generations;q jsonb;
begin
 select * into g from public.quiz_generations where id=p_id and created_by=lower(p_actor) for update;
 if not found then raise exception 'Generation unavailable.';end if;
 if not exists(select 1 from public.courses where id=g.course_id and lower(teacher_email)=lower(p_owner) and archived_at is null) then raise exception 'Choose your own active class.';end if;
 if g.status='ready' then select to_jsonb(a) into q from public.quiz_assignments a where id=p_id;return q;end if;
 if g.status<>'pending' or g.quiz_payload is null then raise exception 'The quiz is not ready yet.';end if;
 if g.quiz_payload->>'id'<>g.id::text or g.quiz_payload->>'course_id'<>g.course_id::text or g.quiz_payload->>'status'<>'draft' then raise exception 'Invalid generated draft.';end if;
 q:=public.save_quiz_assignment(g.quiz_payload,p_actor,p_owner);
 update public.quiz_generations set status='ready',completed_at=now() where id=p_id;
 return q;
end $$;
revoke all on function public.reserve_quiz_generation(jsonb,text,text),public.finish_quiz_generation(uuid,text,text) from public,anon,authenticated;
grant execute on function public.reserve_quiz_generation(jsonb,text,text),public.finish_quiz_generation(uuid,text,text) to service_role;
