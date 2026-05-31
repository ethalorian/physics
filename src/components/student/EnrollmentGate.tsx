"use client"

// React/Next.js imports
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// External imports
import { AlertCircle, UserCheck, RefreshCw } from 'lucide-react'

// Internal imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import JoinCourseWithCode from './JoinCourseWithCode'
import { getUserRole } from '@/lib/permissions'

interface EnrollmentGateProps {
  children: React.ReactNode
  forceCheck?: boolean
}

interface EnrollmentStatus {
  hasAccount: boolean
  hasAssignment: boolean
  needsEnrollment: boolean
  student: any
  courses: any[]
}

export default function EnrollmentGate({ children, forceCheck = false }: EnrollmentGateProps) {
  const { data: session } = useSession()
  const [status, setStatus] = useState<EnrollmentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingEnrollment, setCheckingEnrollment] = useState(false)

  const checkEnrollment = async () => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    // Check user role - admins and teachers bypass enrollment check
    const userRole = getUserRole(session.user.email)
    if (userRole === 'admin' || userRole === 'teacher') {
      setStatus({
        hasAccount: true,
        hasAssignment: true, // Bypass enrollment requirement
        needsEnrollment: false,
        student: null,
        courses: []
      })
      setLoading(false)
      return
    }

    setCheckingEnrollment(true)
    try {
      // Call API endpoint to check enrollment
      const response = await fetch('/api/enrollment/status')
      const enrollmentStatus = await response.json()
      
      setStatus(enrollmentStatus)
    } catch (error) {
      console.error('Error checking enrollment:', error)
      // Fallback to unenrolled state on error
      setStatus({
        hasAccount: false,
        hasAssignment: false,
        needsEnrollment: true,
        student: null,
        courses: []
      })
    } finally {
      setLoading(false)
      setCheckingEnrollment(false)
    }
  }

  useEffect(() => {
    checkEnrollment()
  }, [session?.user?.email])

  const handleEnrollmentSuccess = async () => {
    // Immediately recheck enrollment after successful join
    setCheckingEnrollment(true)
    
    // Small delay to ensure database transaction is committed
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      // Call API endpoint to check enrollment
      const response = await fetch('/api/enrollment/status')
      const enrollmentStatus = await response.json()
      
      setStatus(enrollmentStatus)
      
      if (!enrollmentStatus.needsEnrollment) {
        // Force component re-render by updating state
        setLoading(false)
      } else {
        // Try one more time after another delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        const retryResponse = await fetch('/api/enrollment/status')
        const retryStatus = await retryResponse.json()
        setStatus(retryStatus)
      }
    } catch (error) {
      console.error('Error refreshing enrollment:', error)
    } finally {
      setCheckingEnrollment(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-16">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Checking enrollment status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If student has no enrollment, show join interface
  if (status?.needsEnrollment) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Message */}
        <Card className="bg-primary/5 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <UserCheck className="h-6 w-6" />
              Welcome to Physics Classroom!
            </CardTitle>
            <CardDescription className="text-base">
              To get started, you&apos;ll need to join a course using a join code from your teacher.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Next Steps:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Ask your teacher for the course join code</li>
                  <li>Enter the code in the form below</li>
                  <li>Start accessing lessons and assignments!</li>
                </ul>
              </div>
            </div>

            {checkingEnrollment && (
              <div className="text-center py-2">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Updating enrollment...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join Code Form */}
        <JoinCourseWithCode onSuccess={handleEnrollmentSuccess} />

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">How to get a join code:</p>
              <p>Your teacher will provide you with a 6-character code. This code links you to your class and gives you access to lessons and assignments.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Having trouble?</p>
              <p>If your join code isn&apos;t working, check with your teacher to make sure the code is still active and that you&apos;ve entered it correctly.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Already in Google Classroom?</p>
              <p>Your teacher may need to import their roster. Let them know you&apos;ve signed in to Physics Classroom.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Student is enrolled, show normal dashboard
  return (
    <>
      {status?.courses && status.courses.length > 0 && (
        <div className="mb-4">
          <Card className="bg-success/5 border-success/30">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-success" />
                  <p className="text-sm font-medium">
                    Enrolled in {status.courses.length} course{status.courses.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  onClick={checkEnrollment}
                  variant="ghost"
                  size="sm"
                  disabled={checkingEnrollment}
                >
                  {checkingEnrollment ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {children}
    </>
  )
}

