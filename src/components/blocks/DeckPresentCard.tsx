'use client'
import LessonTeachLink from '@/components/admin/LessonTeachLink'
/** Every teacher entry uses the shared setup, including historical deck blocks. */
export default function DeckPresentCard({lessonId,title}:{lessonId:string;title:string}){return <section className="rounded-xl border bg-card p-4"><h3 className="font-semibold">{title}</h3><p className="my-3 text-sm text-muted-foreground">Choose rehearsal, slides only, or a live class in Teach.</p><LessonTeachLink lessonId={lessonId}/></section>}
