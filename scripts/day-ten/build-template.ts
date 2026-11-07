import fs from 'node:fs'
import {DAY_TEN_LESSON,DAY_TEN_REVIEW,DAY_TEN_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-ten'
import {DAY_TEN_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-ten-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 10 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_TEN_LESSON.slug)},10,${quote(DAY_TEN_LESSON.title)},${array(DAY_TEN_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_TEN_SEQUENCE)},${quote(DAY_TEN_LESSON.slug)},${quote(DAY_TEN_REVIEW)},${array(DAY_TEN_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_TEN_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_TEN_QUIZ))}::jsonb);
`
fs.writeFileSync('supabase/migrations/20261103040000_day_ten_foundation_sequence.sql',sql)
