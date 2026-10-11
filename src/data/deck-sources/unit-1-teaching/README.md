# Unit 1 Teaching Edition source

These authored presentation sources come from the comprehensive Unit 1 Teaching Edition in the Physics Curriculum Planning workspace. They contain 22 daily decks, 421 slides, and 114 practice prompts with solutions. Days 11/12 and 21/22 are distinct decks.

Rebuild from the repository root:

```sh
node scripts/build-unit1-teaching-decks.mjs
```

The October 1 visual edition preserves all 421 slides and their question/solution order. `visuals.mjs` attaches 100 authored data graphics and teaching sequences, `visuals.css` defines their layouts, and `visuals.js` runs finite, replayable animations. The illustrations and generation prompts are in `art/`. Charts and diagrams remain data-driven; assessment decks add only orientation and process supports. Motion simulations use the same clock for the cart, graph, and values. Reduced-motion mode and printing show the completed graphics. Changing slides or hiding the page stops animation.

`scripts/test-unit1-visuals.cjs` verifies every slide's layout and graphic labels, missing resources, pause/reset/scrubbing, reduced motion, linked cart values, and session-controlled navigation. Run against a local public-file server using `DECK_BASE_URL`.

The build writes `public/decks/unit-1-teaching/` and `src/data/unit1-teaching-decks.json`. Edit these source files, then rebuild; do not hand-edit the published HTML. Fonts are served locally with their redistribution licenses. The standalone offline package and teacher-only transfer key stay in the planning workspace.

`runtime.js` exposes the existing `deck-stage` contract: `index`, `length`, `goTo`, `next`, `prev`, `slidechange`, and `classroomnavigate`. When a presentation session controls the deck, local navigation requests go through the live session and the deck toolbar is hidden. Speaker notes remain in metadata for Teach; they are not rendered on the projector.

The lesson's existing BlockDocument remains the source for student content, polls, activities, evidence, and language supports. The presentation exercises are notebook practice. The new decks do not reuse the old slide-index maps. Only explicitly authored section anchors move student follow mode; the learning-target slide points to the lesson's existing `b1` target. Other presentation content can be taught with the matching lesson content selected in Teach.
