import { useSession } from "next-auth/react"
import { getUserRole, getUserPermissions, hasPermission, type UserRole, type UserPermissions } from "@/lib/permissions"

/**
 * Custom hook for checking user permissions
 */
export function usePermissions() {
  const { data: session, status } = useSession()
  
  const userEmail = session?.user?.email
  const userRole: UserRole = getUserRole(userEmail)
  const permissions: UserPermissions = getUserPermissions(userRole)
  
  /**
   * Check if the current user has a specific permission
   */
  const checkPermission = (permission: keyof UserPermissions): boolean => {
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
    userRole,
    isAuthenticated,
    isLoading,
    
    // Permissions object
    permissions,
    
    // Permission checker function
    checkPermission,
    
    // Convenience methods for common checks
    canViewLessons: checkPermission('canViewLessons'),
    canViewAssignments: checkPermission('canViewAssignments'),
    canCreateAssignments: checkPermission('canCreateAssignments'),
    canManageAssignments: checkPermission('canManageAssignments'),
    canAccessAdmin: checkPermission('canAccessAdmin'),
    canCreateLessons: checkPermission('canCreateLessons'),
  }
}
