'use client'
import Link from 'next/link'
import { useLessonContext } from './useLessonContext'
import { lessonContextHref } from '@/lib/lesson-release'
import { planTeachHref } from '@/lib/course-plan-presentation'
import etfDecks from '@/data/trades-etf-decks.json'
export default function LessonTeachLink({lessonId}:{lessonId:string}){
 const context=useLessonContext()
 const etf=etfDecks.find(deck=>deck.lessonId===lessonId)
 const href=etf?planTeachHref(etf.unitId,etf.day,context.classId??''):lessonContextHref('/admin/command-center',{class:context.classId,lesson:lessonId})
 return <Link className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground" href={href}>Teach</Link>
}
