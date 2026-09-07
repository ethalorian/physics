# Arcade audit — September 7, 2026

**Recommendation:** Keep Descent as the flagship, repair the shared run/reward system, and add **TETHER**, a swing-and-release rescue game. The arcade already has considerable variety; dependable saves, clearer progression, and better discovery offer more immediate value than adding several cabinets at once.

**Evidence and limits:** Reviewed the local hub, cabinet bridge, scoring/payout routes, registration pattern, and 22 standalone HTML files (21 games and the retired High Noon notice). Ran local Chrome loading and introductory interaction checks, plus isolated state tests and a simulated slow host. These are smoke tests, not complete campaign, accessibility, or physics-validation tests. No application code, student records, scores, or XP were changed. The configured database credential returned “Invalid API key,” so production enablement, deployed-version parity, real usage, and authenticated payouts remain unverified. Student enthusiasm for Descent is teacher-reported evidence; explanations of that enthusiasm below are design judgments.

## What is working

**Descent has the strongest demonstrated engagement signal.** Its controls affect actual motion: burn timing changes velocity and landing outcome, rather than merely unlocking an animation after answering a question. Immediate feedback, three lives, short retries, fuel constraints, softer-landing bonuses, and escalating acts support improvement through repeated attempts. Live position/velocity/acceleration graphs connect the action to the curriculum. Local checks confirmed entry to Act I, animation, keyboard input, and pause.

**The library has breadth.** Physics cabinets cover motion, forces, energy, momentum, waves, heat, electromagnetism, gravitation, and the car project. Math includes timed fluency, merging, expression construction, and deduction. Preserve those different interaction styles.

**Useful infrastructure exists.** Learning cabinets can be free and ranked; paid midway games provide a reason to spend earned XP. The score route checks ownership and run age, caps scores, and excludes staff via ranking helpers. Purchase SQL uses a shared wallet lock and creates the charge and play together. The player checks whether a game file exists before displaying it. These are good implementation choices, not claims of verified production operation.

## Game-by-game assessment

“Starts” means introductory local behavior worked without an observed JavaScript exception. It does not certify later levels or ranked integration.

| Game(s) | Local assessment | Recommendation |
|---|---|---|
| **Descent** | Starts; keyboard/pause and telemetry work. Shared restart/reward defects below. | Feature prominently; protect the core gameplay. |
| **Redline** | Introductory controls reach play without an observed exception. Racing with velocity demands and telemetry. | Feature alongside Descent; test full heats and payout next. |
| **Push** | Starts. Impulse, friction, and ramps change what the player can accomplish. | Strong candidate for the next unit's featured cabinet. |
| **Cascade** | Starts. Mine-cart motion makes energy conservation, braking, and friction visible. | Keep; emphasize the changing reachable-height/energy display. |
| **Impact** | **Broken in Act I:** animation loop throws an undefined-variable error. | Repair before recommending to students. The throw/catch/recoil premise is promising. |
| **Orbit** | Starts. Spacecraft control and gravitation provide another physical challenge. | Keep; distinguish its mission clearly from Descent in the hub. |
| **Resonance** | Starts. Frequency tuning, standing waves, and interference; sound is an intentional cue. | Keep; verify usable visual feedback with sound off and classroom headphones. |
| **Furnace** | Starts. Heating materials, particle sorting, and engine timing. | Keep; introduce by unit rather than presenting every act at once. |
| **Flux** | Starts. Electromagnetism cabinet with three acts. | Keep; verify all three acts and conceptual accuracy before featuring. |
| **Garage** | Starts. Wiring, gearing, and race configuration connect to the car project. | Feature during the project; guided first mission will help. |
| **Inverse Blitz, Magnitude, Scale Storm, Powers of Ten, Slope Sniper** | Load successfully; shared falling-stack engine and difficulty doors. Introductory checks include answer feedback. | Useful fluency tools, but five versions of the same pressure loop are not five distinct experiences. Add an untimed practice option; do not treat speed as mastery. |
| **Fusion** | Starts; introductory swipe accepted. Equivalent fractions/decimals/percentages, then powers and units. | Highlight as a different way to practice number sense. |
| **Expression Crush** | Starts and generates an expression-building board. | Keep; a worked first move would reduce the initial instruction burden. |
| **Mathle** | Starts and presents the daily equation puzzle. | Use for a shared daily challenge and discussion; not a reflex game. |
| **Stack, Timber, Vortex** | Introductory keyboard interactions produce no observed runtime error. | Keep as optional recreation; test charging and completed runs live. |
| **High Noon** | Explicit retirement notice linking to Redline. | Intentional retirement, not a broken game. Verify it remains disabled in production. |

The hub also links seven vocabulary games. Their components were not replayed in this audit; see the separate vocabulary audit for that subsystem. Do not infer they have passed from the HTML cabinet checks.

## What is not working, in priority order

**1. Impact freezes at the start of Act I.** `attemptT` is read but never declared or updated. The resulting exception exits the frame callback before it schedules the next frame. Reproduced through the visible Insert Coin → Act I → launch flow. Repair the timer's initialization, per-attempt reset, and increment; test both normal docking and the timeout.

Evidence: `public/games/momentum-impact.html:797`, frame loop at `:1157`.

**2. Nine physics cabinets carry learning totals into subsequent runs.** Descent, Push, Cascade, Impact, Orbit, Resonance, Furnace, Flux, and Garage create one `STATS` object and never reset it when a fresh credit/run begins. In isolated browser tests, setting totals to 4 clears, 2 correct, and 1 wrong, then ending and restarting a run, retained all three values. Because payout reads those totals, later runs can inherit earlier success or mistakes. Reset evidence once per new ranked run, while deliberately preserving it across acts belonging to that run.

Evidence: Descent `:353`, `:630`; equivalent STATS/startAct implementations in the other eight files.

**3. “Earn XP” is unreliable and poorly explained.** Physics bonuses are optional, but a player who skips every question earns zero payout regardless of successful landings. Conversely, a single correct question plus many clears can count as 100% answer accuracy. The system therefore measures accuracy on attempted bonuses, not demonstrated understanding across all clears. A run only pays once finished; Descent posts a nonfinal checkpoint at act completion and finalizes at game over. A successful student leaving at the bell has no explicit “Finish and bank” action. Nine physics games also lack a handler to display the host's `arcade:xpAwarded` response.

Add a clear finish-and-bank action, checkpoints after successful stages, an XP receipt, and transparent eligibility. Keep scores and learning evidence separate. If understanding is required for payout, use a brief explanation/prediction tied to the actual attempt with a defined coverage rule.

Evidence: Descent `:462`, `:498`, `:516`; `src/app/api/arcade/payout/route.ts` (`computeXp` and finished-only check); cabinet page final-score branch.

**4. Slow connections can desynchronize ranked play.** Descent falls back to practice after 900 ms. In a local simulated host with a 1,200 ms approval, the mission started but `ARCADE.playId` remained null: the late approval was discarded. Meanwhile the real parent page would record the accepted play. The same bridge pattern appears widely. Some other cabinets process late approvals unconditionally, potentially starting the run again.

Use an explicit pending state and request ID; practice should be a deliberate mode. Reconcile late responses. The parent should acknowledge score saves, report failures, and retain the finished run for retry instead of clearing it after an unsuccessful request.

Evidence: Descent `:266–288`; `src/app/arcade/[slug]/page.tsx` message handler. Do not interpret the simulated delay as a measurement of production latency.

**5. Descent progression and score meaning need clarification.** Unlocks/high scores are stored in browser localStorage, not the student's account. A new device/profile can lose them; a shared profile can inherit them. Advancing to the next act resets the visible score while the server retains the largest score posted for the same play. That makes the leaderboard's “run score” unclear. Define campaign total versus act best, then store account progression and separate boards accordingly.

Evidence: Descent `:115–120`, `:353–357`, `:492–510`; score route's `Math.max` behavior.

**6. Discovery and incentives favor the wrong entry point.** The paid Midway is featured above the physics floor despite Descent being the teacher-reported hit. Add “Continue Descent,” current-unit recommendations, thumbnails, approximate session length, and visible control requirements. The generic daily challenge/streak uses vocabulary scores only, so playing Descent does not advance it. Label it vocabulary-specific or include learning-cabinet activity. The advertised first free Midway credit is also lost if a student plays a free cabinet first: eligibility checks for any prior arcade play.

Evidence: `src/app/arcade/page.tsx`, `src/app/api/arcade/hub/route.ts`, `src/app/api/arcade/cabinet/route.ts`; purchase SQL in `20260907142702_avatar_integrity_and_customization.sql:118`.

**7. Ranking/rewards need stronger integrity under load.** Score and bonus statistics originate on the client; range clamps do not verify that the reported work happened. Leaderboard routes read raw plays without pagination or server aggregation, so a configured API row limit can omit records as usage grows. Payout checks today's total and inserts separately, leaving a concurrency risk across distinct simultaneous runs. These are code-review risks, not demonstrated cheating, leaderboard corruption, or cap overrun in production.

Use server-side ranking aggregation, atomic daily payout accounting, and enough validated run evidence for the importance attached to ranks/XP. Current arcade statistics should remain supplemental practice evidence, not grades.

## Proposed new game: TETHER

**Pitch:** Swing a rescue pod through a damaged station, release at the right instant, and deliver it safely to the next platform. One more swing, one better release.

- **Core control:** Hold Space to attach to a highlighted anchor; release to detach. Begin with one clearly indicated anchor and no extra aiming burden. Offer equivalent large touch controls.
- **Physics drives success:** The pod travels along a pendulum arc while tethered. Release velocity is tangent to that arc; gravity curves the free flight. Height trades with speed. Rope length changes the route and timing.
- **A short run:** Three small deliveries in roughly two minutes, immediate retry after a miss, and an explicit finish-and-bank action. These are proposed design targets, to validate with students.
- **Progression:** Act I teaches release timing with a fixed rope. Act II introduces selectable rope lengths and moving platforms. Act III adds energy-limited winching; any change in energy from the winch must be represented as work, not free speed.
- **Feedback:** Keep a short ghost of the previous attempt and show its release-velocity arrow. After a miss, show the miss distance and whether the landing was too fast. Make improvement visible.
- **Scoring:** Delivery, landing precision, and efficient energy use. Keep speed bonuses modest so careful players can compete. A shared daily course supports friendly competition under identical conditions.
- **Learning prompt:** Occasionally predict which direction the pod will travel on release, then test that prediction immediately. Avoid interrupting every swing with a disconnected quiz.
- **Why it fits:** It retains Descent's timing, physical consequences, and near misses while adding a mechanic absent from the existing library: swinging under a tether constraint and choosing the moment of release.

First prototype: one anchor, three landing pads, fixed rope, three short levels, ghost replay, restart, pause, and finish. Test enjoyment and first-success time with a small student group before building the full campaign. Track return visits, successful deliveries, and prediction improvement; long playtime alone is not evidence of learning.

## Suggested sequence

1. Repair Impact and the shared run-stat reset, delayed approval, and finish/save behavior.
2. Feature Descent and a current-unit cabinet; clarify XP rules and score meaning.
3. Prototype Tether's three-level core and observe students playing.
4. Expand only after the prototype shows repeat play and understandable failure feedback.

The current priority is a trustworthy arcade around an already engaging flagship, followed by one genuinely different physical skill game.
