'use client'
import ChapterOpeningFigure from './ChapterOpeningFigure'
import InteractiveChapterReader, { type ReaderProps } from './InteractiveChapterReader'
import { connectedChapter } from './connected-chapter-catalog'
import { ConnectedChapterFigure } from './ConnectedChapterFigures'
import shared from './chapter-two.module.css'
import styles from './connected-chapters.module.css'
import { ReaderStoryIntro, ReaderStoryPanel, ReaderStoryProvider } from './ReaderStory'

type Props = Omit<ReaderProps, 'renderOpening' | 'renderSection'>
export default function ConnectedChapterReader({ definition, ...props }: Props) {
  const content = connectedChapter(definition.book, definition.chapter)
  if (!content) return <p>This chapter is not available yet.</p>
  const { lessons, intro } = content
  const chapter = definition
  const reader = <InteractiveChapterReader {...props} definition={chapter} renderOpening={onStart => <>
    <div className={shared.heroCopy}><p className={shared.eyebrow}>{chapter.bookTitle} / CHAPTER {chapter.chapter}</p><h1>{intro.headline[0]}<br /><em>{intro.headline[1]}</em></h1><p className={shared.dek}>See the pattern.<br />Explain the change.</p><div className={shared.heroMeta}><span>{lessons.length} connected ideas</span><span>Read · test · explain</span></div></div>
    <ChapterOpeningFigure theme={intro.theme}/>
    <div className={shared.openingBottom}><p>{intro.invitation}</p><button className={shared.primaryButton} onClick={onStart}>Start reading ↓</button></div>
    <div className={shared.bigIdea}><span>THE BIG IDEA</span><p>{intro.bigIdea}</p><p className={shared.bigIdeaDetail}>{intro.detail}</p></div>
    <ReaderStoryIntro />
    {chapter.book === 'openstax' ? <p className={styles.license}>Adapted from <a href="https://openstax.org/details/books/college-physics-ap-courses-2e" target="_blank" rel="noopener noreferrer">OpenStax College Physics for AP® Courses 2e</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a></p> : null}
  </>} renderSection={id => {
    const s = lessons.find(s => s.id === id)
    if (!s) return null
    return <><ReaderStoryPanel sectionId={s.id} /><div className={shared.prose}>{s.paragraphs.slice(0,2).map(p=><p key={p}>{p}</p>)}</div><ConnectedChapterFigure kind={s.visual} id={`figure-${s.id}`}/><div className={shared.prose}>{s.paragraphs.slice(2).map(p=><p key={p}>{p}</p>)}</div>{s.references?.map(ref=><p className={styles.status} key={ref.url}>Further evidence: <a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.title}</a></p>)}<aside className={styles.terms} aria-label={`Vocabulary for ${s.number}`}><h3>Words for your explanation</h3><dl>{s.terms.map(([term,meaning])=><div key={term} style={{display:'contents'}}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl><p className={styles.status}>Use these ideas in your own explanation. Assigned vocabulary practice is available through your reading’s learning path.</p></aside><div className={styles.worked}><h3>{s.worked.title}</h3><p>{s.worked.prompt}</p><details><summary>Compare your reasoning</summary><p>{s.worked.reasoning}</p></details></div></>
  }} />
  // The first reviewed story covers Hewitt 4.1–4.3; other chapters keep their existing reader.
  const hasStory = chapter.book === 'hewitt' && chapter.chapter === 4 && chapter.language === 'en'
  return hasStory ? <ReaderStoryProvider key={`${props.storageKey}:${props.assignment?.id ?? 'chapter'}`} sampleStudent={props.teacher || props.preview}>{reader}</ReaderStoryProvider> : reader
}
