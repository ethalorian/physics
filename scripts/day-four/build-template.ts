import fs from 'node:fs'
import {DAY_FOUR_LESSON,DAY_FOUR_REVIEW,DAY_FOUR_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-four'
import {DAY_FOUR_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-four-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 4 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_FOUR_LESSON.slug)},4,${quote(DAY_FOUR_LESSON.title)},${array(DAY_FOUR_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_FOUR_SEQUENCE)},${quote(DAY_FOUR_LESSON.slug)},${quote(DAY_FOUR_REVIEW)},${array(DAY_FOUR_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_FOUR_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_FOUR_QUIZ))}::jsonb);
`
fs.writeFileSync('supabase/migrations/20261025224605_day_four_foundation_sequence.sql',sql)
