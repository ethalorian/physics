# Direct interaction in the projector window

The original explainer iframe was read-only whenever its host role was `projector`: the renderer hid its teaching controls, disabled pointer events and keyboard focus, and the projected block page supplied no command callback. The earlier Command Center fix made the teacher panel interactive but did not change this projector behavior.

The projected block now supplies the existing authenticated, revision-checked teaching-tool command path for the active original explainer. The original iframe accepts direct mouse, keyboard, and touch input while retaining its full-screen layout. The iPad and projector use the same session state. The passive Command Center thumbnail supplies no command callback and remains display-only. Input is unavailable when the presentation has ended, is blanked, or is showing a class activity.

The adapter serializes outgoing commands and retains new user input until acknowledged. It drops stale animation samples when the other screen takes over, preventing a queued sample from restarting an animation that the teacher just paused. The frame no longer keeps a second retry queue that can outlive the handoff.

Claude's exported HTML, CSS, runtime, animation logic, and quiz content remain unchanged. There are no API authorization, database schema, student evidence, or mastery changes. The existing teacher/admin ownership checks and command revision checks remain in force. This respects lesson system rules A-1, A-2, A-6, P-2, and M-1.

Verification passed: all six originals accept projector input; the course timeline, kinematics animation, and both animated derivations can be paused from the iPad without a later projector sample restarting them. Projector quiz answers and unit-builder controls synchronize back to the iPad. Group and textbook activity return, refresh restoration, and iPad portrait/landscape/split-view layouts pass. The fixture enforces command revision conflicts and exercises the realtime notification path. The final slider check uses native keyboard events rather than a synthetic range fill. These are browser/device-emulation checks, not a physical iPad Safari run.

The original-file/state-validation tests, targeted ESLint, style audit, full nonincremental TypeScript check, and production build passed. All four application files in the staged release were byte-compared with the final browser-tested implementation; regression-script refinements made after staging remain in the main working tree.

Deployment `dpl_Gv38mL9ZVwn6BVsEiUyaHPzLTfdH` is live at `www.antocciphysics.com` on September 23, 2026. Verification confirmed 2,108 production-baseline source files remain unchanged and only the six intended release paths differ or are added. Live checks confirmed the eight original assets remain byte-identical, Command Center responds successfully, and the textbook endpoint retains its authentication requirement. The deployment had no reported runtime error logs when checked.

To load the fix in existing sessions, refresh Command Center on the computer and iPad, then close and reopen the projector window.
