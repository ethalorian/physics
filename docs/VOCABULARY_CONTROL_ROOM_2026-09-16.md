# Vocabulary mastery in the Control Room

The Control Room has a Vocabulary tab at `/admin/control-room?view=vocabulary`. It shares the class, unit, teacher, and student filters. Reviews cover the signed-in teacher’s own active classes, including admins acting as teachers.

Choose a vocabulary assignment, link it to a Knowledge target in the class’s program, and select a student. Large 1–2–3 buttons save a teacher judgment into the canonical `mastery_records` history and optionally advance to the next student with evidence. Assignment linking is explicit; existing assignments are not automatically mapped. Unlinked assignments remain visible so teachers can connect them.

The panel tracks completed checks, recent word accuracy, practice readiness, supports, submitted responses, quiz reviews, and the last teacher rating for that assignment/target. New completed checks or a changed quiz review reopen the item. No completed check means no evidence, not a zero. Written quiz responses require teacher review before mastery rating. Practice accuracy, quiz scores, and game activity never create a mastery grade automatically.

`vocab_mastery_reviews` is an evidence audit trail, not another grade rollup. Its service-only transaction validates task ownership, active enrollment, assignment membership, Knowledge domain/program, unchanged evidence, and the preceding review. It atomically appends a canonical rating and an immutable evidence snapshot. Repeated requests use the same UUID; concurrent/stale reviews are rejected. A deliberate later rating appends history. Teacher notes are retained with the review.

Validation:
- 14 vocabulary/evidence unit tests passed.
- API integration fixture passed class scoping, active membership, unlinked assignment visibility, target/domain validation, teacher/admin roster gates, and atomic save dispatch.
- Local PostgreSQL transaction tests passed atomic writes, exact snapshots, retry deduplication, owner/enrollment checks, stale evidence, pending quiz review, append history, and service-only privileges; all fixture data rolled back.
- TypeScript, focused ESLint, and style audit passed.
- Browser fixture verified explicit target linking; failure preserves notes and student; retry reuses request UUID; success advances; written quiz review unlocks rating; search and pending filter; no-evidence disabled state; 390 px mobile layout without overflow and 96 px high rating buttons.
- Live migration permissions verified: RLS enabled, anonymous access denied, authenticated RPC execution denied, service role allowed, SECURITY INVOKER. The advisor’s informational no-policy entry is intentional for this server-only table.

Release is assembled from the SHA-verified deployed source plus only this feature’s files, preserving unrelated work in the local checkout. No real student ratings are created during testing.

Production: `dpl_EGms7KkXn2vbQDHh5XzQyHJwVn8c` (`physics-e42ka8hr3-ethalorians-projects.vercel.app`), promoted to the live domain after Ready status and a full 1,810-file uploaded-source verification. Production build passed. Signed-in verification loaded CPA Physics F: 16 assigned students, 3 with completed evidence ready for review; pending-only filtering and word accuracy/support details worked; the Knowledge picker exposed the precise-vocabulary motion target and the force-identification target. Target links and student ratings remained unchanged. Fresh browser rendering succeeded; the earlier existing browser tab needed replacement after navigation. No runtime errors appeared in the initial release log check.
