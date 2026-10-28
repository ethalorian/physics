'use client'
import {useState} from 'react'
import {studentQuiz,type Quiz,type QuizAnswers,type QuizTarget} from '@/lib/quizzes/types'
import {QuestionInput,QuestionPrompt,answerComplete} from './shared'
import s from './Quiz.module.css'
import QuizContent from './QuizContent'
import QuizHeader from './QuizHeader'
import CognitiveProfile from '@/components/admin/CognitiveProfile'
export default function QuizPreview({quiz,targets,onClose}:{quiz:Quiz;targets?:readonly QuizTarget[];onClose:()=>void}){const q=studentQuiz(quiz),[index,setIndex]=useState(0),[answers,setAnswers]=useState<QuizAnswers>({});const question=q.questions[index];return <div className={s.app}><div className={`${s.row} ${s.toolbar}`}><p className={s.previewTag}>Teacher preview · answers are not saved or graded</p><button className={s.secondary} onClick={onClose}>Back to quiz editor</button></div><QuizHeader quiz={q} targets={targets} eyebrow="STUDENT VIEW"><QuizContent content={q.instructions}/></QuizHeader><CognitiveProfile demands={quiz.questions.map(q=>q.demand)}/><nav className={`${s.questionNav} mb-4`} aria-label="Quiz questions">{q.questions.map((q,i)=><button key={q.id} aria-current={i===index?'step':undefined} data-complete={answerComplete(q,answers)} onClick={()=>setIndex(i)}>{i+1}</button>)}</nav>{question&&<section className={`${s.card} ${s.stack}`}><QuestionPrompt question={question} index={index}/><QuestionInput question={question} value={answers[question.id]} onChange={v=>setAnswers(a=>({...a,[question.id]:v}))}/></section>}<p className={s.foot}>Students can revisit answers, save, and review before submitting. Answer guides and correct choices are hidden until a grade is returned.</p></div>}
