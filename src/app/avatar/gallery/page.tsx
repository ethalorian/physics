'use client'

import Link from 'next/link'
import AvatarGallery from '@/components/avatar/AvatarGallery'
import EnrollmentGate from '@/components/EnrollmentGate'
import { Button } from '@/components/ui/button'

export default function GalleryPage() {
  return <EnrollmentGate><div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-title-1">Avatar gallery</h1><p className="mt-2 text-sm text-muted-foreground">Meet the characters in your classroom.</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link href="/home">Home</Link></Button><Button asChild><Link href="/avatar">My avatar</Link></Button></div></header>
    <AvatarGallery />
  </div></EnrollmentGate>
}
