/**
 * OAuth Scopes
 * Client-safe scope definitions for Google OAuth 2.0
 * These can be imported by client components
 */

/**
 * Gets minimal scopes for initial authentication
 * Best practice: Use incremental authorization
 */
export function getInitialScopes(): string[] {
  return [
    'openid',
    'email',
    'profile'
  ]
}

/**
 * Gets additional scopes for Google Classroom features
 * Best practice: Use incremental authorization - request scopes in context
 */
export function getClassroomScopes(): string[] {
  return [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.profile.emails'
  ]
}

/**
 * Gets scopes for assignment management
 * Best practice: Use incremental authorization - request scopes when needed
 */
export function getAssignmentScopes(): string[] {
  return [
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly'
  ]
}

