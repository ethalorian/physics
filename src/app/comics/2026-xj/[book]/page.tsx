import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { comicBook, COMIC_BOOKS } from '@/lib/comics'
import ComicReader from '@/components/comics/ComicReader'
import styles from '@/components/comics/comics.module.css'

export function generateStaticParams() { return COMIC_BOOKS.map(book => ({ book: book.slug })) }
export async function generateMetadata({ params }: { params: Promise<{ book: string }> }): Promise<Metadata> {
  const book = comicBook((await params).book)
  return { title: book ? `${book.title} · 2026-XJ` : 'Book not found' }
}
export default async function ComicBookPage({ params }: { params: Promise<{ book: string }> }) {
  const book = comicBook((await params).book)
  if (!book) notFound()
  return <Suspense fallback={<div className={`${styles.world} ${styles.loading}`} role="status">Opening your book…</div>}><ComicReader key={book.slug} book={book} /></Suspense>
}
