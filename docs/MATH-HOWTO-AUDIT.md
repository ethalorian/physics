# Math how-to audit and repairs — 2026-09-07

Scope: all 13 active competencies, the daily warm-up help panel, extra practice, editable teacher summaries, and supporting diagrams. The connected bank had null mini_lesson overrides for all 13 skills, so students were receiving repository defaults. No student records were changed.

## Findings

1. Three short rule lists supplied little teacher modeling: no consistently explained operations, outcome checks, or response-specific guided practice.
2. Mastery selected a single tier; a student could not choose a more explicit or basic explanation.
3. Velocity–time area was called distance. Correct distinction: signed displacement; add absolute pieces for distance.
4. Significant figures were generalized to every operation. Separate product/quotient significant-figure rules from sum/difference decimal-place rules; distinguish exact quantities and uncertainty.
5. Components used x = V cos(theta) without stating the angle reference. Add axes, signs, calculator mode, quadrant and direction checks.
6. Scientific notation and estimation shortcuts omitted operation conditions; inverse-square statements omitted model assumptions. Rearrangement omitted denominator and square-root restrictions.
7. Some diagrams lacked axis/context labels. The estimation marker was inconsistent with its logarithmic scale.
8. Empty or malformed custom tiers could hide help or fail rendering. Extra practice lacked the same teaching resources.

## Implemented

- 26 worked examples with an action and reason for each step, plus a result check; two selectable examples per skill.
- Concept explanations, vocabulary, three progressive hints, a diagnosed common mistake, and a return-to-task prompt for each skill.
- 13 low-stakes multiple-choice practice checks with feedback for every option; unlimited retry, no server submission, mastery or points.
- All support is available to everyone. The mastery value only affects whether the panel starts open; no help level is locked.
- Teacher-authored summaries remain accessible beside the common worked examples; invalid overrides fall back to defaults.
- Same tutor in daily work, post-submission help and extra practice; no assessed answer is automatically filled.
- Updated diagrams and editor guidance; malformed lesson updates are rejected.

## Pedagogical basis and limits

The design models an explicit worked example, explains the reasoning, offers guided practice with informative feedback, then prompts independent application. These choices follow principles in [AERO explicit instruction](https://www.edresearch.edu.au/guides-resources/practice-guides/explicit-instruction-practice-guide-full-publication) and [IES systematic mathematics instruction](https://ies.ed.gov/ncee/wwc/practiceguide/26). The latter is elementary intervention evidence, so this is an adaptation of instructional principles, not evidence that this high-school interface itself improves achievement. Physics distinctions were checked against [OpenStax velocity–time graphs](https://openstax.org/books/physics/pages/2-4-velocity-vs-time-graphs).

The tutor is an authored teaching aid, not a claim of demonstrated pedagogical effectiveness. Teacher observation remains the mastery authority (M-1); language support is not a mathematical dependence penalty (SEI-9). Students still need teacher help when the authored explanations do not resolve their difficulty. Worked examples teach skill families and are not generated from the assessed answer key.

Validation: content-coverage and arithmetic regressions; malformed-override cases; TypeScript/lint; interactive browser checks of example progression, hints and formative feedback.
