import fs from 'node:fs'
import {DAY_ONE_LESSON,DAY_ONE_REVIEW,DAY_ONE_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-one'
import {DAY_ONE_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-one-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const q=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(q).join(',')+']'
const file='supabase/migrations/20261025210035_day_one_foundation_sequence.sql'
const marker='-- The offline-authored template is appended by scripts/day-one/build-template.ts.'
const sql=`\ninsert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${q(DAY_ONE_SEQUENCE)},${q(DAY_ONE_LESSON.slug)},${q(DAY_ONE_REVIEW)},${array(DAY_ONE_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_ONE_REVIEW)!.questions.map(q=>q.id))},${q(JSON.stringify(DAY_ONE_QUIZ))}::jsonb);\n`
fs.writeFileSync(file,fs.readFileSync(file,'utf8').split(marker)[0]+marker+sql)
