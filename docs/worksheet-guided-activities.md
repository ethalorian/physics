# Worksheet-aligned guided activities

Course Plans opens a staff-only guided deck for the selected CPA or Honors day. The SEI editions share the same problems and models; the Model step includes the matching optional language support. Formal assessment days retain their separate directions-only decks.

The revised worksheet content is the authority for every problem, worked example, answer and visual. The original visual curriculum came from `Daily worksheets/visual-rollout-2026-10-22/`. The reviewed language now lives in the repository JSON sources; do not overwrite it with an older export. Print with `scripts/build-readable-worksheets.py` to retain the approved compact two-column format, then use `scripts/build-worksheet-decks.mjs` when deck content changes. No text-response lines belong on printed worksheets. Do not rebuild these activities from the older compact worksheet content or hard-coded walkthroughs.

The export writes `resources/worksheet-decks/source.json`, `figures.json`, and `language-supports.json`. The builder creates 262 private HTML decks, the Course Plans manifest, a coverage ledger with the source SHA256, and response presets with current slide numbers. No answer-bearing HTML belongs under `public/`. The existing authenticated presentation route serves teacher/admin/observer accounts with private, no-store caching.

Each numbered problem has an independent attempt, a model/scaffold, and reasoning that the teacher reveals in steps. Worked examples are labeled as material already provided on the worksheet. Teachers can jump to a problem, skip reasoning, return to the question, use a short think timer, or open the private teacher guide. Every slide exposes labels, notes, and the existing deck-stage navigation API for the command center and projector. A controlled session hides the standalone controls and delegates navigation to the classroom controller.

The response presets now come from the same revised source. Review items do not infer a learning target from the current day; the teacher can choose the appropriate target before launching. Existing responses, grading and mastery records are unchanged.

Validation: run `node scripts/check-worksheet-decks.cjs`, `node scripts/check-deck-math-typography.mjs`, and the lesson-decks, course-plan-conventions and deck-activities TypeScript tests. Review the actual slides at projector and tablet sizes. Changing the shared template or typography requires a full slide-layout pass.
