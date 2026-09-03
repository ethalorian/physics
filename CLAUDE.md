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
