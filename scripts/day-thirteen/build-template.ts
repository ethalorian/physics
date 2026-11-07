import fs from 'node:fs'
import {DAY_THIRTEEN_LESSON,DAY_THIRTEEN_REVIEW,DAY_THIRTEEN_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-thirteen'
import {DAY_THIRTEEN_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-thirteen-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const sql=`-- Authored Day 13 foundation and linked quiz; existing review records are unchanged.
-- Reuses the existing sequence, pairing, approval and per-student submission rules.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values (${quote(DAY_THIRTEEN_LESSON.slug)},13,${quote(DAY_THIRTEEN_LESSON.title)},${array(DAY_THIRTEEN_LESSON.targets)},false);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_THIRTEEN_SEQUENCE)},${quote(DAY_THIRTEEN_LESSON.slug)},${quote(DAY_THIRTEEN_REVIEW)},${array(DAY_THIRTEEN_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_THIRTEEN_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_THIRTEEN_QUIZ))}::jsonb);
`
fs.writeFileSync(process.argv[2],sql)
