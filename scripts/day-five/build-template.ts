import fs from 'node:fs'
import {DAY_FIVE_LESSON,DAY_FIVE_REVIEW,DAY_FIVE_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-five'
import {DAY_FIVE_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-five-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 5 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_FIVE_LESSON.slug)},5,${quote(DAY_FIVE_LESSON.title)},${array(DAY_FIVE_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_FIVE_SEQUENCE)},${quote(DAY_FIVE_LESSON.slug)},${quote(DAY_FIVE_REVIEW)},${array(DAY_FIVE_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_FIVE_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_FIVE_QUIZ))}::jsonb);
`
fs.writeFileSync('supabase/migrations/20261026020926_day_five_foundation_sequence.sql',sql)
