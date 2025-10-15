"use client"

// React/Next.js imports
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// Internal imports
import { PageHeader } from "@/components/ui/page-header"
// import { StudentAssignmentView } from "@/components/assignment-system/StudentAssignmentView" // Removed - migrating to unified hub
import { usePermissions } from "@/hooks/usePermissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AssignmentsPage() {
  const { status } = useSession()
  const { isAuthenticated } = usePermissions()
  const router = useRouter()

  // Loading state
  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-center">Authentication Required</CardTitle>
            <CardDescription className="text-center">
              Please sign in to view your assignments.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PageHeader
        title="My Assignments"
        description="View and complete your assigned work. Track your progress and stay on top of deadlines."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Assignments" }
        ]}
        badge={
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
          </div>
        }
        actions={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        }
      />

      {/* Assignment View Component */}
      <Card>
        <CardHeader>
          <CardTitle>Your Assignments</CardTitle>
          <CardDescription>View and complete your assigned work</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Assignment System Upgrade</h3>
            <p className="text-muted-foreground mb-4">
              We&apos;re migrating to a new unified assignment system with better tracking and features.
            </p>
            <p className="text-sm text-muted-foreground">
              Your teacher will notify you when the new system is ready!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

