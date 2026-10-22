import type { ReactNode } from 'react'
import type { StoryLanguage } from '@/components/readings/interactive/reader-story-content'

const NEW_TAB: Record<StoryLanguage, string> = {
  en: 'Opens in a new tab; your lesson stays open',
  es: 'Se abre en otra pestaña; tu lección permanece abierta',
  fr: 'S’ouvre dans un nouvel onglet ; ta leçon reste ouverte',
  'pt-BR': 'Abre em outra aba; sua atividade continua aberta',
}
const GAME_TAB: Record<StoryLanguage, string> = {
  en: 'Opens in a new tab; your game stays open',
  es: 'Se abre en otra pestaña; tu juego permanece abierto',
  fr: 'S’ouvre dans un nouvel onglet ; ton jeu reste ouvert',
  'pt-BR': 'Abre em outra aba; seu jogo continua aberto',
}
const LABEL: Record<StoryLanguage, string> = {
  en: 'Change your look', es: 'Cambiar tu aspecto', fr: 'Changer ton apparence', 'pt-BR': 'Mudar seu visual',
}

/** Keep unsaved lesson state mounted; the portrait store refreshes when the learner returns. */
export default function CustomizeAvatarLink({ label, children, className, language = 'en', context = 'lesson' }: {
  label?: string; children?: ReactNode; className?: string; language?: StoryLanguage; context?: 'lesson' | 'game'
}) {
  const text = label ?? LABEL[language]
  const notice = (context === 'game' ? GAME_TAB : NEW_TAB)[language]
  return <a href="/avatar" target="_blank" rel="noopener noreferrer" className={className}
    aria-label={`${text}. ${notice}`} title={notice}>
    {children ?? <>{text}<span aria-hidden="true"> ↗</span></>}
  </a>
}
