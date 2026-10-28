# Foundation groups

Published on October 27, 2026 (October 28 UTC) as `dpl_73DWaMYbYUsTdJQUrqSfKzP6zEw6` at www.antocciphysics.com. The source migration `20261028004152_foundation_groups.sql` is recorded as production version `20261028011657`; do not reapply it because the timestamps differ.

Days 1–9 share a code-based group lobby for two to four classmates in the same assignment. Each member uses their own account. The lobby displays saved names and canonical avatars. Starting closes membership. Three lesson-specific discussions require each student's own initial idea, response to the next member, and private reflection. Initial ideas stay hidden until everyone shares; reflections open after everyone responds and remain private to their author and teacher.

## Roles

Roles rotate at each discussion. Slideshow lead and whiteboard scribe are the two primary roles. The lead guides the slides and brings everyone into the conversation. The scribe holds the dry erase marker and works problems at the whiteboard; each student still enters their own work. Timekeeper and checker are secondary duties. Two students combine these duties with their primary roles; a third student handles both secondary duties; with four students they are separate.

Normal groups need no teacher involvement. An explicit request to work independently waits for teacher approval. Students can continue their ordinary questions while waiting. Approved alternatives retain any prior group writing. A new group with two or more active members can continue after a member receives solo approval; one remaining member must also request approval. Request cancellation and regrouping after start are not implemented.

## Preserving existing work

`20261028004152_foundation_groups.sql` is additive. It does not recreate assignments, replace question IDs, reschedule work, clear drafts, rewrite historical snapshots, or change released grades/mastery. Written legacy pairs retain their existing completion rules. Only empty legacy rooms and newly created rooms use the new four-person protocol. Historical v1/v2 evidence remains readable and new snapshots use v3. Each submission stays attributable to its author. Peers' shared writing supplies context only; their private reflections and account IDs are excluded from the grading payload.

The existing gradebook and explicit mastery release paths remain responsible for each student's results. Designated labs keep the four-dimension rubric and individual lab average. Completing a peer's work never unlocks a student's review or quiz.

## Updates and slideshow behavior

Data-free notifications on an opaque group topic request a fresh authorized API read. They never transmit names, codes, answers or grades. Updates are coalesced and do not reload the page, recreate the iframe or clear unsaved text. Return-to-page and reconnect checks supplement events; a visible disconnected or pending-solo view may check once a minute. Hidden and completed views stop these checks.

The nine imported runtime files only change collaboration directions. Original executable scripts, timers, clickable reveals, cover art, graphic novel snapshots and fades remain intact. Import scripts apply the same roles text to future rebuilds.

## Verification and release

Fictional local PostgreSQL/API tests passed 23 scenarios, including legacy draft/snapshot preservation, complete groups of two/three/four, authorization, concurrency, solo approval, individual submission/unlock and four-dimension lab release. A separate ordinary new-group release passed four checks. Four helper tests, 36 slideshow runtime tests, full TypeScript, scoped lint, style/brand audits and local security advisors passed.

Browser checks used the actual shared UI and API with fictional authentication and a local SSE replacement for Supabase transport. They covered group formation, saved avatars, all discussion phases, private reflections, unsaved draft preservation, a timer continuing across peer updates and view changes, and an actual 520px viewport. After disk recovery, the solo pending/approval/save walkthrough passed. Hosted WebSocket delivery was separately verified from the actual database as service_role to the browser; only a transport message ID accompanies the otherwise empty event. No real student writing was created by verification.

The hosted production build passed. All 6,840 source hashes match the audited live baseline plus 52 scoped paths; 63 normal-domain route, exact runtime/cover, script and authentication checks passed. Live teacher preview shows the four fictional classmates, roles, code and start controls. Database function permissions and RLS remain restricted; security advisors reported no new findings and the bounded runtime error/fatal scan was empty. Deployment protection prevented the staged browser walkthrough, and automatic review rejected a connector that may create a sharing link. No sharing or protection settings changed; build/source checks preceded promotion and normal-domain checks followed.

An atomic migration guard verified 1,694 protected records across 17 tables inside the same transaction. All 25 existing room identities remain; 13 written rooms keep their original two-person protocol and 12 empty rooms use the new flow. One live draft continued autosaving during release, so its external fingerprint changed as expected. Its latest state was preserved by the transaction guard; never freeze or overwrite a student's ongoing work to make external fingerprints match.

For future releases, resolve the current live source and prepare a scoped release rather than uploading this dirty checkout. Re-read live function definitions and preserve the in-transaction safeguards; distinguish legitimate concurrent autosaves from migration changes. Release migration and app together; old loaded clients may need to reopen a lesson to see Start group. Never roll back by deleting group evidence or lowering the slot constraint after four-person groups exist.

Evidence is in the Physics Curriculum Planning workspace at `outputs/foundation-groups/`. These scripts use disposable local PostgreSQL on port 55439 and fictional accounts; do not publish preview scripts or fixtures as student activities.
