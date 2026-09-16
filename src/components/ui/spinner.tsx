import type { ComponentProps } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizes = { sm: 'size-4', md: 'size-8', lg: 'size-12' }

/** One accessible loading indicator for inline actions and page loading states. */
export function Spinner({
  size = 'md', className, 'aria-label': label = 'Loading', ...props
}: Omit<ComponentProps<'span'>, 'children'> & { size?: keyof typeof sizes }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex shrink-0 align-middle', sizes[size], className)} {...props}>
      <Loader2 aria-hidden="true" className="size-full animate-spin motion-reduce:animate-none" />
    </span>
  )
}
