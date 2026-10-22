'use client'
import InteractiveChapterReader, { type ReaderProps } from './InteractiveChapterReader'
import { chapterTwoDefinition } from './chapter-two-definition'
import { ChapterTwoOpening, ChapterTwoSection } from './ChapterTwoContent'

export default function ChapterTwoReader(props: Omit<ReaderProps, 'definition' | 'renderOpening' | 'renderSection'>) {
 return <InteractiveChapterReader {...props} definition={chapterTwoDefinition} renderOpening={onStart => <ChapterTwoOpening onStart={onStart} />} renderSection={id => <ChapterTwoSection id={id} />} />
}
