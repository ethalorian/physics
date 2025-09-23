"use client"

// React/Next.js imports
import { createContext, useContext, useState, useEffect } from "react"

// Internal imports
import { usePermissions } from "@/hooks/usePermissions"

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
  const [viewMode, setViewMode] = useState<ViewMode>('admin')
  
  // Only admins and teachers can toggle views
  const canToggleView = canAccessAdmin || userRole === 'teacher'
  
  // Check if current view mode is different from user's default role
  const isViewModeOverride = canToggleView && viewMode === 'student'
  
  // Initialize view mode based on user role
  useEffect(() => {
    if (canAccessAdmin) {
      // Admins default to admin view
      setViewMode('admin')
    } else if (userRole === 'teacher') {
      // Teachers default to admin view (they have most admin permissions)
      setViewMode('admin')
    } else {
      // Students always see student view
      setViewMode('student')
    }
  }, [canAccessAdmin, userRole])
  
  // Toggle between admin and student view
  const toggleViewMode = () => {
    if (!canToggleView) return
    
    setViewMode(prevMode => prevMode === 'admin' ? 'student' : 'admin')
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

