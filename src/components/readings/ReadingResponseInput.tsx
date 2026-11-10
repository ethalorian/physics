'use client'

import { WrittenResponse } from '@/components/interactive-assignments/QuestionResponse'
import { isWorkedExample } from '@/lib/worked-example-answer'
import WorkedExampleInput from './WorkedExampleInput'

export default function ReadingResponseInput({ binder, reference, ...props }: {
  binder: boolean; reference: string; id?: string; label: string; value: string; disabled?: boolean
  help?: string; onChange: (value: string) => void
}) {
  return binder && isWorkedExample(reference)
    ? <WorkedExampleInput value={props.value} onChange={props.onChange} disabled={props.disabled}/>
    : <WrittenResponse {...props} maxLength={10000}/>
}
