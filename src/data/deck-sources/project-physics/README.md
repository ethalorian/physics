# Project Physics motion graphs

## Week 1 Day 1 · Walk the graph

Source: [Motion graphs for SEI physics · Walk the graph](https://claude.ai/artifact/SBvaeZFnzxeetyaQkpwQuQ), retrieved September 15, 2026. Editable source and bundled assets are `week-1-day-1.html` and `week-1-day-1-assets.json`.

Lesson `pp-w01-d1`, unit `proj-1`, plan day 11. Walk (0–50), Talk (50–75), and Write (75–110) map to `w01d1-predict`, `w01d1-talk`, and `w01d1-write`. Use the classroom block picker for the three-row score table and individual exit. Prediction, scores and fixes, writing, exit, and self-rating keep their existing capture IDs.

The walker simulates position in metres from the detector. It does not connect to Vernier hardware. The teacher plan supports both physical and simulated walks. Tool notes are temporary practice; students save evidence in the lesson. Source-relative artifact links are replaced with the installed lesson and Day 3 tool.

Integration fixes: prediction gate prevents early recording; reveal starts the scripted walk; all three matches reset to the correct position; scores require a full 10-second run and log by match number; a focused native slider reserves arrow keys for walking; writing persists across tabs; Level 2 support and same-scale steepness wording are included. Switching stages pauses active recording and the discussion timer. No response, grade, or mastery writes originate in the tool (A-1, P-1/P-2, E-3, M-1).

`node scripts/build-project-motion-tool.cjs` rebuilds both Day 1 and Day 3 exports from editable sources (C-3). `node scripts/test-project-walk-tool.cjs` checks motion, prediction gating, scoring, keyboard/reset, drafts, and timer state. Plans also live in `scripts/project-classroom-plan-overrides.json` so regeneration retains this alignment.

## Week 1 Day 3 · Slope and area

Source: [Motion graphs for SEI physics](https://claude.ai/artifact/CtniDBup6xp8wCcjsFBeNC), retrieved September 14, 2026.

`week-1-day-3.html` is the editable document extracted from the published artifact. The companion asset manifest preserves the exported runtime, React and fonts. The original artifact’s linked worksheet was unavailable; the imported tool links directly to the lesson where work is saved.

Run `node scripts/build-project-motion-tool.cjs` from the repository root to rebuild `public/decks/project-physics/week-1-day-3.html`. Edit the source, never the generated export (C-3).

The five tabs use the existing deck contract through `motion-deck-bridge.js`:

| Tab | Lesson anchor | Time |
| --- | --- | --- |
| Slope | `w01d3-sim1` | 0–25 |
| GEWA 1 | `w01d3-gewa1` | 25–50 |
| Area | `w01d3-sim2` | 50–75 |
| GEWA 2 | `w01d3-gewa2` | 50–75 |
| Talk & Write | `w01d3-talk` | 75–110 |

Lesson: `pp-w01-d3`, unit `proj-1`, plan day 13 (Week 1 Day 3, September 16). Presentation metadata uses these block IDs for student follow; existing response IDs and target links remain the evidence source. The artifact is demonstration/practice only and does not write grades or responses (A-1, P-1/P-2, E-3, M-1).

Integration fixes: expose both answer-feedback values in the template; label answer inputs; clarify signed area versus forward-only distance; correct reciprocal units; preserve reduced-motion preferences; replace broken sibling links with lesson links. The plan source is also in `scripts/project-classroom-plan-overrides.json` so curriculum regeneration retains the alignment.
