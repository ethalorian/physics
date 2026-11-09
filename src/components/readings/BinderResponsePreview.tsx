'use client'

import { useState } from 'react'
import type { BinderSource } from '@/lib/binder-reading'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
import { QuestionPrompt, WrittenResponse } from '@/components/interactive-assignments/QuestionResponse'
import BinderWorkLayout from './BinderWorkLayout'
import styles from './readings.module.css'

export default function BinderResponsePreview({ source, assignment }: { source: BinderSource; assignment: ReadingAssignment }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  return <>
    <header className={styles.hero}><p className="text-overline">Student preview · answers stay in this preview</p>
      <h1 className="text-display">{assignment.title}</h1>
    </header>
    <BinderWorkLayout source={source}>
      <h2 className="text-title-2">Your answers</h2>
      {assignment.questions.map((q, i) => <article key={q.id} className={styles.question}>
        <h3 className="text-title-3">{i + 1}. {q.reference}</h3>
        <QuestionPrompt>{q.prompt}</QuestionPrompt>
        <WrittenResponse label={`Your reasoning · question ${i + 1}`} value={answers[q.id] ?? ''} maxLength={10000}
          onChange={value => setAnswers(previous => ({ ...previous, [q.id]: value }))}/>
      </article>)}
    </BinderWorkLayout>
  </>
}
