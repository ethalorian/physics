import EnrollmentGate from '@/components/EnrollmentGate'
import QuizStudentWork from '@/components/quizzes/QuizStudentWork'
import {auth} from '@/lib/auth'
import {redirect} from 'next/navigation'
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params
 if(!(await auth())?.user)redirect('/auth/signin?callbackUrl='+encodeURIComponent(`/quizzes/${id}`))
 return <EnrollmentGate><QuizStudentWork id={id}/></EnrollmentGate>
}
