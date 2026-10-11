import type {QuizQuestion} from './types'

/** Accept standard TeX delimiters without rewriting literal code or prose. */
export function quizMathContent(content: string) {
  const code = /(`+)[\s\S]*?\1|(~{3,})[^\n]*\n[\s\S]*?\2/g
  const normalize = (text: string) => text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `\n\n$$\n${math.trim()}\n$$\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math.trim()}$`)
  let output = '', last = 0
  for (const match of content.matchAll(code)) {
    output += normalize(content.slice(last, match.index)) + match[0]
    last = match.index! + match[0].length
  }
  return output + normalize(content.slice(last))
}

/** Older generated stems sometimes repeat the separately stored choices.
 * Remove only an exact, complete trailing copy; never infer or change content. */
export function quizQuestionStem(question: Pick<QuizQuestion, 'kind'|'prompt'|'options'>) {
  if (question.kind !== 'choice' || !question.options?.length) return question.prompt
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()
  const suffix = question.options.map((option, i) => `${String.fromCharCode(65 + i)}) ${option}`).join(' ')
  const match = /(?:^|\s)A\)\s/g
  for (const start of question.prompt.matchAll(match)) {
    const offset = start.index! + (start[0].startsWith('A') ? 0 : 1)
    if (normalize(question.prompt.slice(offset)) === normalize(suffix)) return question.prompt.slice(0, offset).trim()
  }
  return question.prompt
}
