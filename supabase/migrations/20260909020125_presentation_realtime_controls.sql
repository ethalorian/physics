-- P-2/P-3: durable session state, immediate private delivery, ordered updates.
alter table public.present_sessions add column if not exists command_revision bigint not null default 0;
create or replace function public.present_command_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.command_revision := old.command_revision + 1;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.present_command_revision() from public, anon, authenticated;
grant execute on function public.present_command_revision() to service_role;
create trigger present_command_revision before update on public.present_sessions
for each row execute function public.present_command_revision();

-- Tokens carry ONLY this session capability (no user email, sub, or service key).
-- Browsers can receive, never publish authoritative commands on this channel.
create policy present_control_receive on realtime.messages for select to authenticated
using (extension = 'broadcast' and realtime.topic() = 'present:' || (select auth.jwt()->>'present_session'));

create or replace function public.present_broadcast_change() returns trigger
language plpgsql set search_path = '' as $$
declare sid uuid; payload jsonb; event_name text;
begin
  if tg_table_name = 'present_sessions' then
    sid := new.id;
    payload := jsonb_build_object('session', to_jsonb(new) - 'teacher_id');
    event_name := 'session';
  elsif tg_table_name = 'lobby_sessions' then
    for sid in select id from public.present_sessions
      where teacher_id = new.created_by and course_id = new.course_id and lesson_id = new.lesson_id
        and status = 'live' and created_at <= new.created_at
    loop
      perform realtime.send('{}'::jsonb, 'activity', 'present:' || sid, true);
    end loop;
    return new;
  else
    sid := new.session_id;
    payload := '{}'::jsonb;
    event_name := 'tools';
  end if;
  perform realtime.send(payload, event_name, 'present:' || sid, true);
  return new;
exception when others then
  -- Realtime is an accelerator: an outage must never prevent a durable command.
  raise warning 'Presentation notification unavailable (%)', sqlstate;
  return new;
end;
$$;
revoke all on function public.present_broadcast_change() from public, anon, authenticated;
grant execute on function public.present_broadcast_change() to service_role;
create trigger present_session_broadcast after update on public.present_sessions for each row execute function public.present_broadcast_change();
create trigger present_tools_broadcast after insert or update on public.present_session_tools for each row execute function public.present_broadcast_change();
create trigger present_pulse_broadcast after insert or update on public.present_pulses for each row execute function public.present_broadcast_change();
create trigger present_lobby_broadcast after insert or update on public.lobby_sessions for each row execute function public.present_broadcast_change();
