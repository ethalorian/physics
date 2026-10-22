'use client'
import InteractiveChapterReader, { type ReaderProps } from './InteractiveChapterReader'
import { chapterTwoDefinition } from './chapter-two-definition'
import { ReaderStoryIntro, ReaderStoryProvider } from './ReaderStory'
import { ChapterTwoOpening, ChapterTwoSection } from './ChapterTwoContent'

export default function ChapterTwoReader(props: Omit<ReaderProps, 'definition' | 'renderOpening' | 'renderSection'>) {
 return <ReaderStoryProvider key={`${props.storageKey}:${props.assignment?.id ?? "chapter"}`} storageKey={props.storageKey} sampleStudent={props.teacher || props.preview}><InteractiveChapterReader {...props} definition={chapterTwoDefinition} renderOpening={onStart => <><ChapterTwoOpening onStart={onStart} /><ReaderStoryIntro /></>} renderSection={id => <ChapterTwoSection id={id} />} /></ReaderStoryProvider>
}
