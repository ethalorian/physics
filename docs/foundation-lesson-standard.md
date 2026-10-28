# Foundational lesson implementation standard

This is the required pattern for future slideshow lessons. It records Craig's decisions from the Days 1–4 implementation. Use Day 4 for an ordinary foundation and Day 3 for an explicitly designated lab. A new lesson is complete only when its source, interactions, individual evidence, reporting, scheduling and verification are all connected.

## 1. Preserve the source experience

- Identify the intended current slideshow from the supplied project. Do not substitute a poster, an older export or the existing review activity.
- Archive the original HTML, interaction scripts and artwork unchanged under `resources/foundations/day-<word>/original`. Record source and packaged hashes in `src/data/foundations/day-<word>-source.json`.
- Package the original executable slideshow. Preserve every timer, start/pause/resume/reset/extension control, clickable answer reveal, diagram and cover. Do not replace interactive slides with screenshots or static reconstructions.
- Use ordinary relative asset URLs for the cover. The Claude export's CSS parser splits on semicolons and breaks embedded image data URLs. Verify the cover visually and compare its bytes with the source.
- Remove teacher-only slides and speaker notes from the student copy. Renumber slides and provide accurate titles and a text companion. Explicitly record any factual correction or missing-source substitution; never invent a source, measurement or handout.
- Use the shared 260 ms incoming fade and respect reduced-motion preferences. Keep the iframe mounted through Slides, Work, Side by side and enlarged views so timers and reveals persist. A full page reload may reset the source slideshow's transient state.
- Keep the script-only sandbox, restrictive document policy and navigation-only bridge. Validate the sender, origin, channel and slide bounds. The imported slideshow must not receive account credentials or access application APIs/storage.

## 2. Reuse one lesson workspace

Use `AssignmentWorkspace`, `LessonActivity`, `QuestionResponse`, `FoundationSlides` and `FoundationExchange`. Register the new foundation in the existing catalog and slide/checkpoint registries. Do not create a parallel lesson shell, saving system or assessment model. Do not restore PhysicsPathView or the removed learning-sequence card.

Match the established indigo/purple application theme. Keep implementation details out of student directions. Provide accessible controls, readable text companions, keyboard navigation and a usable compact layout.

## 3. Author individual evidence from the lesson

- Divide the lesson into coherent sections, with correct slide ranges and questions beside the relevant material. Preserve an independent exit task.
- Reuse `AssessmentDemand`. Assign Bloom's thinking process and DOK independently, according to the reasoning actually required. Include conceptual interpretation, application, explanation, critique and transfer when supported by the lesson; do not inflate DOK because a question is long or difficult.
- Give every question a stable ID, target mapping, answer or review guidance, units/tolerance where appropriate, and a useful hint. Do not put answer keys in student quiz responses.
- Check physics, signs, axes, scale, units and numerical values. Distinguish observations from inferences, displacement from position, and classroom models from real forecasts. Clearly label fictional asteroid data and supplied/ideal sample data.
- Preserve existing review IDs, content, answers, submissions, feedback and grades. The new foundation is a separate activity before that review.

## 4. Require meaningful group participation throughout

Use the shared foundation group lobby and three subject-specific discussion stops, normally after Parts 1–3. Students generate or enter a code to join the classmates actually doing the work, from their own accounts in the same assignment. Show saved names and canonical avatars. Support two, three or four students; never random matching or teacher approval for ordinary group formation. Students start once everyone has joined, closing membership for that lesson.

Rotate these duties at each discussion:

- Slideshow lead (primary): guide slides and include everyone.
- Whiteboard scribe (primary): hold the dry erase marker and work problems at the whiteboard.
- Timekeeper and checker (secondary duties). With two students, the lead also keeps time and the scribe checks. With three, the third student handles both support duties. With four, those duties are separate.

Keep authored A/B physics prompts distinct from these practical roles. Each person writes an initial idea before any classmates’ ideas are revealed. After everyone shares, discuss the evidence at the whiteboard. Each student responds to the next group member in slot order, wrapping around so everyone receives a response. Once everyone responds, each writes a private reflection. Preserve all original writing and enforce sequential stops and final submission on the server.

Peer writing is context, never the student’s own mastery evidence. Never disclose peer reflections in the browser or grading model. Submitted group snapshots retain each author and reply recipient; the model receives sanitized slot labels without account IDs. Existing v1/v2 pair snapshots remain readable. Existing groups with any writing retain their two-person completion rules; empty groups and new groups use the new flow. Never reset existing drafts, shared writing, submissions, reviews, grades, mastery or dates during rollout.

## 5. Support approved independent make-up work

Let a student flag that they are making up the lesson without a partner. Save a pending request and make it visible to the class teacher. Continue allowing slides and individual questions, but do not expose independent substitute activities until the class teacher or authorized administrator approves from their own account.

After approval, replace each partner stop with an authored sequence: own idea, critique of a provided example, own reflection. Use lesson-specific examples, not generic participation checkboxes. Record approval, timing and independent-work provenance. Never fabricate a partner or measurement. For a lab, explicitly distinguish a supplied sample analysis from data the student actually collected; use a teacher-approved equipment alternative where appropriate.

Use data-free Realtime change notifications and authenticated API reads, coalescing bursts. Never refresh the page or recreate the slideshow for group updates. Refresh on page return; a disconnected or pending-solo view may check once a minute while visible, with a manual status check available. Do not poll while hidden or after completion. An approved independent student retains their saved group writing; remaining new-group members can continue if at least two remain. A lone remaining student must request approval too. Request cancellation, automatic re-pairing and editing already-shared writing are not implemented.

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
