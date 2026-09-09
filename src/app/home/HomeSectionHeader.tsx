import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import styles from './home.module.css'

interface HomeSectionHeaderProps {
  title: string
  eyebrow: string
  description?: string
  icon: LucideIcon
  tone: 'indigo' | 'sage' | 'rose' | 'gold'
  id?: string
  status?: ReactNode
}

export default function HomeSectionHeader({ title, eyebrow, description, icon: Icon, tone, id, status }: HomeSectionHeaderProps) {
  return <header className={styles.sectionHeader} data-tone={tone}>
    <div className={styles.sectionHeadingRow}>
      <span className={styles.sectionHeadingIcon}><Icon size={23} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><p className={styles.sectionEyebrow}>{eyebrow}</p><h2 id={id} className={styles.sectionTitle}>{title}</h2></div>
      {status}
    </div>
    {description && <p className={styles.sectionDescription}>{description}</p>}
  </header>
}
