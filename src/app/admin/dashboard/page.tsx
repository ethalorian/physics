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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#4A1A4A] via-[#6A4C93] to-[#9A8AC0] bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-lg text-[#6A4C93] mt-2">
              Manage your physics classroom
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-[#9A8AC0]">
              Logged in as <span className="font-medium text-[#6A4C93]">{userRole}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Lessons
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AdminOverview />

          {/* Quick Actions */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-[#4A1A4A]">Quick Actions</CardTitle>
              <CardDescription className="text-[#6A4C93]">
                Common tasks you can perform
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button 
                onClick={() => setActiveTab('lessons')}
                className="flex items-center gap-2 h-auto p-4 justify-start bg-gradient-to-r from-[#4A1A4A] to-[#6A4C93] hover:from-[#5A2A5A] hover:to-[#7A5CA3]"
              >
                <Plus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Create Lesson</div>
                  <div className="text-xs opacity-90">Add new physics content</div>
                </div>
              </Button>

              <Button 
                onClick={() => setActiveTab('assignments')}
                className="flex items-center gap-2 h-auto p-4 justify-start bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]"
              >
                <Plus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Create Assignment</div>
                  <div className="text-xs opacity-90">Design student tasks</div>
                </div>
              </Button>

              <Button 
                onClick={() => setActiveTab('students')}
                className="flex items-center gap-2 h-auto p-4 justify-start bg-gradient-to-r from-[#9A8AC0] to-[#B19CD9] hover:from-[#AA9AD0] hover:to-[#C1ACE9]"
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
