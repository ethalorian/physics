'use client'

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react'
import CustomizeAvatarLink from '@/components/avatar/CustomizeAvatarLink'
import { ArrowDown, BookOpen, Sparkles } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import ReaderStudentPose, { EmptyStudentDesk } from './ReaderStudentPose'
import { READER_ACTIVITY_COPY } from './reader-activity-copy'
import teacherAvatar from '@/data/physics-coach-avatar.json'
import type { AvatarItem, AvatarTraits, EquippedItems } from '@/lib/avatar/types'
import type { MeBundle } from '@/app/api/avatar/me/route'
import { isStoryScene, READER_STORY, STORY_LANGUAGES, type StoryLanguage, type StorySceneId } from './reader-story-content'
import styles from './reader-story.module.css'
import AvatarInvestigation from '@/components/avatar/AvatarInvestigation'
import { useAvatarPortrait } from '@/hooks/useAvatarPortrait'
import {READER_MISSIONS, type InvestigationMission} from '@/lib/avatar/investigation-missions'
import type { ReaderSection } from './reader-contract'

type StoryState = {
  motionScenes: boolean
  language: StoryLanguage; setLanguage: (language: StoryLanguage) => void
  visible: boolean; setVisible: (visible: boolean) => void
  portrait: MeBundle | null; loaded: boolean; sampleStudent: boolean
  activeScene: string | null; setActiveScene: (id: string | null) => void
  predictions: Partial<Record<StorySceneId, number>>
  predict: (id: StorySceneId, choice: number) => void
}
const StoryContext = createContext<StoryState | null>(null)

/** One avatar request per reader, shared by every panel. No image generation at runtime. */
export function ReaderStoryProvider({ children, sampleStudent = false, motionScenes = false, storageKey }: { children: ReactNode; sampleStudent?: boolean; motionScenes?: boolean; storageKey?: string }) {
  const [language, setLanguage] = useState<StoryLanguage>('en')
  const [visible, setVisible] = useState(true)
  const [activeScene, setActiveScene] = useState<string | null>(null)
  const { portrait, loaded } = useAvatarPortrait(!sampleStudent)
  const [settingsReady, setSettingsReady] = useState(false)
  const [predictions, setPredictions] = useState<StoryState['predictions']>({})
  useEffect(() => {
    const pause = () => { if (document.hidden) setActiveScene(null) }
    document.addEventListener('visibilitychange', pause)
    return () => document.removeEventListener('visibilitychange', pause)
  }, [])
  useEffect(() => {
    if (storageKey) try {
      const saved = JSON.parse(localStorage.getItem(storageKey + ':story') ?? 'null')
      if (saved && STORY_LANGUAGES.some(([id]) => id === saved.language)) setLanguage(saved.language)
      if (typeof saved?.visible === 'boolean') setVisible(saved.visible)
    } catch { /* Reading stays available when storage is blocked. */ }
    setSettingsReady(true)
  }, [storageKey])
  useEffect(() => {
    if (settingsReady && storageKey) try { localStorage.setItem(storageKey + ':story', JSON.stringify({ language, visible })) } catch { /* Optional preference. */ }
  }, [language, visible, settingsReady, storageKey])
  return <StoryContext.Provider value={{ motionScenes, language, setLanguage, visible, setVisible: value => { setVisible(value); if (!value) setActiveScene(null) }, portrait, loaded, sampleStudent, predictions, activeScene, setActiveScene,
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
  return story && story.visible ? { story, sectionId, active: story.activeScene === sectionId, copy: READER_ACTIVITY_COPY[story.language] } : null
}

function StudentPortrait({ story, sectionId }: { story: StoryState; sectionId: StorySceneId }) {
  const copy = READER_STORY[story.language]
  if (story.activeScene === sectionId) return <div className={styles.emptySeat}><EmptyStudentDesk /><a href={`#figure-${sectionId}`}>{READER_ACTIVITY_COPY[story.language].atExperiment}</a></div>
  if (story.sampleStudent) return <ReaderStudentPose portrait={null} sampleStudent />
  const ready = Boolean(story.portrait?.setup_completed && story.portrait.traits)
  return <CustomizeAvatarLink className={styles.avatarLink} label={ready ? copy.customize : copy.missing} language={story.language}>
    <ReaderStudentPose portrait={story.portrait} sampleStudent={false} />
    {!ready ? <span className={styles.seatHelp}>{story.loaded ? copy.missing : copy.loading}</span> : null}
  </CustomizeAvatarLink>
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
  if (!story || !story.motionScenes || !story.visible || !isStoryScene(sectionId)) return null
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

export function ReaderStudyScene({ section }: { section: ReaderSection }) {
  const story = useContext(StoryContext)
  if (!story || !story.visible) return null
  if (story.motionScenes && isStoryScene(section.id)) return <ReaderStoryPanel sectionId={section.id} />
  return null
}

/** A stable wrapper keeps model state mounted when the optional avatar scenes are hidden. */
const ReaderModelContext = createContext<StoryState | null>(null)

export function ReaderExperiment({ section, children, actorInModel = false, mission = READER_MISSIONS.forces }: { section: ReaderSection; children: ReactNode; actorInModel?: boolean; mission?: InvestigationMission }) {
  const story = useContext(StoryContext)
  if (!story || (story.motionScenes && isStoryScene(section.id))) return <>{children}</>
  return <ReaderModelContext.Provider value={story.visible&&story.activeScene===section.id?story:null}><AvatarInvestigation mission={mission} actorInModel={actorInModel} id={section.id} title={section.heading} focus={section.check.prompt} portrait={story.portrait} sample={story.sampleStudent} language={story.language} onLanguageChange={story.setLanguage} active={story.activeScene===section.id} onActiveChange={value=>story.setActiveScene(value?section.id:null)} shown={story.visible}>{children}</AvatarInvestigation></ReaderModelContext.Provider>
}

export function ReaderModelActor({ x, y, width, height, fallback }: { x: number; y: number; width: number; height: number; fallback: ReactNode }) {
  const story = useContext(ReaderModelContext)
  if (!story) return <>{fallback}</>
  return <foreignObject x={x} y={y} width={width} height={height} pointerEvents="none" aria-hidden="true"><ReaderStudentPose portrait={story.portrait} sampleStudent={story.sampleStudent} pose="standing" /></foreignObject>
}
