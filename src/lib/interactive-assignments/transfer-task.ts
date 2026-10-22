import { demand } from '@/lib/assessment-demand'
import type { LessonAssignment, LessonQuestion } from './catalog'

const vectors = 'u1.vectors-tip-to-tail'
const prediction = 'u1.predict-position-uncertainty'
const question = (id: string, prompt: string, explanation: string, targets: string[]): LessonQuestion => ({
  id, part: 1, prompt, explanation, targets, independent: true,
  hint: 'Use the data and references allowed in your transfer packet.',
  demand: demand('Analyze', 3, 'Choose a model, connect representations and justify a prediction and its limits.'),
})

/** The existing two-day, in-class transfer task, recorded through the shared work flow. */
export const TRANSFER_ASSIGNMENTS: LessonAssignment[] = [
  {
    slug: 'day-21-transfer-plan', day: 21, unit: 'unit-1', title: 'Day 21 · Transfer Task: Plan and Begin',
    targets: [vectors, prediction], minutes: 50,
    targetNote: 'Use the student’s analysis and the class transfer packet as evidence. Score only the targets demonstrated; beginning or submitting work is not mastery. Honors: also require assumptions and the conditions where they fail.',
    toolHref: '/decks/unit-1/Day%2021-22%20-%20Transfer%20Task.dc.html',
    sections: [{ title: 'Plan and begin', stop: 'Independent transfer task · Day 1',
      learn: 'Use your teacher’s Unit 1 transfer packet and its data. Work in class. Your Vector Recipe Card and calculator are allowed. Ask for help with the directions only. Keep your paper work for Day 22.',
      questions: [
        question('transfer-21-a', 'Choose axes for the asteroid’s motion. Draw or describe the velocity components. Find each component and show your units. Explain your signs.', 'Uses the supplied packet data, a stated axis convention, correct components and units, with signs explained. Accept an equivalent consistent coordinate system.', [vectors]),
        question('transfer-21-b', 'Use those components to predict the asteroid’s position at the time in the packet. Show your work. State the motion model you used and one reason it may not be exact.', 'Links initial position, velocity components and elapsed time. Distinguishes a model-based prediction from a certain collision forecast; carries earlier arithmetic forward fairly.', [prediction]),
      ],
    }], questions: [],
  },
  {
    slug: 'day-22-transfer-defend', day: 22, unit: 'unit-1', title: 'Day 22 · Transfer Task: Complete, Defend and Submit',
    targets: [prediction], minutes: 50,
    targetNote: 'Review the full packet and oral defense. Rate the prediction/uncertainty target from this evidence; keep the transfer rubric’s separate dimensions in the teacher’s assessment. Honors: distinguish model error from measurement uncertainty and explain what later physics must add.',
    toolHref: '/decks/unit-1/Day%2021-22%20-%20Transfer%20Task.dc.html',
    sections: [{ title: 'Finish and defend', stop: 'Independent transfer task · Day 2',
      learn: 'Finish your class transfer packet. Use its uncertainty values. Explain your work to a partner, check their questions, and revise if needed. Submit your packet and your final answers here.',
      questions: [
        question('transfer-22-a', 'Find the range of possible positions using the uncertainty in the packet. Show your work. Explain why this range changes over time and one assumption that could fail.', 'Uses the packet’s uncertainty values consistently and connects the growing position range to velocity/time uncertainty. Separately identifies a limitation of the physical model.', [prediction]),
        { ...question('transfer-22-b', 'Write a short public briefing about 2026-XJ. State your prediction, support it with your results, and explain what is still unknown. What new evidence or physics would help?', 'A clear evidence-based claim with quantitative support, uncertainty and a model limitation. Does not treat a simplified position estimate as a complete collision forecast.', [prediction]), demand: demand('Evaluate', 3, 'Defend a public claim using the analysis, uncertainty and limits of the model.') },
      ],
    }], questions: [],
  },
].map(assignment => ({ ...assignment, questions: assignment.sections.flatMap(section => section.questions) })) as LessonAssignment[]
