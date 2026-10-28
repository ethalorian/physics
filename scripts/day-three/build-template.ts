import fs from 'node:fs'
import {DAY_THREE_LESSON,DAY_THREE_REVIEW,DAY_THREE_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-three'
import {DAY_THREE_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-three-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
// Preserve the existing release transaction, rubric conversion, grants and
// independent mastery decisions. Only broaden eligibility to explicit labs.
const labFunctions=fs.readFileSync('supabase/migrations/20261025170102_four_dimension_lab_grades.sql','utf8')
 .replace("a.slug not like 'simulation-%' or t.slug is null", "(a.slug not like 'simulation-%' and not coalesce(t.is_lab,false)) or t.slug is null")
 .replace("raise exception 'Simulation unavailable'", "raise exception 'Lab unavailable'")
 .replace("if p_reviewer is null", "if t.is_lab and p_rubric is distinct from 'lab-four-dimensions-v1' then raise exception 'Use the four-dimension rubric for this lab'; end if;\n  if p_reviewer is null")
 .replace("w.state is distinct from s.state", "(case when exists(select 1 from daily_lesson_templates where foundation_slug=a.slug) then (w.state-'partner_exchange') is distinct from (s.state-'partner_exchange') else w.state is distinct from s.state end)")
 .replace("'Simulation lab · '", "'Lab · '")
 .replaceAll("a.slug like 'simulation-%'", "(a.slug like 'simulation-%' or t.is_lab)")
 .replaceAll("lesson_slug like 'simulation-%'", "(lesson_slug like 'simulation-%' or exists(select 1 from interactive_assignment_templates where slug=lesson_slug and is_lab))")
const sql=`-- Explicit lab designation is authored by staff, never supplied by students.
-- Existing review identities, submissions, grades and mastery records are unchanged.
alter table public.interactive_assignment_templates add column is_lab boolean not null default false;
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_THREE_LESSON.slug)},3,${quote(DAY_THREE_LESSON.title)},${array(DAY_THREE_LESSON.targets)},true);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_THREE_SEQUENCE)},${quote(DAY_THREE_LESSON.slug)},${quote(DAY_THREE_REVIEW)},${array(DAY_THREE_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_THREE_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_THREE_QUIZ))}::jsonb);

${labFunctions}
`
fs.writeFileSync('supabase/migrations/20261025223031_day_three_foundation_lab_sequence.sql',sql)
