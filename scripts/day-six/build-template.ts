import fs from 'node:fs'
import {DAY_SIX_LESSON,DAY_SIX_REVIEW,DAY_SIX_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-six'
import {DAY_SIX_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-six-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 6 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_SIX_LESSON.slug)},6,${quote(DAY_SIX_LESSON.title)},${array(DAY_SIX_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_SIX_SEQUENCE)},${quote(DAY_SIX_LESSON.slug)},${quote(DAY_SIX_REVIEW)},${array(DAY_SIX_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_SIX_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_SIX_QUIZ))}::jsonb);
`
fs.writeFileSync('supabase/migrations/20261026024018_day_six_foundation_sequence.sql',sql)
