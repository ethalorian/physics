import Link from 'next/link'

// One-time setup walkthrough for the simulation-tool migration (long since
// applied). Database changes now go through Supabase migrations directly.
// The route is kept as a notice so any old bookmark lands somewhere sensible.
export default function MigrationsRetiredPage() {
  return (
    <div className="max-w-md mx-auto mt-20 text-center px-4" style={{ color: 'var(--foreground)' }}>
      <div className="rounded-2xl border p-8" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h1 className="text-xl font-semibold tracking-tight mb-2">This setup page has been retired</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          The simulation-tool migration it walked through was applied long ago. Schema changes are managed in <code>supabase/migrations/</code> now.
        </p>
        <Link href="/admin/home" className="inline-block mt-5 text-sm font-semibold rounded-lg px-4 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          Back to the command center
        </Link>
      </div>
    </div>
  )
}
