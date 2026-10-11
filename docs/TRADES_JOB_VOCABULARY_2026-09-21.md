# MVP Engineering job vocabulary — published 2026-09-21

All 36 job lessons now have one canonical published vocabulary set, named `MVP Job NN · [job title]`. Each set contains eight ordered entries: 288 job-word entries and 202 distinct terms. Definitions are consistent across repeated words; every entry has a job-specific example. Every job includes a numerical application.

Six additional Knowledge targets (`tr26.p1.vocabulary` through `tr26.p6.vocabulary`) permit assigning and rating vocabulary within the trades program. The original 24 practical targets remain intact. Phase targets deliberately have no bulk default-word mapping: the existing assignment form preserves the selected job's eight words when the teacher chooses a target. Select the matching phase target for each job. Vocabulary recognition does not substitute for practical skill evidence.

## Teacher workflow

Open `/admin/vocabulary/assign?class=33c5a178-998f-4158-aea9-f8589ade37b0`, select `MVP Job NN`, select the matching `trades-reset-N` Knowledge target, choose students and practice/quiz settings, then assign. `scripts/trades-reset/vocabulary-published.json` records stable set IDs and direct links that preselect the job and class. Signing in may discard query parameters; reopen the direct link after sign-in if needed.

No `vocab_tasks`, `vocab_assignments`, student attempts, grades, lesson windows, or lesson content blocks were written by this release. The sets are available for the teacher to assign. Published vocabulary can also appear in the existing vocabulary browsing surfaces.

## Authoring and publication

- `scripts/trades-reset/vocabulary.py`: shared glossary and 36 authored job-specific word/example selections.
- `scripts/trades-reset/build_vocabulary.py`: validates 36 × 8 entries, unique words within each job, definition/example completeness, numerical applications, and lesson identities; builds data and the guide.
- `vocabulary-sets.json` and `vocabulary-targets.json`: generated content.
- `publish-vocabulary.sql`: initial-install transaction using `save_lesson_vocabulary`/`save_vocab_terms`, preserving the app's canonical lesson vocabulary behavior. It refuses to run if job vocabulary or these targets already exist. Future revisions must read fresh versions and use the normal editor; do not rerun the initial installer over teacher edits.
- `Vocabulary-Guide.md`: full definitions, examples, phase target statements, and teaching routine.

The vocabulary build is a separate additive step after `build.py`; it does not rewrite the existing lesson or plan generator. No application deployment or schema migration was required.

## Verification

Read back production data and compared every name, lesson/unit association, term, definition, example, tier, category, and order with the authored payload. All 36 sets are published and unarchived; all 288 terms are unarchived. Each set has a valid trades Knowledge target for its phase. Production readback showed zero assignments using these new terms and zero legacy set assignments, with the course's 15 active enrollments unchanged.

The live assignment URL correctly required sign-in in the available browser session. A read-only local preview used the production release's actual `VocabLearningBoard` and the published database vocabulary, with a synthetic roster and all writes rejected. All 36 sets and six targets appeared in the picker. Job 01 retained all eight selected words after choosing its phase target and enabled the assignment button. Switching to Job 36 selected its eight words and populated its job title. No live student assignment was submitted for testing.

Teacher copies are in `MVP ETF Planning/Course Reset/Vocabulary-Guide.md` and `Vocabulary-Assignment-Links.md`; Day 1's START-HERE links to both.
