import { notFound } from 'next/navigation'
import BinderDailyReader from '@/components/readings/BinderDailyReader'

export default async function BinderPreview({params}:{params:Promise<{edition:string;day:string}>}) {
  const {edition,day}=await params
  if ((edition!=='cpa' && edition!=='honors') || !/^(?:[1-9]|1[0-9]|2[0-2])$/.test(day)) notFound()
  return <main><BinderDailyReader source={{edition,day:Number(day)}} /></main>
}
