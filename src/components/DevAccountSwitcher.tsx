"use client"

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, 
  GraduationCap, 
  Users, 
  Shield, 
  LogIn, 
  LogOut,
  ChevronDown,
  TestTube,
  Zap,
  Copy,
  Check,
  KeyRound,
  Mail
} from 'lucide-react'
import { getUserRole } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useToast } from '@/providers/toast-provider'

// Test accounts configuration
const TEST_ACCOUNTS = [
  {
    email: 'student.test@example.com',
    password: 'student123',
    role: 'student',
    name: 'Test Student',
    icon: GraduationCap,
    color: 'bg-blue-500',
    shortcuts: '⌘1'
  },
  {
    email: 'teacher.test@example.com',
    password: 'teacher123',
    role: 'teacher',
    name: 'Test Teacher',
    icon: Users,
    color: 'bg-green-500',
    shortcuts: '⌘2'
  },
  {
    email: 'admin.test@example.com',
    password: 'admin123',
    role: 'admin',
    name: 'Test Admin',
    icon: Shield,
    color: 'bg-purple-500',
    shortcuts: '⌘3'
  }
]

export function DevAccountSwitcher() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [showQuickGuide, setShowQuickGuide] = useState(false)

  useEffect(() => {
    // Only show in development environment
    const isDev = process.env.NODE_ENV === 'development' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    setIsDevelopment(isDev)

    // Show quick guide on first visit
    if (isDev && !localStorage.getItem('dev_switcher_seen')) {
      setShowQuickGuide(true)
      localStorage.setItem('dev_switcher_seen', 'true')
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isDevelopment) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        switch(e.key) {
          case '1':
            e.preventDefault()
            copyAccountInfo(TEST_ACCOUNTS[0])
            break
          case '2':
            e.preventDefault()
            copyAccountInfo(TEST_ACCOUNTS[1])
            break
          case '3':
            e.preventDefault()
            copyAccountInfo(TEST_ACCOUNTS[2])
            break
          case '0':
            e.preventDefault()
            handleSignOut()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isDevelopment])

  // Don't render in production
  if (!isDevelopment) return null

  const currentRole = session?.user?.email ? getUserRole(session.user.email) : null

  const copyAccountInfo = async (account: typeof TEST_ACCOUNTS[0]) => {
    try {
      // Copy email to clipboard
      await navigator.clipboard.writeText(account.email)
      setCopiedEmail(account.email)
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedEmail(null), 2000)
      
      showToast({
        title: "Email Copied!",
        description: `${account.email} | Password: ${account.password}`,
        duration: 5000,
      })

      // If not signed in, offer to go to sign in page
      if (!session) {
        setTimeout(() => {
          if (confirm('Go to sign in page?')) {
            signIn('google', { callbackUrl: '/dashboard' })
          }
        }, 500)
      } else {
        // If signed in as different user, offer to sign out first
        if (session.user?.email !== account.email) {
          setTimeout(() => {
            if (confirm(`Sign out of ${session.user?.email} and switch accounts?`)) {
              signOut({ callbackUrl: '/auth/signin' })
            }
          }, 500)
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error)
      showToast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "error",
        duration: 3000,
      })
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <>
      {/* Floating Dev Menu Button */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        {/* Quick Guide Card */}
        {showQuickGuide && (
          <Card className="w-72 shadow-xl animate-in slide-in-from-bottom-5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Dev Account Switcher
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowQuickGuide(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-muted-foreground">Quick shortcuts:</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Student</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">⌘⇧1</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Teacher</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">⌘⇧2</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Admin</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">⌘⇧3</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Sign Out</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">⌘⇧0</kbd>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className={cn(
                "shadow-lg hover:shadow-xl transition-all",
                "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
                "text-white border-0"
              )}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Dev
              {session && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 text-xs bg-white/20 text-white border-0"
                >
                  {currentRole}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              Test Account Switcher
            </DropdownMenuLabel>
            
            {session && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm bg-muted/50 rounded mx-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span className="font-medium">Current Session</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {session.user?.name} ({currentRole})
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {session.user?.email}
                  </div>
                </div>
              </>
            )}
            
            <DropdownMenuSeparator />
            
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Click to copy credentials • Use with Google OAuth test accounts
            </div>
            
            {/* Test Account Options */}
            {TEST_ACCOUNTS.map((account) => {
              const Icon = account.icon
              const isCopied = copiedEmail === account.email
              
              return (
                <DropdownMenuItem
                  key={account.email}
                  onClick={() => copyAccountInfo(account)}
                  className="cursor-pointer py-3"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      account.color,
                      "text-white"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.name}</span>
                        <Badge variant="outline" className="text-xs h-5">
                          {account.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="font-mono">{account.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <KeyRound className="h-3 w-3" />
                        <span className="font-mono">{account.password}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 opacity-50" />
                      )}
                      <DropdownMenuShortcut>
                        {account.shortcuts}
                      </DropdownMenuShortcut>
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })}
            
            <DropdownMenuSeparator />
            
            {/* Sign In/Out Options */}
            {session ? (
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
                <DropdownMenuShortcut>⌘⇧0</DropdownMenuShortcut>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In with Google
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <TestTube className="h-3 w-3" />
                <span>Development Mode Only</span>
              </div>
              <div className="mt-1">
                This switcher only appears in local development.
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}