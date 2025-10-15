/**
 * Utility functions for managing localStorage
 */

/**
 * Get the size of localStorage in MB
 */
export function getLocalStorageSize(): number {
  let totalSize = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage.getItem(key)?.length || 0
    }
  }
  return totalSize / (1024 * 1024) // Convert to MB
}

/**
 * Clear physics-related data from localStorage
 */
export function clearPhysicsStorage(): void {
  const keysToRemove = [
    'physics-assignments',
    'physics-submissions',
    'physics-temp-data',
    'physics-cache',
    'physics-drafts'
  ]
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key)
      console.log(`Cleared ${key} from localStorage`)
    }
  })
  
  console.log('Physics storage cleared')
}

/**
 * Clear only image data from assignments in localStorage
 */
interface AssignmentData {
  questions?: QuestionData[]
  [key: string]: unknown
}

interface QuestionData {
  scenarioImage?: string | null
  [key: string]: unknown
}

export function clearImageData(): void {
  try {
    const assignments = JSON.parse(localStorage.getItem('physics-assignments') || '[]') as AssignmentData[]
    const cleaned = assignments.map((assignment) => ({
      ...assignment,
      questions: assignment.questions?.map((q) => ({
        ...q,
        scenarioImage: q.scenarioImage?.startsWith('data:image') ? null : q.scenarioImage
      }))
    }))
    
    localStorage.setItem('physics-assignments', JSON.stringify(cleaned))
    console.log('Cleared image data from assignments')
  } catch (error) {
    console.error('Error clearing image data:', error)
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  totalSizeMB: number
  assignmentsSizeMB: number
  submissionsSizeMB: number
  otherSizeMB: number
  percentUsed: number
} {
  const assignmentsSize = (localStorage.getItem('physics-assignments')?.length || 0) / (1024 * 1024)
  const submissionsSize = (localStorage.getItem('physics-submissions')?.length || 0) / (1024 * 1024)
  const totalSize = getLocalStorageSize()
  const otherSize = totalSize - assignmentsSize - submissionsSize
  
  // localStorage typical limit is 5-10MB, we'll assume 5MB for safety
  const maxSizeMB = 5
  const percentUsed = (totalSize / maxSizeMB) * 100
  
  return {
    totalSizeMB: totalSize,
    assignmentsSizeMB: assignmentsSize,
    submissionsSizeMB: submissionsSize,
    otherSizeMB: otherSize,
    percentUsed: Math.min(percentUsed, 100)
  }
}

/**
 * Check if we're approaching storage limits
 */
export function isStorageNearLimit(): boolean {
  const stats = getStorageStats()
  return stats.percentUsed > 80
}

/**
 * Smart cleanup - removes largest items first
 */
export function smartCleanup(): boolean {
  try {
    const stats = getStorageStats()
    
    if (stats.percentUsed < 80) {
      console.log('Storage is within limits, no cleanup needed')
      return false
    }
    
    console.log('Starting smart cleanup...')
    
    // First, clear image data
    clearImageData()
    
    // Check again
    const newStats = getStorageStats()
    if (newStats.percentUsed < 80) {
      console.log('Storage cleaned successfully by removing images')
      return true
    }
    
    // If still over limit, clear old submissions
    try {
      const submissions = JSON.parse(localStorage.getItem('physics-submissions') || '[]')
      // Keep only last 10 submissions
      const recentSubmissions = submissions.slice(-10)
      localStorage.setItem('physics-submissions', JSON.stringify(recentSubmissions))
      console.log('Cleared old submissions')
    } catch (error) {
      console.error('Error clearing submissions:', error)
    }
    
    // Final check
    const finalStats = getStorageStats()
    if (finalStats.percentUsed > 90) {
      console.warn('Storage still near limit after cleanup. Manual intervention may be needed.')
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error during smart cleanup:', error)
    return false
  }
}
