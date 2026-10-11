import { notFound } from 'next/navigation'
import ClassDayPlayer from '@/components/teaching-tools/ClassDayPlayer'
import { classDayTool } from '@/lib/class-day-tools'

export default async function ClassDayToolPage({ params, searchParams }: {
  params: Promise<{ day: string }>
  searchParams: Promise<{ class?: string; unit?: string }>
}) {
  const [{ day }, query] = await Promise.all([params, searchParams])
  const tool = /^[1-9]\d*$/.test(day) ? classDayTool(query.unit ?? 'unit-1', Number(day)) : null
  if (!tool) notFound()
  return <ClassDayPlayer tool={tool} courseId={query.class ?? ''} />
}
