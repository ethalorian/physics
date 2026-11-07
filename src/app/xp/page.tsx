import XpRequirements from '@/app/home/XpRequirements'
import Link from 'next/link'

export default function XpPage() {
  return <main className="mx-auto max-w-4xl space-y-6 p-4 py-8 sm:p-8">
    <Link href="/home" className="inline-flex min-h-11 items-center underline">← Home</Link>
    <h1 className="text-3xl font-bold">Your XP: what counts and what you need</h1>
    <section className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-bold">Your Physics unit floor</h2><p className="my-2">When your teacher enables unit floors, each assigned mastery activity is worth 10 XP when you submit it. Finish at least 80% to meet the unit floor. Quizzes, labs and transfer tasks have their own grades.</p><Link className="font-semibold underline" href="/home?view=progress#mastery-xp">See my assignments and unit progress →</Link></section>
    <XpRequirements full />
    <section className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-bold">How to earn it</h2>
      <ul className="mt-4 list-disc space-y-3 pl-5">
        <li>The starting term minimum is 1,400 XP for standard courses or 1,800 for Honors, qualifying for +5 term-average points. Your personal tracker above shows your teacher’s current rule and dates. Your teacher applies eligible points when finalizing grades.</li>
        <li>The term bonus tracks total earned XP. Optional practice and games can earn wallet XP without counting toward the Physics unit floor.</li>
        <li>Spending XP does not reduce either your term earnings or the number of mastery assignments you completed.</li>
        <li>Your home screen shows the term minimum and whether you have met it. Meeting the minimum makes you eligible for the teacher’s published term-average points; it does not change your mastery ratings.</li>
      </ul>
    </section>
  </main>
}
