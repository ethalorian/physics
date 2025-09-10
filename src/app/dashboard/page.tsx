"use client"
import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  FileText, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import StudentLessons from '@/components/student/StudentLessons'
import StudentAssignments from '@/components/student/StudentAssignments'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function StudentDashboard() {
  const { data: session } = useSession()
  const { isAuthenticated, userRole, canAccessAdmin } = usePermissions()
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    // If user is an admin, redirect to admin dashboard
    if (isAuthenticated && canAccessAdmin) {
      router.replace('/admin/dashboard')
    }
  }, [isAuthenticated, canAccessAdmin, router])

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <h2 className="text-2xl font-bold text-[#4A1A4A] mb-4">Authentication Required</h2>
          <p className="text-[#6A4C93] mb-6">Please sign in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  // If admin, show loading while redirect happens
  if (canAccessAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <h2 className="text-2xl font-bold text-[#4A1A4A] mb-4">Redirecting...</h2>
          <p className="text-[#6A4C93]">Taking you to the admin dashboard.</p>
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
              My Dashboard
            </h1>
            <p className="text-lg text-[#6A4C93] mt-2">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-[#9A8AC0]">
              Role: <span className="font-medium text-[#6A4C93] capitalize">{userRole}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
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
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <StudentOverview />
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <StudentLessons />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <StudentAssignments />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Overview component with live data
function StudentOverview() {
  return (
    <div className="space-y-6">
      {/* Progress Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ProgressCard
          title="Lessons Completed"
          icon={<BookOpen className="h-4 w-4 text-[#9A8AC0]" />}
        />
        
        <ProgressCard
          title="Assignments Due"
          icon={<Clock className="h-4 w-4 text-[#9A8AC0]" />}
        />
        
        <ProgressCard
          title="Assignments Completed"
          icon={<CheckCircle className="h-4 w-4 text-[#9A8AC0]" />}
        />
        
        <ProgressCard
          title="Overall Progress"
          icon={<BarChart3 className="h-4 w-4 text-[#9A8AC0]" />}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
      
      {/* Upcoming Deadlines */}
      <UpcomingDeadlines />
    </div>
  )
}

// Progress card component that fetches live data
function ProgressCard({ title, icon }: { title: string, icon: React.ReactNode }) {
  // This would fetch real data from your API
  // For now, we'll return empty state since no placeholder data allowed
  return (
    <Card className="apple-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#6A4C93]">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#4A1A4A]">-</div>
        <p className="text-xs text-[#9A8AC0]">
          No data available
        </p>
      </CardContent>
    </Card>
  )
}

// Recent activity component
function RecentActivity() {
  return (
    <Card className="apple-card">
      <CardHeader>
        <CardTitle className="text-[#4A1A4A]">Recent Activity</CardTitle>
        <CardDescription className="text-[#6A4C93]">
          Your latest interactions with lessons and assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-[#9A8AC0] mb-4" />
          <p className="text-[#6A4C93] text-center">
            No recent activity to display
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Upcoming deadlines component
function UpcomingDeadlines() {
  return (
    <Card className="apple-card">
      <CardHeader>
        <CardTitle className="text-[#4A1A4A]">Upcoming Deadlines</CardTitle>
        <CardDescription className="text-[#6A4C93]">
          Assignment due dates you need to keep track of
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <Clock className="h-12 w-12 text-[#9A8AC0] mb-4" />
          <p className="text-[#6A4C93] text-center">
            No upcoming deadlines
          </p>
        </div>
      </CardContent>
    </Card>
  )
}