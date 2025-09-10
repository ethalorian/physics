// Google Classroom API integration using Google Identity Services (GIS)
// This file replaces the deprecated gapi.auth2 implementation with the modern GIS library
// Last updated: Fixed authentication issues and environment variable access

export interface GoogleClassroomCourse {
  id: string
  name: string
  section: string
  descriptionHeading?: string
  description?: string
  room?: string
  ownerId: string
  creationTime: string
  updateTime: string
  enrollmentCode?: string
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED'
  alternateLink: string
}

export interface GoogleClassroomStudent {
  courseId: string
  userId: string
  profile: {
    id: string
    name: {
      givenName: string
      familyName: string
      fullName: string
    }
    emailAddress: string
    photoUrl?: string
  }
  studentWorkFolder?: {
    id: string
    name: string
    alternateLink: string
  }
}

export interface GoogleClassroomEnrollment {
  courseId: string
  userId: string
  role: 'STUDENT' | 'TEACHER' | 'OWNER'
  profile: {
    id: string
    name: {
      givenName: string
      familyName: string
      fullName: string
    }
    emailAddress: string
    photoUrl?: string
  }
}

class GoogleClassroomAPI {
  private accessToken: string | null = null
  private readonly baseUrl = 'https://classroom.googleapis.com/v1'

  /**
   * Initialize the Google Classroom API with an access token
   */
  setAccessToken(token: string) {
    this.accessToken = token
  }

  /**
   * Make an authenticated request to the Google Classroom API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    if (!this.accessToken) {
      throw new Error('No access token provided. Please authenticate first.')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Google Classroom API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  /**
   * Get all courses for the authenticated user
   */
  async getCourses(): Promise<GoogleClassroomCourse[]> {
    try {
      const response = await this.makeRequest('/courses?courseStates=ACTIVE') as { courses?: GoogleClassroomCourse[] }
      return response.courses || []
    } catch (error) {
      throw error
    }
  }

  /**
   * Get students enrolled in a specific course
   */
  async getStudents(courseId: string): Promise<GoogleClassroomStudent[]> {
    try {
      // Explicitly request all profile fields including email
      const response = await this.makeRequest(`/courses/${courseId}/students?fields=students(userId,profile(id,name,emailAddress,photoUrl))`) as { students?: GoogleClassroomStudent[] }
      console.log('Google Classroom API response for students:', response)
      return response.students || []
    } catch (error) {
      console.error('Error fetching students:', error)
      throw error
    }
  }

  /**
   * Get teachers for a specific course
   */
  async getTeachers(courseId: string): Promise<GoogleClassroomEnrollment[]> {
    try {
      const response = await this.makeRequest(`/courses/${courseId}/teachers`) as { teachers?: GoogleClassroomEnrollment[] }
      return response.teachers || []
    } catch (error) {
      throw error
    }
  }

  /**
   * Get course information by ID
   */
  async getCourse(courseId: string): Promise<GoogleClassroomCourse> {
    try {
      return await this.makeRequest(`/courses/${courseId}`) as GoogleClassroomCourse
    } catch (error) {
      throw error
    }
  }

  /**
   * Invite a student to a course (requires teacher permissions)
   */
  async inviteStudent(courseId: string, email: string): Promise<unknown> {
    try {
      const invitation = {
        courseId,
        userId: email,
        role: 'STUDENT'
      }
      return await this.makeRequest('/invitations', {
        method: 'POST',
        body: JSON.stringify(invitation)
      })
    } catch (error) {
      throw error
    }
  }
}

// Export a singleton instance
export const googleClassroomAPI = new GoogleClassroomAPI()

/**
 * Initialize Google OAuth for Classroom API access using Google Identity Services (GIS)
 * This should be called when the user wants to connect to Google Classroom
 */
export async function initializeGoogleClassroomAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Load Google OAuth library
    if (typeof window === 'undefined') {
      reject(new Error('Google Classroom auth can only be initialized in the browser'))
      return
    }

    // Check if client ID is available (must use NEXT_PUBLIC_ prefix for client-side access)
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      reject(new Error('Google Client ID not found. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.'))
      return
    }

    // Load Google Identity Services library
    const loadGoogleIdentityServices = () => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeTokenClient
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
      document.head.appendChild(script)
    }

    const initializeTokenClient = () => {
      // Check if google object is available
      if (!window.google || !window.google.accounts) {
        reject(new Error('Google Identity Services not loaded properly'))
        return
      }

      // Initialize the token client
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.rosters https://www.googleapis.com/auth/classroom.profile.emails https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: (response: TokenResponse) => {
          if (response.error) {
            // Provide more detailed error information
            let errorMessage = response.error_description || response.error
            if (response.error === 'access_denied') {
              errorMessage = 'Access denied. Please check: 1) OAuth consent screen is configured, 2) You are added as a test user if app is in testing mode, 3) Google Classroom API is enabled'
            }
            reject(new Error(errorMessage))
          } else {
            resolve(response.access_token)
          }
        },
      })

      // Request access token with prompt to ensure user selection
      tokenClient.requestAccessToken({ prompt: 'select_account' })
    }

    // Check if GIS is already loaded
    if (window.google && window.google.accounts) {
      initializeTokenClient()
    } else {
      loadGoogleIdentityServices()
    }
  })
}

/**
 * Sign out from Google Classroom (revokes the access token)
 */
export async function signOutGoogleClassroom(accessToken?: string): Promise<void> {
  if (typeof window !== 'undefined' && window.google && window.google.accounts && accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      console.log('Access token revoked')
    })
  }
}

// Type declarations for Google Identity Services
declare global {
  interface TokenResponse {
    access_token: string
    expires_in: number
    scope: string
    token_type: string
    error?: string
    error_description?: string
  }

  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: TokenResponse) => void
            error_callback?: (error: unknown) => void
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void
          }
          revoke: (token: string, callback?: () => void) => void
        }
      }
    }
  }
}
