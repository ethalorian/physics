const fs=require('node:fs'),{execFileSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),sql=`begin;
create table public.courses(id uuid primary key);
do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role;end if;end $$;
`+fs.readFileSync(root+'/supabase/migrations/20261028150947_unified_assignment_review.sql','utf8')+`
insert into courses values('00000000-0000-4000-8000-000000000001');
insert into review_desk_drafts(course_id,source_key,user_id,source_version,reviewer_email,payload) values('00000000-0000-4000-8000-000000000001','quiz:fictional','fictional','attempt1','teacher@test','{"note":"Private"}');
do $$ declare t text; n integer; begin
foreach t in array array['review_desk_drafts','review_desk_revisions','review_desk_suggestions'] loop
 if not (select relrowsecurity from pg_class where oid=('public.'||t)::regclass) then raise exception 'RLS missing';end if;
 if has_table_privilege('anon','public.'||t,'SELECT') or has_table_privilege('authenticated','public.'||t,'SELECT') or has_table_privilege('authenticated','public.'||t,'INSERT') then raise exception 'Private data exposed';end if;
 if not has_table_privilege('service_role','public.'||t,'SELECT,INSERT,UPDATE') then raise exception 'Server access missing';end if;
end loop;
update review_desk_drafts set state='ready',version=2 where source_version='attempt1' and version=1;get diagnostics n=row_count;if n<>1 then raise exception 'Draft save failed';end if;
update review_desk_drafts set payload='{"note":"Stale overwrite"}' where source_version='attempt1' and version=1;get diagnostics n=row_count;if n<>0 then raise exception 'Stale write accepted';end if;
update review_desk_drafts set state='releasing',lease_until=now()+interval '3 minutes' where state='ready' and (lease_until is null or lease_until<now());get diagnostics n=row_count;if n<>1 then raise exception 'Claim failed';end if;
update review_desk_drafts set state='releasing',lease_until=now()+interval '3 minutes' where state='ready' and (lease_until is null or lease_until<now());get diagnostics n=row_count;if n<>0 then raise exception 'Duplicate claim accepted';end if;
begin insert into review_desk_revisions(course_id,source_key,user_id,source_version,reviewer_email,feedback,evidence) values('00000000-0000-4000-8000-000000000001','quiz:fictional','fictional','attempt1','teacher@test','   ','[]');raise exception 'Blank feedback accepted';exception when check_violation then null;end;
insert into review_desk_revisions(course_id,source_key,user_id,source_version,reviewer_email,feedback,evidence) values('00000000-0000-4000-8000-000000000001','quiz:fictional','fictional','attempt1','teacher@test','Compare start and finish.','[]');
if (select count(*) from review_desk_drafts)<>1 then raise exception 'Existing draft lost';end if;
end $$;
rollback;`;
execFileSync('/opt/homebrew/bin/psql',['postgresql://craigantocci@127.0.0.1:55442/postgres','-X','-v','ON_ERROR_STOP=1','-q'],{input:sql,stdio:['pipe','inherit','inherit']});console.log('PASS: real PostgreSQL migration, RLS/grants, draft conflict, release lease, revision validation and rollback.');
