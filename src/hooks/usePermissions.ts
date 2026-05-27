import { useSession } from "next-auth/react"
import { getUserRole, getUserPermissions, type UserRole, type UserPermissions } from "@/lib/permissions"

// ============================================================================
// BASE PERMISSIONS HOOK
// ============================================================================

/**
 * Custom hook for checking user permissions
 * @param viewModeOverride Optional view mode override ('student' to view as student)
 */
export function usePermissions(viewModeOverride?: 'admin' | 'student') {
  const { data: session, status } = useSession()
  
  const userEmail = session?.user?.email
  // Prefer the session-baked role (reflects DB teacher grants); fall back to the
  // hardcoded allowlist if the session predates the role field.
  const actualUserRole: UserRole = (session?.user?.role as UserRole | undefined) ?? getUserRole(userEmail)

  // Determine effective role based on view mode override
  const isElevatedUser = actualUserRole === 'admin' || actualUserRole === 'teacher'
  const isViewModeActive = viewModeOverride === 'student' && isElevatedUser
  const effectiveRole: UserRole = isViewModeActive ? 'student' : actualUserRole

  const permissions: UserPermissions = getUserPermissions(effectiveRole)

  /**
   * Check if the current user has a specific permission (considering view mode).
   * Keyed off the effective ROLE (which honors DB grants), not the email allowlist.
   */
  const checkPermission = (permission: keyof UserPermissions): boolean => {
    return getUserPermissions(effectiveRole)[permission]
  }
  
  return {
    // User info
    userEmail,
    userRole: actualUserRole,
    effectiveRole,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    
    // Permissions
    permissions,
    checkPermission,
    
    // Convenience permission checks
    canViewLessons: checkPermission('canViewLessons'),
    canViewAssignments: checkPermission('canViewAssignments'),
    canCreateAssignments: checkPermission('canCreateAssignments'),
    canManageAssignments: checkPermission('canManageAssignments'),
    canAccessAdmin: checkPermission('canAccessAdmin'),
    canCreateLessons: checkPermission('canCreateLessons'),
    
    // View mode info
    isViewModeOverride: isViewModeActive
  }
}
