'use client'

import { useId, useState } from 'react'
import Avatar from './Avatar'
import CustomizeAvatarLink from './CustomizeAvatarLink'
import AvatarCharacter, { EmptyStudentDesk } from './AvatarCharacter'
import teacher from '@/data/physics-coach-avatar.json'
import type { AvatarItem, AvatarTraits, EquippedItems } from '@/lib/avatar/types'
import type { MeBundle } from '@/app/api/avatar/me/route'
import { STORY_LANGUAGES, type StoryLanguage } from '@/components/readings/interactive/reader-story-content'
import styles from './learning-scene.module.css'

const COPY = {
  en: { scene: 'Your classroom scene', language: 'Scene language', teacher: 'Mr. Antocci', you: 'You', sample: 'Sample student', look: 'Change your look', focus: 'Our question', model: 'Explore the model', phases: ['Notice', 'Predict', 'Explain'], prompts: ['Read the question. Which objects, quantities, or relationships should we pay attention to?', 'Before answering, make a prediction. Which evidence or method could help you check it?', 'Compare your prediction with what you observed. Which evidence supports your explanation?'], thoughts: ['I’ll look for the details that matter.', 'I’ll make a prediction and decide how to check it.', 'I can use what I observed to explain my thinking.'] },
  es: { scene: 'Tu escena en clase', language: 'Idioma de la escena', teacher: 'Profesor Antocci', you: 'Tú', sample: 'Estudiante de ejemplo', look: 'Cambiar tu aspecto', focus: 'Nuestra pregunta', model: 'Explorar el modelo', phases: ['Observar', 'Predecir', 'Explicar'], prompts: ['Lee la pregunta. ¿En qué objetos, cantidades o relaciones debemos fijarnos?', 'Antes de responder, haz una predicción. ¿Qué pruebas o método podrían ayudarte a comprobarla?', 'Compara tu predicción con lo que observaste. ¿Qué pruebas apoyan tu explicación?'], thoughts: ['Buscaré los detalles que importan.', 'Haré una predicción y decidiré cómo comprobarla.', 'Puedo usar mis observaciones para explicar mi razonamiento.'] },
  fr: { scene: 'Ta scène en classe', language: 'Langue de la scène', teacher: 'M. Antocci', you: 'Toi', sample: 'Élève exemple', look: 'Changer ton apparence', focus: 'Notre question', model: 'Explorer le modèle', phases: ['Observer', 'Prédire', 'Expliquer'], prompts: ['Lis la question. Quels objets, grandeurs ou relations méritent notre attention ?', 'Avant de répondre, fais une prédiction. Quelles preuves ou quelle méthode pourraient t’aider à la vérifier ?', 'Compare ta prédiction avec tes observations. Quelles preuves soutiennent ton explication ?'], thoughts: ['Je vais chercher les détails importants.', 'Je vais faire une prédiction et choisir comment la vérifier.', 'Je peux expliquer mon raisonnement à partir de mes observations.'] },
  'pt-BR': { scene: 'Sua cena na sala de aula', language: 'Idioma da cena', teacher: 'Professor Antocci', you: 'Você', sample: 'Estudante de exemplo', look: 'Mudar seu visual', focus: 'Nossa pergunta', model: 'Explorar o modelo', phases: ['Observar', 'Prever', 'Explicar'], prompts: ['Leia a pergunta. Quais objetos, grandezas ou relações merecem nossa atenção?', 'Antes de responder, faça uma previsão. Quais evidências ou métodos poderiam ajudar a verificá-la?', 'Compare sua previsão com o que observou. Quais evidências apoiam sua explicação?'], thoughts: ['Vou procurar os detalhes importantes.', 'Vou fazer uma previsão e decidir como verificá-la.', 'Posso usar minhas observações para explicar meu raciocínio.'] },
} as const

/** Native text and authored lesson context; no live generation or grading side effects. */
export default function LearningScene({ title, focus, portrait, sampleStudent = false, language: suppliedLanguage, onLanguageChange, modelHref, active = false, onReturn }: {
  title: string; focus: string; portrait: MeBundle | null; sampleStudent?: boolean
  language?: StoryLanguage; onLanguageChange?: (value: StoryLanguage) => void; modelHref?: string
  active?: boolean; onReturn?: () => void
}) {
  const [ownLanguage, setOwnLanguage] = useState<StoryLanguage>('en')
  const [phase, setPhase] = useState(0)
  const language = suppliedLanguage ?? ownLanguage, copy = COPY[language], id = useId()
  const activityCopy = { en: ['I’m in the model below, testing the motion.', 'Back to my desk'], es: ['Estoy en el modelo de abajo, probando el movimiento.', 'Volver a mi escritorio'], fr: ['Je suis dans le modèle ci-dessous pour tester le mouvement.', 'Retour à mon bureau'], 'pt-BR': ['Estou no modelo abaixo, testando o movimento.', 'Voltar para minha carteira'] }[language]
  return <section className={styles.scene} lang={language} translate="yes" aria-labelledby={`${id}-title`} data-learning-scene>
    <header className={styles.header}><div><p>{copy.scene}</p><h3 id={`${id}-title`} lang="en">{title}</h3></div>
      {(!suppliedLanguage || onLanguageChange) && <label className={styles.language}>{copy.language}<select value={language} onChange={e => (onLanguageChange ?? setOwnLanguage)(e.target.value as StoryLanguage)}>{STORY_LANGUAGES.map(([value, label]) => <option key={value} value={value} lang={value}>{label}</option>)}</select></label>}
    </header>
    <div className={styles.phases} role="group" aria-label={copy.scene}>{copy.phases.map((label, index) => <button type="button" key={index} aria-pressed={phase === index} onClick={() => setPhase(index)}><span aria-hidden="true">0{index + 1}</span>{label}</button>)}</div>
    <div className={styles.frames}>
      <div className={styles.teacher}><p className={styles.speech}><strong>{copy.teacher}</strong>{copy.prompts[phase]}</p><div className={styles.teacherArt}><Avatar traits={teacher.traits as AvatarTraits} equipped={{ ...teacher.equipped, background: undefined } as EquippedItems} items={teacher.items as AvatarItem[]} size={100} decorative /></div></div>
      <div className={styles.student}><p className={styles.thought}><strong>{sampleStudent ? copy.sample : copy.you}</strong>{active ? activityCopy[0] : copy.thoughts[phase]}</p><div className={styles.board}><span>{copy.focus}</span><p lang="en">{focus}</p></div>{active ? <div className={styles.studentArt} data-empty-student-desk><EmptyStudentDesk /></div> : <CustomizeAvatarLink label={copy.look} language={language} className={styles.studentArt}><AvatarCharacter portrait={portrait} sampleStudent={sampleStudent} /></CustomizeAvatarLink>}</div>
    </div>
    <footer>{active && onReturn ? <button type="button" onClick={onReturn} className="min-h-11 underline">{activityCopy[1]}</button> : modelHref ? <a href={modelHref}>{copy.model} ↓</a> : <span>{copy.phases.join(' · ')}</span>}<CustomizeAvatarLink label={copy.look} language={language}>{copy.look} ↗</CustomizeAvatarLink></footer>
  </section>
}
