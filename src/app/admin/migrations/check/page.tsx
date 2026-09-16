'use client'

import { Spinner } from '@/components/ui/spinner'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MigrationCheckPage() {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<any>(null)

  const checkMigration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/check-migration')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error checking migration:', error)
      setResults({ overall: 'error', error: 'Could not connect to API' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkMigration()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" className="text-primary" />
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Migration Successful</Badge>
      case 'tables-exist-no-data':
        return <Badge className="bg-reward/15 text-foreground"><XCircle className="h-3 w-3 mr-1" />Tables Exist, No Data</Badge>
      case 'migration-not-run':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Migration Not Run</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Migration Status Check</h1>
          <p className="text-muted-foreground">
            Verify database tables and seed data
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkMigration} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/migrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overall Status</CardTitle>
            {getStatusBadge(results?.overall)}
          </div>
        </CardHeader>
        <CardContent>
          {results?.overall === 'success' && (
            <div className="bg-success/10 p-4 rounded-lg">
              <p className="text-success font-medium">✅ Migration completed successfully!</p>
              <p className="text-success text-sm mt-2">
                All tables exist and {results.simulations?.length || 0} simulations are seeded.
              </p>
            </div>
          )}

          {results?.overall === 'tables-exist-no-data' && (
            <div className="bg-reward/10 p-4 rounded-lg">
              <p className="text-foreground font-medium">⚠️ Tables exist but no simulations found</p>
              <p className="text-foreground text-sm mt-2">
                The migration may have partially run. Try running it again.
              </p>
            </div>
          )}

          {results?.overall === 'migration-not-run' && (
            <div className="bg-destructive/10 p-4 rounded-lg">
              <p className="text-destructive font-medium">❌ Migration has not been run</p>
              <p className="text-destructive text-sm mt-2">
                Please run the migration SQL in Supabase Dashboard.
              </p>
              <Button asChild className="mt-3">
                <Link href="/admin/migrations">
                  Run Migration Now
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tables Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {results?.tables && Object.entries(results.tables).map(([table, info]: [string, any]) => (
              <div key={table} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {info.exists ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <code className="text-sm font-mono">{table}</code>
                </div>
                <div className="flex items-center gap-3">
                  {info.exists && (
                    <span className="text-sm text-muted-foreground">
                      {info.count} rows
                    </span>
                  )}
                  <Badge variant={info.exists ? 'default' : 'destructive'}>
                    {info.exists ? 'Exists' : 'Missing'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulations Data */}
      {results?.simulations && results.simulations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Seeded Simulations ({results.simulations.length})</CardTitle>
              {results.simulations.length < 4 && (
                <Button
                  size="sm"
                  onClick={async () => {
                    const res = await fetch('/api/admin/seed-missing-simulations', { method: 'POST' })
                    const data = await res.json()
                    alert(data.message || 'Done!')
                    checkMigration()
                  }}
                >
                  Add Missing Sims
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {results.simulations.length < 4 && (
              <div className="mb-4 p-3 bg-reward/10 border border-reward/40 rounded-lg">
                <p className="text-sm text-foreground">
                  ⚠️ Expected 4 simulations, found {results.simulations.length}.
                  Click &quot;Add Missing Sims&quot; to fix.
                </p>
              </div>
            )}
            <div className="space-y-2">
              {results.simulations.map((sim: any) => (
                <div key={sim.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{sim.title}</div>
                    <code className="text-xs text-muted-foreground">{sim.slug}</code>
                  </div>
                  <Badge variant={sim.published ? 'default' : 'secondary'}>
                    {sim.published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="mt-6 bg-primary/10 border-primary/40">
        <CardHeader>
          <CardTitle className="text-primary">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="text-primary space-y-2 text-sm">
          {results?.overall === 'success' ? (
            <>
              <p>✅ You&apos;re all set! You can now:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Manage simulations at <Link href="/admin/simulations" className="underline">/admin/simulations</Link></li>
                <li>View analytics at <Link href="/admin/simulations/analytics" className="underline">/admin/simulations/analytics</Link></li>
                <li>Students can access at <Link href="/simulations" className="underline">/simulations</Link></li>
              </ul>
            </>
          ) : (
            <>
              <p>To complete setup:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Run the migration SQL in Supabase Dashboard</li>
                <li>Come back here and click Refresh</li>
                <li>Verify all tables show as &quot;Exists&quot;</li>
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
