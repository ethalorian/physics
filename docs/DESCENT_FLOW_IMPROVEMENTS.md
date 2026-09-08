# Descent flow improvements

Descent now follows briefing → flight → flight check → next mission or finish and bank.

- Briefings state mission progress, practice/ranked mode, and a prediction to make before launch.
- Successful flights require one check before advancing. The question and explanation use the flight's actual planet, landing speed, relative pad speed, or launch velocity.
- Completed flight checks supply payout evidence. Skipping an unchecked landing by ending a run does not increase `solved`. Wrong answers still reveal the explanation and allow continuation; crashes only cost ships, not answer accuracy.
- Failed vertical landings show actual speed versus the limit, plus an earlier-braking or fuel-management suggestion.
- Students may finish from briefings, failure results, answered checks, act completion, or pause. P, the pause button, and loss of window focus freeze active flight; resume clears accumulated simulation time.
- Each act is a separate ranked run. Bank at act completion, then pick the next unlocked act in the hangar. Endless mode can extend the current act. Scores retain the existing per-act scale and local high-score behavior.
- New runs reset score and learning counters. Descent uses the existing protocol-2 bridge shared with Tether/Flywheel. Delayed approval no longer silently becomes practice. The play ID and final payload remain available until score and payout are acknowledged; failed/unconfirmed final saves expose Retry Save and block starting a replacement run.
- Direct-file play is explicitly practice; it sends no ranked score or payout.

Impact also had an undefined `attemptT` reference in its Act I loop. Its course timeout now uses the existing per-attempt simulation clock `t`, which launch resets and pause stops.

## Verification

`node scripts/test-descent-flow-browser.cjs` runs the real cabinet React page and game HTML against mocked API endpoints, without production data. It checks delayed approval, a successful first Descent mission using the real physics integrator, keyboard pause/resume, one-time answers, failed-save retry, fresh-run counters, failed landing feedback, Act II/III contact fixtures and questions, standalone practice, mobile pause/bank, and Impact's first-act step and timeout. The Act II/III fixtures verify boundary behavior, not full playthroughs of those acts.

`node scripts/test-tether-routes.cjs` checks actual score/payout route retry behavior with an isolated database fixture, including ownership and immutable completed scores. `npx tsx --test src/lib/tether-bridge.test.ts` checks request serialization, source isolation, and receipt retries. TypeScript and targeted ESLint also pass.

Screenshots: `docs/descent-verification/flight-check.png` and `mobile-briefing.png`.

These changes are local and have not been deployed. No database migration is needed for this update. Production payout and cabinet availability were not tested. Deploy the cabinet host/API and Descent HTML together because Descent now requires protocol 2.
