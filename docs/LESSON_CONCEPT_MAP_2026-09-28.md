# Student lesson concept map — 2026-09-28

The student Lessons link now defaults to an interactive map of the current published physics-path lessons. The eight video concepts branch through measurements, motion, position, vectors, direction and rates. Selecting a node shows the idea, its learning targets, and named incoming/outgoing connections. Open lessons have an individual launch link; unreleased, scheduled and closed lessons remain grey and explain their access state. Students can zoom, pan, find their next available lesson, or switch back to the lesson list.

## Access and data

The map uses the student's server-resolved program, track and exact class lesson windows. It returns only an explicit allowlist of titles, goals, targets, access state and the student's own completion. Locked nodes contain no lesson documents, questions, answers, video identifiers or playable URLs. Drafts, retired lesson versions and lessons outside the student's track/program are excluded. Opening one lesson never opens its neighbors. Existing lesson-body, response, XP and submission authorization is unchanged. Completion is labeled separately from mastery evidence.

The map refreshes on window focus, every minute while visible, and on request. Connections describe conceptual relationships, not prerequisite unlocks. Future published physics-path lessons are included automatically; related practice/investigation nodes connect through shared learning targets. The current eight video links are curated in `src/lib/lesson-concept-map.ts`.

No database schema or production records are modified by this release.

## Verification

- 37 access/review behavioral checks, including current versus legacy/draft catalogs, program/track filtering, locked metadata, scheduled/closed states, individual release, and enrollment gates.
- 8 video-XP API boundary checks.
- TypeScript, targeted lint, global style and brand audits.
- Browser verification using the actual components and map builder with synthetic access/progress: open, scheduled, closed and never-released states; individual launch hrefs; list/map switching; all-locked catalog; desktop, tablet and phone layouts; zoom and next-lesson navigation.
- Release assembled from the exact current production source; unrelated workspace changes excluded.
