import fs from 'node:fs'
import {DAY_NINE_LESSON,DAY_NINE_REVIEW,DAY_NINE_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-nine'
import {DAY_NINE_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-nine-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 9 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_NINE_LESSON.slug)},9,${quote(DAY_NINE_LESSON.title)},${array(DAY_NINE_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_NINE_SEQUENCE)},${quote(DAY_NINE_LESSON.slug)},${quote(DAY_NINE_REVIEW)},${array(DAY_NINE_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_NINE_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_NINE_QUIZ))}::jsonb);
`
fs.writeFileSync('supabase/migrations/20261026155816_day_nine_foundation_sequence.sql',sql)
