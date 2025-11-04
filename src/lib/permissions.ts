// User roles and permissions system
export type UserRole = 'student' | 'teacher' | 'admin'

export interface UserPermissions {
  canViewLessons: boolean
  canViewAssignments: boolean
  canCreateAssignments: boolean
  canManageAssignments: boolean
  canAccessAdmin: boolean
  canCreateLessons: boolean
}

// Define admin emails (centralized from admin page)
export const ADMIN_EMAILS = [
  'antoccic@fitchburg.k12.ma.us',
  'craigantocci@gmail.com',
  // Test accounts (only in development)
  ...(process.env.NODE_ENV === 'development' ? [
    'admin@test.com',
    'admin.test@example.com'
  ] : []),
  // Add more admin emails here as needed
]

// Define teacher emails (you can expand this list)
export const TEACHER_EMAILS = [
  ...ADMIN_EMAILS, // Admins are also teachers
  // Test accounts (only in development)
  ...(process.env.NODE_ENV === 'development' ? [
    'teacher@test.com',
    'teacher.test@example.com'
  ] : []),
  // Add teacher-only emails here
]

/**
 * Determine user role based on email
 */
export function getUserRole(email: string | null | undefined): UserRole {
  if (!email) return 'student'
  
  // In development, check for test account patterns
  if (process.env.NODE_ENV === 'development') {
    const lowerEmail = email.toLowerCase()
    
    // Check for test account patterns
    if (lowerEmail.includes('admin.test') || lowerEmail.includes('test.admin')) {
      return 'admin'
    }
    if (lowerEmail.includes('teacher.test') || lowerEmail.includes('test.teacher')) {
      return 'teacher'
    }
    if (lowerEmail.includes('student.test') || lowerEmail.includes('test.student')) {
      return 'student'
    }
    
    // Check environment variable overrides
    if (process.env.NEXT_PUBLIC_TEST_ADMIN_EMAIL === email) return 'admin'
    if (process.env.NEXT_PUBLIC_TEST_TEACHER_EMAIL === email) return 'teacher'
    if (process.env.NEXT_PUBLIC_TEST_STUDENT_EMAIL === email) return 'student'
  }
  
  if (ADMIN_EMAILS.includes(email)) {
    return 'admin'
  }
  
  if (TEACHER_EMAILS.includes(email)) {
    return 'teacher'
  }
  
  return 'student'
}

/**
 * Get user permissions based on their role
 */
export function getUserPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        canViewLessons: true,
        canViewAssignments: true,
        canCreateAssignments: true,
        canManageAssignments: true,
        canAccessAdmin: true,
        canCreateLessons: true,
      }
    
    case 'teacher':
      return {
        canViewLessons: true,
        canViewAssignments: true,
        canCreateAssignments: true,
        canManageAssignments: true,
        canAccessAdmin: false,
        canCreateLessons: false,
      }
    
    case 'student':
    default:
      return {
        canViewLessons: true,
        canViewAssignments: true,
        canCreateAssignments: false,
        canManageAssignments: false,
        canAccessAdmin: false,
        canCreateLessons: false,
      }
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  email: string | null | undefined,
  permission: keyof UserPermissions
): boolean {
  const role = getUserRole(email)
  const permissions = getUserPermissions(role)
  return permissions[permission]
}
