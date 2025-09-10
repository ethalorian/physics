"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, RefreshCw, Search, Download, UserCheck, GraduationCap, Grid3x3, List } from 'lucide-react'
import { initializeGoogleClassroomAuth, googleClassroomAPI } from '@/lib/google-classroom'

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
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    // Only initialize with real data when connected
    if (isConnected && courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id)
    }
  }, [isConnected, courses, selectedCourse])

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse)
    }
  }, [selectedCourse])

  const connectToGoogleClassroom = async () => {
    setLoading(true)
    try {
      // Clear any existing tokens to force re-authentication with new scopes
      const accessToken = await initializeGoogleClassroomAuth()
      googleClassroomAPI.setAccessToken(accessToken)
      
      // Fetch courses to verify connection
      const courses = await googleClassroomAPI.getCourses()
      setCourses(courses.map(course => ({
        id: course.id,
        name: course.name,
        section: course.section || 'No section',
        studentCount: 0 // Will be updated when students are fetched
      })))
      
      if (courses.length > 0) {
        setSelectedCourse(courses[0].id)
      }
      
      setIsConnected(true)
      alert('Connected to Google Classroom successfully!')
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
      
      alert(errorMessage)
      console.error('Google Classroom connection error:', error)
      console.error('📋 To fix OAuth issues, visit: https://console.cloud.google.com/apis/credentials/consent')
      console.error('📋 To enable Google Classroom API: https://console.cloud.google.com/apis/library/classroom.googleapis.com')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async (courseId: string) => {
    setLoading(true)
    try {
      if (isConnected) {
        // Fetch from Google Classroom API
        const classroomStudents = await googleClassroomAPI.getStudents(courseId)
        
        // Debug: Log the raw data from Google Classroom
        console.log('Raw Google Classroom students data:', classroomStudents)
        
        const formattedStudents: Student[] = classroomStudents.map(student => {
          // Debug: Log individual student data
          console.log('Processing student - Full profile:', student.profile)
          console.log('Looking for email in:', {
            emailAddress: student.profile?.emailAddress,
            email: student.profile?.email,
            userEmail: student?.email,
            fullStudent: student
          })
          
          // Try multiple possible email field locations
          const email = student.profile?.emailAddress || 
                       student.profile?.email || 
                       student.email ||
                       student.userEmail ||
                       'No email available'
          
          return {
            id: student.userId,
            name: student.profile.name.fullName,
            email: email,
            profilePhoto: student.profile.photoUrl || student.profile?.photoUrl,
            enrollmentState: 'ACTIVE', // Google Classroom API only returns active students
            courseId: courseId
          }
        })
        
        console.log('Formatted students:', formattedStudents)
        setStudents(formattedStudents)
      } else {
        // No data available when not connected
        setStudents([])
      }
    } catch (error) {
      // Show empty state on error
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const refreshStudents = () => {
    if (selectedCourse) {
      fetchStudents(selectedCourse)
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

  const filteredStudents = students.filter(student =>
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
          ) : (
            <>
              <Button variant="outline" onClick={refreshStudents} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6A4C93]">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-[#9A8AC0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#4A1A4A]">{students.length}</div>
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
                  {students.filter(s => s.enrollmentState === 'ACTIVE').length}
                </div>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6A4C93]">
                  Pending Invites
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-[#9A8AC0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#4A1A4A]">
                  {students.filter(s => s.enrollmentState === 'INVITED').length}
                </div>
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
