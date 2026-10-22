'use client'

import { memo, useId, useRef, useState, type ReactNode, type SyntheticEvent } from 'react'
import Avatar from './Avatar'
import AvatarCharacter, { EmptyStudentDesk } from './AvatarCharacter'
import CustomizeAvatarLink from './CustomizeAvatarLink'
import teacher from '@/data/physics-coach-avatar.json'
import type { AvatarItem, AvatarTraits, EquippedItems } from '@/lib/avatar/types'
import type { MeBundle } from '@/app/api/avatar/me/route'
import { STORY_LANGUAGES, type StoryLanguage } from '@/components/readings/interactive/reader-story-content'
import s from './avatar-investigation.module.css'
import {InvestigationParticipation} from './InvestigationParticipation'
import InvestigationEvidence from './InvestigationEvidence'
import type {InvestigationMission} from '@/lib/avatar/investigation-missions'

const Character = memo(AvatarCharacter)
const COPY = {
 en: { label:'Your avatar · Investigation', language:'Scene language', teacher:'Mr. Antocci', phases:['Predict','Test','Explain'], prompts:['Before you change anything, what do you predict? Which quantity will change, and which will stay the same?','Change one setting. Compare the model and its measurements with your prediction.','Use a specific setting and an observation to explain what happened. What would make you revise your prediction?'], question:'Our question', desk:'At your desk', controls:'At the controls', inModel:'In the model', enter:'Enter the experiment', back:'Back to my desk', change:'Change your look', observed:'Last control you changed', evidence:'Keep the evidence', note:'Use the existing questions or notebook below to record your prediction, observations, and reasoning.', study:'Read the scene, then explain your thinking in the questions below.' },
 es: { label:'Tu avatar · Investigación', language:'Idioma de la escena', teacher:'Profesor Antocci', phases:['Predecir','Probar','Explicar'], prompts:['Antes de cambiar algo, ¿qué predices? ¿Qué cantidad cambiará y cuál seguirá igual?','Cambia un ajuste. Compara el modelo y sus medidas con tu predicción.','Usa un ajuste concreto y una observación para explicar lo ocurrido. ¿Qué te haría revisar tu predicción?'], question:'Nuestra pregunta', desk:'En tu escritorio', controls:'En los controles', inModel:'En el modelo', enter:'Entrar al experimento', back:'Volver a mi escritorio', change:'Cambiar tu aspecto', observed:'Último control que cambiaste', evidence:'Conserva las pruebas', note:'Usa las preguntas o el cuaderno de abajo para registrar tu predicción, observaciones y razonamiento.', study:'Lee la escena y explica tu razonamiento en las preguntas de abajo.' },
 fr: { label:'Ton avatar · Investigation', language:'Langue de la scène', teacher:'M. Antocci', phases:['Prédire','Tester','Expliquer'], prompts:['Avant de changer un réglage, que prédis-tu ? Quelle grandeur changera et laquelle restera constante ?','Change un réglage. Compare le modèle et ses mesures à ta prédiction.','Utilise un réglage précis et une observation pour expliquer le résultat. Qu’est-ce qui te ferait réviser ta prédiction ?'], question:'Notre question', desk:'À ton bureau', controls:'Aux commandes', inModel:'Dans le modèle', enter:'Entrer dans l’expérience', back:'Retour à mon bureau', change:'Changer ton apparence', observed:'Dernière commande modifiée', evidence:'Garde les preuves', note:'Utilise les questions ou le carnet ci-dessous pour noter ta prédiction, tes observations et ton raisonnement.', study:'Lis la scène, puis explique ton raisonnement dans les questions ci-dessous.' },
 'pt-BR': { label:'Seu avatar · Investigação', language:'Idioma da cena', teacher:'Professor Antocci', phases:['Prever','Testar','Explicar'], prompts:['Antes de mudar algo, o que você prevê? Qual grandeza vai mudar e qual vai permanecer igual?','Mude um ajuste. Compare o modelo e suas medidas com sua previsão.','Use um ajuste específico e uma observação para explicar o resultado. O que faria você revisar sua previsão?'], question:'Nossa pergunta', desk:'Na sua carteira', controls:'Nos controles', inModel:'No modelo', enter:'Entrar no experimento', back:'Voltar para minha carteira', change:'Mudar seu visual', observed:'Último controle alterado', evidence:'Guarde as evidências', note:'Use as perguntas ou o caderno abaixo para registrar sua previsão, observações e raciocínio.', study:'Leia a cena e explique seu raciocínio nas perguntas abaixo.' },
} as const

/** A character operates the real controls; this layer never changes model values or student answers. */
export default function AvatarInvestigation({ id, title, focus, portrait, sample = false, language = 'en', onLanguageChange, active = false, onActiveChange, actorInModel = false, interactive = true, shown = true, mission, children }: {
 mission?: InvestigationMission; id: string; title: string; focus: string; portrait: MeBundle | null; sample?: boolean; language?: StoryLanguage
 onLanguageChange?: (language: StoryLanguage) => void; active?: boolean; onActiveChange?: (active: boolean) => void
 actorInModel?: boolean; interactive?: boolean; readOnly?: boolean; shown?: boolean; children?: ReactNode
}) {
 const model=useRef<HTMLDivElement>(null)
 const uid=useId(),copy=COPY[language], [chosenPhase,setPhase]=useState(0), [lastControl,setLastControl]=useState('')
 const phase=active?1:chosenPhase===1?2:chosenPhase
 const activate=()=>{ if(!interactive||!shown)return;setPhase(1);onActiveChange?.(true) }
 function notice(event:SyntheticEvent) {
  if(!interactive||!shown||!(event.target instanceof Element))return
  const control=event.target.closest<HTMLElement>('button,input[type="range"],input[type="number"],input[type="checkbox"],input[type="radio"],select')
  if(!control||control.matches(':disabled')||control.closest('[data-avatar-ignore]'))return
  const label=control.getAttribute('aria-label')||control.closest('label')?.textContent||control.textContent||''
  setLastControl(label.trim().replace(/\s+/g,' ').slice(0,140));activate()
 }
 const choosePhase=(next:number)=>{setPhase(next);if(next!==1)onActiveChange?.(false);else activate()}
 return <InvestigationParticipation.Provider value={{active:active&&shown,portrait,sample}}><div className={s.investigation} role="group" aria-labelledby={shown?`${uid}-title`:undefined} data-avatar-investigation={id} data-avatar-active={active} data-avatar-shown={shown}>
  <div hidden={!shown} className={s.scene} lang={language} translate="yes">
   <header className={s.header}><div><p>{copy.label}</p><h3 id={`${uid}-title`} lang="en">{title}</h3></div>{onLanguageChange&&<label>{copy.language}<select value={language} onChange={e=>onLanguageChange(e.target.value as StoryLanguage)}>{STORY_LANGUAGES.map(([value,label])=><option key={value} value={value} lang={value}>{label}</option>)}</select></label>}</header>
   <div className={s.phases} role="group" aria-label={copy.label}>{copy.phases.map((label,i)=><button key={i} type="button" aria-pressed={phase===i} disabled={i===1&&(!interactive)} onClick={()=>choosePhase(i)}>{label}</button>)}</div>
   <div className={s.classroom}>
    <div className={s.teacher}><div className={s.portrait}><Avatar traits={teacher.traits as AvatarTraits} equipped={teacher.equipped as EquippedItems} items={teacher.items as AvatarItem[]} crop="portrait" size={64} decorative/></div><p className={s.speech}><strong>{copy.teacher}</strong><span lang={mission?"en":language}>{mission?[mission.predict,mission.test,mission.explain][phase]:copy.prompts[phase]}</span></p><div className={s.question}><strong>{copy.question}</strong><p lang="en">{focus}</p></div></div>
    <div className={s.student}><span>{active?(actorInModel?copy.inModel:copy.controls):copy.desk}</span><div className={s.character}>{active?((actorInModel||mission)?<EmptyStudentDesk/>:<><div className={s.operator}><Character portrait={portrait} sampleStudent={sample} pose="standing"/></div><svg className={s.console} viewBox="0 0 120 60" aria-hidden="true"><path d="M12 18h96l9 22H3zM14 40v18m92-18v18" fill="var(--muted)" stroke="var(--foreground)" strokeWidth="2"/><path d="M27 27h28m-28 7h18" stroke="var(--primary)" strokeWidth="3"/><circle cx="77" cy="30" r="4" fill="var(--primary)"/><circle cx="94" cy="30" r="4" fill="var(--primary)"/></svg></>):<Character portrait={portrait} sampleStudent={sample}/>}</div><CustomizeAvatarLink label={copy.change} language={language}>{copy.change} ↗</CustomizeAvatarLink></div>
   </div>
   <div className={s.actions}>{interactive?<button type="button" onClick={()=>active?choosePhase(2):activate()}>{active?copy.back:copy.enter}</button>:<span>{copy.study}</span>}{lastControl&&<p><strong>{copy.observed}: </strong><span lang="en">{lastControl}</span></p>}</div>
  </div>
  <div ref={model} className={s.model} onInputCapture={notice} onChangeCapture={notice} onClickCapture={notice}>{children}</div>
  {shown&&interactive&&mission&&<InvestigationEvidence source={model} mission={mission} actorInModel={actorInModel} onCapture={activate}/>}
  {shown&&interactive&&!mission&&<footer className={s.evidence} lang={language}><strong>{copy.evidence}</strong><span>{copy.note}</span></footer>}
 </div></InvestigationParticipation.Provider>
}
