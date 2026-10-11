'use client'

import { useEffect, useState } from 'react'
import { UUID } from '@/lib/vocab-learning'

export function useVocabAssignmentLink() {
  const [taskId, setTaskId] = useState('')
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('task_id') ?? ''
    if (UUID.test(id)) setTaskId(id)
  }, [])
  return { assignmentHref: taskId ? `/vocabulary/work?task_id=${taskId}` : '/vocabulary/work', assigned: Boolean(taskId) }
}
