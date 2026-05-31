"use client"

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  GraduationCap, 
  Users, 
  Shield, 
  LogOut,
  ChevronRight,
  Zap,
  X,
  Settings2,
  KeyRound
} from 'lucide-react'
import { getUserRole } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// Test accounts configuration - matches auth.ts TEST_USERS
const TEST_ACCOUNTS = [
  {
    email: 'student@test.com',
    password: 'student123',
    role: 'student',
    name: 'Test Student',
    icon: GraduationCap,
    color: 'bg-primary',
    hoverColor: 'hover:bg-primary',
    description: 'Student account',
    shortcut: '1'
  },
  {
    email: 'teacher@test.com',
    password: 'teacher123',
    role: 'teacher',
    name: 'Test Teacher',
    icon: Users,
    color: 'bg-success',
    hoverColor: 'hover:bg-success',
    description: 'Teacher account',
    shortcut: '2'
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    name: 'Test Admin',
    icon: Shield,
    color: 'bg-primary',
    hoverColor: 'hover:bg-primary',
    description: 'Admin account',
    shortcut: '3'
  }
]

export function QuickTestAccountSwitcher() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const currentRole = session?.user?.email ? getUserRole(session.user.email) : null

  useEffect(() => {
    setIsMounted(true)
    // Only show in development environment
    const isDev = process.env.NODE_ENV === 'development' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    setIsDevelopment(isDev)
    
    // Load saved preference
    const saved = localStorage.getItem('dev-switcher-expanded')
    if (saved !== null) {
      setIsExpanded(saved === 'true')
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('dev-switcher-expanded', String(isExpanded))
    }
  }, [isExpanded, isMounted])

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDevelopment) return
      
      // Toggle expanded with Ctrl/Cmd + \
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setIsExpanded(prev => !prev)
        return
      }
      
      // Quick switch with Ctrl/Cmd + number
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault()
        const account = TEST_ACCOUNTS[parseInt(e.key) - 1]
        if (account) {
          handleQuickSwitch(account)
        }
        return
      }
      
      // Quick sign out with Ctrl/Cmd + 0
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        handleSignOut()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDevelopment])

  const handleQuickSwitch = async (account: typeof TEST_ACCOUNTS[0]) => {
    setIsLoading(account.email)
    
    try {
      // Sign out if currently signed in
      if (session) {
        await signOut({ redirect: false })
      }
      
      // Sign in with test account (using the test-credentials provider)
      const result = await signIn('test-credentials', {
        email: account.email,
        password: account.password,
        redirect: false
      })
      
      if (result?.ok) {
        // Navigate to appropriate dashboard
        if (account.role === 'admin' || account.role === 'teacher') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      } else {
        console.error('Sign in failed:', result?.error)
        // For Google OAuth fallback
        signIn('google', { callbackUrl: '/dashboard' })
      }
    } catch (error) {
      console.error('Switch account error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleSignOut = async () => {
    setIsLoading('signout')
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  // Don't render in production
  if (!isDevelopment || !isMounted) return null

  // Collapsed state - just a small floating button
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 left-4 z-[100]">
        <Button
          onClick={() => setIsExpanded(true)}
          size="sm"
          className="bg-gradient-to-r from-primary/15 to-primary/5 hover:from-primary/15 hover:to-primary/5 text-white shadow-lg animate-pulse"
        >
          <Settings2 className="h-4 w-4 mr-1" />
          Dev
        </Button>
      </div>
    )
  }

  // Expanded state - full account switcher
  return (
    <div className="fixed bottom-4 left-4 z-[100] animate-in slide-in-from-left">
      <Card className="w-80 shadow-2xl border-2 border-primary/30/20 bg-background/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Quick Test Accounts
              <Badge variant="outline" className="text-xs">DEV</Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pb-3">
          {/* Current session info */}
          {session && (
            <div className="p-2 bg-muted rounded-lg mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <p className="text-xs font-medium">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{currentRole}</p>
                  </div>
                </div>
                <Badge variant={currentRole === 'admin' ? 'default' : 'secondary'}>
                  {currentRole}
                </Badge>
              </div>
            </div>
          )}

          {/* Quick switch buttons */}
          <div className="space-y-1">
            {TEST_ACCOUNTS.map((account) => {
              const Icon = account.icon
              const isCurrentAccount = session?.user?.email === account.email
              
              return (
                <Button
                  key={account.email}
                  variant={isCurrentAccount ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "w-full justify-start relative group",
                    !isCurrentAccount && "hover:border-primary/30/50"
                  )}
                  onClick={() => handleQuickSwitch(account)}
                  disabled={isLoading !== null || isCurrentAccount}
                >
                  {isLoading === account.email ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  ) : (
                    <Icon className={cn("h-4 w-4 mr-2", account.color, "text-white rounded p-0.5")} />
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.description}</p>
                  </div>
                  <kbd className="hidden group-hover:inline-flex px-1.5 py-0.5 text-xs font-mono bg-muted rounded">
                    ⌘{account.shortcut}
                  </kbd>
                  {isCurrentAccount && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Active
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Sign out button */}
          {session && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
              onClick={handleSignOut}
              disabled={isLoading !== null}
            >
              {isLoading === 'signout' ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-r-transparent" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Sign Out
              <kbd className="ml-auto px-1.5 py-0.5 text-xs font-mono bg-muted rounded">
                ⌘0
              </kbd>
            </Button>
          )}

          {/* Keyboard shortcuts help */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="h-3 w-3" />
                <span>Keyboard Shortcuts:</span>
              </div>
              <div className="ml-5 space-y-0.5">
                <div>⌘1-3: Switch accounts</div>
                <div>⌘0: Sign out</div>
                <div>⌘\: Toggle panel</div>
              </div>
            </div>
          </div>

          {/* Account credentials for easy reference */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-medium">Test Passwords:</p>
              <div className="ml-2">
                <div>Student: <code className="bg-muted px-1 rounded">student123</code></div>
                <div>Teacher: <code className="bg-muted px-1 rounded">teacher123</code></div>
                <div>Admin: <code className="bg-muted px-1 rounded">admin123</code></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
