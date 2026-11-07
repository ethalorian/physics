# Foundational lesson implementation standard

This is the required pattern for future slideshow lessons. It records Craig's decisions from the Days 1–4 implementation. Use Day 4 for an ordinary foundation and Day 3 for an explicitly designated lab. A new lesson is complete only when its source, interactions, individual evidence, reporting, scheduling and verification are all connected.

## 1. Preserve the source experience

Use the Claude presentation as the visual and instructional reference. Keep its cover, type, emphasis, slide order, worked examples, and lab procedures. Put simpler explanations in the reading guide. Match inserted comic panels to the source deck’s layout, colors, and typography. Document any corrections to scientific claims or changes needed for classroom roles.

- Identify the intended current slideshow from the supplied project. Do not substitute a poster, an older export or the existing review activity.
- Archive the original HTML, interaction scripts and artwork unchanged under `resources/foundations/day-<word>/original`. Record source and packaged hashes in `src/data/foundations/day-<word>-source.json`.
- Package the original executable slideshow. Preserve every timer, start/pause/resume/reset/extension control, clickable answer reveal, diagram and cover. Do not replace interactive slides with screenshots or static reconstructions.
- Use ordinary relative asset URLs for the cover. The Claude export's CSS parser splits on semicolons and breaks embedded image data URLs. Verify the cover visually and compare its bytes with the source.
- Remove teacher-only slides and speaker notes from the student copy. Renumber slides and provide accurate titles and a text companion. Explicitly record any factual correction or missing-source substitution; never invent a source, measurement or handout.
- Use the shared 260 ms incoming fade and respect reduced-motion preferences. Keep the iframe mounted through Slides, Work, Side by side and enlarged views so timers and reveals persist. A full page reload may reset the source slideshow's transient state.
- Keep the script-only sandbox, restrictive document policy and display-only bridge for navigation and authored translations. Validate the sender, origin, channel and slide bounds. The imported slideshow must not receive account credentials, student writing or access to application APIs/storage.

## 2. Reuse one lesson workspace

Use `AssignmentWorkspace`, `LessonActivity`, `QuestionResponse`, `FoundationSlides` and `FoundationExchange`. Register the new foundation in the existing catalog and slide/checkpoint registries. Do not create a parallel lesson shell, saving system or assessment model. Do not restore PhysicsPathView or the removed learning-sequence card.

Give every slide a short reading guide in English, Spanish, and Brazilian Portuguese. Place it beside the slide when the viewer is wide and below it when space is tight. Match the guide to the visible slide and its Work section. For practice slides, explain how to begin and leave the result for the student to find.

Match the established indigo/purple application theme. Keep implementation details out of student directions. Provide accessible controls, readable text companions, keyboard navigation and a usable compact layout.

## 3. Author individual evidence from the lesson

- Divide the lesson into coherent sections, with correct slide ranges and questions beside the relevant material. Preserve an independent exit task.
- Reuse `AssessmentDemand`. Assign Bloom's thinking process and DOK independently, according to the reasoning actually required. Include conceptual interpretation, application, explanation, critique and transfer when supported by the lesson; do not inflate DOK because a question is long or difficult.
- Give every question a stable ID, target mapping, answer or review guidance, units/tolerance where appropriate, and a useful hint. Do not put answer keys in student quiz responses.
- Check physics, signs, axes, scale, units and numerical values. Distinguish observations from inferences, displacement from position, and classroom models from real forecasts. Clearly label fictional asteroid data and supplied/ideal sample data.
- Preserve existing review IDs, content, answers, submissions, feedback and grades. The new foundation is a separate activity before that review.

## 4. Require meaningful group participation throughout

Use the shared foundation group lobby and three subject-specific discussion stops, normally after Parts 1–3. Students generate or enter a code to join the classmates actually doing the work, from their own accounts in the same assignment. Show saved names and canonical avatars. Support two, three or four students; never random matching or teacher approval for ordinary group formation. Existing groups close membership when they start. Under the routine, a new table can start with two and accept classmates into open seats.

Rotate these duties at each discussion:

- Slideshow lead (primary): guide slides and include everyone.
- Whiteboard scribe (primary): hold the dry erase marker and work problems at the whiteboard.
- Timekeeper and checker (secondary duties). With two students, the lead also keeps time and the scribe checks. With three, the third student handles both support duties. With four, those duties are separate.

Keep authored A/B physics prompts distinct from the practical roles. Each person writes an initial idea before seeing a classmate’s writing. In the [in-class discussion routine](foundation-in-class-routine.md), new groups compare a real posted idea at the board, then each student saves their own response and private reflection. Start with two, allow late arrivals where there is room, and keep the stops in order per student. A provided example is an explicitly labeled alternative for one stalled stop in a started group; never credit it as peer interaction. Earlier groups retain their original blind, full-group turns and reply order. Preserve all saved writing and enforce submission on the server.

Peer writing is context, never the student’s own mastery evidence. Never disclose peer reflections in the browser or grading model. Submitted group snapshots retain each author and reply recipient; the model receives sanitized slot labels without account IDs. Existing v1/v2 pair snapshots remain readable. Existing groups with any writing retain their two-person completion rules; empty groups and new groups use the new flow. Never reset existing drafts, shared writing, submissions, reviews, grades, mastery or dates during rollout.

## 5. Support approved independent make-up work

Let a student flag that they are making up the lesson without a partner. Save a pending request and make it visible to the class teacher. Continue allowing slides and individual questions, but do not expose independent substitute activities until the class teacher or authorized administrator approves from their own account.

After approval, replace each partner stop with an authored sequence: own idea, critique of a provided example, own reflection. Use lesson-specific examples, not generic participation checkboxes. Record approval, timing and independent-work provenance. Never fabricate a partner or measurement. For a lab, explicitly distinguish a supplied sample analysis from data the student actually collected; use a teacher-approved equipment alternative where appropriate.

Use data-free Realtime change notifications and authenticated API reads, coalescing bursts. Never refresh the page or recreate the slideshow for group updates. Refresh on page return; a disconnected or pending-solo view may check once a minute while visible, with a manual status check available. Do not poll while hidden or after completion. An approved independent student retains their saved group writing; in the earlier group protocol, a lone remaining member also requests approval. In the routine, a member of a group that already started can finish a stalled stop by critiquing the lesson example. Canceling an independent make-up request, automatic re-pairing and editing already-shared writing are not implemented.

## 6. Keep tracking, mastery and grades separate

Reuse the existing authenticated draft, submission, review and gradebook paths. Freeze collaboration evidence from server records into each student's immutable submission; ignore client-provided attempts to forge partner evidence. Keep answers, attempts, replies and reflections attributable to their author, assignment and submission version.

Completion is a valid saved submission, not opening slides, partner completion, timer expiry or a self-reported checkbox. Mastery remains an explicit teacher judgment tied to the relevant target and individual evidence. AI output is a suggestion, never an automatic release. Preserve authorization, enrollment scope, idempotency and stale-submission checks.

The foundation, review and quiz remain distinct gradebook entries. Do not erase or merge earlier evidence to simplify reporting.

## 7. Register the daily foundation → review → quiz sequence

Create an explicit daily template linking the foundation slug, existing review slug, required question IDs and an authored quiz. The initial pattern is six questions worth ten points, using new examples to check individual understanding; vary only with a clear instructional reason.

Scheduling a foundation must create or reuse its linked review and quiz three school days later. Scheduling a review must create or reuse its foundation three school days earlier and its quiz on the review date. Count weekdays excluding the default school calendar’s saved no-school dates; the anchor date is day zero, and rotating class meeting blocks do not change the spacing. Use Eastern dates and 11:59 PM Eastern quiz deadlines across DST. For initial assignment or a confirmed move using normal linked spacing, the teacher’s chosen placement is the anchor and both companions follow it. Existing individual dates can instead be overridden through the confirmation flow below. Unassigning either removes all three from student calendars. Retrying, moving, unassigning or reassigning must preserve assignment/quiz IDs, questions, drafts, immutable submissions, released grades and mastery rather than duplicate or delete them. Do not rewrite existing class dates merely by deploying this rule.

Unlock review content, draft saves and submission only after **that student** has a valid immutable foundation submission. Unlock quiz content, draft saves and submission only after **that student** has valid immutable submissions for both prerequisites. Do not wait for teacher grading. Enforce this in routes and database functions, not only the interface. Locked reviews and quizzes are still assigned work; show the missing prerequisite through the existing calendar/gradebook controls. Keep ordinary non-daily quiz scheduling unchanged. Do not retroactively assign activities to real classes merely by releasing the feature.

For existing linked assignments, the teacher may override an individual date after an alert and explicit confirmation showing all three current and resulting dates. The default confirmation changes only the selected activity. Discussion/review moves also offer normal linked spacing. Quiz dates may be changed independently after confirmation. Reject stale confirmations and keep student completion prerequisites, work and private grading unchanged. Initial assignment and whole-group removal keep their automatic behavior.

## 8. Designate labs deliberately

An activity is a lab only when explicitly designated and supported by the intended investigation/evidence. Graph paper, timers, partners or a slideshow alone do not make it a lab. Days 1, 2 and 4 are ordinary foundations; Day 3 is a lab.

Designated labs use the existing four dimensions: Science, Reasoning, Communication and Transfer, each 0–4. The syllabus table converts the lowest dimension to 50/75/85/89/96. Follow that explicit table rather than the conflicting prose example. Keep mastery decisions separate.

Released four-dimension submissions feed the student-header lab average and lab history in the selected class and grading term. Original and separately released revisions count as separate submissions; correcting a release replaces that entry. Legacy point grades remain visible but are excluded from this average. Never assign an unreleased draft a zero or average ordinary foundations into labs. Keep existing simulation labs on their supported path.

## 9. Place matching graphic-novel snapshots

Use the approved installment and panels that explain the current lesson concept. Insert snapshots at relevant transitions, with a short interpretation/question and a link to the matching work section. Include meaningful alternative text and companion text. Preserve original artwork bytes; viewport crops are acceptable. Do not use a whole page as an unreadable thumbnail or include unrelated story panels merely as decoration.

For new or revised art, read `docs/comic-character-continuity.md` and inspect its canonical references first. Preserve the locked character designs. Reuse existing approved art when it fits.

## 10. Verification and release checklist

A lesson is ready only after these checks pass:

- Original executable logic, cover bytes, slide counts, teacher-content removal, all timers/reveals, fade/reduced-motion CSS and bridge validation.
- Browser review of the cover, every inserted snapshot, all interactive controls, view/navigation state preservation, paired and approved-independent stops, individual-answer retention, a compact layout and console errors. Record actual measured viewport dimensions.
- Real local database/route checks with fictional accounts: chosen pairing, cross-class/day isolation, privacy, teacher approval, blocked impersonation/self-approval, immutable and idempotent submission, forged-evidence rejection, per-student quiz gates, calendar retry/move behavior and gradebook/mastery results. For a lab, verify released grades and header average as well.
- TypeScript, scoped lint, style/brand checks and affected regression tests. Before deployment, run a full production build of the reviewed release source.
- Generate migrations with the Supabase CLI, review grants/RLS/functions, run local security advisors and apply only the release's intended migrations. Never run a broad pending-migration push from a dirty workspace.
- Verify the current live deployment and assemble a release from its audited source plus the intended changes. Exclude local previews, fictional users, test output, archives and secrets. Stage production without assigning domains, verify it, then promote that tested build when publication is authorized.
- Verify live routes/assets, access boundaries and runtime errors; record deployment ID, rollback, source hashes, migration results, verification limits and screenshots. Never claim local fixture checks were live student tests.

Update `AGENTS.md` and the release record with what actually shipped. Keep future lessons on this shared path; extend a registry or day-specific definition rather than copy a second implementation.

## Foundation text convention — October 29, 2026

Apply docs/assignment-language-standard.md to the complete foundation sequence: slide prose and captions, lesson and review questions, hints, supplied examples, group roles and stops, approved independent work, sentence starters, and quiz templates. Foundation slides, lesson questions, hints, examples, and group/solo directions target **fifth-grade sentence structure**. Keep the physics, required reasoning, and assessment demand. Use short sentences and separate steps. Define needed physics terms rather than removing them. Reviews and daily quizzes keep their own identities and are not rewritten by this foundation-only language update. Name the actual drawing, graph, calculation, or explanation instead of an unexplained “model.” Translate “claim,” “critique,” “condition,” and “assumption” into the action students must take. Define useful technical terms when introduced.

Bold the given values with their signs and units and the specific requested result. Italicize and underline spelled-out compass directions in prose, including inside bold phrases. Use the shared authored-text renderer; never show raw Markdown markers. Keep student writing as submitted.

All nine slide importers call scripts/foundation-groups/slide-language.cjs through slide-copy.cjs. Its reviewed text map and the shared emphasis implementation update the packaged slides and the readable companion. Keep source exports, artwork, executable logic, timers, answer reveals, geometry and navigation intact. Regenerate the package and metadata; do not hand-edit generated HTML. Verify slide counts, controls, text bounds and referenced assets. A graph that students must read must actually be provided. Keep answer reveals out of the companion.

Preserve compact two-column printed worksheets and copying efficiency. Do not add text-response lines. Preserve stable question IDs, answers, scoring, and student records. Review saved quiz wording and future quiz templates together when either contains revised text.

## Foundation language choices

Offer English, Spanish, and Brazilian Portuguese for both slides and accompanying lesson questions. Translate only authored teaching text. Keep student answers, classmates’ names and writing, private reflections, grading, IDs, and answer-option order unchanged. A language change must keep the same input fields and iframe mounted; preserve slide position, active timers, open reveals, and unsaved writing. Apply slide text translations to existing text nodes and accessible labels, never by replacing slide HTML. Keep artwork unchanged; provide translated slide text beside pictures that contain English words.

Prepare static language files using `scripts/foundation-language/source.cjs` and the reviewed translation pipeline. The translation generator reads only canonical lesson source and must have explicit permission for the API destination and authored payload before use. No translation API runs in a student session. Verify complete language keys and the current English version before release. A loading failure must leave English usable, explain the issue, and allow retry without refreshing the lesson. Recheck science, values, signs, units, equations, figures, language layout, and the preservation tests whenever source text changes.

Run `npm run verify:foundation-languages` after generation; prebuild also requires it. This checks all nine lessons in both languages against their current English hashes and protects numbers, signs, math, links and emphasis. Keep generation caches outside `public`; only the reviewed per-lesson dictionaries belong there. The build-time generator supports `--locale=es`, `--locale=pt-BR`, an explicit private `--cache=...` directory, and `--pack-only` to assemble an already reviewed cache without calling the API. API output is draft authored content: validate complete passages and review physics and language before release.

Direct human-reviewed translations can also be assembled offline with `node scripts/foundation-language/assemble.cjs --cache=/absolute/private/cache`. Supply dictionaries keyed by the exact canonical English passages, named `es.json` and `pt-BR.json`. Both assembly paths derive readable slide companions from the translated slide nodes; do not independently translate a second copy of each slide. Review short fragments in their full sentences, especially Spanish question punctuation. Numeric formatting intentionally follows the authored problems (decimal points and thousands commas), with an explanation beside the language selector. Never translate student writing or change stored answer values when changing display language.

## CPA editions and independent reading guides — November 4, 2026

Keep the current foundation question set as the Honors edition. CPA classes (`courses.track = 'cpa'`, including the existing untyped-class CPA default) automatically receive the authored `cpa-v1` questions when starting new work. This choice comes from the server, never a student toggle. The first save pins `foundationQuestionEdition` into the student's state. Existing saved work without a marker retains its original full or shortened questions, even in CPA classes. A class-track change must not reinterpret a saved draft, submission, assessment, or revision. Use `foundationEdition` for student display, validation, teacher review and AI assessment. Never rewrite an existing edition's scientific task after students have used it; introduce a new version and preserve the earlier renderer.

CPA questions keep stable learning targets, per-student evidence, input types, group requirements, teacher-approved solo alternatives, independent exits and designated-lab reporting. Their demand is authored separately: shorter explanations, fewer concurrent comparisons, and visible math scaffolds. Give the equation, define needed symbols, provide substitution and operation order, then require the student to calculate and include units/direction. Do not claim that a student independently selected an equation that was supplied. The review and daily quiz remain separate activities; this edition does not silently rewrite their content.

`src/data/foundations/cpa-questions.json` is the English source; `cpa-languages.json` carries Spanish and Brazilian Portuguese prompts. `cpa-language.ts` includes shared directions and objective feedback. Keep number values, options, diagram fields and input IDs aligned. Teacher evidence and AI assessment use the correct edition's expected evidence and demand. Never show a previous answer as a comparison when its edition differs.

Every slide must have a teaching guide suitable for independent reading in all three languages. Preserve the original interactive deck. In the existing reading side panel, use a short “Key idea” paragraph and one “Try this” direction. Aim for fifth-grade wording and no more than 65 words in the key idea. Explain only the physics needed for the current slide; do not list unrelated formulas. Do not add a redundant self-check/explanation accordion or repeated practice directions. Do not reveal a solution to the student's independent exit. Keep a compact next-slide connection. Keep comic full-page links available. The guide scrolls separately on wide screens and flows beneath the slide on narrow screens; navigation resets only its scroll, not the iframe, timers, or student answers.

Maintain explicit title/number mappings in `teaching-guide-map.json`, generated by `scripts/foundation-cpa/map-guides.cjs`, and review the matching topic explanations in `teaching-guide-topics.json`. Reusing an explanation for adjacent slides on the same concept is appropriate; each keeps its own direct instruction. Future decks must be added to both the mapping and the CPA source. `npm run verify:foundation-cpa` is a prebuild guard for slide alignment, languages, numeric values and figures. Run the edition-preservation tests and actual isolated route/database checks before release.

Migration `20261104135419_foundation_question_editions.sql` makes completion gates recognize the original long, shortened Honors and CPA question contracts without changing saved rows or dates. Deploy it with the reviewed application change; do not delete older question keys from drafts to force an edition change.
