-- Graded work may be released without feedback. A revision still needs directions.
-- Preserve existing reviews, grade calculation, ownership, locking and mastery guards.
alter table public.quiz_reviews drop constraint quiz_reviews_note_check;
alter table public.quiz_reviews add constraint quiz_reviews_note_check check (
 length(note)<=3000 and (decision='graded' or length(btrim(note))>0)
);
do $migration$
declare signature regprocedure := 'public.review_quiz_submission(uuid,uuid,text,text,text,jsonb,jsonb,text,jsonb,text,integer)'::regprocedure;
 definition text;
 old_guard text := 'length(btrim(p_note)) not between 1 and 3000';
 new_guard text := '(length(p_note)>3000 or (p_decision=''returned'' and length(btrim(p_note))=0))';
begin
 select pg_get_functiondef(signature) into definition;
 if position(old_guard in definition)=0 then raise exception 'Review feedback guard changed; inspect before applying.';end if;
 execute replace(definition,old_guard,new_guard);
end $migration$;
