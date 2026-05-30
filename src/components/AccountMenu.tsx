"use client"

// The avatar opens a small account dropdown — identity, "My progress", Sign Out.
// Nothing opens a dashboard directly from the avatar; "My progress" is the explicit
// labeled trigger for the progress slide-over (see UserContextSheet).

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Avatar from '@/components/avatar/Avatar'
import type { MeBundle } from '@/app/api/avatar/me/route'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, LogOut, Eye, EyeOff, Smile } from 'lucide-react'
import { useViewAs } from '@/lib/use-view-as'
import { setViewAs, clearViewAs } from '@/lib/view-as-shared'
import UserContextSheet from '@/components/UserContextSheet'
import { useRouter } from 'next/navigation'

// Module-level cache so a hard navigation between pages doesn't refetch the
// avatar bundle every time the menu mounts. Wardrobe edits invalidate by
// dispatching the 'avatar-updated' event below.
let _meCache: MeBundle | null = null

export default function AccountMenu() {
  const { data: session } = useSession()
  const [progressOpen, setProgressOpen] = useState(false)
  const { role, realRole, viewingAs } = useViewAs()
  const router = useRouter()
  const [me, setMe] = useState<MeBundle | null>(_meCache)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      fetch('/api/avatar/me')
        .then((r) => (r.ok ? r.json() : null))
        .then((d: MeBundle | null) => {
          if (cancelled || !d) return
          _meCache = d
          setMe(d)
        })
        .catch(() => {})
    }
    if (!_meCache) load()
    const onUpdate = () => load()
    window.addEventListener('avatar-updated', onUpdate)
    return () => { cancelled = true; window.removeEventListener('avatar-updated', onUpdate) }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Nudge students to build their Mii — a soft glow on the bubble until done.
  const needsSetup = !!me && !me.setup_completed && realRole === 'student'

  return (
    <>
      {needsSetup && (
        <style>{`@keyframes avatarNudge{0%,100%{box-shadow:0 0 0 0 color-mix(in oklch, var(--primary) 0%, transparent)}50%{box-shadow:0 0 0 4px color-mix(in oklch, var(--primary) 22%, transparent),0 0 14px 2px color-mix(in oklch, var(--primary) 45%, transparent)}}.avatar-nudge-glow{animation:avatarNudge 2.2s ease-in-out infinite;border-radius:9999px}@media (prefers-reduced-motion:reduce){.avatar-nudge-glow{animation:none}}`}</style>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background${needsSetup ? ' avatar-nudge-glow' : ''}`}
          >
            {me?.use_custom_avatar && me?.setup_completed ? (
              // Custom Mii — head-only crop so the face fills the bubble.
              // The square viewBox + size=40 matches the sm:h-10 sm:w-10
              // trigger; the rounded-full button clips the corners into a
              // circle. Background tint sits behind for the head's neck/ear
              // space inside the square crop.
              <div className="w-full h-full rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                <Avatar
                  traits={me.traits}
                  equipped={me.equipped}
                  items={me.equipped_items}
                  size={40}
                  crop="head"
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
            <Badge variant={role === 'student' ? 'default' : 'secondary'} className="mt-1 w-fit">{role}</Badge>
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
          {realRole === 'admin' && !viewingAs && (
            <DropdownMenuItem onSelect={() => { if (session?.user?.email) { setViewAs(session.user.email); window.location.reload() } }}>
              <Eye className="h-4 w-4 mr-2" />
              View as teacher
            </DropdownMenuItem>
          )}
          {viewingAs && (
            <DropdownMenuItem onSelect={() => { clearViewAs(); window.location.reload() }}>
              <EyeOff className="h-4 w-4 mr-2" />
              Exit teacher view
            </DropdownMenuItem>
          )}
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
