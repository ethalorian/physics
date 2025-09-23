"use client"
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { AssignmentManager } from '@/components/assignment-system/AssignmentManager'
import { StudentAssignmentView } from '@/components/assignment-system/StudentAssignmentView'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

export default function AssignmentSystemPage() {
  const { data: session, status } = useSession()
  const userRole = getUserRole(session?.user?.email)

  if (status === 'loading') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please sign in to access assignments.</p>
      </div>
    )
  }

  if (userRole === 'student') {
    return <StudentAssignmentView />
  }

  if (userRole !== 'admin' && userRole !== 'teacher') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Access denied. Teacher or admin role required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignment System</h1>
        <p className="text-muted-foreground">
          Manage lesson and homework assignments for your classes
        </p>
      </div>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manage">Manage Assignments</TabsTrigger>
          <TabsTrigger value="student-view">Student View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <AssignmentManager />
        </TabsContent>

        <TabsContent value="student-view">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Student Assignment View</h3>
                  <p className="text-muted-foreground">
                    This is how students see their assignments. You can test the student view here.
                  </p>
                </div>
                <StudentAssignmentView />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Assignment Analytics</h3>
                <p className="text-muted-foreground">
                  Analytics dashboard coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

