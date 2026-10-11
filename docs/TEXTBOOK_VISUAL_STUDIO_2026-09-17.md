# Textbook reading studio

The teacher composer now uses three steps: choose reading, pick questions, preview and assign. The common flow needs no typed question numbers or title: select section cards, tap question tiles, review the student preview, and publish.

- Chapter selector groups the book by topic and includes search. Section cards show the printed starting page and selected state.
- The adjacent textbook preview renders the actual authenticated student PDF. Sections and numbered questions jump to their relevant page. Page controls, an open-in-new-tab link, and failure/retry states are included. On phones the preview is collapsed until requested.
- Question sets are visible buttons and question numbers are toggle tiles. Selected questions show their mastery target; expanding one allows prompt/reference/target edits. Unmapped tiles have a target icon and dashed border.
- Section concept checks show their full prompt as selectable cards. Custom questions and bulk number entry remain available; batch settings are collapsed by default.
- The final step previews the assignment title, reading, directions, questions, target statements, and answer spaces. Optional title/directions/page edits and due-date controls live here.
- Existing per-question target mappings, teacher overrides, validation, draft/publish semantics, student submissions, revisions, and mastery review are preserved. No database changes.

## Page metadata

`src/data/textbook-page-map.json` contains only chapter offsets, page counts, and question-to-PDF-page indexes for chapters 2–40. No new textbook prose, PDF files, or answer keys are bundled. Page locations were derived from the local student-edition PDFs and the prior question inventory. Every chapter's first/last printed-page markers was checked against its PDF length. Spaced numbering in chapter 20 (#16) and chapter 40 (#8–9) was resolved against the original PDFs. Chapter 20 #16 is printed p. 398 / PDF p. 17.

The preview lazily imports `pdfjs-dist` and loads its worker from the same package, avoiding the repository's differing root and nested react-pdf versions. It renders one page at a time, cancels superseded rendering work, and disposes its document/worker on unmount. The existing `/api/textbook/[chapter]` authentication boundary remains in place.

## Verification

- Ten focused unit tests passed, including every selectable question/section's page bounds and printed-page regression cases.
- Existing API tests passed for authentication, role restrictions, class scoping, draft privacy, and preview write blocking.
- Real component browser fixture with synthetic class/student data and actual local student PDFs passed: section selection and PDF page jumps; graphical question selection; concept checks; target matching and overrides; invalid/unmapped save blocking; question deduplication; custom prompt editing; title/directions/due preview; save draft and publish; PDF failure/retry; chapter change cancel/confirm; answer persistence and autosave failure recovery; submission; revision and resubmission; one rating per unique target; three independently mapped targets through submission and review; stale-window protection.
- Responsive overflow checks passed at 1366, 768, 390, and 320 pixels. Phone previews and dark mode were inspected visually. TypeScript, focused ESLint, and the style audit passed.

Screenshots in `docs/readings-visual-verification/` are from the synthetic fixture. No real student assignment was published by these tests.
