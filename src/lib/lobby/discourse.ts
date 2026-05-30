/**
 * Discourse scaffolds for lobby group work, grounded in the expert-panel review
 * (see Lobby-Discourse-Panel.md):
 *   - Rotating roles      → Cohen (Complex Instruction), Johnson & Johnson
 *   - Accountable talk     → Michaels & O'Connor; Mercer (exploratory talk)
 *   - Build-on reflection  → Chi (ICAP Interactive), Webb (elaborated explanations)
 *
 * Pure data + helpers, safe to import on client and server.
 */

export interface DiscourseRole {
  key: string
  label: string
  blurb: string
  stem: string
}

// Four roles tuned for physics sense-making; cycle for groups larger than four.
export const ROLES: DiscourseRole[] = [
  { key: 'facilitator', label: 'Facilitator', blurb: 'Keep the group moving — make sure everyone shares their word and their thinking.', stem: `"Let's hear from everyone — what do you think?"` },
  { key: 'skeptic', label: 'Skeptic', blurb: `Push for reasons. Ask how the group knows it's right.`, stem: `"How do we know that? What's our evidence?"` },
  { key: 'recorder', label: 'Recorder', blurb: `Capture the group's reasoning so it's ready to submit.`, stem: `"So what we're agreeing on is ___ — did I get that right?"` },
  { key: 'reporter', label: 'Reporter', blurb: 'Be ready to explain the group’s thinking if the teacher calls on you.', stem: `"Our group thinks ___ because ___."` },
]

export function roleForIndex(i: number): DiscourseRole {
  return ROLES[((i % ROLES.length) + ROLES.length) % ROLES.length]
}

// Accountable-talk sentence starters shown to students during the group phase.
export const TALK_MOVES: string[] = [
  `"I agree with ___ because…"`,
  `"I see it differently — ___."`,
  `"Can you say more about that?"`,
  `"What's our evidence for that?"`,
  `"So what you're saying is…"`,
  `"Let's check we all agree before we submit."`,
]
