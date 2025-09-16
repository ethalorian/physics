"use client"
import { useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  FileText, 
  Users, 
  Plus,
  BarChart3
} from 'lucide-react'
import LessonManagement from '@/components/admin/LessonManagement'
import AssignmentManagement from '@/components/admin/AssignmentManagement'
import StudentManagement from '@/components/admin/StudentManagement'
import AdminOverview from '@/components/admin/AdminOverview'

export default function AdminDashboard() {
  const { isAuthenticated, canAccessAdmin, userRole } = usePermissions()
  const [activeTab, setActiveTab] = useState('overview')

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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground relative">
              Admin Dashboard
              <div className="absolute -bottom-1 sm:-bottom-2 left-0 w-20 sm:w-28 h-0.5 sm:h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-primary mt-1 sm:mt-2">
              Manage your physics classroom
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Logged in as <span className="font-medium text-primary">{userRole}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 sm:max-w-[600px] bg-secondary border border-border p-1 h-auto">
          <TabsTrigger 
            value="overview" 
            className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground hover:bg-primary/10 font-medium transition-all py-2 px-1 text-xs h-14 sm:h-12 sm:flex-row sm:gap-2 sm:text-sm sm:px-3 rounded-md"
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="text-center leading-tight text-[10px] sm:text-xs">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="lessons" 
            className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground hover:bg-primary/10 font-medium transition-all py-2 px-1 text-xs h-14 sm:h-12 sm:flex-row sm:gap-2 sm:text-sm sm:px-3 rounded-md"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="text-center leading-tight text-[10px] sm:text-xs">Lessons</span>
          </TabsTrigger>
          <TabsTrigger 
            value="assignments" 
            className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground hover:bg-primary/10 font-medium transition-all py-2 px-1 text-xs h-14 sm:h-12 sm:flex-row sm:gap-2 sm:text-sm sm:px-3 rounded-md"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="text-center leading-tight text-[10px] sm:text-xs">Assignments</span>
          </TabsTrigger>
          <TabsTrigger 
            value="students" 
            className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground hover:bg-primary/10 font-medium transition-all py-2 px-1 text-xs h-14 sm:h-12 sm:flex-row sm:gap-2 sm:text-sm sm:px-3 rounded-md"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="text-center leading-tight text-[10px] sm:text-xs">Students</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AdminOverview />

          {/* Quick Actions */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-muted-foreground">
                Common tasks you can perform
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Button 
                onClick={() => setActiveTab('lessons')}
                className="flex items-center gap-2 h-auto p-4 justify-start bg-primary hover:bg-primary/80 text-primary-foreground transition-colors"
              >
                <Plus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Create Lesson</div>
                  <div className="text-xs opacity-90">Add new physics content</div>
                </div>
              </Button>

              <Button 
                onClick={() => setActiveTab('assignments')}
                className="flex items-center gap-2 h-auto p-4 justify-start bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors border border-primary/30"
              >
                <Plus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Create Assignment</div>
                  <div className="text-xs opacity-90">Design student tasks</div>
                </div>
              </Button>

              <Button 
                onClick={() => setActiveTab('students')}
                className="flex items-center gap-2 h-auto p-4 justify-start bg-accent hover:bg-accent/80 text-accent-foreground border border-primary/40 transition-colors"
              >
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Manage Students</div>
                  <div className="text-xs opacity-90">View enrolled students</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <LessonManagement />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <AssignmentManagement />
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <StudentManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
