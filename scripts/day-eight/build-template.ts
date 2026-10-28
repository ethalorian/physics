import fs from 'node:fs'
import {DAY_EIGHT_LESSON,DAY_EIGHT_REVIEW,DAY_EIGHT_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-eight'
import {DAY_EIGHT_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-eight-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 8 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_EIGHT_LESSON.slug)},8,${quote(DAY_EIGHT_LESSON.title)},${array(DAY_EIGHT_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_EIGHT_SEQUENCE)},${quote(DAY_EIGHT_LESSON.slug)},${quote(DAY_EIGHT_REVIEW)},${array(DAY_EIGHT_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_EIGHT_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_EIGHT_QUIZ))}::jsonb);
`
fs.writeFileSync('supabase/migrations/20261026031258_day_eight_foundation_sequence.sql',sql)
