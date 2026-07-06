"use client"

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Lock, RefreshCw } from 'lucide-react'

// The test-credentials login moved here from /auth/signin so test passwords
// and the credentials form never ship in the production sign-in bundle.
// The wrapping page 404s outside development.

const TEST_ACCOUNTS = [
  { label: 'Student Account', email: 'student@test.com', password: 'student123' },
  { label: 'Teacher Account', email: 'teacher@test.com', password: 'teacher123' },
  { label: 'Admin Account', email: 'admin@test.com', password: 'admin123' },
]

function DevLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/home'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const doSignIn = async (e: string, p: string) => {
    setErr('')
    setBusy(true)
    try {
      const result = await signIn('test-credentials', { email: e, password: p, callbackUrl, redirect: false })
      if (result?.error) { setErr('Invalid email or password'); setBusy(false) }
      else if (result?.ok) router.push(callbackUrl)
    } catch {
      setErr('An error occurred during sign-in')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <Card className="w-full max-w-md p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold">Dev test login</h1>
          <p className="text-sm text-muted-foreground mt-1">Development only — this route 404s in production.</p>
        </div>

        {err && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">{err}</div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Quick login:</p>
          <div className="grid gap-2">
            {TEST_ACCOUNTS.map((a) => (
              <Button key={a.email} onClick={() => doSignIn(a.email, a.password)} disabled={busy} variant="outline" className="justify-start" size="sm">
                <User className="w-4 h-4 mr-2" /> {a.label}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); doSignIn(email, password) }} className="space-y-3 pt-2 border-t">
          <p className="text-sm font-medium">Or enter credentials manually:</p>
          <div className="space-y-2">
            <Label htmlFor="dev-email">Email</Label>
            <Input id="dev-email" type="text" placeholder="student@test.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dev-password">Password</Label>
            <Input id="dev-password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} />
          </div>
          <Button type="submit" disabled={busy || !email || !password} className="w-full" size="sm">
            {busy ? (<><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Signing in…</>) : (<><Lock className="w-4 h-4 mr-2" /> Sign in with test account</>)}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default function DevLoginForm() {
  return (
    <Suspense fallback={null}>
      <DevLoginContent />
    </Suspense>
  )
}
