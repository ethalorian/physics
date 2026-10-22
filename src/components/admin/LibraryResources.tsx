import Link from 'next/link'
import { ArrowRight, BookOpen, BookOpenCheck, BookText, Image as ImageIcon, Microscope, type LucideIcon } from 'lucide-react'
import type { ContentArea } from '@/lib/content-access'
import { scopedTeachingHref } from '@/lib/teaching-navigation'
import type { LibrarySection } from '@/lib/library-navigation'

type Resource = {
  title: string; description: string; icon: LucideIcon; href: string; action: string
  manage?: { href: string; label: string; area?: ContentArea }
}
const resources: Record<Exclude<LibrarySection, 'lessons'>, Resource[]> = {
  interactive: [
    { title: 'Simulations', description: 'Explore interactive physics models, then use guided investigations to support predictions, evidence, and explanations.', icon: Microscope, href: '/simulations', action: 'Explore simulations', manage: { href: '/admin/simulations', label: 'Manage simulations', area: 'simulations' } },
    { title: 'Guided investigations', description: 'Prepare simulation activities connected to learning targets and set their availability for your classes.', icon: BookOpenCheck, href: '/admin/simulations/activities', action: 'Open investigations' },
    { title: 'Vocabulary', description: 'Browse words and practice resources. Assign word goals and follow student progress from Teaching → Plan.', icon: BookText, href: '/vocabulary', action: 'Browse vocabulary', manage: { href: '/admin/vocabulary', label: 'Manage word sets', area: 'vocabulary' } },
  ],
  materials: [
    { title: 'Textbook', description: 'Read Conceptual Physics chapters and explanations to support your lessons.', icon: BookOpen, href: '/textbook', action: 'Read textbook', manage: { href: '/admin/textbook', label: 'Manage chapter PDFs' } },
    { title: 'Lesson media', description: 'Upload images and PDFs to use in lesson activities and explanations.', icon: ImageIcon, href: '/admin/media', action: 'Upload media' },
  ],
  curriculum: [
    { title: 'Curriculum coverage', description: 'Review learning targets, identify gaps, and refine the shared lesson collection.', icon: BookOpenCheck, href: '/admin/workshop', action: 'Review coverage' },
    { title: 'Review materials', description: 'Create, review, and approve shared skill reviews. Assign them to classes and review student responses in Teaching.', icon: BookText, href: '/admin/reviews', action: 'Manage review materials' },
  ],
}

export default function LibraryResources({ section, isAdmin, editableAreas, observer, search }: {
  section: Exclude<LibrarySection, 'lessons'>; isAdmin: boolean; editableAreas: ContentArea[]; observer: boolean; search: string
}) {
  const visible = resources[section].filter(resource => !observer || resource.href === '/textbook' || resource.href === '/simulations')
  return <div className="overflow-hidden rounded-2xl border bg-card">
    {visible.map(resource => {
      const Icon = resource.icon
      const canManage = !observer && resource.manage && (isAdmin || Boolean(resource.manage.area && editableAreas.includes(resource.manage.area)))
      return <article key={resource.title} className="flex gap-4 border-b p-5 last:border-b-0 sm:p-7">
        <Icon aria-hidden="true" className="mt-1 hidden h-6 w-6 shrink-0 text-primary sm:block" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold">{resource.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link className="inline-flex min-h-11 items-center gap-2 font-medium text-primary" href={scopedTeachingHref(resource.href, search)}>{resource.action}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            {canManage && resource.manage && <Link className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4" href={scopedTeachingHref(resource.manage.href, search)}>{resource.manage.label}</Link>}
          </div>
        </div>
      </article>
    })}
  </div>
}
