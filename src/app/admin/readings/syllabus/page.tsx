import { Suspense } from 'react'
import ReadingDashboard from '@/components/readings/ReadingDashboard'
import { Spinner } from '@/components/ui/spinner'

export default function Page() { return <Suspense fallback={<Spinner />}><ReadingDashboard initialView="syllabus" /></Suspense> }
