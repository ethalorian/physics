# Native teaching tools: shared implementation contract, version 1

The curriculum remains authored by the teacher. This specification standardizes how an assignable lesson teaches: a visual model, meaningful interaction, useful evidence and native classroom controls.

## One lesson, four surfaces

The BlockDocument remains the source of truth. A block can advertise a `teachingTool` capability with a registered kind, explicit version and authored configuration. It does not contain executable code or an external application URL.

The same tool renderer serves the student lesson, desktop presenter, iPad Command Center and projector. Tool capabilities are course-independent. A measurement tool can serve Trades, physics or engineering without copying the presentation or state logic.

`workshop` metadata supplies the surrounding lesson design: title, short action, expected time, steps, catch-up help and the purpose of its response. Other courses can use the same reader face with their own curriculum and registered tools.

## Required tool contract

Each registry entry must provide:

- A supported version and validated configuration.
- A deterministic default state and bounded, validated commands.
- A visual renderer that works without teacher controls on the projector.
- Accessible teacher controls usable by touch and keyboard, at least 44 pixels.
- A student practice mode that owns separate local state.
- A written fallback and an accessible explanation of its visual.
- A clear relationship to a capture block, or an explicit designation as practice only.

The first kind is `measurement-bench`, version 1. Its variants are measuring, marking and checking. Its state is `setup`, a mark in sixteenths from 0 to 160, and explanation visibility. Modes are `demonstrate` and `practice`. New kinds must register their own validators and renderers; they do not add new projector routes or separate iPad tools.

## State ownership

Teacher demonstration state is stored by block ID on the existing `present_sessions` row. The same session, class ownership checks, command revision and notification transport used for slides also govern tools.

A teacher command carries the expected command revision. A stale command receives a conflict instead of silently overwriting a newer iPad or desktop action. The control surface displays confirmed state; failures remain visible and retryable. Slider dragging previews locally and commits on release, rather than flooding the server with pointer movements.

The projector reads the confirmed session and never writes student evidence. A teacher can select a tool, display it, change its setup, reveal an explanation, reset it, or open student practice directly from the iPad or desktop panel.

Students in Follow mode see the demonstration. They can try on their own and rejoin. Their practice state is retained separately while they look at the shared state. Opening practice does not replace a draft response. Returning the class to demonstration does not erase practice or evidence. Disconnected clients keep the last confirmed state; authenticated polling is the recovery path.

## Evidence is a separate action

Only existing capture blocks write through `useBlockResponses`. Moving a ruler, opening a model or resetting the board is not completion, XP or proficiency.

Every required response must answer three authoring questions: what does the learner demonstrate; what will the teacher learn; what action can follow? If no useful answer exists, make the interaction practice rather than a required field.

Use an existing response type whenever possible. A materially changed task receives a new block ID, so historical work does not acquire a different meaning. Submitted snapshots remain historical. Mastery is always teacher-rated; automatically checked choices remain formative signals.

## Assignment and library behavior

These remain ordinary assignable lessons, governed by the existing course, track and lesson-window authorization. Adding a teaching tool must not bypass class ownership, enrollments or access windows. A lesson preview, its projector and the assigned student lesson must render the same block version. No separately assigned slide pack or tool assignment is required.

A reusable lesson should pair each major teaching moment with a short action, a visual, practice, optional support and at most the evidence actually needed. Library entries should describe those capabilities rather than merely listing block types. Before extending this to another course, audit the inputs and author tool configurations for that curriculum; do not mass-rewrite learning targets or replace lessons with generic templates.

## Release checks

Test an iPad command reaching the projector, reopening the same session, stale command rejection, an unauthorized teacher, an inactive/nonmember student, personal practice followed by rejoining, an unsuccessful evidence save and retry, and preservation of a saved response across tool changes. Verify the actual projector components, not only the normal BlockRenderer. Check 1366×768, iPad and phone layouts, keyboard operation and reduced motion.

The Trades opening lesson is the initial implementation. Other courses are intentionally unchanged until their teaching moments are authored and reviewed against this contract.

## Unit 1 extension: case-board version 1

The second registered capability is case-board: one to six authored frames with a title, accessible visual, short prompt, optional explanation and optional reveal. Commands can change only a validated frame index and reveal visibility; they cannot inject arbitrary state or lesson content. The same native controls and session transport serve both capabilities.

All 15 Trades Unit 1 lessons now use the workshop reader. Capture blocks close teaching moments using the existing pagination algorithm. The current target, explicit steps, optional catch-up support and a useful response accompany each board. Record sheets retain their existing row data contract; drawing revisions can explicitly seed from an earlier response while saving under a separate block ID. Other courses require their own authored content before adopting this experience.
