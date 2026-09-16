'use client'
import {usePathname} from 'next/navigation'
import Link from 'next/link'
import {missionForCode,missionHref,COMPETENCIES,type CompetencyCode} from '@/lib/math-missions/catalog'
export default function MissionLessonLink({code}:{code:string}){const pathname=usePathname(),m=missionForCode(code);return m?<div className="rounded-xl border border-primary/30 bg-primary/10 p-5"><p className="font-semibold">{m.name} · {code}</p><p className="my-2 text-sm">{COMPETENCIES[code as CompetencyCode]} · guided practice with optional help</p><Link className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" href={missionHref(code,pathname)}>Practice this skill →</Link></div>:<p>Choose a valid math competency in the block settings.</p>}
