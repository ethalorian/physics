'use client'

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowDown, BookOpen, Sparkles } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import ReaderStudentPose, { EmptyStudentDesk } from './ReaderStudentPose'
import { READER_ACTIVITY_COPY } from './reader-activity-copy'
import teacherAvatar from '@/data/physics-coach-avatar.json'
import type { AvatarItem, AvatarTraits, EquippedItems } from '@/lib/avatar/types'
import type { MeBundle } from '@/app/api/avatar/me/route'
import { isStoryScene, READER_STORY, STORY_LANGUAGES, type StoryLanguage, type StorySceneId } from './reader-story-content'
import styles from './reader-story.module.css'

type StoryState = {
  language: StoryLanguage; setLanguage: (language: StoryLanguage) => void
  visible: boolean; setVisible: (visible: boolean) => void
  portrait: MeBundle | null; loaded: boolean; sampleStudent: boolean
  activeScene: StorySceneId | null; setActiveScene: (id: StorySceneId | null) => void
  predictions: Partial<Record<StorySceneId, number>>
  predict: (id: StorySceneId, choice: number) => void
}
const StoryContext = createContext<StoryState | null>(null)

/** One avatar request per reader, shared by every panel. No image generation at runtime. */
export function ReaderStoryProvider({ children, sampleStudent = false }: { children: ReactNode; sampleStudent?: boolean }) {
  const [language, setLanguage] = useState<StoryLanguage>('en')
  const [visible, setVisible] = useState(true)
  const [activeScene, setActiveScene] = useState<StorySceneId | null>(null)
  const [portrait, setPortrait] = useState<MeBundle | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [predictions, setPredictions] = useState<StoryState['predictions']>({})
  useEffect(() => {
    if (sampleStudent) return
    let controller: AbortController | null = null
    const load = async () => {
      controller?.abort()
      controller = new AbortController()
      const { signal } = controller
      try {
        const response = await fetch('/api/avatar/me', { signal })
        if (!response.ok) return
        const bundle = await response.json() as MeBundle
        if (!signal.aborted && Array.isArray(bundle.equipped_items)) setPortrait(bundle)
      } catch { /* Keep the last confirmed portrait during a failed refresh. */ }
      finally { if (!signal.aborted) setLoaded(true) }
    }
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    void load()
    window.addEventListener('avatar-updated', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      controller?.abort()
      window.removeEventListener('avatar-updated', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [sampleStudent])
  return <StoryContext.Provider value={{ language, setLanguage, visible, setVisible: value => { setVisible(value); if (!value) setActiveScene(null) }, portrait, loaded, sampleStudent, predictions, activeScene, setActiveScene,
    predict: (id, choice) => setPredictions(previous => ({ ...previous, [id]: choice })),
  }}>{children}</StoryContext.Provider>
}

export function ReaderStoryIntro() {
  const story = useContext(StoryContext)
  const languageId = useId()
  if (!story) return null
  const copy = READER_STORY[story.language]
  return <aside className={styles.intro} lang={story.language} translate="yes" aria-label={copy.title}>
    <div className={styles.introHeading}><BookOpen size={21} aria-hidden="true" /><h2>{copy.title}</h2></div>
    <p>{copy.intro}</p>
    <div className={styles.settings}>
      <label className={styles.toggle}><input type="checkbox" checked={story.visible} onChange={event => story.setVisible(event.target.checked)} />{copy.show}</label>
      <div className={styles.language}><label htmlFor={languageId}>{copy.language}</label><select id={languageId} value={story.language} onChange={event => story.setLanguage(event.target.value as StoryLanguage)}>{STORY_LANGUAGES.map(([value, label]) => <option key={value} value={value} lang={value}>{label}</option>)}</select></div>
    </div>
  </aside>
}

// The classroom supplies the background; the characters keep their equipped clothing.
function TeacherPortrait() {
  return <Avatar traits={teacherAvatar.traits as AvatarTraits} equipped={{ ...teacherAvatar.equipped, background: undefined } as EquippedItems} items={teacherAvatar.items as AvatarItem[]} size={124} decorative />
}
export function useReaderStoryExperiment(figureId: string) {
  const story = useContext(StoryContext)
  const sectionId = figureId.replace(/^figure-/, '')
  return story && story.visible && isStoryScene(sectionId) ? { story, sectionId, active: story.activeScene === sectionId, copy: READER_ACTIVITY_COPY[story.language] } : null
}

function StudentPortrait({ story, sectionId }: { story: StoryState; sectionId: StorySceneId }) {
  const copy = READER_STORY[story.language]
  if (story.activeScene === sectionId) return <div className={styles.emptySeat}><EmptyStudentDesk /><a href={`#figure-${sectionId}`}>{READER_ACTIVITY_COPY[story.language].atExperiment}</a></div>
  if (story.sampleStudent) return <ReaderStudentPose portrait={null} sampleStudent />
  const ready = Boolean(story.portrait?.setup_completed && story.portrait.traits)
  return <Link href="/avatar" className={styles.avatarLink} aria-label={ready ? copy.customize : copy.missing}>
    <ReaderStudentPose portrait={story.portrait} sampleStudent={false} />
    {!ready ? <span className={styles.seatHelp}>{story.loaded ? copy.missing : copy.loading}</span> : null}
  </Link>
}

function StoryBoard({ id }: { id: StorySceneId }) {
  return <svg className={styles.board} viewBox="0 0 220 150" aria-hidden="true" focusable="false">
    <path d="M15 120H205M35 25V135" fill="none" stroke="currentColor" opacity=".25" />
    {id === 'frame-1' ? <>
      <path d="M50 42H202M50 114H202" stroke="currentColor" opacity=".5" />
      <path d="M68 108L157 47M145 48L157 47L155 60" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M120 85h60m-10-7 10 7-10 7" fill="none" stroke="currentColor" strokeWidth="3" opacity=".5" />
    </> : id === 'speed-2' ? <>
      <path d="M53 58H191l-11-9m11 9-11 9M191 96H53l11-9m-11 9 11 9" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="53" cy="120" r="5" fill="currentColor" />
    </> : <>
      <path d="M62 115H163l-11-8m11 8-11 8M62 115V14l-8 11m8-11 8 11" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M155 109A94 94 0 0 0 68 20" fill="none" stroke="currentColor" strokeDasharray="4 6" opacity=".45" />
    </>}
  </svg>
}

export function ReaderStoryPanel({ sectionId }: { sectionId: string }) {
  const story = useContext(StoryContext)
  if (!story || !story.visible || !isStoryScene(sectionId)) return null
  const copy = READER_STORY[story.language], scene = copy.scenes[sectionId]
  const selected = story.predictions[sectionId]
  const sceneNumber = ['frame-1', 'speed-2', 'velocity-3'].indexOf(sectionId) + 1
  return <section className={styles.story} lang={story.language} translate="yes" aria-labelledby={`story-title-${sectionId}`} data-reader-story={sectionId}>
    <div className={styles.caption}><span>{copy.classroom}</span><span aria-hidden="true">0{sceneNumber}</span></div>
    <h3 id={`story-title-${sectionId}`} className={styles.title}>{scene.title}</h3>
    <div className={styles.frames}>
      <div className={styles.teacherFrame}>
        <p className={styles.speech}><span className={styles.speakerKicker}>Mr. Antocci <span>Batmantocci</span></span><span>{scene.teacher}</span></p>
        <div className={styles.teacherPortrait}><TeacherPortrait /></div>
      </div>
      <div className={styles.studentFrame}>
        <StoryBoard id={sectionId} />
        <p className={styles.thought}><span className={styles.speakerKicker}>{story.sampleStudent ? copy.sample : copy.you}</span><span>{scene.student}</span></p>
        <div className={styles.studentPortrait}><StudentPortrait story={story} sectionId={sectionId} /></div>
      </div>
    </div>
    <div className={styles.investigation}>
      <fieldset><legend><span>{copy.prediction}</span>{scene.question}</legend>
        <div className={styles.choices}>{scene.choices.map((choice, index) => <label key={index} className={styles.choice} data-selected={selected === index}>
          <input type="radio" name={`story-prediction-${sectionId}`} checked={selected === index} onChange={() => story.predict(sectionId, index)} />
          <span>{choice}</span>
        </label>)}</div>
      </fieldset>
      <div className={styles.next}>
        {selected !== undefined ? <p className={styles.selected} role="status">{copy.selected}</p> : null}
        <p>{scene.investigate}</p>
        <a href={`#figure-${sectionId}`} className={styles.tryModel} onClick={() => story.setActiveScene(sectionId)}>{copy.test}<ArrowDown size={16} aria-hidden="true" /></a>
        <span className={styles.practice}>{copy.practice}</span>
      </div>
      <details className={styles.connection}><summary><Sparkles size={15} aria-hidden="true" />{copy.asteroid}</summary><p>{scene.connection}</p></details>
    </div>
  </section>
}
