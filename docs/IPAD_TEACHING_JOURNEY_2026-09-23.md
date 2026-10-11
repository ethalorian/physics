# iPad teaching journey

The Command Center is now a focused teaching workspace with one start flow and four destinations: **Teach**, **Activities**, **Students**, and **Notes**. Slide navigation, blank screen, timer, classroom-screen connection, and Finish stay in the same place above every destination. The admin sidebar and global navigation are removed on the command-center and projector routes; Teacher home remains available before and after teaching.

## Start and connect

Choose the class and lesson, then Start presentation. A running presentation is the first option when one exists. On the classroom computer, starting or resuming opens the screen-connection controls directly; Open projector window launches the existing standalone deck. Keep the computer page and the deck window open. On the iPad, Control this presentation opens the same session. Copy projector link remains available for the standalone connection page.

Both `course` and `class` query parameters are accepted. While teaching, the URL records the selected course and lesson so refresh returns to that session. Resume never creates a second session. An idle computer connection panel does not send a false projector acknowledgment.

## Teach and finish

Teach shows the classroom preview, slide chooser, private speaker notes, next slide, lesson-content picker, and SEI switch. A projected interactive teaching tool exposes its controls in this view. Activities contains lesson polls, group work, and pulse checks. Students contains help requests, the fair picker, and classroom observations. Notes contains private bookmarks and saved notes. Switching views preserves unfinished notes and the live projector bridge.

An open activity disables slide navigation and offers one persistent action to close it and return to teaching. Finish is always visible. Its confirmation closes the active group activity, ends the presentation, and clears the poll/timer. Failed requests leave the confirmation actionable. The finished screen links to notes and the next lesson. Leaving an ended computer bridge keeps the screen blank.

## Verification

- TypeScript and targeted ESLint pass.
- Semantic-token/style audit passes.
- Browser fixture uses the real controller, projector, student components, and existing command hooks in separate browser contexts; HTTP responses are controlled fixtures, not production student data.
- Full browser journey covers projector setup in Command Center, remote slides, double-tap guard, failed command recovery, lesson projection and slide restoration, SEI failure/retry, polls, group work, pulse checks, help requests, fair picker, private notes, note drafts across tabs, reconnect, and finish.
- Portrait 820×1180, landscape 1180×820, and split view 568×820 pass overflow and 44px control checks.
- Additional fixture modes cover refresh/resume and interrupted finish (`JOURNEY_ONLY`), stale session ending (`END_ONLY`), and existing laptop-to-iPad handoff (`LAPTOP_HANDOFF`, `HANDOFF_ONLY`).

No database schema, lesson content, evidence, or mastery changes. Respects A-1/A-4/A-7, P-1/P-2/P-4/P-5, M-1, and SEI-1/SEI-9. Physical iPad Safari, classroom display placement, and production Wi-Fi remain device checks. These changes are included in the isolated teaching release; see PHYSICS_EXPLAINERS_GROUP_WORK_2026-09-23.md for the accompanying features and TEACHING_RELEASE_2026-09-23.md for release verification.
