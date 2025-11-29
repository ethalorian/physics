"use client"
import { useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useViewMode } from '@/contexts/ViewModeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  FileText, 
  Users,
  BarChart3,
  TrendingUp,
  Eye,
  EyeOff,
  Microscope,
  Plus,
  Gamepad2,
  Database,
  RefreshCw
} from 'lucide-react'
import AdminOverview from '@/components/admin/AdminOverview'
import StudentActivityDashboard from '@/components/admin/StudentActivityDashboard'
import StudentDetailView from '@/components/admin/StudentDetailView'
import StudentManagement from '@/components/admin/StudentManagement'
import Gradebook from '@/components/admin/Gradebook'
import GlobalAssignmentHub from '@/components/admin/GlobalAssignmentHub'
import AdminLessonBrowser from '@/components/admin/AdminLessonBrowser'
import Link from 'next/link'

// Import student dashboard for view mode
import { lazy, Suspense } from 'react'
const StudentDashboard = lazy(() => import('@/app/dashboard/page'))

export default function AdminDashboard() {
  const { isAuthenticated, canAccessAdmin, userRole } = usePermissions()
  const { toggleViewMode, canToggleView, isViewModeOverride } = useViewMode()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [studentView, setStudentView] = useState<'activity' | 'roster'>('activity')

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="bg-card border rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  if (!canAccessAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="bg-card border rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-2">You don&apos;t have permission to access the admin dashboard.</p>
          <p className="text-sm text-muted-foreground">Your current role: {userRole}</p>
        </div>
      </div>
    )
  }

  // If in student view mode, show the student dashboard
  if (isViewModeOverride) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <StudentDashboard />
      </Suspense>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your physics classroom
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canToggleView && (
            <Button
              onClick={toggleViewMode}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Student View</span>
            </Button>
          )}
        </div>
      </div>

      {/* Simplified 5-Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Assign</span>
          </TabsTrigger>
          <TabsTrigger value="gradebook" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Grades</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================= */}
        {/* OVERVIEW TAB - Clean summary, no redundancy  */}
        {/* ============================================= */}
        <TabsContent value="overview" className="space-y-6">
          <AdminOverview />
        </TabsContent>

        {/* ============================================= */}
        {/* ASSIGNMENTS TAB - Full hub embedded directly */}
        {/* ============================================= */}
        <TabsContent value="assignments" className="space-y-6">
          <GlobalAssignmentHub defaultTab="all" />
        </TabsContent>

        {/* ============================================= */}
        {/* GRADEBOOK TAB                               */}
        {/* ============================================= */}
        <TabsContent value="gradebook" className="space-y-6">
          <Gradebook />
        </TabsContent>

        {/* ============================================= */}
        {/* STUDENTS TAB - Full student management      */}
        {/* ============================================= */}
        <TabsContent value="students" className="space-y-6">
          {selectedStudent ? (
            <StudentDetailView 
              studentEmail={selectedStudent} 
              onBack={() => setSelectedStudent(null)}
            />
          ) : (
            <>
              {/* View Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Students</h2>
                  <p className="text-sm text-muted-foreground">
                    {studentView === 'activity' ? 'Monitor student progress and engagement' : 'Sync roster from Google Classroom'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={studentView === 'activity' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStudentView('activity')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Activity
                  </Button>
                  <Button
                    variant={studentView === 'roster' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStudentView('roster')}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Roster Sync
                  </Button>
                </div>
              </div>

              {/* Content based on view */}
              {studentView === 'activity' ? (
                <StudentActivityDashboard 
                  selectedStudent={selectedStudent || undefined}
                  onStudentSelect={(email) => setSelectedStudent(email)}
                />
              ) : (
                <StudentManagement />
              )}
            </>
          )}
        </TabsContent>

        {/* ============================================= */}
        {/* CONTENT TAB - All content management         */}
        {/* ============================================= */}
        <TabsContent value="content" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Content Management</h2>
              <p className="text-sm text-muted-foreground">Create and manage all educational content</p>
            </div>
          </div>

          {/* Content Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/assignments/create">
              <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Plus className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-base">Create Assignment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Build homework with questions and AI grading</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/simulations">
              <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Microscope className="h-5 w-5 text-amber-600" />
                    </div>
                    <CardTitle className="text-base">Simulations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Manage interactive physics labs</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/vocabulary">
              <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Gamepad2 className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-base">Vocabulary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Create vocabulary sets for games</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/question-bank">
              <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-base">Question Bank</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Centralized question repository</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Lessons Browser */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lessons
              </CardTitle>
              <CardDescription>View and edit your physics lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminLessonBrowser />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
