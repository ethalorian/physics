import type { BlockDocument, ContentBlock } from '@/data/content-blocks'

export type ReflectionKind = 'manga' | 'story'
export const REFLECTION_TEMPLATES = [
  { kind: 'manga' as const, title: 'My week in physics · Manga', description: 'Upload a manga page connecting this week’s learning to physics in your life, then reflect on how you learned.' },
  { kind: 'story' as const, title: 'Physics comes to life · Short story', description: 'Write a fictional scene built around physics from your world, then explain how your thinking changed.' },
]

/** Creative products and reflections use canonical capture blocks and lesson receipts. */
export function createReflectionAssignment(kind: ReflectionKind, targetId?: string): BlockDocument {
  const support = { modes: ['text' as const], frames: [{ level: 3 as const, text: 'I used to think ___. Now I think ___ because ___.' }], wordBank: ['evidence', 'strategy', 'revise', 'notice', 'explain', 'next step'] }
  const response = (id: string, title: string, prompt: string, frame?: string): ContentBlock => ({
    id, type: 'exit_ticket', capture: true, targetId, evidenceRole: 'exit', prompt, frame,
    sei: support, workshop: { stage: title, title, pageBreakBefore: true },
  })
  return { schemaVersion: 1, dayType: 'SYNTHESIS', reflection: { version: 1, kind }, blocks: [
    { id: 'reflection-purpose', type: 'prose', markdown: '## Learning about my learning\n\nChoose an idea you learned or revised **this week**. Connect it to a specific experience from your life: a sport, a ride, music, work, cooking, or something else you noticed. Show the physics and explain how you came to understand it.\n\nYour teacher looks for accurate physics, specific evidence of a change in your thinking, a useful learning strategy, and a next step. Artistic polish, spelling, and dramatic flair are not the focus.' },
    response('reflection-notice', 'Notice your learning', 'What physics idea did you learn or revise this week? Describe one specific place you noticed it in your own life. Explain the connection using the physics, not just its name.', 'This week I learned ___. I noticed it when ___. The physics explains ___ because ___.'),
    ...(kind === 'manga' ? [
      { id: 'reflection-product', type: 'sketch', capture: true, submission: 'upload', targetId, evidenceRole: 'main', instruction: 'Create one manga page that explains this week’s physics in your life. Upload a clear photo, image, or PDF of your hand-drawn or digital page. Add a caption explaining the physics shown.', prompts: ['Use a few panels to establish a real situation, show what happens, and explain why.', 'Use speech bubbles, labels, arrows, or captions to make the physics visible.', 'Show a moment of realizing, questioning, or revising an idea. Stick figures are welcome.'], workshop: { stage: 'Create your manga', title: 'Create your manga', pageBreakBefore: true } } as ContentBlock,
    ] : [response('reflection-product', 'Write your story', 'Write a short fictional story inspired by your real-world example. Give a character a goal or problem. Let the physics affect what happens and how the character responds. Make the scenario come to life through action or dialogue. A few focused paragraphs are enough. Keep the physics believable, even when the characters or setting are invented.')]),
    response('reflection-change', 'Trace your thinking', 'What did you think before this week? What do you think now? Point to a particular observation, mistake, discussion, lab result, or piece of work that changed or strengthened your thinking. Explain how it did that.'),
    response('reflection-strategy', 'Understand how you learned', 'Which learning strategy helped you understand this idea? Describe exactly what you did and why it helped. How did making your manga or story reveal a gap or help you check your understanding?', 'I tried ___. It helped because ___. While creating, I noticed ___.'),
    response('reflection-next', 'Plan your next step', 'What are you still unsure about? Choose one specific next step to test or improve your understanding, and explain how you will know whether it worked.', 'I still wonder ___. Next I will ___. I will check my understanding by ___.'),
  ] }
}
