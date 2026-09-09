-- Notification-only transport: no session state, student data, notes, or credentials
-- are broadcast. Every recipient reads state through the existing authorized API.
-- This supports NextAuth without distributing a Supabase user JWT to the browser.
create or replace function public.present_broadcast_change() returns trigger
language plpgsql set search_path = '' as $$
declare sid uuid; event_name text;
begin
  if tg_table_name = 'present_sessions' then
    sid := new.id;
    event_name := 'session';
  elsif tg_table_name = 'lobby_sessions' then
    for sid in select id from public.present_sessions
      where teacher_id = new.created_by and course_id = new.course_id and lesson_id = new.lesson_id
        and status = 'live' and created_at <= new.created_at
    loop
      perform realtime.send('{}'::jsonb, 'activity', 'present:' || sid, false);
    end loop;
    return new;
  else
    sid := new.session_id;
    event_name := 'tools';
  end if;
  perform realtime.send('{}'::jsonb, event_name, 'present:' || sid, false);
  return new;
exception when others then
  raise warning 'Presentation notification unavailable (%)', sqlstate;
  return new;
end;
$$;
drop policy if exists present_control_receive on realtime.messages;
