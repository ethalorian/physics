# Textbook question target mappings

The reading composer now fills in a primary Physics mastery target per recognized question. It uses an authored reference map rather than assigning one target to a whole chapter. 1325 numbered questions and 179 section concept checks are mapped. The numbered-question index covers chapters 2–40 in the installed Prentice Hall high-school edition.

## Teacher workflow

1. Open /admin/readings and choose the class and chapter.
2. Leave Target selection on automatic. Enter question numbers (for example, Chapter 4: 5, 7, 10). The composer identifies the correct Assess question set and independently chooses each target.
3. Review the target statement shown directly under each question. Change any target as needed.
4. Select a target for every highlighted question before saving or publishing.

Section concept checks are mapped when added from selected reading sections. Custom questions require teacher selection. Editing a reference or prompt clears its previous target so a stale link cannot silently survive. The Map unlinked questions action fills only recognized, unchanged textbook prompts and preserves all existing teacher target choices. The one-target-per-batch option remains available.

## Scope and evidence

A question provides evidence toward its primary target; an answer is not automatic proof of every clause in a target. Multi-part questions may support other targets, and teachers can override the primary link. Submission and rating still use the existing immutable snapshots and teacher review flow. No automatic grades, new learning targets, class assignments, or mastery records were created by this mapping work. There were zero live textbook assignments at the time of the mapping audit.

Automatic mappings use the Physics curriculum. Project Physics and Trades retain their own manual target catalog; targets never cross program boundaries. Questions without a reviewed match stay unlinked. This includes historical recall, dedicated laboratory skills, relativity, and several topics outside the current Physics targets. The UI says when a match is missing, rather than claiming all textbook questions are covered.

## Source and numbering audit

Sources: local student editions cp02.pdf through cp40.pdf in /Users/craigantocci/Desktop/Current/Conc. Text teachers copy/student-edition, plus the existing section Concept Checks in src/data/textbook-sections.ts. End-of-chapter Assess prompts were read against the live learning_targets catalog, excluding targets excluded from growth. The shipped map contains references and target slugs, not an additional copy of the textbook question text or answer key.

The old thinkAndSolve arrays are not used by the new mapper: they include questions belonging to other sets. For example, Chapter 4 #44 is Think and Explain, #51 begins Think and Solve, and #58 begins Activities. Plug and Chug is now available. The book prints Chapter 2 #47 twice and has no #46; #47 requires a clarified prompt and teacher target choice. Missing punctuation in several printed labels is handled in the verified index. Existing lesson reading assignments were not rewritten.

## Maintenance

Source of truth: src/data/textbook-target-map.json. Resolve slugs against the current teacher catalog, never hard-code database UUIDs. If a target disappears or becomes excluded from growth, its mapping cannot resolve and requires a teacher choice. Recheck prompts against the same textbook edition before extending mappings. The CSV beside this document lists every indexed numbered question, its primary target or review status, and all mapped section checks.

## Coverage

| Chapter | Mapped numbered questions | Indexed numbered questions | Mapped section checks |
|---|---:|---:|---:|
| 2 | 46 | 47 | 5 |
| 3 | 43 | 56 | 4 |
| 4 | 58 | 60 | 9 |
| 5 | 50 | 50 | 6 |
| 6 | 56 | 71 | 5 |
| 7 | 60 | 61 | 7 |
| 8 | 66 | 66 | 6 |
| 9 | 45 | 55 | 8 |
| 10 | 32 | 56 | 2 |
| 11 | 1 | 55 | 1 |
| 12 | 6 | 50 | 2 |
| 13 | 49 | 64 | 8 |
| 14 | 46 | 50 | 6 |
| 15 | 0 | 40 | 0 |
| 16 | 0 | 47 | 0 |
| 17 | 0 | 74 | 0 |
| 18 | 9 | 50 | 1 |
| 19 | 0 | 64 | 0 |
| 20 | 0 | 69 | 0 |
| 21 | 45 | 67 | 7 |
| 22 | 42 | 48 | 5 |
| 23 | 39 | 62 | 3 |
| 24 | 52 | 59 | 7 |
| 25 | 49 | 70 | 7 |
| 26 | 56 | 56 | 10 |
| 27 | 45 | 69 | 1 |
| 28 | 5 | 51 | 2 |
| 29 | 55 | 55 | 12 |
| 30 | 38 | 43 | 7 |
| 31 | 30 | 35 | 6 |
| 32 | 45 | 52 | 7 |
| 33 | 42 | 44 | 6 |
| 34 | 67 | 76 | 9 |
| 35 | 59 | 59 | 6 |
| 36 | 39 | 47 | 7 |
| 37 | 50 | 59 | 7 |
| 38 | 0 | 41 | 0 |
| 39 | 0 | 68 | 0 |
| 40 | 0 | 56 | 0 |
