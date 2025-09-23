"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Gamepad2
} from 'lucide-react'
import Link from 'next/link'
import AdminNavigation from '@/components/admin/AdminNavigation'

export default function AdminHomePage() {
  const { data: session, status } = useSession()
  
  // Wait for session to load before checking permissions
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  
  // Check if user has admin/teacher access
  const userRole = getUserRole(session?.user?.email)
  if (userRole !== 'admin' && userRole !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Physics Classroom Admin
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Welcome back, {session?.user?.name}! Manage your physics classroom, create engaging content, and track student progress.
        </p>
        
        {/* Role Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Users className="h-3 w-3 mr-1" />
            {userRole === 'admin' ? 'Administrator' : 'Teacher'}
          </Badge>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Students"
          value="24"
          icon={<Users className="h-4 w-4" />}
          trend="+3 this week"
          trendUp={true}
        />
        <StatsCard
          title="Published Lessons"
          value="12"
          icon={<BookOpen className="h-4 w-4" />}
          trend="2 drafts"
          trendUp={false}
        />
        <StatsCard
          title="Assignments"
          value="8"
          icon={<FileText className="h-4 w-4" />}
          trend="3 due this week"
          trendUp={false}
        />
        <StatsCard
          title="Vocabulary Sets"
          value="5"
          icon={<Gamepad2 className="h-4 w-4" />}
          trend="Ready for games"
          trendUp={true}
        />
      </div>

      {/* Main Navigation */}
      <AdminNavigation />

      {/* Recent Activity & Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <RecentActivityCard />
        <SystemStatusCard />
      </div>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend: string
  trendUp: boolean
}

function StatsCard({ title, value, icon, trend, trendUp }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className={`text-xs flex items-center mt-1 ${
          trendUp ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
        }`}>
          {trendUp && <TrendingUp className="h-3 w-3 mr-1" />}
          {trend}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivityCard() {
  const activities = [
    { type: 'assignment', title: 'Motion and Forces Quiz', action: 'submitted', time: '2 hours ago', student: 'John Smith' },
    { type: 'lesson', title: 'Kinematics Lesson 3', action: 'completed', time: '4 hours ago', student: 'Sarah Johnson' },
    { type: 'vocabulary', title: 'Energy Terms', action: 'played game', time: '6 hours ago', student: 'Mike Chen' },
    { type: 'assignment', title: 'Lab Report #2', action: 'submitted', time: '1 day ago', student: 'Emma Wilson' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
        <CardDescription>
          Latest student interactions and submissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`p-1.5 rounded-full ${
                  activity.type === 'assignment' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  activity.type === 'lesson' ? 'bg-green-100 dark:bg-green-900/20' :
                  'bg-purple-100 dark:bg-purple-900/20'
                }`}>
                  {activity.type === 'assignment' && <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
                  {activity.type === 'lesson' && <BookOpen className="h-3 w-3 text-green-600 dark:text-green-400" />}
                  {activity.type === 'vocabulary' && <Gamepad2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {activity.student} {activity.action}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.title}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm" className="w-full">
              View Full Activity Log
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function SystemStatusCard() {
  const statusItems = [
    { label: 'Database Connection', status: 'healthy', icon: CheckCircle, color: 'text-green-600' },
    { label: 'OpenAI API', status: 'healthy', icon: CheckCircle, color: 'text-green-600' },
    { label: 'Student Sessions', status: '24 active', icon: Users, color: 'text-blue-600' },
    { label: 'Storage Usage', status: '68% used', icon: BarChart3, color: 'text-orange-600' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>System Status</span>
        </CardTitle>
        <CardDescription>
          Current system health and usage metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusItems.map((item, index) => {
            const IconComponent = item.icon
            return (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <IconComponent className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {item.status}
                </Badge>
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-blue-900 dark:text-blue-100">
                System Update Available
              </div>
              <div className="text-blue-700 dark:text-blue-300 mt-1">
                New features for vocabulary games and improved analytics are ready to install.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}