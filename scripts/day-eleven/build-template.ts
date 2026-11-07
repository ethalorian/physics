import fs from 'node:fs'
import {DAY_ELEVEN_LESSON,DAY_ELEVEN_REVIEW,DAY_ELEVEN_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-eleven'
import {DAY_ELEVEN_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-eleven-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 11 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_ELEVEN_LESSON.slug)},11,${quote(DAY_ELEVEN_LESSON.title)},${array(DAY_ELEVEN_LESSON.targets)},true);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_ELEVEN_SEQUENCE)},${quote(DAY_ELEVEN_LESSON.slug)},${quote(DAY_ELEVEN_REVIEW)},${array(DAY_ELEVEN_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_ELEVEN_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_ELEVEN_QUIZ))}::jsonb);
`
fs.writeFileSync('supabase/migrations/20261103141000_day_eleven_foundation_sequence.sql',sql)
