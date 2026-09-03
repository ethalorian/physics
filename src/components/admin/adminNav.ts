import {
  LayoutGrid, Gift, Microscope, Gamepad2, Joystick,
  Eye, Users, Activity, BookOpen, BookOpenCheck, BookText, BarChart3, CalendarClock, CalendarRange, Smile, Trophy, GraduationCap, Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react'

/**
 * The admin/teacher navigation model — the single source of truth for both the
 * persistent sidebar (admin/layout) and the command palette. Previously this
 * lived inside admin/home; it was lifted here so the launcher could move into
 * the nav without duplicating the data.
 */
export type Tool = {
  href: string
  label: string
  desc: string
  icon: LucideIcon
  accent: string
  adminOnly?: boolean
}

export type ToolGroup = { title: string; tools: Tool[] }

export const GROUPS: ToolGroup[] = [
  {
    title: 'Teach & grade',
    tools: [
      { href: '/admin/classes', label: 'Classes', desc: 'The cockpit — one card per class: plan, roster & analytics, engagement', icon: GraduationCap, accent: 'var(--primary)' },
      { href: '/admin/control-room', label: 'Control Room', desc: 'Rate mastery from student work, grade lessons, copy grades to Aspen', icon: LayoutGrid, accent: 'var(--primary)' },
      { href: '/admin/lobby', label: 'Lobby sessions', desc: 'Code-gated group activities — sort students, split a passphrase, review every artifact live', icon: Users, accent: 'var(--primary)' },
      { href: '/admin/lesson-access', label: 'Lesson access', desc: 'Open & close lessons per class — the single release board', icon: CalendarClock, accent: 'var(--primary)' },
      { href: '/admin/challenges', label: 'XP challenges', desc: 'Daily game challenges with bonus XP — assign to classes or student slices', icon: Trophy, accent: 'var(--reward)' },
      { href: '/admin/roster', label: 'Roster & classes', desc: 'Sync Google Classroom rosters and see performance', icon: GraduationCap, accent: 'var(--primary)' },
      { href: '/admin/store', label: 'Rewards', desc: 'Fulfil redemptions and manage the points store', icon: Gift, accent: 'var(--reward)' },
    ],
  },
  {
    title: 'Plan & build',
    tools: [
      { href: '/admin/workshop', label: 'Workshop', desc: 'Curriculum studio — shape seeded lessons, review coverage, target workbench', icon: BookOpenCheck, accent: 'var(--primary)', adminOnly: true },
      { href: '/admin/dashboard', label: 'Lessons & builder', desc: 'Shape seeded lessons — blocks, settings, publish — unit by unit', icon: BookOpen, accent: 'var(--primary)', adminOnly: true },
      { href: '/admin/reviews', label: 'Review library', desc: 'Generate and approve AI skill reviews shared with students app-wide', icon: BookOpenCheck, accent: 'var(--success)', adminOnly: true },
      { href: '/admin/teacher/plans', label: 'Lesson plans', desc: 'Day-by-day teacher plans per unit — Word/PDF downloads and the Present deck launch', icon: CalendarRange, accent: 'var(--primary)' },
      { href: '/admin/pacing', label: 'Pacing', desc: 'Map your sections to the calendar — all-section overview inside', icon: CalendarClock, accent: 'var(--reward)' },
      { href: '/admin/collaborators', label: 'Collaborators', desc: 'Grant per-area curriculum edit rights to specific people', icon: Users, accent: 'var(--primary)', adminOnly: true },
    ],
  },
  {
    title: 'Insights',
    tools: [
      { href: '/admin/analytics', label: 'Mastery analytics', desc: 'Disaggregate app-wide performance and ask Claude', icon: BarChart3, accent: 'var(--success)', adminOnly: true },
      { href: '/admin/oversight', label: 'App Oversight', desc: 'Colleague adoption, engagement and feature usage', icon: Activity, accent: 'var(--success)', adminOnly: true },
      { href: '/admin/duplicates', label: 'Duplicate students', desc: 'Safety net — student rows that look like the same person twice', icon: Users, accent: 'var(--success)', adminOnly: true },
      { href: '/leaderboard', label: 'Leaderboard', desc: 'Top earners across the whole app — monitor the engagement loop', icon: Trophy, accent: 'var(--reward)' },
    ],
  },
  {
    title: 'Content library',
    tools: [
      { href: '/admin/textbook', label: 'Textbook chapters', desc: 'Upload Conceptual Physics chapter PDFs to the private bucket and see what students can open', icon: BookText, accent: 'var(--primary)', adminOnly: true },
      { href: '/admin/simulations', label: 'Simulations', desc: 'Manage the interactive labs', icon: Microscope, accent: 'var(--primary)' },
      { href: '/admin/vocabulary', label: 'Vocabulary', desc: 'Term sets and the review games', icon: Gamepad2, accent: 'var(--reward)' },
      { href: '/admin/media', label: 'Media upload', desc: 'Drop a PDF or image, get a URL to paste into any lesson block', icon: ImageIcon, accent: 'var(--primary)' },
      { href: '/admin/arcade', label: 'Arcade cabinets', desc: 'Power cabinets on/off, set coin prices, see which game files are deployed', icon: Joystick, accent: 'var(--reward)' },
      { href: '/admin/avatar', label: 'Avatar catalog', desc: 'Every Mii item with art preview and owner counts', icon: Smile, accent: 'var(--primary)', adminOnly: true },
    ],
  },
  {
    title: 'Preview',
    tools: [
      { href: '/home', label: 'View as student', desc: 'See the student home experience', icon: Eye, accent: 'var(--muted-foreground)' },
    ],
  },
]

/** Role-gate the groups: drop admin-only tools for non-admins, then drop empties. */
export function gateGroups(groups: ToolGroup[], isAdmin: boolean): ToolGroup[] {
  return groups
    .map((g) => ({ ...g, tools: isAdmin ? g.tools : g.tools.filter((t) => !t.adminOnly) }))
    .filter((g) => g.tools.length > 0)
}

/** Flattened, role-gated tool list (for the command palette index). */
export function flatTools(isAdmin: boolean): Tool[] {
  return gateGroups(GROUPS, isAdmin).flatMap((g) => g.tools)
}
