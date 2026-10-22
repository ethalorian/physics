import { LIBRARY_SECTIONS } from '@/lib/library-navigation'
import type { ContentArea } from '@/lib/content-access'
import {
  Settings, ListOrdered, CalendarDays, MonitorPlay, Table2, LayoutGrid, Gift, Microscope, Gamepad2, Joystick,
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
  editorArea?: ContentArea
}

export type ToolGroup = { title: string; tools: Tool[]; expanded?: boolean }

const ORIGINAL_GROUPS: ToolGroup[] = [
  {
    title: 'Teach & grade',
    tools: [
      { href: '/admin/students?view=roster', label: 'Roster', desc: 'Student names and language supports', icon: GraduationCap, accent: 'var(--primary)' },
      { href: '/admin/control-room?view=tasks', label: 'Vocabulary tasks', desc: 'Assign word goals and track each student’s accuracy and progress by target', icon: BookText, accent: 'var(--primary)' },
      { href: '/admin/command-center', label: 'Guided problem solving', desc: 'Guide worksheet and practice problems with discussion and student participation', icon: LayoutGrid, accent: 'var(--primary)' },
      { href: '/admin/observe', label: 'Classroom observations', desc: 'Walk the room: quick mastery ratings and feedback on iPad', icon: Eye, accent: 'var(--primary)' },
      { href: '/admin/control-room', label: 'Teaching', desc: 'Plan units, schedule classes, and review results and mastery', icon: LayoutGrid, accent: 'var(--primary)' },
      { href: '/admin/quizzes', label: 'Quizzes & grades', desc: 'Assign vocabulary and physics quizzes, return grades, and review mastery', icon: BookOpenCheck, accent: 'var(--primary)' },
      { href: '/admin/review-modules', label: 'Review assignments', desc: 'Class codes, written responses, and student review submissions', icon: BookOpenCheck, accent: 'var(--primary)' },
      { href: '/admin/interactive-assignments', label: 'Interactive assignments', desc: 'Course-day practice, student submissions, and teacher mastery ratings', icon: BookOpenCheck, accent: 'var(--primary)' },
      { href: '/admin/readings', label: 'Reading dashboard', desc: 'Manage textbooks, the reading syllabus, connected assignments, and review', icon: BookText, accent: 'var(--primary)' },
      { href: '/admin/lobby', label: 'Group activities', desc: 'Code-gated group activities — sort students, split a passphrase, review every artifact live', icon: Users, accent: 'var(--primary)' },
      { href: '/admin/control-room?view=access', label: 'Lesson access', desc: 'Open & close lessons per class — the single release board', icon: CalendarClock, accent: 'var(--primary)' },
      { href: '/admin/students?view=rewards&section=challenges', label: 'XP challenges', desc: 'Daily game challenges with bonus XP — assign to classes or student slices', icon: Trophy, accent: 'var(--reward)' },
      { href: '/admin/students?view=settings', label: 'Class settings', desc: 'Sync Google Classroom rosters and choose class types', icon: GraduationCap, accent: 'var(--primary)' },
      { href: '/admin/students?view=rewards&section=store', label: 'Rewards', desc: 'Fulfil redemptions and manage the points store', icon: Gift, accent: 'var(--reward)' },
    ],
  },
  {
    title: 'Plan & build',
    tools: [
      { href: '/admin/workshop', label: 'Coverage', desc: 'Curriculum studio — shape seeded lessons, review coverage, target workbench', icon: BookOpenCheck, accent: 'var(--primary)', adminOnly: true },
      { href: '/admin/library?section=lessons', label: 'Lessons & activities', desc: 'Reusable video lessons and classroom activities', icon: BookOpen, accent: 'var(--primary)' },
      { href: '/admin/reviews', label: 'Review materials', desc: 'Generate and approve AI skill reviews shared with students app-wide', icon: BookOpenCheck, accent: 'var(--success)', adminOnly: true },
      { href: '/admin/teacher/plans', label: 'Course guide', desc: 'Asteroid course sequence, classroom investigations, and supporting videos; also Trades plans', icon: CalendarRange, accent: 'var(--primary)' },
      { href: '/admin/control-room?view=pacing', label: 'Pacing', desc: 'Map your sections to the calendar — all-section overview inside', icon: CalendarClock, accent: 'var(--reward)' },
      { href: '/admin/collaborators', label: 'Collaborators', desc: 'Grant per-area curriculum edit rights to specific people', icon: Users, accent: 'var(--primary)', adminOnly: true },
    ],
  },
  {
    title: 'Insights',
    tools: [
      { href: '/admin/analytics', label: 'Learning analytics', desc: 'Growth, classes, student learning, skills, Bloom’s tasks, and engagement', icon: BarChart3, accent: 'var(--success)', adminOnly: true },
      { href: '/admin/oversight', label: 'App Oversight', desc: 'Colleague adoption, engagement and feature usage', icon: Activity, accent: 'var(--success)', adminOnly: true },
      { href: '/admin/duplicates', label: 'Duplicate students', desc: 'Safety net — student rows that look like the same person twice', icon: Users, accent: 'var(--success)', adminOnly: true },
      { href: '/leaderboard', label: 'Leaderboard', desc: 'Top earners across the whole app — monitor the engagement loop', icon: Trophy, accent: 'var(--reward)' },
    ],
  },
  {
    title: 'Content library',
    tools: [
      { href: '/admin/textbook', label: 'Textbook chapters', desc: 'Upload Conceptual Physics chapter PDFs to the private bucket and see what students can open', icon: BookText, accent: 'var(--primary)', adminOnly: true },
      { href: '/admin/simulations', adminOnly: true, editorArea: 'simulations', label: 'Simulations', desc: 'Manage the interactive labs', icon: Microscope, accent: 'var(--primary)' },
      { href: '/admin/vocabulary', adminOnly: true, editorArea: 'vocabulary', label: 'Vocabulary word sets', desc: 'Create and publish words for vocabulary tasks', icon: Gamepad2, accent: 'var(--reward)' },
      { href: '/admin/media', label: 'Media upload', desc: 'Drop a PDF or image, get a URL to paste into any lesson block', icon: ImageIcon, accent: 'var(--primary)' },
      { href: '/admin/arcade', label: 'Arcade cabinets', desc: 'Power cabinets on/off, set coin prices, see which game files are deployed', icon: Joystick, accent: 'var(--reward)' },
      { href: '/admin/avatar', label: 'Avatar catalog', desc: 'Every Mii item with art preview and owner counts', icon: Smile, accent: 'var(--primary)', adminOnly: true },
    ],
  },
  {
    title: 'Preview',
    tools: [
      { href: '/admin/student-preview', label: 'View student lesson', desc: 'Inspect a selected student’s availability, progress, and feedback read-only', icon: Eye, accent: 'var(--muted-foreground)' },
    ],
  },
]

const tools = [...ORIGINAL_GROUPS.flatMap(g => g.tools),
  { href: '/experience', label: 'Experience as…', desc: 'Walk through student, teacher, observer, and admin accounts read-only', icon: Eye, accent: 'var(--primary)', adminOnly: true },
  {href:'/arcade',label:'Arcade',desc:'Visit the arcade and explore the games available to students',icon:Joystick,accent:'var(--reward)'},
]
const group = (title: string, paths: string[]): ToolGroup => ({ title, tools: paths.map(path => tools.find(t => t.href === path)!).filter(Boolean) })
export const GROUPS: ToolGroup[] = [
  { title: 'Teaching', expanded: true, tools: [
    { href: '/admin/control-room?view=plan', label: 'Plan', desc: 'Build the unit sequence and read the course guide', icon: ListOrdered, accent: 'var(--primary)' },
    { href: '/admin/control-room?view=calendar', label: 'Calendar', desc: 'Schedule teaching meetings and manage student deadlines', icon: CalendarDays, accent: 'var(--primary)' },
    { href: '/admin/control-room?view=live', label: 'Live classroom', desc: 'Guide problem solving, observe students, and run group activities', icon: MonitorPlay, accent: 'var(--primary)' },
    { href: '/admin/control-room?view=results', label: 'Results', desc: 'Review student work, lesson access, and mastery', icon: Table2, accent: 'var(--primary)' },
  ] },
  { title: 'Students', expanded: true, tools: [
    { href: '/admin/students?view=roster', label: 'Roster', desc: 'Student names and language supports', icon: Users, accent: 'var(--primary)' },
    { href: '/admin/students?view=activity', label: 'Activity', desc: 'Participation, practice habits, and student follow-up', icon: Activity, accent: 'var(--primary)' },
    { href: '/admin/students?view=rewards', label: 'XP & rewards', desc: 'Challenges, rewards, and redemption requests', icon: Gift, accent: 'var(--primary)' },
    { href: '/admin/students?view=settings', label: 'Class settings', desc: 'Roster sync, class types, and teacher setup', icon: Settings, accent: 'var(--primary)' },
  ] },
  { title: 'Library', expanded: true, tools: LIBRARY_SECTIONS.map(section => ({
    href: '/admin/library?section=' + section.key, label: section.label, desc: section.description,
    icon: section.key === 'interactive' ? Microscope : section.key === 'materials' ? BookText : section.key === 'curriculum' ? BookOpenCheck : BookOpen,
    accent: 'var(--primary)', adminOnly: 'adminOnly' in section,
  })) },
  group('Role walkthroughs', ['/experience']),
  group('Arcade', ['/arcade', '/admin/arcade', '/admin/avatar']),
  group('Insights', ['/admin/analytics', '/admin/oversight', '/admin/duplicates', '/leaderboard', '/admin/collaborators']),
]

/** Role-gate the groups: drop admin-only tools for non-admins, then drop empties. */
export function gateGroups(groups: ToolGroup[], isAdmin: boolean, editableAreas: readonly ContentArea[] = []): ToolGroup[] {
  return groups
    .map((g) => ({ ...g, tools: isAdmin ? g.tools : g.tools.filter((t) => !t.adminOnly || (t.editorArea !== undefined && editableAreas.includes(t.editorArea))) }))
    .filter((g) => g.tools.length > 0)
}

/** Flattened, role-gated tool list (for the command palette index). */
export function flatTools(isAdmin: boolean, editableAreas: readonly ContentArea[] = []): Tool[] {
  const visible = gateGroups(GROUPS, isAdmin, editableAreas).flatMap(g => g.tools)
  const specialists = gateGroups(ORIGINAL_GROUPS, isAdmin, editableAreas).flatMap(g => g.tools)
  return [...new Map([...specialists, ...visible].map(tool => [tool.href, tool])).values()]
}
