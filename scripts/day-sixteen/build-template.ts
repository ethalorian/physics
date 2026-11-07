import fs from 'node:fs'
import {DAY_SIXTEEN_LESSON,DAY_SIXTEEN_REVIEW,DAY_SIXTEEN_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-sixteen'
import {DAY_SIXTEEN_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-sixteen-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 16 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_SIXTEEN_LESSON.slug)},${DAY_SIXTEEN_LESSON.day},${quote(DAY_SIXTEEN_LESSON.title)},${array(DAY_SIXTEEN_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_SIXTEEN_SEQUENCE)},${quote(DAY_SIXTEEN_LESSON.slug)},${quote(DAY_SIXTEEN_REVIEW)},${array(DAY_SIXTEEN_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_SIXTEEN_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_SIXTEEN_QUIZ))}::jsonb);
`
fs.writeFileSync(process.argv[2],sql)
