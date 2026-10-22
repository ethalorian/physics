import type { Metadata } from 'next'
import ComicLibrary from '@/components/comics/ComicLibrary'

export const metadata: Metadata = { title: 'The Reading Room · Antocci Physics', description: 'Explore 2026-XJ, an original full-color physics graphic novel. One book per unit. One installment per day.' }
export default function ComicsPage() { return <ComicLibrary /> }
