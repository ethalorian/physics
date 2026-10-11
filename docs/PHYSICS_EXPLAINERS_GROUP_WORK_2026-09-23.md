# Physics explainers and textbook group work

> Historical implementation report: the native rewrites described below are superseded by the exact original Claude exports. See [Claude original explainers](CLAUDE_EXPLAINERS_2026-09-23.md) for the current implementation and access links. The group and textbook workflow remains in use.

## Teach from the iPad

Open https://www.antocciphysics.com/admin/command-center. On the classroom computer, choose the class and lesson, start or resume the presentation, and use **Open projector window**. Keep the computer connection and projector window open. On the iPad, sign into the same teacher account and choose **Control this presentation**.

In a canonical Unit 1 lesson, **Open an explainer** offers six presentations: the 2026-XJ course briefing (10 slides), Vectors and scalars (12), Kinematics (12), Derivatives (11), Units (11), and UAM derivation lab (12). All six are available from each Unit 1 lesson. These supplement the 22 rebuilt daily decks (421 slides). Slide navigation, reveal controls, and model settings synchronize through the existing presentation session. Change parameters, then tap **Apply**; the classroom screen uses the confirmed state. Speaker prompts, expected reasoning, and debrief notes remain private on the teacher controller until explicitly revealed.

The six models cover distance/displacement, position/velocity/acceleration graphs, secants and tangents, vector deflection, dimensional analysis, and an idealized ramp. Students can also explore the explainers as optional reference tools in the canonical online lesson; these do not add completion gates.

## Launch a discussion

On a discussion slide, tap **Discuss this slide in groups**. Review the selected prompt and debrief, choose grouping and size, and tap **Launch lobby**. Students join through the existing group tool. Use **Form groups**, **Start work**, and **Start debrief**. **View groups & work** opens the existing teacher review. **Close activity & return to slides** restores the explainer frame and model state; returning to the deck restores its saved slide.

## Launch a textbook question

Tap **Launch a textbook question**, select a question, and review it before launching. The catalog includes the lesson's reading checks and Think & Solve references, questions from the assigned sections of concept exercises, and published textbook assignments for the selected class. Questions that only reference a book number retain that reference and an **Open textbook** link; missing textbook wording is not invented. The picker has loading, retry, and empty states.

Groups contribute one shared response with a claim, evidence, reasoning, and a disagreement to discuss. Use the same launch, group, work, debrief, and close flow as for explainers. The server derives the chosen prompt and learning target from the authorized catalog; browser-supplied question text and target overrides cannot replace them. The group artifact records its source in the existing lobby metadata and does not overwrite an individual textbook assignment. Submission errors remain visible and preserve the group's draft.

## Content and implementation

The source was the user's exported Claude design project, **Kinematics teaching tool design**, project 22893b34-5e55-4562-9f77-7e126ee2e5ef. The source explainers were re-authored as native presentation frames and interactive models rather than loading exported scripts. Teaching content includes worked examples, predictions, checks, reasoning reveals, and discussion/debrief prompts.

Physics corrections include distinguishing zero net force from zero velocity; avoiding effort as a definition of speed; limiting the path/endpoints distinction to distance and displacement; allowing signed scalars; treating a rocket burn as a velocity change; and labeling the asteroid and ramp models' assumptions. The ramp uses simulated data with a frictionless sliding-particle approximation, and teaching notes discuss wheel rotation and losses in real carts.

No schema migration or production lesson publication change is required. Existing unpublished lesson gates remain in force. No live student sessions, responses, or mastery records were created during verification. The release is assembled from verified production source with only teaching changes overlaid; unrelated local work is excluded.

## Verification

- TypeScript, targeted ESLint, semantic style audit, and patch whitespace checks passed.
- Physics/state unit tests and idempotent lesson mapping passed; catalog tests verify assigned-section filtering.
- API tests cover authorized class/lesson scope, source validation, forged prompt/target rejection, valid discussion frames, and the existing group-submission enrollment guard.
- Existing lesson access/review tests (30 checks) and presentation API tests passed in the isolated release.
- Real-component browser journey passed with separate iPad, computer, and projector contexts: slide/model synchronization, reasoning reveals, contextual discussions, textbook groups, debrief, restoration, and reload persistence. Controlled HTTP fixtures were used; this does not simulate classroom Wi-Fi.
- Portrait 820×1180, landscape 1180×820, and split view 568×820 passed horizontal-overflow and 44px control checks.
- All 68 explainer slides were rendered with reasoning visible: zero layout overflows and zero browser errors. Minimum fitted scale was 0.811. The original 22 daily decks and their 421 slides were checked in the preceding deck pass.
- Physical iPad Safari and classroom display/Wi-Fi remain device checks.

Release results are recorded in TEACHING_RELEASE_2026-09-23.md after production verification. QA images and the full layout report are in explainer-teaching-verification/.
