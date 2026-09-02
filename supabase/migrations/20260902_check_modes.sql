-- Two new check modes (src/lib/math-answer-check.ts checkAnswerWithMode). Applied live 2026-09-02.
--   exact-form → sig-fig/precision items: value AND written digits must match ("12.0 cm" ≠ "12 cm")
--   estimate   → Fermi items: match within a factor of ~3 of the key's headline figure
ALTER TABLE public.math_spiral_items DROP CONSTRAINT IF EXISTS math_spiral_items_check_mode_check;
ALTER TABLE public.math_spiral_items ADD CONSTRAINT math_spiral_items_check_mode_check
  CHECK (check_mode IN ('numeric','short-answer','teacher-only','exact-form','estimate'));

-- QE3 (Fermi): every machine-judged item is an estimate.
UPDATE public.math_spiral_items i SET check_mode = 'estimate'
FROM public.math_competencies c WHERE c.id = i.competency_id AND c.code = 'QE3' AND i.check_mode = 'numeric';

-- QE4 (sig figs): numeric items whose key is a written value → exact-form;
-- prose-key items were never machine-judgeable → teacher-only.
UPDATE public.math_spiral_items i SET check_mode = 'teacher-only'
FROM public.math_competencies c WHERE c.id = i.competency_id AND c.code = 'QE4' AND i.check_mode = 'numeric'
  AND (i.answer_key ILIKE 'No —%' OR i.answer_key ILIKE 'False precision%' OR i.answer_key ILIKE 'Not clearly%' OR i.answer_key ILIKE '12.3 s at best%');
UPDATE public.math_spiral_items i SET check_mode = 'exact-form'
FROM public.math_competencies c WHERE c.id = i.competency_id AND c.code = 'QE4' AND i.check_mode = 'numeric'
  AND i.prompt NOT ILIKE 'Percent error%';

-- SM1: the 8 "numeric" items have symbolic keys (a = 2d/t²) → short-answer.
UPDATE public.math_spiral_items i SET check_mode = 'short-answer'
FROM public.math_competencies c WHERE c.id = i.competency_id AND c.code = 'SM1' AND i.check_mode = 'numeric';
