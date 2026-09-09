import XpRequirements from '@/app/home/XpRequirements'
import Link from 'next/link'

export default function XpPage() {
  return <main className="mx-auto max-w-4xl space-y-6 p-4 py-8 sm:p-8">
    <Link href="/home" className="inline-flex min-h-11 items-center underline">← Home</Link>
    <h1 className="text-3xl font-bold">Your XP: what counts and what you need</h1>
    <XpRequirements full />
    <section className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-bold">How to earn it</h2>
      <ul className="mt-4 list-disc space-y-3 pl-5">
        <li>The starting term minimum is 1,400 XP for standard courses or 1,800 for Honors, qualifying for +5 term-average points. Your personal tracker above shows your teacher’s current rule and dates. Your teacher applies eligible points when finalizing grades.</li>
        <li>Every assigned lesson evidence block displays its XP. Complete and save all required parts to earn that reward once. Drafts and repeat saves don’t pay again.</li>
        <li>A completed answer can earn XP even when it needs correction. Checkpoint correctness and teacher mastery ratings still work separately.</li>
        <li>Standard units plan 500 lesson XP and 200 math XP. Honors units plan 650 lesson XP and 250 math XP. Lesson rewards are divided across the published work assigned to your track.</li>
        <li>Math games and issued math problems share a daily allowance: 10 XP for standard students or 15 for Honors. Practice stays available after that allowance is used.</li>
        <li>Vocabulary games add up to 5 XP per day. The daily spin adds 1–25 XP. These smaller bonuses do not replace the lesson and math earning plan.</li>
        <li>Past earnings and purchases are preserved. Future lesson progress percentages do not award a second completion stipend.</li>
        <li>Your home screen shows the term minimum and whether you have met it. Meeting the minimum makes you eligible for the teacher’s published term-average points; it does not change your mastery ratings.</li>
      </ul>
    </section>
  </main>
}
