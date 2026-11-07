import fs from 'node:fs'
import {DAY_TWELVE_LESSON,DAY_TWELVE_REVIEW,DAY_TWELVE_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-twelve'
import {DAY_TWELVE_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-twelve-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 12 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_TWELVE_LESSON.slug)},12,${quote(DAY_TWELVE_LESSON.title)},${array(DAY_TWELVE_LESSON.targets)},true);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_TWELVE_SEQUENCE)},${quote(DAY_TWELVE_LESSON.slug)},${quote(DAY_TWELVE_REVIEW)},${array(DAY_TWELVE_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_TWELVE_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_TWELVE_QUIZ))}::jsonb);
`
fs.writeFileSync('supabase/migrations/20261103144500_day_twelve_foundation_sequence.sql',sql)
