// import { supabase } from '@/lib/supabase'  // Backend disabled
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Backend functionality disabled - keeping frontend only
// async function getSubmissionDetails(assignmentId: string, userId: string) {
//   const { data, error } = await supabase
//     .from('submissions')
//     .select(`
//       *,
//       assignment:assignments(
//         title,
//         total_points,
//         lesson:lessons(title, slug)
//       )
//     `)
//     .eq('assignment_id', assignmentId)
//     .eq('user_id', userId)
//     .single()
// 
//   if (error) throw error
//   return data
// }

export default async function SubmittedPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Note: In a real app, you'd get the user ID from the session
  // For now, we'll assume you have access to it
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Assignment Submitted Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Your assignment has been submitted and saved. You will receive your grade once it has been reviewed.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Submitted at:</span>
              <span className="text-muted-foreground">
                {new Date().toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <Badge variant="default">
                <Clock className="w-3 h-3 mr-1" />
                Awaiting Grade
              </Badge>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Multiple choice and numerical questions have been automatically graded. 
              Written responses will be reviewed by your instructor.
            </p>
            
            <div className="flex gap-3 justify-center">
              <Link href="/assignments">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Button>
              </Link>
              <Link href={`/assignments/${params.id}/results`}>
                <Button>
                  View Results
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

