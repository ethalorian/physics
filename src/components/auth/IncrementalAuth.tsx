"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { AlertCircle, Lock, CheckCircle } from 'lucide-react'
import { getClassroomScopes, getAssignmentScopes } from '@/lib/oauth-scopes'

interface IncrementalAuthProps {
  feature: 'classroom' | 'assignments' | 'roster'
  onSuccess?: () => void
  onError?: (error: string) => void
  children?: React.ReactNode
}

/**
 * Component to handle incremental authorization for Google OAuth scopes
 * Best practice: Use incremental authorization - request scopes in context
 */
export default function IncrementalAuth({ 
  feature, 
  onSuccess, 
  onError,
  children 
}: IncrementalAuthProps) {
  const { data: session } = useSession()
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Check if we need re-authentication
  if (session?.requiresReauth) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Session Expired
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              {session.tokenError || 'Your session has expired. Please sign in again.'}
            </p>
            <Button 
              onClick={() => window.location.href = '/auth/signin'}
              className="mt-2"
              size="sm"
              variant="outline"
            >
              Sign In Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getScopesForFeature = () => {
    switch (feature) {
      case 'classroom':
        return getClassroomScopes()
      case 'assignments':
        return getAssignmentScopes()
      case 'roster':
        return [
          ...getClassroomScopes(),
          'https://www.googleapis.com/auth/classroom.rosters'
        ]
      default:
        return []
    }
  }

  const getFeatureDescription = () => {
    switch (feature) {
      case 'classroom':
        return {
          title: 'Google Classroom Access',
          description: 'This feature requires access to your Google Classroom courses to sync classes and students.',
          benefits: [
            'View your Google Classroom courses',
            'Access student rosters',
            'Sync student information'
          ]
        }
      case 'assignments':
        return {
          title: 'Assignment Management',
          description: 'This feature requires additional permissions to create and manage assignments in Google Classroom.',
          benefits: [
            'Create assignments in Google Classroom',
            'Track student submissions',
            'Sync grades automatically'
          ]
        }
      case 'roster':
        return {
          title: 'Class Roster Management',
          description: 'This feature requires permission to manage class rosters and student information.',
          benefits: [
            'Import student lists',
            'Manage class enrollments',
            'Access student profiles'
          ]
        }
      default:
        return {
          title: 'Additional Permissions',
          description: 'This feature requires additional permissions.',
          benefits: []
        }
    }
  }

  const handleAuthorize = async () => {
    setIsAuthorizing(true)
    setAuthError(null)

    try {
      // Request additional scopes using Google's OAuth 2.0 endpoint
      const scopes = getScopesForFeature()
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      
      if (!clientId) {
        throw new Error('Google Client ID not configured')
      }

      // Build the authorization URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.append('client_id', clientId)
      authUrl.searchParams.append('redirect_uri', `${window.location.origin}/auth/callback`)
      authUrl.searchParams.append('response_type', 'code')
      authUrl.searchParams.append('scope', scopes.join(' '))
      authUrl.searchParams.append('access_type', 'offline')
      authUrl.searchParams.append('prompt', 'consent')
      authUrl.searchParams.append('include_granted_scopes', 'true')
      
      // Store the current page to return to after authorization
      sessionStorage.setItem('oauth_return_url', window.location.href)
      
      // Redirect to Google's authorization page
      window.location.href = authUrl.toString()
      
    } catch (error) {
      console.error('Authorization error:', error)
      setAuthError(error instanceof Error ? error.message : 'Authorization failed')
      onError?.(error instanceof Error ? error.message : 'Authorization failed')
    } finally {
      setIsAuthorizing(false)
    }
  }

  const featureInfo = getFeatureDescription()

  // If children are provided, wrap them with authorization check
  if (children) {
    return (
      <>
        <div onClick={() => setShowDialog(true)}>
          {children}
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>{featureInfo.title}</span>
              </DialogTitle>
              <DialogDescription>
                {featureInfo.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {featureInfo.benefits.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">This will allow the app to:</p>
                  <ul className="space-y-1">
                    {featureInfo.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={isAuthorizing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAuthorize}
                  disabled={isAuthorizing}
                >
                  {isAuthorizing ? 'Authorizing...' : 'Grant Access'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Standalone authorization button
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            {featureInfo.title}
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            {featureInfo.description}
          </p>
          
          {featureInfo.benefits.length > 0 && (
            <ul className="mt-2 space-y-1">
              {featureInfo.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-700">{benefit}</span>
                </li>
              ))}
            </ul>
          )}
          
          {authError && (
            <p className="text-sm text-red-600 mt-2">{authError}</p>
          )}
          
          <Button
            onClick={handleAuthorize}
            disabled={isAuthorizing}
            size="sm"
            className="mt-3"
          >
            {isAuthorizing ? 'Authorizing...' : 'Grant Access'}
          </Button>
        </div>
      </div>
    </div>
  )
}
