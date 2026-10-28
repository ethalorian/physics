'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { checkpointScore, type CheckpointAttempt, type CheckpointQuestion } from '@/lib/vocab-checkpoint'
import CheckpointScene from './CheckpointScene'
import s from './checkpoint.module.css'
import {ChoiceResponse,WrittenResponse} from '@/components/interactive-assignments/QuestionResponse'

interface StudentProps {
  state: { title: string; instructions: string }
  attempt: CheckpointAttempt
  onAnswer: (id: string, answer: string) => void
  onSubmit: () => void
  onTeacher?: () => void
  questions: CheckpointQuestion[]
  words: string[]
  busy?: boolean
  saveStatus?: string
}

export function CheckpointStudent({ state, attempt, onAnswer, onSubmit, onTeacher, questions, words, busy = false, saveStatus = 'Answers saved' }: StudentProps) {
  const [stage, setStage] = useState<'intro' | 'rehearse' | 'quiz' | 'confirm'>('intro')
  const [index, setIndex] = useState(0)
  const [rehearsal, setRehearsal] = useState('')
  const [checked, setChecked] = useState(false)
  const prompt = useRef<HTMLHeadingElement>(null)
  const question = questions[index]
  const answered = questions.filter(q => attempt.answers[q.id]?.trim()).length
  const startQuiz = () => { setIndex(Math.max(0,questions.findIndex(q=>!attempt.answers[q.id]?.trim()))); setStage('quiz') }
  useEffect(() => { if (stage === 'quiz') prompt.current?.focus() }, [index, stage])

  if (attempt.submitted) return <div className={s.studentWidth}><Card className={s.finishCard}>
    <CheckCircle2 size={42} className={s.successIcon} /><p className={s.eyebrow}>CHECKPOINT SUBMITTED</p><h1 className="text-title-1">Your thinking is in.</h1>
    <p>Your answers are saved. Your teacher will score the two explanations and release your quiz grade.</p>
    <div className={s.breakdown}><span><Check size={18} /> 8 questions checked automatically</span><span><Clock3 size={18} /> 2 explanations with your teacher</span></div>
    <p className={s.muted}>Your final score will appear after review.</p>
    {onTeacher && <Button size="lg" variant="outline" onClick={onTeacher}>Preview the teacher’s next step <ArrowRight /></Button>}
  </Card></div>

  if (stage === 'intro') return <div className={s.studentWidth}>
    <p className={s.eyebrow}>VOCABULARY CHECKPOINT</p><h1 className="text-display">Put your words to work.</h1><p className={s.lead}>{state.title}</p>
    <Card className={s.introCard}><div className={s.inlineMeta}><span>10 questions</span><span>20 points</span><span>Untimed · save and return</span></div>
      <h2 className="text-title-2">Show what you understand.</h2><p>{state.instructions}</p>
      <div className={s.threeParts}>{[['01','Recognize','4 quick questions'],['02','Interpret','4 real situations'],['03','Explain','2 short responses']].map(([n,t,d])=><div key={n}><span className={s.eyebrow}>{n}</span><strong>{t}</strong><span>{d}</span></div>)}</div>
      <div className={s.chips}>{words.map(w=><span key={w}>{w}</span>)}</div>
      <p className={s.muted}>You can go back and change answers before submitting. Explanations are scored for meaning and use; minor spelling errors won’t cost points.</p>
      <div className={s.actions}><Button size="lg" onClick={startQuiz}>{answered ? 'Resume checkpoint' : 'Start checkpoint'} <ArrowRight /></Button><Button size="lg" variant="outline" onClick={()=>setStage('rehearse')}>Try an ungraded example</Button></div>
    </Card>
  </div>

  if (stage === 'rehearse') return <div className={s.studentWidth}><p className={s.eyebrow}>PRACTICE EXAMPLE · NO POINTS</p><h1 className="text-title-1">Try the kind of thinking you’ll use.</h1><Card className={s.questionCard}>
    <h2 className="text-title-2">Which explanation best shows you understand a vocabulary word?</h2>
    <div className={s.options}>{['Repeat the word without explaining it','Explain its meaning and apply it to a specific example'].map(a=><Button key={a} variant="outline" className={s.option} aria-pressed={rehearsal===a} onClick={()=>{setRehearsal(a);setChecked(false)}}>{a}{rehearsal===a&&<Check />}</Button>)}</div>
    {checked&&<div className={s.guidance} role="status"><strong>{rehearsal==='Explain its meaning and apply it to a specific example'?'Yes—meaning plus an example shows understanding.':'Go beyond repeating the word.'}</strong><p>For example, “a prediction says what I expect will happen; I predict the paper bridge will bend when I add a weight.” Name the meaning, then connect it to the situation.</p></div>}
    <div className={s.actions}><Button size="lg" disabled={!rehearsal} onClick={()=>setChecked(true)}>Check my thinking</Button><Button size="lg" variant="outline" onClick={startQuiz}>Go to checkpoint <ArrowRight /></Button></div>
  </Card></div>

  if (stage === 'confirm') return <div className={s.studentWidth}><p className={s.eyebrow}>ONE LAST LOOK</p><h1 className="text-title-1">Ready to hand it in?</h1><Card className={s.questionCard}>
    <p>{answered} of 10 questions answered. Select any question to review it.</p><div className={s.answerReview}>{questions.map((q,i)=><Button key={q.id} size="lg" variant="outline" onClick={()=>{setIndex(i);setStage('quiz')}}><span>{i+1}. {q.part==='explain'?'Explanation':q.part==='interpret'?'Situation':'Meaning'}</span>{attempt.answers[q.id]?.trim()?<Check size={18}/>:<span>Needs an answer</span>}</Button>)}</div>
    <p className={s.muted}>Submitting locks this attempt. Your teacher reviews your explanations before releasing a final grade.</p>
    <Button size="lg" disabled={busy || answered!==10} onClick={onSubmit}>Submit checkpoint <Check /></Button>
  </Card></div>

  return <div className={s.studentWidth}>
    <div className={s.quizTop}><span>{state.title}</span><span>{answered} of 10 answered</span></div><progress value={answered} max={10} aria-label="Questions answered" className={s.progress}/>
    <div className={s.questionNav} aria-label="Question navigation">{questions.map((q,i)=><Button key={q.id} variant="outline" aria-label={`Question ${i+1}${attempt.answers[q.id]?.trim()?', answered':''}`} aria-current={index===i?'step':undefined} onClick={()=>setIndex(i)}>{i+1}{attempt.answers[q.id]?.trim()&&<span className={s.answerDot}/>}</Button>)}</div>
    <Card className={s.questionCard}>
      <div className={s.between}><p className={s.eyebrow}>{question.part==='recognize'?'01 · RECOGNIZE':question.part==='interpret'?'02 · INTERPRET':'03 · EXPLAIN'}</p><span className={s.badge}>{question.points} {question.points===1?'point':'points'}</span></div>
      <h1 ref={prompt} tabIndex={-1} className="text-title-1">{question.prompt}</h1>
      {question.scene&&<CheckpointScene kind={question.scene}/>}
      {question.options?<ChoiceResponse value={attempt.answers[question.id]} disabled={busy} onChange={v=>onAnswer(question.id,v)} options={question.options.map((o,i)=>({id:String(i),content:o}))}/>:<>
        <div className={s.chips}>{question.words.map(w=><span key={w}>{w}</span>)}</div>
        <WrittenResponse label="Your explanation" maxLength={2000} disabled={busy} value={attempt.answers[question.id]??''} onChange={v=>onAnswer(question.id,v)} help="Explain your choices with evidence from the situation."/>
        <details className={s.support}><summary>Need a sentence starter?</summary><p>{question.frame}</p></details>
        <div className={s.rubricMini}><strong>How this earns 4 points</strong><span>Use accurate meanings, apply them to the situation, and justify your reasoning.</span></div>
      </>}
    </Card>
    <div className={s.quizFooter}><Button size="lg" variant="outline" disabled={index===0} onClick={()=>setIndex(i=>i-1)}><ArrowLeft/> Back</Button><span className={s.muted}>{saveStatus}</span><Button size="lg" onClick={()=>index===9?setStage('confirm'):setIndex(i=>i+1)}>{index===9?'Review & submit':'Next'} <ArrowRight/></Button></div>
  </div>
}

export function CheckpointResult({ state, attempt, questions, gradeLabel='Quiz grade' }: { gradeLabel?:string; state: {title:string}; attempt: CheckpointAttempt; questions: CheckpointQuestion[] }) {
  const score = checkpointScore(questions,attempt)
  if(!attempt.released) return <div className={s.studentWidth}><Card className={s.finishCard}><Clock3 size={40}/><h1 className="text-title-1">{attempt.submitted?'Your grade is on its way.':'Your checkpoint is waiting.'}</h1><p>{attempt.submitted?'Your teacher will release your score after reviewing both explanations.':'Complete your checkpoint to see your results here.'}</p><p className={s.muted}>No missing work or unscored answer is shown as a zero.</p></Card></div>
  return <div className={s.studentWidth}><p className={s.eyebrow}>YOUR CHECKPOINT RESULTS · {attempt.name}</p><h1 className="text-title-1">{state.title}</h1>
    <Card className={s.resultHero}><div><span className={s.muted}>{gradeLabel}</span><div className={s.bigGrade}>{score.percent}<span>%</span></div><p>{score.points} out of {score.possible} points</p></div><div className={s.breakdown}><span><strong>{score.autoPoints} / {score.autoPossible}</strong> Recognize &amp; interpret</span><span><strong>{score.writtenPoints} / {score.writtenPossible}</strong> Explain</span><span><strong>{attempt.knowledge?`${attempt.knowledge} · ${['Not yet','Almost','Got it'][attempt.knowledge-1]}`:'Not rated yet'}</strong> Knowledge mastery · teacher judgment</span></div></Card>
    {attempt.notes._overall&&<Card density="compact"><strong>From your teacher</strong><p>{attempt.notes._overall}</p></Card>}<h2 className="text-title-2">Your feedback</h2><p className={s.muted}>Review the explanation behind each answer, then use the words again.</p>
    <div className={s.stack}>{questions.map((q,i)=>{
      const points=q.part==='explain'?attempt.scores[q.id]:attempt.answers[q.id]===String(q.answer)?q.points:0
      return <Card density="compact" key={q.id}><div className={s.between}><strong>{i+1}. {q.words.join(' · ')}</strong><span className={`${s.badge} ${points===q.points?s.positive:s.attention}`}>{points} / {q.points}</span></div><p>{q.prompt}</p><div className={s.response}><span>Your answer</span><p>{q.options?q.options[Number(attempt.answers[q.id])]:attempt.answers[q.id]}</p></div><p>{q.explanation}</p>{attempt.notes[q.id]&&<div className={s.guidance}><strong>From your teacher</strong><p>{attempt.notes[q.id]}</p></div>}</Card>
    })}</div>
  </div>
}
