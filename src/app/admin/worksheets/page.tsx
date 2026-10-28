import {Suspense} from 'react'
import WorksheetTeacher from '@/components/worksheets/WorksheetTeacher'
export default function Page(){return <Suspense fallback={<p>Loading worksheets…</p>}><WorksheetTeacher/></Suspense>}
