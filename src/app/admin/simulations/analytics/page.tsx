'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Clock,
  TrendingUp,
  Brain,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface SimulationStats {
  simulation_id: string
  simulation_title: string
  total_students: number
  total_completions: number
  avg_time_spent: number
  avg_score: number
  completion_rate: number
  ai_hints_avg: number
}

interface StudentActivity {
  id: string
  student_name?: string
  student_email?: string
  simulation_title: string
  started_at: string
  completed_at?: string
  time_spent: number
  score?: number
  passed?: boolean
  ai_hints_used: number
  interactions_count: number
}

export default function SimulationAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [simulationStats, setSimulationStats] = useState<SimulationStats[]>([])
  const [recentActivity, setRecentActivity] = useState<StudentActivity[]>([])

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true)
        
        // Fetch real analytics from API
        const response = await fetch('/api/simulations/analytics')
        
        if (response.ok) {
          const data = await response.json()
          setSimulationStats(data.stats || [])
        } else {
          console.log('Unable to load analytics - showing placeholder data')
          // Fallback to empty state
          setSimulationStats([])
        }

        // TODO: Fetch recent activity
        setRecentActivity([])

      } catch (error) {
        console.error('Error loading analytics:', error)
        setSimulationStats([])
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Simulation Analytics</h1>
            <p className="text-muted-foreground">
              Track student progress and engagement with interactive simulations
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/simulations">
              Manage Simulations
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Simulation Details</TabsTrigger>
          <TabsTrigger value="students">Student Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Simulations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{simulationStats.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active simulations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {simulationStats.reduce((sum, s) => sum + s.total_students, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Unique students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(simulationStats.reduce((sum, s) => sum + s.completion_rate, 0) / simulationStats.length)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Across all simulations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(simulationStats.reduce((sum, s) => sum + s.avg_score, 0) / simulationStats.length)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Overall performance</p>
              </CardContent>
            </Card>
          </div>

          {/* Simulation Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Simulation Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {simulationStats.map((stat) => (
                  <div key={stat.simulation_id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{stat.simulation_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {stat.total_students} students • {stat.total_completions} completed
                        </p>
                      </div>
                      <Badge 
                        variant={stat.completion_rate >= 75 ? 'default' : 'secondary'}
                        className={stat.completion_rate >= 75 ? 'bg-green-600' : ''}
                      >
                        {stat.completion_rate}% completion
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                          <Clock className="h-3 w-3" />
                          Avg Time
                        </div>
                        <div className="text-xl font-bold text-blue-900">
                          {formatTime(stat.avg_time_spent)}
                        </div>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-green-600 mb-1">
                          <CheckCircle className="h-3 w-3" />
                          Avg Score
                        </div>
                        <div className="text-xl font-bold text-green-900">
                          {stat.avg_score}%
                        </div>
                      </div>

                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-purple-600 mb-1">
                          <Brain className="h-3 w-3" />
                          AI Hints
                        </div>
                        <div className="text-xl font-bold text-purple-900">
                          {stat.ai_hints_avg.toFixed(1)}
                        </div>
                      </div>

                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-orange-600 mb-1">
                          <TrendingUp className="h-3 w-3" />
                          Completion
                        </div>
                        <div className="text-xl font-bold text-orange-900">
                          {stat.total_completions}/{stat.total_students}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon: Detailed Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Future features:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-gray-700">
                <li>Time-series graphs of usage over time</li>
                <li>Breakdown by device/configuration used</li>
                <li>Common struggle points identification</li>
                <li>Comparison across class periods</li>
                <li>Individual simulation deep-dive</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Activity Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Student Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No activity data yet</p>
                  <p className="text-sm mt-2">Students will appear here after using simulations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div>
                        <div className="font-medium">{activity.student_name || activity.student_email}</div>
                        <div className="text-sm text-muted-foreground">{activity.simulation_title}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {activity.passed ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {activity.score}%
                          </Badge>
                        ) : activity.completed_at ? (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            {activity.score}%
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            In Progress
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatTime(activity.time_spent)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
