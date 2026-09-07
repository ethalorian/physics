import type { QuestionBankFilters, QuestionBankItem } from '@/types/question-bank'

/** Filter the loaded bank without issuing a request for every keystroke. */
export function filterQuestionBank(questions: QuestionBankItem[], filters: QuestionBankFilters): QuestionBankItem[] {
  const search = filters.searchText?.trim().toLowerCase()
  return questions.filter(item => {
    if (filters.units?.length && !filters.units.includes(item.unit)) return false
    if (filters.lessons?.length && !filters.lessons.includes(item.lesson)) return false
    if (filters.difficulty?.length && !filters.difficulty.includes(item.difficulty)) return false
    if (filters.questionTypes?.length && !filters.questionTypes.includes(item.question.type)) return false
    if (filters.topics?.length && !filters.topics.some(topic => item.topics.includes(topic))) return false
    if (filters.tags?.length && !filters.tags.some(tag => item.tags?.includes(tag))) return false
    if (filters.cognitive_levels?.length && (!item.cognitive_level || !filters.cognitive_levels.includes(item.cognitive_level))) return false
    return !search || [item.question.question, ...item.topics, ...(item.tags ?? [])].some(text => text.toLowerCase().includes(search))
  })
}

/** Refresh once, including after a partially successful import. */
export async function importQuestionBankItems<T>(items: T[], save: (item: T) => Promise<void>, refresh: () => Promise<void>): Promise<void> {
  if (!items.length) return
  try {
    for (const item of items) await save(item)
  } finally {
    await refresh()
  }
}
