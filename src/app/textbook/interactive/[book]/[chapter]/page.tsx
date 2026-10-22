import InteractiveAccess from '@/components/readings/interactive/InteractiveAccess'
import ChapterLibraryReader from '@/components/readings/interactive/ChapterLibraryReader'
export default async function Page({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book, chapter } = await params
  return <InteractiveAccess><ChapterLibraryReader book={book} chapter={chapter} /></InteractiveAccess>
}
