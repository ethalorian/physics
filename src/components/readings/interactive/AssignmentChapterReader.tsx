'use client'
import dynamic from 'next/dynamic'
import { connectedChapter } from './connected-chapter-catalog'
import type { ComponentType } from 'react'
import type { ReaderProps } from './InteractiveChapterReader'
import styles from './chapter-two.module.css'

type ChapterProps = Omit<ReaderProps, 'definition' | 'renderOpening' | 'renderSection'>
const readers: Record<string, ComponentType<ChapterProps>> = {
  'hewitt:2:en': dynamic(() => import('./ChapterTwoReader'), { loading: () => <p role="status">Opening the interactive reading…</p> }),
}

const ConnectedReader = dynamic(() => import('./ConnectedChapterReader'), { loading: () => <p role="status">Opening the interactive reading…</p> })

/** Register reviewed content in registry.ts and its lazy renderer here. */
export default function AssignmentChapterReader({ definition, ...props }: ChapterProps & Pick<ReaderProps, 'definition'>) {
  const Reader = readers[`${definition.book}:${definition.chapter}:${definition.language}`]
  const connected = !!connectedChapter(definition.book, definition.chapter)
  return <div className={styles.embedded}>{connected ? <ConnectedReader {...props} definition={definition} /> : Reader ? <Reader {...props} /> : <p>This chapter’s interactive reader is unavailable. Open the original textbook to continue.</p>}</div>
}
