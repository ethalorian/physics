# Math arcade audit and remediation game designs

## Recommendation

Build a coherent **Math Missions** collection aligned to the existing 13 math fluency competencies. Each mission should reveal a student's reasoning, provide a short strategy when needed, fade the support, and check independent transfer. Retain the existing arcade games as optional fluency challenges after repairing the issues below.

The seven missions and supporting workflows are now implemented locally; see [implementation, verification and release status](math-missions-verification/README.md). The designs below preserve the original audit rationale. These are not validated interventions. Alignment uses the repository's authored math standards and teaching guides, not a live review of student records. Arcade performance remains formative and does not automatically award teacher-rated competency mastery.

## Audit findings

Reviewed all eight game sources, shared cabinet messaging, the math spine, authored teaching guides, and existing verification scripts. Ran the existing logic suite: 1,200 generated questions from each of the five falling-question games, plus Fusion equivalence/doubling, 200 deterministic Mathle puzzles, and Expression Crush arithmetic checks. All passed their current assertions. Those tests do not establish complete standards coverage or effective remediation.

Targeted Chrome checks at desktop width 1366 and mobile width 390 confirmed that **the second question is invisible in untimed practice in all five falling-question games**. A test-only state accessor selected correct answers; shipped rendering and controls were unchanged. The question had zero visible vertical intersection with the board in all ten cases. The first question can appear, masking the defect. Evidence: [measurements](math-remediation-evidence/results.json), [desktop screenshot](math-remediation-evidence/untimed-1366.png), and [mobile screenshot](math-remediation-evidence/untimed-390.png).

| Priority | Finding | Proposed improvement |
| --- | --- | --- |
| P1 | Untimed practice sets each new card above the board, while disabling the movement that would bring it into view. | Give practice a stable, visible problem panel. Test visibility after multiple completed questions, including long prompts and graphs. |
| P1 | Scale Storm's cubic questions reuse hints telling students to square the factor. For `V ∝ r³`, doubling radius requires ×8, not ×4. | Generate explanations from the actual exponent and direction of change. Add semantic tests for each distractor's feedback. |
| P1 | Expression Crush's playable tiles are `div` elements operated by `pointerdown`, without a keyboard selection path. | Provide focusable tile controls, arrow-key navigation, Enter selection, clear expression order, and undo. |
| P2 | The five falling-question games increase difficulty every six completed problems regardless of support needed or errors. | In remediation, select the next task from demonstrated skill and misconception evidence; retain user control over challenge level. |
| P2 | Incorrect feedback disappears after 1.9 seconds; completed answers advance after 330 ms. Errors also drop the card and reset streaks. | Keep the explanation until the student continues. Show the relevant representation and provide a related retry. Use pressure only in an explicitly chosen challenge mode. |
| P2 | Shared ranked-start messaging has no timeout or recovery when a parent response never arrives. Save retries do exist. | Add a bounded start failure state, safe retry, and deliberate practice option, with handling for late responses. Source finding; transport loss was not reproduced against production. |
| P2 | Mathle uses the same daily target for all doors, but applies different difficulty multipliers to that target. Every new run starts the daily again. | Give the common daily a common scoring rule and separate repeat practice from the first ranked daily attempt. Verify server behavior before changing eligibility rules. |
| P2 | Fusion's accuracy is based on occasional quizzes; a short run can have its XP eligibility decided by one final quiz. | Show the evidence sample size, distinguish puzzle performance from skill checks, and avoid presenting one response as a reliable fluency measure. |
| P2 | Shared game telemetry contains aggregate solved/right/wrong counts, with no competency, misconception, or assistance information. | Record meaningful learning evidence separately from arcade score. |

### What each existing game contributes

| Game | Useful foundation | Remediation gap / improvement |
| --- | --- | --- |
| Inverse Blitz | Repeated inverse operations and physics equation contexts. | Make equality visible, diagnose the first invalid operation, and distinguish symbolic rearrangement from substitution. |
| Magnitude | Comparisons, equivalent fractions/decimals/percentages, scientific-notation magnitude. | Add place-value construction and number-line reasoning; selecting the largest value does not explain why it is larger. |
| Scale Storm | Direct, inverse, square, cube, and inverse-square relationships. | Repair cubic feedback; let students build and compare quantities before predicting a factor. |
| Powers of Ten | Scientific notation, familiar conversions, estimation, and significant-figure recognition. | The fixed conversion, Fermi, and sig-fig banks offer limited variation. Students need to construct unit cancellation, defend estimates, and report appropriate precision. |
| Slope Sniper | Slope/area interpretations, units, component recognition, relationship recognition. | Add signed area, student-selected axes and fits, signed vector components, and vector addition. Small SVG labels also need a mobile readability pass. |
| Equivalence Fusion | Engaging repeated recognition of equivalent representations. | Show why a merge is valid; add targeted equivalence checks and separate their evidence from spatial puzzle success. |
| Expression Crush | Arithmetic expression construction and order of operations. | Add keyboard access and a visible evaluation trace that diagnoses grouping and precedence errors. |
| Daily Mathle | Equation validity and deduction; invalid equations do not consume a guess. | Keep as enrichment. Failed deduction is not the same as a mathematical misconception; normalize daily scoring. |

## Proposed collection: seven games, thirteen competencies

Use a mature workshop/mission aesthetic, shared navigation, and genuinely different game boards. Every card should show the actual core interaction, the skill in plain language, estimated session length, available XP, and a clearly labeled challenge leaderboard. Never expose individual remediation needs on public leaderboards.

### 1. Numberline Navigator — NS1, NS2

**Core play:** Land a rover at a target value by zooming a number line and composing quantities. A single location can have several equivalent labels. Later rounds include signed values and unfamiliar intervals as extensions.

**Example:** Place `0.45`, `0.5`, and `3/4`; attach percentage labels. A student who places `0.45` beyond `0.5` because “45 is bigger than 5” sees tenths subdivide into hundredths: `0.50 = 50/100`, `0.45 = 45/100`.

**Remediation:** Start with a short comparison probe; offer place-value columns or fraction strips based on the response. Then remove labels and support in stages. Confirm a pattern with a second probe before assigning a misconception label.

**Independent check:** Position an unfamiliar equivalent value on a different scale and explain a comparison. Record placement accuracy and equivalence accuracy separately.

**Card image:** The playable number line with a rover at `0.75` and equivalent `3/4` and `75%` labels.

### 2. Ratio Reactor — PR1, PR2

**Core play:** Adjust a reactor's input to reach a target output. Direct ratios use linked quantities or a double number line. Square/cube scaling changes a visible area/volume; inverse-square changes spreading over distance.

**Example:** A recipe uses 3 units of A for 5 of B. Make 20 of B while preserving the ratio. Later, predict the effect of doubling a radius when volume is proportional to its cube.

**Remediation:** Separate additive reasoning, inverted scale factors, and wrong relationship selection. Students first choose the relationship, then predict, then run the model. Feedback must be mathematically tied to that relationship; cubes must show three factors.

**Independent check:** Solve an unfamiliar context without the animated model, including halving and inverse cases. Show an explanation or a valid proportional setup.

**Card image:** Linked input/output chambers with a visible ratio and a target gauge.

### 3. Unit Courier — QE1, QE2; supporting SM2

**Core play:** Deliver a physical quantity to the required unit by assembling conversion factors as bridges. Units visibly cancel; the quantity's value is preserved at every step. A scientific-notation bay handles very large and small quantities.

**Example:** Route `72 km/h` to `m/s` using `1000 m / 1 km` and `1 h / 3600 s`, yielding `20 m/s`. A reversed factor leaves the wrong units visible, prompting repair.

**Remediation:** Diagnose factor orientation, powers-of-ten mistakes, uncancelled units, and failure to square conversion factors. Teach one correction at a time. Accept different valid conversion paths.

**Independent check:** Enter a complete conversion in a fresh context without suggested factors; include a squared-unit challenge after the prerequisite is secure.

**Card image:** A quantity traveling through a short conversion chain with cancelled units.

### 4. Precision Observatory — QE3, QE4

**Core play:** Plan an estimate, take measurements, and publish a defensible result. The game rewards justified assumptions and appropriate precision. Estimation and measurement are distinct missions within the same observatory.

**Example:** Estimate how many people fit in a hall from an assumed usable area and area per person. Then measure an object with an instrument and report a calculated result using the information the measurement supports.

**Remediation:** Distinguish an unreasonable assumption from a calculation error. Let students adjust an assumption and observe the result. For precision, highlight the limiting measurement and carry extra digits until final rounding.

**Independent check:** Give a new estimate with assumptions and a plausible range; complete a new measurement/calculation with justified rounding. Use a rubric and teacher review for defensible reasoning, rather than demanding one exact Fermi answer.

**Card image:** The actual measurement instrument beside an estimate range and a reporting panel.

### 5. Balance Bay — SM1, SM2

**Core play:** Repair a machine by isolating its requested variable. Every action affects both sides of a live equation. Students then plug in values with units and test whether the repaired machine behaves as predicted.

**Example:** Rearrange `v = u + at` for `t`, then evaluate with `v = 14 m/s`, `u = 2 m/s`, and `a = 3 m/s²`. The symbolic result is `t = (v − u)/a`; the measured result is `4 s`.

**Remediation:** Diagnose undoing the wrong operation, changing only one side, dividing only part of an expression, and losing grouping during substitution. Animate the chosen operation and its consequence. Accept alternative valid solution paths.

**Independent check:** Solve a new equation for a different variable before substituting. Track rearrangement and substitution as separate competencies.

**Card image:** A working two-sided equation with operation controls and a machine target.

### 6. Motion Mapper — GV1, GV2

**Core play:** Construct a graph to guide a robot through a motion mission, then analyze sensor data from its journey. Students manipulate segments, interpret slope and signed area, select transformed axes, and inspect a fit.

**Example:** Build a velocity-time graph that moves the robot forward and then back to its starting point. Explain why equal positive and negative areas give zero displacement despite nonzero distance.

**Remediation:** Diagnose slope-versus-height, area-versus-slope, units, signed-area errors, and treating every straight line as proportional. Link a selected graph segment to the corresponding motion, then fade the animation.

**Independent check:** Interpret an unfamiliar graph and select axes for a fresh dataset; state the fitted rate and its units. Include nonzero intercepts and imperfect data, not only lines through the origin.

**Card image:** A robot route paired with its editable graph and shaded signed area.

### 7. Vector Rescue — GV3

**Core play:** Set a rescue drone's thrust against wind/current to reach a target. Build components, add vectors, and reconstruct magnitude and direction. Show both component and head-to-tail views.

**Example:** Combine `(6, 8) m/s` with `(-2, 0) m/s`, giving `(4, 8) m/s`. The resultant is about `8.94 m/s` at `63.4°` above positive x.

**Remediation:** Diagnose the angle's reference axis, sine/cosine choice, missing signs, and adding magnitudes instead of components. Highlight the relevant triangle and axis directions, then remove that support.

**Independent check:** Use a new quadrant, a different angle reference, and two vectors. Require component signs and a physically sensible direction.

**Card image:** The actual drone, wind arrow, component triangle, and resultant flight path.

## A complete remediation session

Target roughly 5–8 minutes, with no forced countdown:

1. **Locate the need:** Two or three short probes about one competency. A correct answer with an incorrect explanation should trigger another probe, not a confident diagnosis.
2. **Teach a strategy:** A brief worked example linked to the observed error, with a visual model and an explanation of why the operation works.
3. **Try with support:** Complete a similar task with optional hints, worked steps, and undo. Help remains available without losing hearts or XP already earned.
4. **Fade support:** A new task removes one aid; a further task removes the remaining aids if the student is ready. Persistent difficulty returns to instruction rather than increasing speed.
5. **Check transfer:** An unassisted task changes the numbers and context. If help is requested, retain the help and mark the evidence as assisted.
6. **Return later:** Offer a fresh, short retrieval check in a later lesson/assignment. The teacher sees retention evidence separately from same-session success.

For Balance Bay, a student who divides only the `at` term first sees the entire left and right sides grouped. They practice `(v − u)/a`, then rearrange `F = ma` for `a`, then a structurally different expression such as `E = E₀ + Pt` for `t`. A delayed check asks for a new variable in a fresh context. This gives much more useful evidence than a final arcade score alone.

The design draws on explicit instruction, representations, mathematical language, and number-line work described in the [IES mathematics intervention guide](https://ies.ed.gov/ncee/wwc/practiceguide/26). That guide concerns elementary intervention; adapting these principles to foundational skills in this physics setting is a design inference, not proof that these proposed games improve outcomes.

## Product integration and learning evidence

- **Entry points:** Math arcade browsing, a competency's “Practice this skill” action, lesson blocks, and teacher assignments. A teacher can assign a competency or a specific mission. Vocabulary remains outside the arcade and available through lessons/assignments.
- **Modes:** “Build fluency” offers guided practice; “Challenge” offers independent performance and comparable rankings. Make practice a first-class choice on the card. A challenge must use a consistent question distribution/difficulty rule within its leaderboard.
- **Rewards:** Show the applicable XP amount/cap before entry. Propose a bounded completion reward for a meaningful guided session, with support available throughout. Keep within the existing economy and deduplicate completion rewards. This would require an explicit payout implementation; present untimed practice does not already provide it.
- **Public versus personal progress:** Keep challenge leaderboards prominent and clearly labeled. Keep misconception details, assistance history, and teacher recommendations private. The guided path emphasizes personal progress.
- **Evidence per task:** Competency, subskill, problem version/seed, first response, subsequent response, hint/worked-example use, independent/assisted status, observed error pattern, representation, and transfer outcome. Time can describe the session, but should not by itself determine remediation need.
- **Teacher view:** “Independent on 4 of 5 new substitution checks; still drops parentheses with negative inputs” is useful. “87% accurate in math” is too broad. Always show sample size and distinguish same-session practice from delayed retention.
- **Mastery boundary:** Follow the existing teaching guides' formative-only contract. Practice proposes evidence for review; it does not silently change teacher-rated mastery.
- **Accessibility:** Every manipulation also has keyboard and button/input controls. Use readable mathematical text, text alternatives for graphs, labeled axes, feedback beyond color, reduced-motion behavior, persistent explanations, and layouts that remain usable on a small screen.

## Build order and acceptance criteria

**First repair the current blockers:** untimed prompt visibility, cubic feedback, and Expression Crush keyboard access. Add coverage for those specific failures.

**Pilot Balance Bay, Numberline Navigator, and Unit Courier.** Together these target equation manipulation, number sense, scientific notation, and units—foundations repeatedly needed in physics. Select the first pilot using actual class needs rather than assuming all students share the same deficit. Reuse authored guides in `src/lib/math-teaching-guides.ts` and the existing math-spine lesson structure.

Build one reusable session controller for probes, hints, assisted practice, independent checks, and evidence reporting, with separate game mechanics. Do not copy the falling-question engine seven more times. Start with hand-reviewed, parameterized problem families and explicit error rules; no live AI-generated scoring is necessary.

Then add Ratio Reactor, Motion Mapper, Vector Rescue, and Precision Observatory. Retain existing games as polished challenge options where they provide useful practice.

A pilot is ready when:

- Every claimed competency has an observable independent task, not merely a themed question.
- Common errors lead to correct, persistent explanations and an appropriate retry.
- Generated answers, accepted equivalent forms, units, and all distractor explanations pass semantic checks.
- Keyboard-only and small-screen users can complete the full session, including help and exit.
- Pausing/resuming, saving, and failed-network recovery preserve the session without duplicate XP.
- Assisted success is distinguishable from independent transfer and delayed retention.
- A teacher reviews representative student sessions and compares independent checks before and after practice; engagement and arcade scores alone are not treated as evidence of learning.

## Source locations

- Standards and formative teaching: `src/lib/math-spine.ts`, `src/lib/math-teaching-guides.ts`, `src/lib/math-spine-lessons.ts`.
- Untimed spawn/movement example: `public/games/numbersense-magnitude.html`, functions `spawn`, `tick`; the same pattern occurs in the other four falling-question games.
- Cubic hints: `public/games/proportion-scale-storm.html`, function `genPower`.
- Tile access: `public/games/logic-expression-crush.html`, function `tileNode`.
- Daily scoring: `public/games/daily-mathle.html`, daily target initialization and `tier`/`gain` calculation.
- Quiz-based accuracy: `public/games/equivalence-fusion.html`, `runAudit` and final audit behavior.
- Start/retry and aggregate evidence: `public/games/math-cabinet.js`.
- Existing sampled checks: `scripts/test-math-arcade-logic.cjs`.
