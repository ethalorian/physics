# iPad Command Center

Launch `/admin/command-center` from the teacher dashboard or staff navigation.

## Classroom setup

1. Sign in on the iPad and choose a class and lesson. The site reconnects to an existing live presentation for that combination, or offers Start presentation.
2. Copy the projector link and open it on the classroom computer, signed into the same teaching account.
3. On that computer, choose Open projector window. Move that window to the classroom display and enter fullscreen. Keep the connection page open.
4. Use the iPad to move slides, jump to a slide, read speaker notes, blank the board, run a timer, and open lesson polls or group activities.

This setup uses a separate classroom computer to drive the projector. Direct iPad AirPlay mirroring is not a separate private presenter display. The computer connection page must remain running; expect about 1–2 seconds for remote controls to reach it. Pop-ups must be permitted on the classroom computer. The iPad uses only normal site requests.

## Teaching flow

Polls use the lesson's existing multiple-choice checkpoints. Open, lock, reveal results, and close from the iPad. Student submissions still use the existing live poll evidence pipeline. Teacher-facing response counts stay private until results are revealed on the projector. Polling does not award mastery.

Lobby launch uses a lesson's lobby-ready blocks with the existing grouping and session APIs. The classroom screen displays the join code. Form groups, start work, and close the activity from the command center. Closing restores the unchanged slide. A separate View groups & work link opens the existing detailed monitor. Close a poll before starting a lobby, and close the lobby before starting a poll.

The timer runs from the server's end timestamp. Blackout overrides the visible activity. Ending a presentation blanks the projector and ends its poll/timer. Lobby sessions have their own lifecycle; close an active lobby before ending the presentation if student work should stop too.

Observe & give feedback opens the observation tool in another tab, keeping the presentation running. No student names, mastery ratings, teacher speaker notes, or group passphrase answers are projected by the command overlays.

## Implementation and verification

The existing `present_sessions` row remains the source of slide, poll, timer, and blackout state. Its authenticated GET response now includes that state alongside tallies. Active lobbies are resolved from the same teacher, class, and lesson, created after the presentation began; the original controls need no new schema. The additional teaching tools require migration `20260907145933_classroom_command_tools.sql` before deploying this version. The latest matching lobby determines the board; closing it restores slides without resurrecting an older lobby.

The projector connection drives an actual second deck window through `present-bridge`; it does not iframe or modify authored deck bundles. Auto slides and the iPad share `present-auto-slides.ts` to keep continuation-slide indices identical. Authored decks expose slide labels and notes through `deck-stage > section`. Student-follow mapping uses exact anchors or authored slide maps; unmapped slides do not guess a student section.

Respects lesson rules A-1, A-4, A-7, P-1/P-2/P-4/P-5, L-1, M-1 and M-4. Existing server role and session-owner authorization stays authoritative. Read-only Supabase query verified the session/lobby relationship against the existing schema; no production sessions or student evidence were written during verification.

Validation: TypeScript, targeted ESLint, an actual API handler test with database fixtures (owner guard, poll/no-poll state, latest-response tally, failed activity read), and separate browser contexts for the iPad and projector. The browser harness exercised slide commands, failed PATCH recovery, double-tap suppression, blackout, timer, polls, lobby lifecycle, restored slide, end/restart, 44px controls, and overflow at 820×1180, 1180×820, and 568×820. Browser automation used Chromium with touch emulation; physical iPad Safari and live authenticated projector smoke testing remain deployment checks.


## Additional real-time tools

- **Who needs me?** Shows explicit student help requests, named pulse checks indicating help/low confidence, current-poll incorrect answers, and missing responses. Explicit requests appear first; the first five students are shown with an option to expand. Missing responses are check-in prompts, not mastery ratings. Observe opens the selected student and class. Help given clears the student's request.
- **Pulse checks:** Readiness or confidence, named or anonymous. Students respond from the live lesson screen and can also request/cancel help. Anonymous rounds store a salted per-round response key and no user ID; teacher UI receives aggregate totals only and cannot identify nonresponders. The server retains the salt privately to deduplicate submissions and restore a student's own choice. No pulse response writes mastery or awards XP.
- **Fair picker:** Selects a random student who has not already been picked in this presentation. Picks persist across refresh; a database uniqueness constraint prevents repeat picks. Skip moves to another unpicked student. A one-minute think-pair-share timer is available. Names never appear on the projector.
- **Pause & discuss:** Locks the current lesson poll, hides its reveal, and starts 90 seconds of discussion. Start fresh vote creates a new poll run ID; earlier responses remain in the original round. The projector displays the discussion instruction until the new vote begins.
- **Private bookmarks and recap:** Save a quick tag or a custom note for the current slide and optionally a student. Notes persist on the server. Use the recap link during class or Saved session recaps after class to reopen/download the notes. No automatic messages are sent to students.
- **Projector confirmation:** The display page acknowledges the rendered command signature and slide every two seconds. The iPad distinguishes not connected, waiting for a command to apply, confirmed, and stale (over ten seconds). Reconnect reloads an existing projector window; if that window was closed, a person must reopen it on the classroom computer because browser pop-up rules require a local click.

The new tables are RLS-enabled and accessible only through the service role; API routes enforce session ownership/class membership. Student pulse writes run in a database function that locks the live session and pulse before accepting the authenticated student's vote. Closed/ended/foreign-class writes are rejected. Display-only tool reads omit student rosters, help queues, and private marks.

### Additional verification

- `npx tsx --test src/lib/presentation-tools.test.ts`: projector freshness/signature and picker exclusions.
- `node scripts/test-presentation-tools-api.cjs`: actual server/route modules with database fixtures, anonymous versus named queue, private display projection, identity spoofing/foreign-session checks, and rejected late votes.
- `sh scripts/test-presentation-tools-db.sh`: isolated PostgreSQL cluster; migration, real pulse function, anonymous identity omission, duplicate-vote updates, class/closed/ended rejection, picker uniqueness, RLS and grants. Set PG_BIN for another PostgreSQL installation.
- `node scripts/test-presentation-tools-browser.cjs`: separate fixture teacher, student, and projector contexts, including all six tools and the original live workflow. Set PLAYWRIGHT_PATH to a Playwright installation when outside the bundled runtime.

Apply the migration before deploying the application changes. Local tests do not apply it to production or create real student records.
