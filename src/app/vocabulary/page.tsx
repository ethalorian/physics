import { redirect } from 'next/navigation'

// Vocabulary is entered through lesson blocks or assigned word practice.
export default function VocabularyRedirect() {
  redirect('/vocabulary/work')
}
