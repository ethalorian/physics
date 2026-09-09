import { withAuth } from '@/lib/api-auth'
import { getMasteryStudentWork } from '@/lib/mastery-student-work'
export const GET = withAuth(getMasteryStudentWork)
