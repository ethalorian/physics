"use client"

// The avatar opens a small account dropdown — identity, "My progress", Sign Out.
// Nothing opens a dashboard directly from the avatar; "My progress" is the explicit
// labeled trigger for the progress slide-over (see UserContextSheet).

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Avatar from '@/components/avatar/Avatar'
import { useAvatarPortrait } from '@/hooks/useAvatarPortrait'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, LogOut, Eye, EyeOff, Smile, GraduationCap } from 'lucide-react'
import { useViewAs } from '@/lib/use-view-as'
import { EXPERIENCE_MARKER } from '@/lib/experience'
import { clearViewAs, clearStudentView } from '@/lib/view-as-shared'
import { useViewMode } from '@/contexts/ViewModeContext'
import UserContextSheet from '@/components/UserContextSheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useRouter } from 'next/navigation'

export default function AccountMenu() {
  const { data: session } = useSession()
  const [progressOpen, setProgressOpen] = useState(false)
  const { role, realRole, viewingAs } = useViewAs()
  const { viewMode, canToggleView } = useViewMode()
  const router = useRouter()

  // "View as student" is a UI-only preview for staff. The cookie helpers keep
  // it mutually exclusive with the admin's "view as teacher"; a full reload
  // (matching the teacher-view toggle) keeps every consumer of the cookies in
  // sync — no half-switched chrome.
  const studentViewActive = canToggleView && viewMode === 'student'
  const displayRole = studentViewActive ? 'student' : role
  const { portrait: me } = useAvatarPortrait()

  const handleSignOut = async () => {
    try {
      if (session?.experience || document.cookie.split('; ').some(cookie => cookie.startsWith(EXPERIENCE_MARKER + '='))) {
        await fetch('/api/admin/experience', { method: 'DELETE' })
        try { localStorage.setItem('experience-changed', String(Date.now())) } catch { /* Sign out still works without browser storage. */ }
      }
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Nudge students to build their Mii — a brief highlight when the setup prompt appears.
  const needsSetup = !!me && !me.setup_completed && realRole === 'student'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Account and appearance"
            variant="ghost"
            className={`relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background${needsSetup ? ' avatar-nudge-glow' : ''}`}
          >
            {me?.setup_completed && me?.traits ? (
              // Use the same circular face framing as Home and the leaderboard.
              <div className="w-full h-full rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                <Avatar
                  traits={me.traits}
                  equipped={me.equipped}
                  items={me.equipped_items}
                  size={40}
                  crop="portrait"
                  className="size-full"
                />
              </div>
            ) : session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold flex items-center justify-center text-sm">
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="font-semibold leading-tight">{session?.user?.name || 'User'}</span>
            <span className="text-xs font-normal text-muted-foreground truncate">{session?.user?.email}</span>
            <Badge variant={displayRole === 'student' ? 'default' : 'secondary'} className="mt-1 w-fit">
              {studentViewActive ? 'student (preview)' : displayRole}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => { setTimeout(() => setProgressOpen(true), 0) }}>
            <BarChart3 className="h-4 w-4 mr-2" />
            My progress
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/avatar')}>
            <Smile className="h-4 w-4 mr-2" />
            My avatar
          </DropdownMenuItem>
          {/* A colleague who signed in on the staff domain but has no staff role
              yet — the only path to /teacher-access, which was otherwise
              unreachable except by typed URL. Students never see this. */}
          {realRole === 'student' && !!session?.user?.email && !session.user.email.includes('@student.') && (
            <DropdownMenuItem onSelect={() => router.push('/teacher-access')}>
              <GraduationCap className="h-4 w-4 mr-2" />
              Request teacher access
            </DropdownMenuItem>
          )}
          {!session?.experience && realRole === 'admin' && !viewingAs && !studentViewActive && (
            <DropdownMenuItem onSelect={() => { clearStudentView(); clearViewAs(); window.location.assign('/experience') }}>
              <Eye className="h-4 w-4 mr-2" />
              Experience as…
            </DropdownMenuItem>
          )}
          {viewingAs && (
            <DropdownMenuItem onSelect={() => { clearViewAs(); window.location.reload() }}>
              <EyeOff className="h-4 w-4 mr-2" />
              Exit teacher view
            </DropdownMenuItem>
          )}
          {canToggleView && !studentViewActive && !session?.experience && (
            <DropdownMenuItem onSelect={() => { clearStudentView(); window.location.assign('/admin/student-preview') }}>
              <GraduationCap className="h-4 w-4 mr-2" />
              View student account
            </DropdownMenuItem>
          )}
          {studentViewActive && (
            <DropdownMenuItem onSelect={() => { clearStudentView(); window.location.reload() }}>
              <EyeOff className="h-4 w-4 mr-2" />
              Exit student view
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {/* Appearance — moved out of the top bar to declutter it. */}
          <div className="flex items-center justify-between px-2 py-1.5 text-sm" onClick={(e) => e.stopPropagation()}>
            <span className="text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserContextSheet open={progressOpen} onOpenChange={setProgressOpen} />
    </>
  )
}
