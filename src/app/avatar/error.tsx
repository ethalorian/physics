'use client'
import { Button } from '@/components/ui/button'
export default function AvatarError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-3xl space-y-4 p-6"><h1 className="text-xl font-semibold">Your avatar could not load</h1><p>Your saved avatar is still available. Try loading it again.</p><Button onClick={reset}>Try again</Button></main>
}
