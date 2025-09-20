"use client"
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useActivityTracking } from '@/contexts/StudentActivityContext'

interface LessonActivityTrackerProps {
  lessonId: string
  children: React.ReactNode
}

export default function LessonActivityTracker({ lessonId, children }: LessonActivityTrackerProps) {
  const { data: session } = useSession()
  const { recordLessonView } = useActivityTracking()
  const startTimeRef = useRef<number>(Date.now())
  const hasRecordedView = useRef<boolean>(false)

  // Record lesson view on mount
  useEffect(() => {
    if (session?.user?.email && !hasRecordedView.current) {
      recordLessonView(lessonId)
      hasRecordedView.current = true
      startTimeRef.current = Date.now()
    }
  }, [session, lessonId, recordLessonView])

  // Record session duration on unmount
  useEffect(() => {
    return () => {
      if (session?.user?.email && hasRecordedView.current) {
        const sessionDuration = Math.floor((Date.now() - startTimeRef.current) / 1000)
        if (sessionDuration > 10) { // Only record if spent more than 10 seconds
          recordLessonView(lessonId, sessionDuration)
        }
      }
    }
  }, [session, lessonId, recordLessonView])

  // Record periodic activity (every 2 minutes of active viewing)
  useEffect(() => {
    if (!session?.user?.email) return

    let lastActivity = Date.now()
    let totalTime = 0

    const handleActivity = () => {
      lastActivity = Date.now()
    }

    const trackActivity = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity
      
      // If less than 30 seconds since last activity, count as active time
      if (timeSinceLastActivity < 30000) {
        totalTime += 30 // Add 30 seconds
        
        // Record activity every 2 minutes
        if (totalTime % 120 === 0 && totalTime > 0) {
          recordLessonView(lessonId, totalTime)
        }
      }
    }

    // Track mouse movement, scrolling, and keyboard activity
    const events = ['mousemove', 'scroll', 'keydown', 'click', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Check activity every 30 seconds
    const interval = setInterval(trackActivity, 30000)

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      clearInterval(interval)
    }
  }, [session, lessonId, recordLessonView])

  return <>{children}</>
}
