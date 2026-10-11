# Student physics learning: first release

The student library now starts with physics topics and learning targets. Videos and worked examples provide instruction; students produce evidence through explanations, problems, investigations, and asteroid applications.

## September 27 follow-up: video-led instruction

The deployed library now includes eight verified channel videos in a suggested concept sequence, optional target browsing, and templates for creating canonical lesson drafts from the newer videos. The three original published lessons remain unchanged. See [the current video-to-target map and validation notes](VIDEO_TARGET_MAP_2026-09-27.md) for scope, remaining recording needs, and deployment status.

The sections below document the original three-lesson release.

## Open the new experience
- Learning library: https://antocciphysics.com/lessons
- Position & displacement pilot: https://antocciphysics.com/lessons/position-and-displacement
- Foundations: https://antocciphysics.com/lessons/units-quantities-and-precision
- Kinematics introduction: https://antocciphysics.com/lessons/kinematics-the-language-of-motion
- Teacher target map: https://antocciphysics.com/admin/lessons/roadmap
- Existing mastery and feedback: https://antocciphysics.com/dashboard/growth

Sign in with your existing school account. Teacher previews do not create student evidence.

## What is ready
Three complete lessons use the three published YouTube videos: units/quantities/precision, the kinematics introduction, and position/displacement. Each has an explanation, formative checks, and target-linked student responses. Position/displacement also has an interactive number line and a fictional asteroid transfer problem.

The reusable student problem workspace follows Problem → Model → Plan → Work → Answer. It includes a persistent reference diagram on larger screens, optional model sketches, your school-account avatar, and a stage-specific Hint button. Students may move between stages and review all their work. The same format is applied to existing physics problem blocks while retaining their IDs, target links, original prompts, and saved responses. It supports conceptual reasoning as well as numerical work.

The library groups the current physics curriculum into Learn, Investigate, and Asteroid missions. A replaced lesson remains in Earlier lessons so students can return to saved work. Remaining lessons retain their current instruction until a replacement is ready. This first release does not claim that the entire curriculum has been rewritten.

All 148 existing physics targets plus three new introductory targets appear in the 151-target launch map. The map identifies current lesson coverage, Hewitt support, and video needs. A mapped target is not a claim that a learner has mastered it.

## How mastery stays central
Students see the latest teacher rating for the lesson's targets. Not yet rated is distinct from a low rating. A saved response is evidence; video playback, activity completion, and hints do not assign or change mastery.

Checks give feedback on an attempt. An incorrect formative answer can be saved and does not block the next instructional section. Students submit their saved work through the existing review workflow. Submission snapshots retain their reasoning, sketches, and hint history. The teacher reviews that evidence and chooses the rating using the existing system.

Hint use provides context, not an automatic penalty. A useful follow-up is a fresh, less supported problem when independent application needs to be demonstrated. Language support does not lower the physics standard.

## A sustainable lesson pattern
1. **Orient:** a small set of learning targets and a meaningful question.
2. **Learn:** one short concept video, a readable summary, and targeted Hewitt support.
3. **Check:** one misconception-focused formative prompt with specific feedback.
4. **See it worked:** a worked example using Model, Plan, Work, and Answer.
5. **Try and explain:** a different problem plus a short conceptual explanation.
6. **Investigate when useful:** a lab or simulation that tests a prediction.
7. **Transfer when appropriate:** an asteroid task requiring the same physics in a new context.
8. **Review and revisit:** teacher feedback, target rating, and a next attempt.

Use only the steps that serve the target. Do not add a simulation or asteroid story to every lesson merely to fill a slot. Students who already understand an idea should be able to move directly to the evidence task.

## Next recording priorities
Begin with the next motion targets already in the map:
- Position–time and velocity–time graphs: connect shape, slope, and motion.
- Predicting position from velocity: one numerical worked example.
- Acceleration: include changing direction at constant speed.
- Choosing a constant-acceleration model: explain the assumptions before calculating.
- Vector addition and components: pair a visual model with a worked problem.

For each topic, keep a short concept video separate from the worked problem. Attach both to the same target where appropriate. Existing instruction provides a fallback until each video is published; missing videos are not presented as ready.

## Adding the next lesson
Use the existing lesson editor and canonical content blocks. Add an Instruction video block with its YouTube ID and a readable summary. Use the problem-workspace format for a problem, assign every evidence block to the intended target, and author short hints for Model, Plan, Work, and Answer. Add an appropriate reference visual and check it at phone and desktop widths.

Keep one student lesson distinct from the classroom lesson plan. Release it through the existing class access controls. Do not change a learning target simply because a video or a lesson title changes.

The target map is a dated launch snapshot. Update it as targets or lesson assignments change; library resource badges read the current lesson blocks.

## Validation and scope
The release was checked with the real rendering components and synthetic student data on desktop and phone. The save, draft, submission, access-control, and teacher-review paths were exercised through automated tests. Full TypeScript checking, the style audit, and the hosted production build must pass before publication.

No live student response was created for testing. The launch adds three lessons and three targets and copies the current position lesson's release windows to those starters for the same four physics classes. Original lessons, targets, submissions, and teacher mastery records are preserved.
