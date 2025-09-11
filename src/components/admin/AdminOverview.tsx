"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { BookOpen, FileText, Users, GraduationCap } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface AdminStats {
  totalLessons: number
  totalAssignments: number
  activeAssignments: number
  enrolledStudents: number
}

export default function AdminOverview() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<AdminStats>({
    totalLessons: 0,
    totalAssignments: 0,
    activeAssignments: 0,
    enrolledStudents: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only fetch stats when session is loaded and user is authenticated
    if (status === 'authenticated' && session) {
      fetchAdminStats()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [session, status])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      
      // Initialize stats object
      const newStats = {
        totalLessons: 0,
        totalAssignments: 0,
        activeAssignments: 0,
        enrolledStudents: 0
      }
      
      // Fetch lessons count with better error handling
      try {
        const { count: lessonsCount, error: lessonsError } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('published', true)
        
        if (!lessonsError) {
          newStats.totalLessons = lessonsCount || 0
        }
      } catch (lessonsErr) {
        // Silent error handling
      }

      // Backend functionality disabled for assignments - using mock data
      // try {
      //   const { count: assignmentsCount, error: assignmentsError } = await supabase
      //     .from('assignments')
      //     .select('*', { count: 'exact', head: true })
      //     .eq('published', true)
      //   if (!assignmentsError) {
      //     newStats.totalAssignments = assignmentsCount || 0
      //   }
      // } catch (assignmentsErr) {
      //   // Silent error handling
      // }

      // Mock assignment counts for frontend demo
      newStats.totalAssignments = 3  // Mock total assignments
      newStats.activeAssignments = 2  // Mock active assignments

      setStats(newStats)

    } catch (error) {
      
      // Set default stats on error
      setStats({
        totalLessons: 0,
        totalAssignments: 0,
        activeAssignments: 0,
        enrolledStudents: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="apple-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="apple-card">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-[#6A4C93]">Please sign in to view admin statistics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="apple-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Total Lessons
          </CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalLessons}</div>
          <p className="text-xs text-muted-foreground">
            Published lessons
          </p>
        </CardContent>
      </Card>

      <Card className="apple-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Active Assignments
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.activeAssignments}</div>
          <p className="text-xs text-muted-foreground">
            Not yet due ({stats.totalAssignments} total)
          </p>
        </CardContent>
      </Card>

      <Card className="apple-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Enrolled Students
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.enrolledStudents}</div>
          <p className="text-xs text-muted-foreground">
            {stats.enrolledStudents === 0 ? 'Connect Google Classroom' : 'From Google Classroom'}
          </p>
        </CardContent>
      </Card>

      <Card className="apple-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Content Created
          </CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalLessons + stats.totalAssignments}</div>
          <p className="text-xs text-muted-foreground">
            Total items published
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
