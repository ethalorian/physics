'use client'

import LearningScene from '@/components/avatar/LearningScene'
import { useAvatarPortrait } from '@/hooks/useAvatarPortrait'

export default function LessonLearningScene({ title, focus, preview = false }: { title: string; focus: string; preview?: boolean }) {
  const { portrait } = useAvatarPortrait(!preview)
  return <LearningScene title={title} focus={focus || title} portrait={portrait} sampleStudent={preview} />
}
