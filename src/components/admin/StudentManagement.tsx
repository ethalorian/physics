"use client"
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, RefreshCw, Search, Download, UserCheck, GraduationCap, Grid3x3, List, Database, Upload } from 'lucide-react'
import { initializeGoogleClassroomAuth, googleClassroomAPI } from '@/lib/google-classroom'
import { useToast } from '@/providers/toast-provider'

interface Student {
  id: string
  name: string
  email: string
  profilePhoto?: string
  enrollmentState: 'ACTIVE' | 'INVITED' | 'DECLINED'
  lastActivity?: string
  courseId: string
}

interface Course {
  id: string
  name: string
  section: string
  studentCount: number
}

export default function StudentManagement() {
  const { data: session } = useSession()
  const { showToast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [importing, setImporting] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [importedStudents, setImportedStudents] = useState<Student[]>([])
  const [showImportedData, setShowImportedData] = useState(false)

  // Define fetchCourses before it's used in useEffect
  const fetchCourses = useCallback(async () => {
    try {
      // Fetch courses from Google Classroom
      const courses = await googleClassroomAPI.getCourses()
      
      // Fetch student counts for each course
      const coursesWithStudentCounts = await Promise.all(
        courses.map(async (course) => {
          try {
            const students = await googleClassroomAPI.getStudents(course.id)
            return {
              id: course.id,
              name: course.name,
              section: course.section || 'No section',
              studentCount: students.length
            }
          } catch (error) {
            console.error(`Failed to fetch students for course ${course.id}:`, error)
            return {
              id: course.id,
              name: course.name,
              section: course.section || 'No section',
              studentCount: 0
            }
          }
        })
      )
      
      setCourses(coursesWithStudentCounts)
      
      if (coursesWithStudentCounts.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesWithStudentCounts[0].id)
      }
      
      return coursesWithStudentCounts
    } catch (error) {
      console.error('Error fetching courses:', error)
      throw error
    }
  }, [selectedCourse])

  // Auto-connect using NextAuth session token
  useEffect(() => {
    if (session?.accessToken && !isConnected) {
      console.log('✅ Found Google access token in session, attempting auto-connect...')
      setLoading(true)
      setAccessToken(session.accessToken)
      googleClassroomAPI.setAccessToken(session.accessToken)
      
      // Try to fetch courses to verify token is valid
      fetchCourses()
        .then(() => {
          setIsConnected(true)
          console.log('✅ Auto-connected successfully!')
        })
        .catch((error) => {
          console.warn('⚠️ Session token expired or invalid, need to reconnect:', error)
          // Token is expired or invalid, clear it and show connect button
          setAccessToken(null)
          setIsConnected(false)
        })
        .finally(() => setLoading(false))
    }
  }, [session?.accessToken, isConnected, fetchCourses])

  useEffect(() => {
    // Only initialize with real data when connected
    if (isConnected && courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id)
    }
  }, [isConnected, courses, selectedCourse])

  const fetchStudents = useCallback(async (courseId: string) => {
    setLoading(true)
    try {
      if (isConnected) {
        console.log('🔍 Fetching Google Classroom students for course:', courseId)
        // Fetch from Google Classroom API
        const classroomStudents = await googleClassroomAPI.getStudents(courseId)
        
        const formattedStudents: Student[] = classroomStudents.map(student => {
          
          // Try multiple possible email field locations
          const email = student.profile?.emailAddress || 
                       'No email available'
          
          // Proxy Google profile photos through our API to avoid CORS issues
          const photoUrl = student.profile.photoUrl || student.profile?.photoUrl
          const proxiedPhotoUrl = photoUrl 
            ? `/api/proxy-image?url=${encodeURIComponent(photoUrl)}`
            : undefined
          
          return {
            id: student.userId,
            name: student.profile.name.fullName,
            email: email,
            profilePhoto: proxiedPhotoUrl,
            enrollmentState: 'ACTIVE', // Google Classroom API only returns active students
            courseId: courseId
          }
        })
        
        console.log('📊 Google Classroom students for course', courseId, ':', formattedStudents.length)
        setStudents(formattedStudents)
      } else {
        // No data available when not connected
        setStudents([])
      }
    } catch {
      // Show empty state on error
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [isConnected])

  const fetchImportedRoster = useCallback(async () => {
    if (!selectedCourse) return

    try {
      console.log('🔍 Fetching imported students for course:', selectedCourse)
      const response = await fetch(`/api/roster/import?course_id=${selectedCourse}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Database API response:', data)
        console.log('📊 Students returned from database:', data.students?.length || 0)
        
        const formattedStudents: Student[] = data.students.map((student: any) => {
          // Proxy Google profile photos through our API to avoid CORS issues
          const photoUrl = student.profile_photo_url
          const proxiedPhotoUrl = photoUrl 
            ? `/api/proxy-image?url=${encodeURIComponent(photoUrl)}`
            : undefined
          
          return {
            id: student.google_user_id,
            name: student.name,
            email: student.email,
            profilePhoto: proxiedPhotoUrl,
            enrollmentState: student.enrollment_state as 'ACTIVE' | 'INVITED' | 'DECLINED',
            courseId: selectedCourse
          }
        })
        
        console.log('📊 Formatted students for course', selectedCourse, ':', formattedStudents.length)
        setImportedStudents(formattedStudents)
        
        // Log comparison for debugging
        console.log('📊 Database vs Google Classroom comparison:')
        console.log('   - Database students:', formattedStudents.length)
        console.log('   - Course ID:', selectedCourse)
      } else {
        console.log('❌ Failed to fetch imported roster:', response.status, response.statusText)
        setImportedStudents([])
      }
    } catch (error) {
      console.error('Error fetching imported roster:', error)
      setImportedStudents([])
    }
  }, [selectedCourse])

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse)
      // Also fetch imported students to update the database count
      fetchImportedRoster()
    }
  }, [selectedCourse, fetchStudents, fetchImportedRoster])

  const connectToGoogleClassroom = async () => {
    setLoading(true)
    try {
      // Clear any existing tokens to force re-authentication with new scopes
      const accessToken = await initializeGoogleClassroomAuth()
      googleClassroomAPI.setAccessToken(accessToken)
      setAccessToken(accessToken)
      
      // Fetch courses to verify connection
      await fetchCourses()
      
      setIsConnected(true)
      showToast({
        title: "Connected Successfully!",
        description: "You're now connected to Google Classroom",
        variant: "success",
        duration: 3000
      })
    } catch (error) {
      let errorMessage = 'Failed to connect to Google Classroom.\n\n'
      
      if (error instanceof Error) {
        if (error.message.includes('Google Client ID not found')) {
          errorMessage += 'Please make sure NEXT_PUBLIC_GOOGLE_CLIENT_ID is set in your environment variables.'
        } else if (error.message.includes('Failed to load Google')) {
          errorMessage += 'Could not load Google Identity Services. Please check your internet connection.'
        } else if (error.message.includes('access_denied') || error.message.includes('Access denied')) {
          errorMessage += '⚠️ Access was denied. To fix this:\n\n'
          errorMessage += '1. Go to Google Cloud Console > APIs & Services > OAuth consent screen\n'
          errorMessage += '2. Add your email as a test user (if app is in testing mode)\n'
          errorMessage += '3. Or publish the app to remove testing restrictions\n'
          errorMessage += '4. Ensure Google Classroom API is enabled\n\n'
          errorMessage += 'Check browser console for details.'
        } else {
          errorMessage += error.message
        }
      } else if (typeof error === 'object' && error !== null) {
        // Handle Google API error objects
        const errorObj = error as Record<string, unknown>
        
        if (errorObj.error === 'access_denied') {
          errorMessage += '⚠️ OAuth Access Denied\n\n'
          errorMessage += 'Quick fix: Add yourself as a test user in Google Cloud Console'
        } else if (errorObj.error) {
          errorMessage += `Google API Error: ${errorObj.error}`
        } else if (errorObj.details) {
          errorMessage += `Details: ${errorObj.details}`
        } else if (errorObj.message) {
          errorMessage += errorObj.message
        } else {
          errorMessage += 'An unknown error occurred.'
        }
      } else {
        errorMessage += 'Please try again.'
      }
      
      showToast({
        title: "Connection Failed",
        description: errorMessage.split('\n')[0], // Show first line in toast
        variant: "error",
        duration: 5000
      })
      console.error('Google Classroom connection error:', error)
      console.error('Full error details:', errorMessage)
      console.error('📋 To fix OAuth issues, visit: https://console.cloud.google.com/apis/credentials/consent')
      console.error('📋 To enable Google Classroom API: https://console.cloud.google.com/apis/library/classroom.googleapis.com')
    } finally {
      setLoading(false)
    }
  }

  const refreshStudents = async () => {
    if (selectedCourse) {
      await fetchStudents(selectedCourse)
      showToast({
        title: "Students Refreshed",
        description: `Updated ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`,
        variant: "success",
        duration: 2000
      })
    }
  }

  const syncRosterData = async () => {
    if (!selectedCourse || !accessToken) {
      showToast({
        title: "Sync Failed",
        description: "Please select a course and ensure you're connected to Google Classroom",
        variant: "error",
        duration: 3000
      })
      return
    }

    setLoading(true)
    try {
      // First refresh from Google Classroom
      await fetchStudents(selectedCourse)
      
      // Then import/sync to database
      await importRosterToDatabase()
      
      showToast({
        title: "Sync Complete",
        description: "Roster data synchronized between Google Classroom and database",
        variant: "success",
        duration: 3000
      })
    } catch (error) {
      console.error('Sync error:', error)
      showToast({
        title: "Sync Failed",
        description: "Failed to synchronize roster data",
        variant: "error",
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const importRosterToDatabase = async () => {
    if (!selectedCourse || !accessToken) {
      showToast({
        title: "Import Failed",
        description: "Please select a course and ensure you're connected to Google Classroom",
        variant: "error",
        duration: 3000
      })
      return
    }

    setImporting(true)
    try {
      const response = await fetch('/api/roster/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          accessToken: accessToken
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Import API error:', errorData)
        
        let errorMessage = errorData.error || 'Failed to import roster'
        if (errorData.hints && errorData.hints.length > 0) {
          errorMessage += '\n\nSuggestions:\n' + errorData.hints.map((hint: string) => `• ${hint}`).join('\n')
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Import result:', result)
      
      showToast({
        title: "Roster Imported Successfully!",
        description: `Imported ${result.studentsSynced}/${result.studentsTotal} students to database`,
        variant: "success",
        duration: 5000
      })

      // Fetch the imported data to display
      await fetchImportedRoster()

    } catch (error) {
      console.error('Roster import error:', error)
      
      let errorMessage = "Failed to import roster to database"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      showToast({
        title: "Import Failed",
        description: errorMessage.split('\n')[0], // Show first line in toast
        variant: "error",
        duration: 8000
      })
      
      // Log full error details for debugging
      console.error('Full error details:', error)
      console.error('📋 Troubleshooting steps:')
      console.error('1. Check if database migration was run successfully')
      console.error('2. Verify Supabase connection is working')
      console.error('3. Check browser network tab for API response details')
      console.error('4. Ensure Google Classroom access token is valid')
    } finally {
      setImporting(false)
    }
  }


  const exportStudentList = () => {
    const csv = [
      'Name,Email,Google Profile Photo,Status,Last Activity,Course ID',
      ...filteredStudents.map(student => 
        `"${student.name}","${student.email}","${student.profilePhoto || 'No photo'}","${student.enrollmentState}","${student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'Never'}","${student.courseId || selectedCourse}"`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students-${selectedCourse}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    showToast({
      title: "Export Complete",
      description: `Exported ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''} to CSV`,
      variant: "success",
      duration: 2000
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case 'INVITED':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Invited</Badge>
      case 'DECLINED':
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const currentStudents = showImportedData ? importedStudents : students
  const filteredStudents = currentStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#4A1A4A]">Student Management</h2>
          <p className="text-[#6A4C93]">View and manage students from Google Classroom</p>
        </div>
        <div className="flex gap-3">
          {!isConnected ? (
            <>
              <Button
                onClick={connectToGoogleClassroom}
                disabled={loading}
                className="bg-gradient-to-r from-[#9A8AC0] to-[#B19CD9] hover:from-[#AA9AD0] hover:to-[#C1ACE9]"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                Connect Google Classroom
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={refreshStudents} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={syncRosterData} 
                disabled={loading || importing || !selectedCourse}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Sync to Database
              </Button>
              <Button 
                onClick={importRosterToDatabase} 
                disabled={importing || loading || !selectedCourse}
                variant="outline"
              >
                {importing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Import Only
              </Button>
              <Button variant="outline" onClick={exportStudentList}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      {!isConnected ? (
        <Card className="apple-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-[#9A8AC0] mb-4" />
            <h3 className="text-lg font-medium text-[#4A1A4A] mb-2">Connect to Google Classroom</h3>
            <p className="text-[#6A4C93] text-center mb-6 max-w-md">
              Connect your Google Classroom account to import student enrollment data and manage your classes.
            </p>
            <Button
              onClick={connectToGoogleClassroom}
              disabled={loading}
              className="bg-gradient-to-r from-[#9A8AC0] to-[#B19CD9] hover:from-[#AA9AD0] hover:to-[#C1ACE9]"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              Connect Google Classroom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Data Source Toggle */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={!showImportedData ? "default" : "outline"}
                size="sm"
                onClick={() => setShowImportedData(false)}
              >
                Google Classroom
              </Button>
              <Button
                variant={showImportedData ? "default" : "outline"}
                size="sm"
                onClick={async () => {
                  setShowImportedData(true)
                  await fetchImportedRoster()
                }}
                disabled={!selectedCourse}
              >
                Database ({importedStudents.length})
              </Button>
            </div>
            {showImportedData && (
              <div className="text-sm text-muted-foreground">
                Showing students imported to database for progress tracking
              </div>
            )}
          </div>

          {/* Course Selection and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} - {course.section} ({course.studentCount} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9A8AC0]" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Students Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6A4C93]">
                  Google Classroom
                </CardTitle>
                <Users className="h-4 w-4 text-[#9A8AC0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#4A1A4A]">{students.length}</div>
                <p className="text-xs text-muted-foreground">Students enrolled</p>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6A4C93]">
                  Database
                </CardTitle>
                <Database className="h-4 w-4 text-[#9A8AC0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#4A1A4A]">{importedStudents.length}</div>
                <p className="text-xs text-muted-foreground">Imported for tracking</p>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6A4C93]">
                  Active Students
                </CardTitle>
                <UserCheck className="h-4 w-4 text-[#9A8AC0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#4A1A4A]">
                  {currentStudents.filter(s => s.enrollmentState === 'ACTIVE').length}
                </div>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6A4C93]">
                  {showImportedData ? 'Sync Status' : 'Pending Invites'}
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-[#9A8AC0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#4A1A4A]">
                  {showImportedData 
                    ? `${Math.round((importedStudents.length / Math.max(students.length, 1)) * 100)}%`
                    : currentStudents.filter(s => s.enrollmentState === 'INVITED').length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {showImportedData ? 'Synced to database' : 'Awaiting response'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A4C93]"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <Card className="apple-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-[#9A8AC0] mb-4" />
                  <h3 className="text-lg font-medium text-[#4A1A4A] mb-2">No students found</h3>
                  <p className="text-[#6A4C93] text-center">
                    {searchTerm ? 'No students match your search criteria.' : 'No students enrolled in this course yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-4">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="apple-card hover:shadow-lg transition-shadow">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16 ring-2 ring-[#E6DCF9] ring-offset-2">
                          <AvatarImage 
                            src={student.profilePhoto} 
                            alt={student.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] text-white font-semibold text-lg">
                            {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#4A1A4A] text-lg">{student.name}</h3>
                          {student.email ? (
                            <p className="text-sm text-[#6A4C93] font-medium mt-1">
                              📧 {student.email}
                            </p>
                          ) : (
                            <p className="text-sm text-red-500 font-medium mt-1">
                              ⚠️ Email not available
                            </p>
                          )}
                          {student.profilePhoto && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Google account connected
                            </p>
                          )}
                          {student.lastActivity && (
                            <p className="text-xs text-[#9A8AC0] mt-1">
                              Last active: {new Date(student.lastActivity).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(student.enrollmentState)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="apple-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F7F2FF] border-b border-[#E6DCF9]">
                      <tr>
                        <th className="text-left p-4 font-semibold text-[#4A1A4A]">Profile</th>
                        <th className="text-left p-4 font-semibold text-[#4A1A4A]">Name</th>
                        <th className="text-left p-4 font-semibold text-[#4A1A4A]">Email</th>
                        <th className="text-left p-4 font-semibold text-[#4A1A4A]">Status</th>
                        <th className="text-left p-4 font-semibold text-[#4A1A4A]">Last Activity</th>
                        <th className="text-left p-4 font-semibold text-[#4A1A4A]">Google Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => (
                        <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                          <td className="p-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={student.profilePhoto} 
                                alt={student.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] text-white text-sm">
                                {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </td>
                          <td className="p-4 font-medium text-[#4A1A4A]">{student.name}</td>
                          <td className="p-4 text-[#6A4C93]">{student.email || 'Not available'}</td>
                          <td className="p-4">{getStatusBadge(student.enrollmentState)}</td>
                          <td className="p-4 text-[#9A8AC0] text-sm">
                            {student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-4">
                            {student.profilePhoto ? (
                              <span className="text-green-600 text-sm">✓ Connected</span>
                            ) : (
                              <span className="text-gray-400 text-sm">Not connected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
