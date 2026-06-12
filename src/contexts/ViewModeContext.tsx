"use client"

// React/Next.js imports
import { createContext, useContext, useState, useEffect } from "react"

// Internal imports
import { usePermissions } from "@/hooks/usePermissions"
import { readStudentViewCookie, setStudentView, clearStudentView } from "@/lib/view-as-shared"

export type ViewMode = 'admin' | 'student'

interface ViewModeContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  isViewModeOverride: boolean
  canToggleView: boolean
  toggleViewMode: () => void
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined)

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const { canAccessAdmin, userRole } = usePermissions()
  const [viewMode, setViewModeState] = useState<ViewMode>('admin')

  // Only admins and teachers can toggle views
  const canToggleView = canAccessAdmin || userRole === 'teacher'

  // Check if current view mode is different from user's default role
  const isViewModeOverride = canToggleView && viewMode === 'student'

  // Initialize view mode: staff default to the staff view, but a persisted
  // "view as student" cookie (set from the avatar menu) keeps them in the
  // student preview across reloads until they exit it. Real students always
  // get the student view — their cookie (if any) is ignored.
  useEffect(() => {
    if (canAccessAdmin || userRole === 'teacher') {
      setViewModeState(readStudentViewCookie() ? 'student' : 'admin')
    } else {
      setViewModeState('student')
    }
  }, [canAccessAdmin, userRole])

  // Single write path: update state AND persist the choice (staff only).
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    if (!canToggleView) return
    if (mode === 'student') setStudentView()
    else clearStudentView()
  }

  // Toggle between admin and student view
  const toggleViewMode = () => {
    if (!canToggleView) return
    setViewMode(viewMode === 'admin' ? 'student' : 'admin')
  }

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        isViewModeOverride,
        canToggleView,
        toggleViewMode
      }}
    >
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const context = useContext(ViewModeContext)
  if (!context) {
    throw new Error('useViewMode must be used within ViewModeProvider')
  }
  return context
}
