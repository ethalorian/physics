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
  Mail,
  Sparkles,
  UserCog,
  Keyboard
} from 'lucide-react'
import { getUserRole } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useToast } from '@/providers/toast-provider'
import { useRouter } from 'next/navigation'

// Test accounts configuration
const TEST_ACCOUNTS = [
  {
    email: 'student.test@example.com',
    password: 'student123',
    role: 'student',
    name: 'Test Student',
    icon: GraduationCap,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500/20',
    bgColor: 'bg-blue-500/10',
    shortcuts: '⌘1',
    description: 'Student view with assignments & lessons'
  },
  {
    email: 'teacher.test@example.com',
    password: 'teacher123',
    role: 'teacher',
    name: 'Test Teacher',
    icon: Users,
    color: 'from-green-500 to-green-600',
    borderColor: 'border-green-500/20',
    bgColor: 'bg-green-500/10',
    shortcuts: '⌘2',
    description: 'Teacher view with grading & analytics'
  },
  {
    email: 'admin.test@example.com',
    password: 'admin123',
    role: 'admin',
    name: 'Test Admin',
    icon: Shield,
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-500/20',
    bgColor: 'bg-purple-500/10',
    shortcuts: '⌘3',
    description: 'Admin view with full system access'
  }
]

export function EnhancedDevAccountSwitcher() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [showKeyboardHints, setShowKeyboardHints] = useState(true)
  const [isQuickSwitching, setIsQuickSwitching] = useState(false)

  const currentRole = session?.user?.email ? getUserRole(session.user.email) : null

  useEffect(() => {
    // Only show in development environment
    const isDev = process.env.NODE_ENV === 'development' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    setIsDevelopment(isDev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isDevelopment) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + Shift
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        switch(e.key) {
          case '1':
            e.preventDefault()
            quickSwitch(TEST_ACCOUNTS[0])
            break
          case '2':
            e.preventDefault()
            quickSwitch(TEST_ACCOUNTS[1])
            break
          case '3':
            e.preventDefault()
            quickSwitch(TEST_ACCOUNTS[2])
            break
          case '0':
            e.preventDefault()
            handleSignOut()
            break
          case 'd':
            e.preventDefault()
            setIsExpanded(prev => !prev)
            break
        }
      }
      // Quick toggle with just backtick
      if (e.key === '`' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setIsExpanded(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isDevelopment])

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' })
      toast({
        title: "Signed Out",
        description: "Successfully signed out",
      })
    } catch (error) {
      console.error('Sign out error:', error)
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      })
    }
  }

  const quickSwitch = async (account: typeof TEST_ACCOUNTS[0]) => {
    setIsQuickSwitching(true)
    
    // Sign out current session if exists
    if (session) {
      await signOut({ redirect: false })
    }
    
    // Quick sign in with test account
    toast({
      title: "Switching Account",
      description: `Signing in as ${account.name}...`,
    })
    
    // Copy credentials to clipboard
    await navigator.clipboard.writeText(account.email)
    
    // Redirect to sign in with email prefilled
    signIn('google', { callbackUrl: '/dashboard' })
    
    setTimeout(() => {
      toast({
        title: "Credentials Copied",
        description: `Email: ${account.email} | Password: ${account.password}`,
      })
      setIsQuickSwitching(false)
    }, 1000)
  }

  const copyAccountInfo = async (account: typeof TEST_ACCOUNTS[0]) => {
    const credentials = `Email: ${account.email}\nPassword: ${account.password}`
    await navigator.clipboard.writeText(credentials)
    setCopiedEmail(account.email)
    
    toast({
      title: "Credentials Copied!",
      description: `${account.name} credentials copied to clipboard`,
    })
    
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  if (!isDevelopment) return null

  const currentAccount = session?.user?.email 
    ? TEST_ACCOUNTS.find(acc => acc.email === session.user?.email)
    : null

  return (
    <>
      {/* Floating Action Button - More Prominent */}
      <div className={cn(
        "fixed z-50 transition-all duration-300",
        isExpanded ? "bottom-4 right-4" : "bottom-6 right-6"
      )}>
        {/* Expanded View with Quick Actions */}
        {isExpanded && (
          <Card className="mb-3 w-80 shadow-2xl animate-in slide-in-from-bottom-5 border-2 border-orange-500/20">
            <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/10 to-red-500/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
                  Quick Account Switch
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsExpanded(false)}
                >
                  ×
                </Button>
              </div>
              {session && (
                <CardDescription className="text-xs mt-1">
                  Current: <span className="font-medium">{currentRole}</span> - {session.user?.email}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {/* Quick Switch Buttons */}
              {TEST_ACCOUNTS.map((account) => {
                const Icon = account.icon
                const isActive = session?.user?.email === account.email
                
                return (
                  <Button
                    key={account.email}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "w-full justify-start group",
                      isActive && `bg-gradient-to-r ${account.color} text-white`,
                      !isActive && account.borderColor
                    )}
                    onClick={() => quickSwitch(account)}
                    disabled={isQuickSwitching}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          "h-4 w-4",
                          isActive ? "text-white" : "text-muted-foreground"
                        )} />
                        <div className="text-left">
                          <div className="text-sm font-medium">{account.name}</div>
                          <div className="text-xs opacity-80">{account.description}</div>
                        </div>
                      </div>
                      <kbd className={cn(
                        "px-1.5 py-0.5 text-xs font-mono rounded",
                        isActive ? "bg-white/20 text-white" : "bg-muted"
                      )}>
                        {account.shortcuts}
                      </kbd>
                    </div>
                  </Button>
                )
              })}
              
              <DropdownMenuSeparator />
              
              {/* Sign Out Button */}
              {session && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                  <kbd className="ml-auto px-1.5 py-0.5 text-xs font-mono bg-muted rounded">
                    ⌘⇧0
                  </kbd>
                </Button>
              )}
              
              {/* Keyboard Shortcuts Hint */}
              {showKeyboardHints && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Keyboard className="h-3 w-3" />
                    <span>Press <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">`</kbd> to toggle</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Floating Button - Larger and More Visible */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size={isExpanded ? "sm" : "default"}
              className={cn(
                "shadow-2xl hover:shadow-3xl transition-all hover:scale-105",
                "bg-gradient-to-r from-orange-500 via-orange-600 to-red-500",
                "hover:from-orange-600 hover:via-orange-700 hover:to-red-600",
                "text-white border-2 border-white/20",
                isExpanded ? "w-full" : "rounded-full h-14 px-4",
                "group relative overflow-hidden"
              )}
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-red-400/20 
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <div className="flex items-center gap-2 relative">
                <TestTube className={cn(
                  "animate-pulse",
                  isExpanded ? "h-4 w-4" : "h-5 w-5"
                )} />
                <span className={cn(
                  "font-semibold",
                  isExpanded ? "text-sm" : "text-base"
                )}>
                  {isExpanded ? "More Options" : "Dev Tools"}
                </span>
                {session && !isExpanded && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 text-xs bg-white/20 text-white border-0 px-2"
                  >
                    {currentRole?.toUpperCase()}
                  </Badge>
                )}
                <ChevronDown className={cn(
                  "ml-1",
                  isExpanded ? "h-3 w-3" : "h-4 w-4"
                )} />
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-orange-500" />
              Development Account Manager
            </DropdownMenuLabel>
            
            {/* Current Session Info */}
            {session && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 bg-muted/50 rounded mx-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-sm">Current Session</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {session.user?.name || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {session.user?.email}
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-xs",
                      currentAccount && `bg-gradient-to-r ${currentAccount.color} text-white border-0`
                    )}>
                      {currentRole?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </>
            )}
            
            <DropdownMenuSeparator />
            
            {/* Test Account List with Copy Function */}
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Click to copy • ⌘+Click to quick switch
            </div>
            
            {TEST_ACCOUNTS.map((account) => {
              const Icon = account.icon
              const isCopied = copiedEmail === account.email
              const isActive = session?.user?.email === account.email
              
              return (
                <DropdownMenuItem
                  key={account.email}
                  className={cn(
                    "cursor-pointer py-3",
                    isActive && account.bgColor
                  )}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey) {
                      quickSwitch(account)
                    } else {
                      copyAccountInfo(account)
                    }
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        `bg-gradient-to-r ${account.color}`
                      )}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.name}</span>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs">
                              ACTIVE
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {account.email}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <KeyRound className="h-3 w-3" />
                          {account.password}
                        </div>
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
            
            {/* Action Buttons */}
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
            
            {/* Help Section */}
            <div className="px-2 py-2 space-y-2">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <Keyboard className="h-3 w-3" />
                  Keyboard Shortcuts
                </div>
                <div className="grid grid-cols-2 gap-1 ml-5">
                  <div>Toggle Panel: <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">`</kbd></div>
                  <div>Expand: <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">⌘⇧D</kbd></div>
                  <div>Student: <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">⌘⇧1</kbd></div>
                  <div>Teacher: <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">⌘⇧2</kbd></div>
                  <div>Admin: <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">⌘⇧3</kbd></div>
                  <div>Sign Out: <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">⌘⇧0</kbd></div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <TestTube className="h-3 w-3" />
                <span>Development Mode Only - Not visible in production</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
