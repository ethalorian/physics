import {Suspense} from 'react'
import {notFound} from 'next/navigation'
import {missionBySlug} from '@/lib/math-missions/catalog'
import MissionPlayer from '@/components/math-missions/MissionPlayer'
export default async function MissionPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!missionBySlug(slug))notFound();return <Suspense fallback={<p>Opening mission…</p>}><MissionPlayer slug={slug}/></Suspense>}
