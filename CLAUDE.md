# Physics Classroom — read first

See `.cursorrules` for the stack and code style.

**Before touching lessons, blocks, present, lobby, mastery, or SEI: read `docs/LESSON_SYSTEM_RULES.md`.**
It is the contract for the lesson system (one BlockDocument, three faces, one evidence pipeline). Every rule
has a stable ID (A-1 … O-2); cite the ones a change implements or respects in the commit message. The
invariants that must never move: `mastery_records` is teacher-rated only (M-1); schema changes are additive
only (A-2); language scaffolds are data on the block, never a teacher habit (SEI-1); prompt and rubric are
identical at every language level (SEI-9).

Curriculum-side rules live in the Claude project *Physics Curriculum Planning*
(`claude/Physics-Classroom-App-Decisions.md`, `claude/Project-Physics-SEI-Access-Layer.md`).

**Before authoring or revising any assignment:** read `docs/assignment-language-standard.md`. Use about seventh-grade wording in every course, preserve cognitive demand, revise sentence starters, and verify every referenced diagram.

**Worksheet printing:** Keep the original compact two-column layout. Never add text-response lines or redesign print pages during wording edits. Preserve copying efficiency and check page counts. This is Craig’s explicit October 29, 2026 correction.

**Student Choice Binder pages are not worksheets.** Before building or revising binder notes pages, practice choice pages, or binder reference pages, read `docs/STUDENT_CHOICE_BINDER_STANDARD.md` (rules B-1 … V-3: 3-hole-punch letter geometry, grayscale outlines, the unit color code students add by hand, CPA vs Honors demand). The worksheet print rules above do not apply to them, and binder rules do not apply to worksheets.


## Required quantity, task and direction emphasis

Italicize and underline spelled-out compass directions within question text and sentence starters, including north, south, east, west and compound directions such as northeast. Keep this direction treatment inside bold task phrases too. Do not confuse N (newtons) with a compass direction; leave mathematical notation and diagram labels intact.

Craig clarified October 29, 2026: bold numbers with units/signs and phrases identifying what students must find or produce (How far, How long, Calculate the acceleration, Draw a force diagram). Keep surrounding prose regular and preserve the compact two-column worksheet layout with no text-response lines. See docs/assignment-language-standard.md and src/lib/assignment-emphasis-rules.json.
