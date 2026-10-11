"""Initial-install SQL. New IDs preserve historical answers and assignments.
Staging rejects collisions. Activation is a separate transaction after readback
and a verified application deployment. No student response or grade writes.
"""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent
def read(name):return json.loads((HERE/(name+'.json')).read_text())
def payload(data):
 s=json.dumps(data,ensure_ascii=False);assert '$etf_data$' not in s
 return '$etf_data$'+s+'$etf_data$::jsonb'
def insert(table,items):
 columns=','.join(items[0]);assert all(list(x)==list(items[0]) for x in items)
 return f'insert into public.{table}({columns}) select {columns} from jsonb_populate_recordset(null::public.{table},{payload(items)});\n'
guard="""if not exists(select 1 from courses where id='33c5a178-998f-4158-aea9-f8589ade37b0' and name='MVP Engineering' and program='trades' and teacher_email='antoccic@fitchburg.k12.ma.us' and archived_at is null) then raise exception 'Course context changed'; end if;"""
sql='begin;\ndo $$ begin '+guard+" if exists(select 1 from units where id like 'trades-etf-%') then raise exception 'ETF units already exist; inspect before rerunning'; end if; end $$;\n"
for table,name in [('units','units'),('learning_targets','targets'),('mastery_tasks','mastery-tasks')]:sql+=insert(table,read(name))
sql+="commit; select jsonb_build_object('units',(select count(*) from units where id like 'trades-etf-%'),'targets',(select count(*) from learning_targets where unit_id like 'trades-etf-%'),'tasks',(select count(*) from mastery_tasks where unit_id like 'trades-etf-%'));"
(HERE/'stage-0.sql').write_text(sql)
lessons=read('lessons');vocab=read('vocabulary-sets')
for p in range(1,5):
 ls=[l for l in lessons if l['unit_id']==f'trades-etf-{p}']; vs=[s for s in vocab if s['unit_id']==f'trades-etf-{p}']
 sql='begin;\ndo $$ begin '+guard+f" if exists(select 1 from lessons where unit_id='trades-etf-{p}') then raise exception 'Project lessons already staged; inspect before rerunning'; end if; end $$;\n"
 sql+=insert('lessons',ls)
 sql+='do $check$ declare expected jsonb := '+payload(ls)+f"; begin if (select count(*) from jsonb_array_elements(expected) j join lessons l on l.id=(j->>'id')::uuid where to_jsonb(l) @> j) <> {len(ls)} then raise exception 'Stored lesson content does not match authored source'; end if; end $check$;\n"
 sql+='do $vocab$ declare data jsonb := '+payload(vs)+"; item jsonb; saved jsonb; begin for item in select value from jsonb_array_elements(data) loop saved := public.save_lesson_vocabulary((item->>'lesson_id')::uuid,null,item->'terms',false); update public.vocabulary_sets set name=item->>'name',description=item->>'description',created_by='antoccic@fitchburg.k12.ma.us' where id=(saved->>'setId')::uuid; end loop; end $vocab$;\n"
 sql+=f"commit; select jsonb_build_object('project',{p},'lessons',(select count(*) from lessons where unit_id='trades-etf-{p}' and not published),'vocabulary_sets',(select count(*) from vocabulary_sets where unit_id='trades-etf-{p}' and not published),'terms',(select count(*) from vocabulary_terms t join vocabulary_sets s on s.id=t.vocabulary_set_id where s.unit_id='trades-etf-{p}' and not t.archived));"
 (HERE/f'stage-{p}.sql').write_text(sql)

# Retirement metadata was backed up before staging; no prior content is overwritten.
first=lessons[0]['id']
sql='begin;\ndo $$ begin '+guard+" if (select count(*) from lessons where unit_id like 'trades-etf-%')<>36 or (select count(*) from learning_targets where unit_id like 'trades-etf-%')<>20 or (select count(*) from lesson_plan_links where unit_id like 'trades-etf-%')<>36 then raise exception 'Incomplete ETF curriculum or teacher-plan verification'; end if; if (select count(*) from vocabulary_sets where unit_id like 'trades-etf-%' and not archived)<>36 then raise exception 'Incomplete vocabulary'; end if; end $$;\n"
sql+="""update lessons set published=true,updated_at=now() where unit_id like 'trades-etf-%';
update vocabulary_sets set published=true,updated_at=now() where unit_id like 'trades-etf-%' and not archived;
update lessons set published=false,updated_at=now() where unit_id ~ '^trades-reset-[1-6]$';
update units set name=case when name like 'Archive · %' then name else 'Archive · '||name end,order_index=200+right(id,1)::integer,default_start_date=null,updated_at=now() where id ~ '^trades-reset-[1-6]$';
update learning_targets set exclude_from_growth=true,updated_at=now() where unit_id ~ '^trades-reset-[1-6]$';
update vocabulary_sets set published=false,updated_at=now() where unit_id ~ '^trades-reset-[1-6]$';
update lesson_class_windows set close_at=now(),updated_at=now(),set_by='antoccic@fitchburg.k12.ma.us' where course_id='33c5a178-998f-4158-aea9-f8589ade37b0' and lesson_id in(select id::text from lessons where unit_id ~ '^trades-reset-[1-6]$') and close_at is null;
"""
sql+=f"insert into lesson_class_windows(course_id,lesson_id,open_at,close_at,set_by) values('33c5a178-998f-4158-aea9-f8589ade37b0','{first}',now(),null,'antoccic@fitchburg.k12.ma.us') on conflict(course_id,lesson_id) do update set open_at=excluded.open_at,close_at=null,set_by=excluded.set_by,updated_at=now();\n"
sql+="""commit;
select jsonb_build_object('published',(select count(*) from lessons where unit_id like 'trades-etf-%' and published),'old_published',(select count(*) from lessons where unit_id ~ '^trades-reset-[1-6]$' and published),'vocab_sets',(select count(*) from vocabulary_sets where unit_id like 'trades-etf-%' and published and not archived),'open_lessons',(select jsonb_agg(l.slug) from lesson_class_windows w join lessons l on l.id::text=w.lesson_id where w.course_id='33c5a178-998f-4158-aea9-f8589ade37b0' and l.published and coalesce(w.open_at,'-infinity')<=now() and coalesce(w.close_at,'infinity')>now()));
"""
(HERE/'activate.sql').write_text(sql)
print('Prepared staging transactions 0–4 and a guarded activation transaction. No database writes performed.')
