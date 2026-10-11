# Claude's original explainers

The six original exports from the user's **Kinematics teaching tool design** project replace the native rewrites. The exported HTML, CSS, text, SVG illustrations, animations, quizzes, and `support.js` are preserved byte for byte. Source hashes are recorded in `src/data/explainers/claude-manifest.json`; `scripts/build-claude-explainers.mjs` validates and copies the originals into the public library.

Open https://www.antocciphysics.com/explainers/claude/index.html to browse the originals directly. The Command Center start screen includes **Browse original explainers**. In a Unit 1 teaching session, **Open an explainer** selects an original for the classroom screen. The six exports contain 40 named sections in total: Course (7), Vectors (7), Kinematics (7), Derivatives (6), Units (7), and UAM (6). Their original scrolling layouts are retained.

The integration surrounds the exported documents. An iframe adapter observes the pinned Claude runtime's existing model and scroll position. The existing classroom command channel synchronizes that bounded state to the projector, including original animations and quiz choices. One active controller publishes model changes; projected copies do not publish their own animation ticks. The projector acknowledges only after the original runtime loads and applies the state. The adapter validates authored keys, numbers, choices, and nested simulated run data; it accepts no arbitrary executable content or grading data.

Section navigation, **Discuss this slide in groups**, **Launch a textbook question**, group work, debrief, and restoration use the existing teaching workflow. Closing an activity restores the original explainer state; returning to the deck restores its prior slide. Optional student reference links open the same original documents. No lesson publication, mastery, completion gate, database schema, or student record changes are included.

## Verification

Source/public file equality and manifest hashes are checked for all six documents and their runtime. The browser fixture uses real controller and projector components in separate iPad, computer, and projector contexts, with controlled API responses. It covers original simulation controls, animated derivations, quiz feedback, classroom synchronization, group discussion, textbook group work, restoration, refresh, all six original layouts, and iPad portrait/landscape/split-view overflow. API tests cover class/lesson scope and forged prompt rejection. TypeScript, targeted lint, and the semantic style audit are release checks.

The original runtime's React, ReactDOM, Babel, and Google font network dependencies remain unchanged. A route-specific CSP permits only the three original version-pinned, SRI-checked runtime scripts; the application policy and other security headers remain in force elsewhere. The browser fixture applies this real CSP to every original. The vendor archive is excluded from app-code linting to preserve its bytes. Raw original templates briefly produce SVG placeholder warnings while mounting; the mounted originals have no runtime error panel. Physical iPad Safari and classroom Wi-Fi are not emulated by the browser fixture.

## Release scope

This release is assembled from production deployment `dpl_9uyXPTcP2J2sNZwvL37GYrZy8DB9` with only the original-explainer integration overlaid. The production base is verified against Vercel's source hashes. Unrelated workspace edits are excluded. The previous native-explainer implementation and its 68-frame QA report are superseded by this version; the daily lesson decks remain in the verified production base.
