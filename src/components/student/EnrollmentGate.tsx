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
import { getStudentEnrollmentStatus } from '@/lib/student-management'
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
      console.log('Admin/Teacher using student view - bypassing enrollment check')
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
      const enrollmentStatus = await getStudentEnrollmentStatus(session.user.email)
      setStatus(enrollmentStatus)
    } catch (error) {
      console.error('Error checking enrollment:', error)
    } finally {
      setLoading(false)
      setCheckingEnrollment(false)
    }
  }

  useEffect(() => {
    checkEnrollment()
  }, [session?.user?.email])

  const handleEnrollmentSuccess = async () => {
    // Recheck enrollment status after successful join
    await checkEnrollment()
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
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2">
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
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
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
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
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

