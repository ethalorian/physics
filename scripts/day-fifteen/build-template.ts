import fs from 'node:fs'
import {DAY_FIFTEEN_LESSON,DAY_FIFTEEN_REVIEW,DAY_FIFTEEN_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-fifteen'
import {DAY_FIFTEEN_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-fifteen-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 15 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_FIFTEEN_LESSON.slug)},${DAY_FIFTEEN_LESSON.day},${quote(DAY_FIFTEEN_LESSON.title)},${array(DAY_FIFTEEN_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_FIFTEEN_SEQUENCE)},${quote(DAY_FIFTEEN_LESSON.slug)},${quote(DAY_FIFTEEN_REVIEW)},${array(DAY_FIFTEEN_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_FIFTEEN_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_FIFTEEN_QUIZ))}::jsonb);
`
fs.writeFileSync(process.argv[2],sql)
