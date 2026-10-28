import fs from 'node:fs'
import {DAY_TWO_LESSON,DAY_TWO_REVIEW,DAY_TWO_SEQUENCE} from '../../src/lib/interactive-assignments/foundations/day-two'
import {DAY_TWO_QUIZ} from '../../src/lib/interactive-assignments/foundations/day-two-quiz'
import {assignmentBySlug} from '../../src/lib/interactive-assignments/catalog'
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const array=(a:string[])=>'array['+a.map(quote).join(',')+']'
const previous=fs.readFileSync('supabase/migrations/20261025214411_foundation_collaboration_checkpoints.sql','utf8')
// Reuse the same reviewed locking and privacy rules for registered foundations.
// Existing records and immutable submissions are not rewritten.
const functions=[...previous.matchAll(/create (?:or replace )?function public\.[\s\S]*?end \$\$;/g)].map(m=>m[0].replace(/^create (?:or replace )?function/,'create or replace function').replaceAll("slug='day-1-foundation-briefing'","slug in (select foundation_slug from daily_lesson_templates)"))
if(functions.length!==5)throw Error('Expected the five collaboration functions')
const sql=`-- Extend the local foundation sequence to Day 2. Preserve existing review records.\ninsert into public.interactive_assignment_templates(slug,day,title,target_slugs) values (${quote(DAY_TWO_LESSON.slug)},2,${quote(DAY_TWO_LESSON.title)},${array(DAY_TWO_LESSON.targets)});\ninsert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values (${quote(DAY_TWO_SEQUENCE)},${quote(DAY_TWO_LESSON.slug)},${quote(DAY_TWO_REVIEW)},${array(DAY_TWO_LESSON.questions.map(q=>q.id))},${array(assignmentBySlug(DAY_TWO_REVIEW)!.questions.map(q=>q.id))},${quote(JSON.stringify(DAY_TWO_QUIZ))}::jsonb);\n\n${functions.join('\n\n')}\n\n-- CREATE OR REPLACE retains existing service-role-only grants.\n`
fs.writeFileSync('supabase/migrations/20261025221740_day_two_foundation_sequence.sql',sql)
