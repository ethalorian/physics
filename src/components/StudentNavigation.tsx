'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, BookText, ChevronDown, Gift, Home, Joystick, LayoutGrid, Menu, Sigma, Trophy, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const groups = [
  { label: 'Learn', icon: BookOpen, items: [
    { href: '/lessons', label: 'Lessons', icon: BookOpen },
    { href: '/quizzes', label: 'Quizzes', icon: LayoutGrid },
    { href: '/reference', label: 'Reference', icon: Sigma },
    { href: '/textbook', label: 'Textbook', icon: BookText },
    { href: '/comics', label: 'Graphic novels', icon: BookOpen },
  ] },
  { label: 'Play', icon: Joystick, items: [
    { href: '/arcade', label: 'Arcade', icon: Joystick },
    { href: '/vocabulary/work', label: 'Vocabulary games', icon: BookText },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/store', label: 'Store', icon: Gift },
    { href: '/avatar/gallery', label: 'Avatar gallery', icon: Users },
  ] },
] as const

export default function StudentNavigation() {
  const pathname = usePathname()
  const active = (href: string) => pathname === href || pathname?.startsWith(href + '/')
  const groupActive = (label: string, items: readonly { href: string }[]) => items.some(i => active(i.href)) || label === 'Play' && active('/vocabulary') || label === 'Learn' && ['/readings', '/dashboard/math-spine'].some(active)
  return <>
    <div className="hidden md:flex items-center gap-1" aria-label="Student navigation">
      <Button asChild variant={active('/home') ? 'default' : 'ghost'} className="min-h-11 gap-2"><Link href="/home" aria-current={active('/home') ? 'page' : undefined}><Home size={17} />Home</Link></Button>
      {groups.map(group => <DropdownMenu key={group.label}>
        <DropdownMenuTrigger asChild><Button variant={groupActive(group.label, group.items) ? 'secondary' : 'ghost'} className="min-h-11 gap-2" data-active={groupActive(group.label, group.items)}><group.icon size={17} />{group.label}<ChevronDown size={14} /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">{group.items.map(item => <DropdownMenuItem asChild key={item.href}><Link className="min-h-11 gap-3" href={item.href} aria-current={active(item.href) ? 'page' : undefined}><item.icon size={17} />{item.label}</Link></DropdownMenuItem>)}</DropdownMenuContent>
      </DropdownMenu>)}
      <Button asChild variant="outline" className="min-h-11 gap-2 ml-3"><Link href="/lobby" aria-current={active('/lobby') ? 'page' : undefined}><Users size={17} />Join lobby</Link></Button>
    </div>
    <div className="md:hidden"><Sheet>
      <SheetTrigger asChild><Button variant="ghost" className="min-h-11 gap-2 px-2" aria-label="Open navigation"><Menu size={20} /><span className="hidden min-[380px]:inline">Menu</span></Button></SheetTrigger>
      <SheetContent side="left" className="w-[min(320px,90vw)] overflow-y-auto">
        <SheetHeader><SheetTitle>Navigation</SheetTitle></SheetHeader>
        <div className="p-4 space-y-3">
          <SheetClose asChild><Link href="/home" aria-current={active('/home') ? 'page' : undefined} className="flex min-h-11 items-center gap-3 rounded-lg px-3 bg-secondary"><Home size={18} />Home</Link></SheetClose>
          {groups.map(group => <section key={group.label} aria-label={group.label}>
            <h2 className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground">{group.label}</h2>
            {group.items.map(item => <SheetClose asChild key={item.href}><Link href={item.href} aria-current={active(item.href) ? 'page' : undefined} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted aria-[current=page]:bg-secondary"><item.icon size={18} />{item.label}</Link></SheetClose>)}
          </section>)}
          <SheetClose asChild><Link href="/lobby" className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3"><Users size={18} />Join lobby</Link></SheetClose>
        </div>
      </SheetContent>
    </Sheet></div>
  </>
}
