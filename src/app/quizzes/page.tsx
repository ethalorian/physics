import EnrollmentGate from '@/components/EnrollmentGate'
import QuizStudentList from '@/components/quizzes/QuizStudentList'
import {auth} from '@/lib/auth'
import {redirect} from 'next/navigation'
export default async function Page(){
 if(!(await auth())?.user)redirect('/auth/signin?callbackUrl=/quizzes')
 return <EnrollmentGate><QuizStudentList/></EnrollmentGate>
}
