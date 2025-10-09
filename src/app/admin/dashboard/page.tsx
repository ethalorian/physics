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
  Database,
  BookMarked,
  ArrowRight,
  TrendingUp,
  Settings,
  ExternalLink,
  Eye,
  EyeOff,
  Microscope,
  Target,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import LessonManagement from '@/components/admin/LessonManagement'
import AssignmentManagement from '@/components/admin/AssignmentManagement'
import StudentManagement from '@/components/admin/StudentManagement'
import AdminOverview from '@/components/admin/AdminOverview'
import QuickLessonPreview from '@/components/admin/QuickLessonPreview'
import StudentActivityDashboard from '@/components/admin/StudentActivityDashboard'
import StudentDetailView from '@/components/admin/StudentDetailView'
import Gradebook from '@/components/admin/Gradebook'

// Import student dashboard for view mode
import { lazy, Suspense } from 'react'
const StudentDashboard = lazy(() => import('@/app/dashboard/page'))

export default function AdminDashboard() {
  const { isAuthenticated, canAccessAdmin, userRole } = usePermissions()
  const { toggleViewMode, canToggleView, isViewModeOverride } = useViewMode()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <h2 className="text-2xl font-bold text-[#4A1A4A] mb-4">Authentication Required</h2>
          <p className="text-[#6A4C93] mb-6">Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  if (!canAccessAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#B19CD9] to-[#9A8AC0] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#4A1A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#4A1A4A] mb-4">Access Denied</h2>
          <p className="text-[#6A4C93] mb-2">You don&apos;t have permission to access the admin dashboard.</p>
          <p className="text-sm text-[#9A8AC0]">Your current role: {userRole}</p>
          <p className="text-xs text-[#9A8AC0] mt-1">Only admins can access this page.</p>
        </div>
      </div>
    )
  }

  // If in student view mode, show the student dashboard with integrated toggle
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
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            {isViewModeOverride && (
              <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                Student View
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            {isViewModeOverride 
              ? "Viewing the dashboard as a student would see it"
              : "Manage your physics classroom and monitor student progress"
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {canToggleView && (
            <Button
              onClick={toggleViewMode}
              variant={isViewModeOverride ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isViewModeOverride ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Exit Student View</span>
                  <span className="sm:hidden">Exit</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">View as Student</span>
                  <span className="sm:hidden">Student</span>
                </>
              )}
            </Button>
          )}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Logged in as</span>
            <div className="font-medium text-foreground capitalize">{userRole}</div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Assignments</span>
          </TabsTrigger>
          <TabsTrigger value="gradebook" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Gradebook</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Tools</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AdminOverview />

          {/* Quick Lesson Preview */}
          <div className="grid gap-6 md:grid-cols-2">
            <QuickLessonPreview />
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700">Quick Actions</div>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('content')}
                  className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                >
                  <div className="font-medium text-blue-900">Manage Content</div>
                  <div className="text-xs text-blue-700">View and organize lessons</div>
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                >
                  <div className="font-medium text-purple-900">Assignment System</div>
                  <div className="text-xs text-purple-700">Assign lessons and homework to classes</div>
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                >
                  <div className="font-medium text-green-900">View Students</div>
                  <div className="text-xs text-green-700">Monitor progress and analytics</div>
                </button>
                <a
                  href="/admin/simulations"
                  className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors block"
                >
                  <div className="font-medium text-amber-900 flex items-center gap-2">
                    <Microscope className="h-4 w-4" />
                    Manage Simulations
                  </div>
                  <div className="text-xs text-amber-700">Create and manage physics labs</div>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card 
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              onClick={() => setActiveTab('content')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Management</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Manage</div>
                <p className="text-xs text-muted-foreground">
                  View and organize existing lessons and assignments
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              onClick={() => setActiveTab('assignments')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignment System</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">Assign</div>
                <p className="text-xs text-muted-foreground">
                  Assign lessons and homework to classes and students
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              onClick={() => setActiveTab('students')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Student Analytics</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Monitor</div>
                <p className="text-xs text-muted-foreground">
                  Track student progress and engagement
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              onClick={() => setActiveTab('tools')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teaching Tools</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">Tools</div>
                <p className="text-xs text-muted-foreground">
                  Access advanced teaching resources
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Content Management</h2>
            <p className="text-muted-foreground">View and organize your lessons and assignments</p>
          </div>

          <Tabs defaultValue="lessons" className="space-y-4">
            <TabsList>
              <TabsTrigger value="lessons" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lessons
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Assignments
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="lessons" className="space-y-4">
              <LessonManagement />
            </TabsContent>
            
            <TabsContent value="assignments" className="space-y-4">
              <AssignmentManagement />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Assignments Tab - Now redirects to unified assignment hub */}
        <TabsContent value="assignments" className="space-y-6">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Assignment Hub</CardTitle>
              <CardDescription>
                Complete assignment management has been moved to a dedicated page for better organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    What you can do:
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Create and manage homework assignments
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Assign lessons and homework to classes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      View student submissions and grade work
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Track assignment analytics and progress
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">Quick Links:</h3>
                  <div className="space-y-2">
                    <Button asChild className="w-full justify-start" size="lg">
                      <a href="/admin/assignments">
                        <Target className="h-5 w-5 mr-2" />
                        Go to Assignment Hub
                        <ArrowRight className="h-5 w-5 ml-auto" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <a href="/admin/assignments/create">
                        <Sparkles className="h-5 w-5 mr-2" />
                        Create New Homework
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gradebook Tab */}
        <TabsContent value="gradebook" className="space-y-6">
          <Gradebook />
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          {selectedStudent ? (
            <StudentDetailView 
              studentEmail={selectedStudent} 
              onBack={() => {
                setSelectedStudent(null)
              }}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Students</h2>
                  <p className="text-muted-foreground">Monitor student progress and engagement</p>
                </div>
              </div>

              <Tabs defaultValue="roster" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="roster" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Class Roster
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="roster" className="space-y-4">
                  <StudentManagement />
                </TabsContent>
                
                <TabsContent value="analytics" className="space-y-4">
                  <StudentActivityDashboard 
                    selectedStudent={selectedStudent || undefined}
                    onStudentSelect={(email) => {
                      setSelectedStudent(email)
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Teaching Tools</h2>
              <p className="text-muted-foreground">Access question bank, vocabulary tools, and integrations</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Question Bank</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Manage</div>
                <p className="text-xs text-muted-foreground">
                  Physics questions and assessments
                </p>
                <Button asChild className="w-full mt-4" size="sm">
                  <a href="/admin/question-bank" className="inline-flex items-center gap-2">
                    Open Question Bank
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vocabulary</CardTitle>
                <BookMarked className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Create</div>
                <p className="text-xs text-muted-foreground">
                  Physics terminology and games
                </p>
                <Button asChild className="w-full mt-4" size="sm" variant="outline">
                  <a href="/admin/vocabulary" className="inline-flex items-center gap-2">
                    Manage Vocabulary
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Integrations</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Connect</div>
                <p className="text-xs text-muted-foreground">
                  External teaching tools
                </p>
                <Button className="w-full mt-4" size="sm" variant="outline" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Features</CardTitle>
              <CardDescription>
                Intelligent tools to enhance your teaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <FileText className="h-5 w-5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Question Generation</p>
                    <p className="text-sm text-muted-foreground">
                      Auto-generate physics questions with AI
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <TrendingUp className="h-5 w-5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Smart Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Insights into student learning patterns
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
