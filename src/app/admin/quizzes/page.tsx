import {Suspense} from 'react'
import QuizTeacher from '@/components/quizzes/QuizTeacher'
export default function Page(){return <Suspense fallback={<p>Loading quiz center…</p>}><QuizTeacher/></Suspense>}
