import fs from 'node:fs'
import {DAY_FOURTEEN_LESSON,DAY_FOURTEEN_REVIEW,DAY_FOURTEEN_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-fourteen'
import {DAY_FOURTEEN_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-fourteen-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 14 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_FOURTEEN_LESSON.slug)},${DAY_FOURTEEN_LESSON.day},${quote(DAY_FOURTEEN_LESSON.title)},${array(DAY_FOURTEEN_LESSON.targets)},true);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_FOURTEEN_SEQUENCE)},${quote(DAY_FOURTEEN_LESSON.slug)},${quote(DAY_FOURTEEN_REVIEW)},${array(DAY_FOURTEEN_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_FOURTEEN_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_FOURTEEN_QUIZ))}::jsonb);
`
fs.writeFileSync(process.argv[2],sql)
