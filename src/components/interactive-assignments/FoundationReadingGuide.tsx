'use client'
import type {FoundationKey} from '@/lib/interactive-assignments/foundations/checkpoints'
import topics from '@/data/foundations/teaching-guide-topics.json'
import mapping from '@/data/foundations/teaching-guide-map.json'
import {useFoundationLanguage} from './FoundationLanguage'
import QuizContent from '@/components/quizzes/QuizContent'
import FoundationNoteExample from './FoundationNoteExample'
import s from './Foundation.module.css'

const labels={
 en:{learn:'Key idea',use:'Try this',next:'Next',exit:'Answer the exit question on your own in Work.'},
 es:{learn:'Idea clave',use:'Prueba esto',next:'Después',exit:'Responde la pregunta final por tu cuenta en Trabajo.'},
 'pt-BR':{learn:'Ideia principal',use:'Tente isto',next:'Depois',exit:'Responda à questão final por conta própria em Trabalho.'},
}
export default function FoundationReadingGuide({foundation,number,title,step,next}:{foundation:FoundationKey;number:number;title:string;step:string;previous?:string;next?:string}){
 const {t,locale}=useFoundationLanguage(),copy=labels[locale]
 const entry=mapping[foundation].find(item=>item.number===number&&item.title===title)
 const topic=entry?topics[entry.topic as keyof typeof topics]:null
 return <div className={s.guideLesson}>
  {topic&&<><h4>{copy.learn}</h4><QuizContent content={topic.learn[locale]} questionEmphasis/></>}
  <h4>{copy.use}</h4><QuizContent content={t(step)} questionEmphasis/>
  <FoundationNoteExample at="slide" number={number}/>
  {/exit/i.test(title)&&<p>{copy.exit}</p>}
  {next&&<p className={s.guideConnection}>{copy.next}: {t(next)}</p>}
 </div>
}
