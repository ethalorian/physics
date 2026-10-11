# Video instruction by concept and target — 2026-09-27

Status: deployed to [Antocci Physics](https://www.antocciphysics.com) on September 27, 2026. Release `dpl_H1QGhEqv35a7f9Y2bVpmsXSHj2Z7`; see [the release record](../VIDEO_INSTRUCTION_RELEASE_2026-09-27.md). No production lessons, class access, student responses, or mastery records were changed.

The teacher and student physics libraries start with **Video instruction → Suggested sequence**. **Browse by target** provides the alternative route. Classroom lessons, readings, investigations, and asteroid applications remain available. Teacher library, workspace, and teaching-picker titles omit the historical “Day N” prefix; stored titles, IDs, saved work, and explicit teaching-plan references remain intact.

## Reviewed sequence

The public [Antocci Physics channel](https://www.youtube.com/@antocciphysics/videos) showed eight published videos. Channel metadata and descriptions/chapters were inspected; this was not a complete playback/transcript audit. The first three also match the existing authored and published lesson documents.

| Sequence | Video | Direct target connections | Preparation connections / remaining scope |
| --- | --- | --- | --- |
| 1 | [Units, physical quantities & significant figures](https://www.youtube.com/watch?v=Z1qFlfqlS_E) | `foundations.units-quantities`; `foundations.measurement-precision` | Measurement and calculation practice still needed. |
| 2 | [What is kinematics?](https://www.youtube.com/watch?v=vf7X7mmJfsE) | `u1.kinematics-language` | `u1.acceleration-rate-of-change`: conceptual introduction, not acceleration calculation from data. |
| 3 | [1D position & displacement](https://www.youtube.com/watch?v=u0V8uJ5KTvo) | `u1.vocab-position-distance-displacement` | Reference point, sign, distance versus displacement. |
| 4 | [Position & displacement in 2D and 3D](https://www.youtube.com/watch?v=djR8sAAi740) | `u1.vocab-position-distance-displacement` | `u1.vectors-tip-to-tail`: component notation/subtraction; addition and trigonometry remain. |
| 5 | [Scalars, vectors & position](https://www.youtube.com/watch?v=FshpPgPAeWM) | `u1.vocab-position-distance-displacement` | `u1.vectors-tip-to-tail`: vector anatomy, components and magnitude; addition and angle-based decomposition remain. |
| 6 | [Position vectors in 1D](https://www.youtube.com/watch?v=maoz-9mGWyk) | `u1.vocab-position-distance-displacement` | Sign supplies direction along the chosen horizontal or vertical axis. |
| 7 | [Length, time & rates of change](https://www.youtube.com/watch?v=YViTBR_aygk) | `u1.kinematics-language`; `foundations.units-quantities` | `u1.predict-position-uncertainty`: rates are a prerequisite; future prediction and uncertainty remain. |
| 8 | [Velocity vs. speed: average and instantaneous](https://www.youtube.com/watch?v=hj8usnvYrRo) | `u1.kinematics-language`; `u1.vocab-position-distance-displacement` | `u1.capture-pt-graph`: secants/tangents prepare students for the Vernier lab. `u1.read-vt-graph-components`: velocity vocabulary; v–t interpretation and 2D decomposition remain. |

These are links to specific parts of targets. A video in a lesson no longer implies that every target attached to that lesson has video instruction. The target map distinguishes direct instruction, preparation, and missing instruction; viewing/completing videos never counts as mastery.

**Video 9 — Setting a graph scale** is listed for teachers as in preparation, based on the supplied Claude design. No published YouTube URL was verified, so it has no playable link and does not count toward available instruction. Its initial connection is graph construction before the graphing/interpretation targets above.

## Teacher and student journey

1. Teacher: Lessons → Video instruction. Choose a video or browse its targets.
2. Existing exact video lessons have a direct **Open video lesson** link. Other lessons are clearly labeled **Related practice**.
3. For a new video, **Create a lesson draft from this video** prefills an ordinary BlockDocument: Watch & understand → Check your thinking → Apply & explain. It includes a choice question with misconception feedback, a reflection, target references, and language supports. Creating a draft uses the existing protected API and does not publish or open class access.
4. Use the normal lesson workspace to review content, preview as a student, publish, open class access, teach, and review evidence. Drafts share the existing reader, projector and evidence mechanisms; there is no second assignment model.
5. Student: the suggested sequence includes videos connected to currently open, server-filtered lessons. Links lead only to those open lessons. Closed or scheduled work does not become accessible through video browsing. The student's responses and teacher feedback remain the evidence of learning.

The first three videos already have published lesson content. The five newer videos have reviewed catalogue mappings and draft templates; their new lesson records have not been created or assigned in production.

## Implementation and validation

- Source catalogue: `src/data/physics-videos.ts`; reusable mapping/access helpers: `src/lib/video-instruction.ts`.
- Draft authoring: `src/lib/video-lesson-authoring.ts`, with questions and answer keys in `src/data/physics-video-prompts.ts`; integrated into NewLessonForm. Shared student catalogue imports exclude the authoring prompts and answer keys, verified by a bundle dependency check.
- Shared video library is used by both teacher and student libraries. Target roadmap uses explicit reviewed links rather than inferring coverage from any video in a lesson.
- Corrected the renderer's `practice` evidence label from “Individual exit” to “Practice check.”
- 29 focused tests passed: eight draft validations, real target references, open-access requirements, exact-video ordering, conservative target scopes, stable block IDs, server-owned correctness, answer-key filtering, and existing notebook/workspace regressions.
- Existing physics-learning regression script passed, including all 151 mapped targets; scoped ESLint and style audit passed.
- Full TypeScript check passed with an 8 GB Node heap. The first attempt hit Node's default 2 GB heap limit.
- Browser fixture used actual components and synthetic records. Verified default video sequence, target filtering, canonical draft creation, student preview, incorrect-answer feedback, progression to reflection, next-video navigation, and closed/restricted access. iPad portrait width 820 px had no horizontal overflow.
- Verified the correct YouTube embed URLs and external links. Embedded third-party playback remained blank in the in-app localhost browser, so actual streaming playback was not confirmed there. The existing InstructionVideo player was not changed.
- Rules preserved: A-1/A-2/A-3/A-4/A-5/A-6, B-2/B-5, E-3, M-1, and SEI-2/SEI-5. No migration or production writes required for this interface release.
- Hosted production build, 11 staged route checks, and the same 11 live route checks passed. Uploaded source hashes matched the isolated release; live artwork, original notebook, and brand assets matched their source hashes. The production log query returned no error/fatal entries for this deployment at verification time. Full signed-in live UI verification was unavailable because the browser had no authenticated session.
