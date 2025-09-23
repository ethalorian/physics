import { useSession } from "next-auth/react"
import { getUserRole, getUserPermissions, hasPermission, type UserRole, type UserPermissions } from "@/lib/permissions"

/**
 * Enhanced permissions hook that considers view mode override
 * This hook should be used instead of usePermissions when view mode matters
 */
export function useViewAwarePermissions(viewMode?: 'admin' | 'student') {
  const { data: session, status } = useSession()
  
  const userEmail = session?.user?.email
  const actualUserRole: UserRole = getUserRole(userEmail)
  
  // If view mode is 'student', override permissions to student level
  // But only if the user actually has admin/teacher privileges
  const effectiveRole: UserRole = 
    viewMode === 'student' && (actualUserRole === 'admin' || actualUserRole === 'teacher') 
      ? 'student' 
      : actualUserRole
  
  const permissions: UserPermissions = getUserPermissions(effectiveRole)
  
  /**
   * Check if the current user has a specific permission (considering view mode)
   */
  const checkPermission = (permission: keyof UserPermissions): boolean => {
    // In student view mode, always use student permissions
    if (viewMode === 'student' && (actualUserRole === 'admin' || actualUserRole === 'teacher')) {
      const studentPermissions = getUserPermissions('student')
      return studentPermissions[permission]
    }
    
    return hasPermission(userEmail, permission)
  }
  
  /**
   * Check if the current user is authenticated
   */
  const isAuthenticated = status === "authenticated"
  
  /**
   * Check if the current user is loading
   */
  const isLoading = status === "loading"
  
  return {
    // User info
    userEmail,
    userRole: actualUserRole,
    effectiveRole,
    isAuthenticated,
    isLoading,
    
    // Permissions object (reflects effective role)
    permissions,
    
    // Permission checker function (considers view mode)
    checkPermission,
    
    // Convenience methods for common checks (considers view mode)
    canViewLessons: checkPermission('canViewLessons'),
    canViewAssignments: checkPermission('canViewAssignments'),
    canCreateAssignments: checkPermission('canCreateAssignments'),
    canManageAssignments: checkPermission('canManageAssignments'),
    canAccessAdmin: checkPermission('canAccessAdmin'),
    canCreateLessons: checkPermission('canCreateLessons'),
    
    // View mode info
    isViewModeOverride: viewMode === 'student' && (actualUserRole === 'admin' || actualUserRole === 'teacher')
  }
}

