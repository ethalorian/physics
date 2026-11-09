import type { BinderSection } from '@/lib/binder-reading'
import { notFound } from 'next/navigation'
import BinderDailyReader from '@/components/readings/BinderDailyReader'

export default async function BinderPreview({params,searchParams}:{params:Promise<{edition:string;day:string}>;searchParams:Promise<{section?:string|string[]}>}) {
  const {edition,day}=await params
  if ((edition!=='cpa' && edition!=='honors') || !/^(?:[1-9]|1[0-9]|2[0-2])$/.test(day)) notFound()
  const {section}=await searchParams
  const sections: BinderSection[] = ['A', 'B', 'C', 'D', 'E']
  const initialSection = sections.find(letter => letter === section)
  return <main><BinderDailyReader source={{edition,day:Number(day)}} initialSection={initialSection} /></main>
}
