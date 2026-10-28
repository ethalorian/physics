-- Fictional test database only. Native quiz and worksheet schemas are loaded first.
create table interactive_assignments(id uuid primary key default gen_random_uuid(),course_id uuid,slug text,target_id uuid,due_on date,unique(course_id,slug));
create table lessons(id uuid primary key,published boolean,unit_id text,visibility_track text);
create table lesson_class_windows(id uuid primary key default gen_random_uuid(),course_id text,lesson_id text,open_at timestamptz,close_at timestamptz,due_at timestamptz,set_by text,updated_at timestamptz,unique(course_id,lesson_id));
create table textbook_assignments(id uuid primary key,course_id uuid,status text,version integer,due_at timestamptz,opens_at timestamptz);
create table reading_syllabus_bundles(course_id uuid,step_id text,reading_id uuid,reading_quiz_id uuid,vocabulary_quiz_id uuid);
create table choice_sections(id uuid primary key,course_id uuid,published_at timestamptz,due_at timestamptz,options jsonb);
create table rotation_calendar(id text primary key,anchor_date text,anchor_p1_block text,no_school_dates text[],cycle_offset integer,alt_week_anchor text);
insert into rotation_calendar values('default','2026-10-19','A','{}',0,null);
create table section_schedules(id uuid primary key default gen_random_uuid(),course_id uuid,blocks text[],block text,week_pattern text,on_week_anchor text,on_week_dates text[]);
insert into section_schedules(course_id,blocks,week_pattern) values('00000000-0000-4000-8000-000000000001',array['G'],'every');
alter table quiz_assignments add column daily_sequence_key text;
