import fs from 'node:fs'
import {DAY_SEVEN_LESSON,DAY_SEVEN_REVIEW,DAY_SEVEN_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-seven'
import {DAY_SEVEN_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-seven-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 7 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_SEVEN_LESSON.slug)},7,${quote(DAY_SEVEN_LESSON.title)},${array(DAY_SEVEN_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_SEVEN_SEQUENCE)},${quote(DAY_SEVEN_LESSON.slug)},${quote(DAY_SEVEN_REVIEW)},${array(DAY_SEVEN_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_SEVEN_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_SEVEN_QUIZ))}::jsonb);
`
fs.writeFileSync('supabase/migrations/20261026025951_day_seven_foundation_sequence.sql',sql)
