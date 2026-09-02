-- Which predicted slip (math_spiral_items.misconceptions[].tag) a ✗ matched, so the
-- teacher view can aggregate misconceptions per class/competency. Applied live 2026-09-02.
ALTER TABLE public.math_warmup_submissions ADD COLUMN IF NOT EXISTS misconception_tag TEXT;
CREATE INDEX IF NOT EXISTS idx_warmup_subs_misconception ON public.math_warmup_submissions(misconception_tag) WHERE misconception_tag IS NOT NULL;
