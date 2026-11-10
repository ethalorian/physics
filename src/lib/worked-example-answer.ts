// Keep the existing string answer format, using LaTeX display blocks for steps.
export function splitWorkedAnswer(value: string) {
  const equations: string[] = []
  let explanation = value
  while (explanation.startsWith('$$\n')) {
    const end = explanation.indexOf('\n$$', 3)
    if (end < 0) break
    const rest = explanation.slice(end + 3)
    if (rest && !rest.startsWith('\n\n')) break
    equations.push(explanation.slice(3, end))
    explanation = rest.slice(2)
  }
  return { equations, explanation }
}

export function joinWorkedAnswer(equations: string[], explanation: string) {
  const blocks = equations.filter(line => line.trim()).map(line => ['$$', line, '$$'].join('\n'))
  return [...blocks, explanation].filter(Boolean).join('\n\n')
}

export function isWorkedExample(reference: string) {
  return /^section\s+D\b.*\bworked example\b/i.test(reference)
}
