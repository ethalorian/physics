'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OPENSTAX_PDF, OPENSTAX_PHYSICS, honorsPdfPage, honorsReadingUrl, type HonorsReading } from '@/lib/openstax-physics'
const BookPreview = dynamic(()=>import('./ReadingBookPreview'),{ssr:false})

export default function OpenStaxReading({reading,standalone=false}:{reading:HonorsReading;standalone?:boolean}) {
  const [page,setPage]=useState(honorsPdfPage(reading.from))
  return <section className="rounded-lg border border-border bg-card p-4 space-y-4" aria-label="Honors OpenStax reading">
    <div><p className="text-overline text-primary">Honors · {OPENSTAX_PHYSICS.title}</p><h2 className="text-title-3 mt-2">{standalone?'Section':'Sections'} {reading.sections.join(', ')} · {reading.from===reading.to?`p. ${reading.from}`:`pp. ${reading.from}–${reading.to}`}</h2><p className="mt-2 text-muted-foreground">{reading.focus}</p></div>
    <div className="flex flex-wrap gap-2"><Button size="lg" variant="outline" onClick={()=>setPage(honorsPdfPage(reading.from))}>{standalone?'Start section':'Start assigned pages'}</Button>{!standalone&&<Button size="lg" asChild variant="outline"><Link href={honorsReadingUrl(reading)} target="_blank">Open full textbook</Link></Button>}</div>
    <BookPreview chapter={0} page={page} offset={-OPENSTAX_PHYSICS.offset} onPage={setPage} language="en" sourceUrl={OPENSTAX_PDF} sourceTitle={OPENSTAX_PHYSICS.title} fullReader />
    <p className="text-caption text-muted-foreground">{OPENSTAX_PHYSICS.copyright} · <a href={OPENSTAX_PHYSICS.licenseUrl} className="underline" target="_blank" rel="noreferrer">{OPENSTAX_PHYSICS.license}</a>. Original supplied edition, unchanged. <a href={OPENSTAX_PHYSICS.sourceUrl} className="underline" target="_blank" rel="noreferrer">Access for free at openstax.org.</a> Page numbers above are printed book pages.</p>
  </section>
}
