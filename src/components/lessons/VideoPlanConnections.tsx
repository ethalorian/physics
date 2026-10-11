import Link from 'next/link'
import { videoPlanConnections } from '@/data/asteroid-video-support'
import { lessonContextHref } from '@/lib/lesson-release'

export default function VideoPlanConnections({sequences,classId}:{sequences:number[];classId?:string}) {
 const connections=sequences.flatMap(videoPlanConnections)
 const units=[...new Set(connections.map(c=>c.unit))]
 if(!connections.length)return null
 return <section aria-label="Video support in Asteroid course plans" className="space-y-3 rounded-xl border bg-card p-4">
   <h3 className="font-semibold">Where this supports the Asteroid course</h3>
   <p className="text-sm text-muted-foreground">Use this video for direct instruction or a focused review, then apply the idea in class. Open a course plan to see when and how to use it.</p>
   {units.map(unit=><div key={unit}><p className="text-sm font-medium">Unit {unit.replace('unit-','')}</p><div className="flex flex-wrap gap-2">{[...new Set(connections.filter(c=>c.unit===unit).map(c=>c.day))].map(day=><Link key={day} className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm underline" href={lessonContextHref('/admin/teacher/plans',{class:classId,unit,day})}>Class day {day}</Link>)}</div></div>)}
   <p className="text-xs text-muted-foreground">Video numbers are independent of class days. These links do not change class access.</p>
 </section>
}
