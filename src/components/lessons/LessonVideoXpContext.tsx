'use client'
import { createContext, useContext } from 'react'

export const LessonVideoXpContext = createContext<{
  lessonId: string
  enabled: boolean
  onXpTotal: (xp: number) => void
} | null>(null)

export const useLessonVideoXp = () => useContext(LessonVideoXpContext)
