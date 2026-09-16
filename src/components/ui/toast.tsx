"use client"

import type { ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

const toastVariants = {
  default: 'bg-card border-border',
  success: 'bg-success/12 border-success/40',
  error: 'bg-destructive/12 border-destructive/40',
  warning: 'bg-reward/12 border-reward/40',
  info: 'bg-primary/12 border-primary/40',
}

const icons = {
  default: null,
  success: <CheckCircle aria-hidden="true" className="size-5 text-success" />,
  error: <AlertCircle aria-hidden="true" className="size-5 text-destructive" />,
  warning: <AlertTriangle aria-hidden="true" className="size-5 text-foreground" />,
  info: <Info aria-hidden="true" className="size-5 text-primary" />,
}

export function Toast({ title, description, variant = 'default', onClose }: ToastProps) {
  return (
    <div className="rounded-lg bg-card">
      <div
        role={variant === 'error' ? 'alert' : 'status'}
        className={cn(
          'pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-lg border p-4 text-foreground shadow-sm shadow-primary/15',
          'animate-in slide-in-from-top-full duration-300 ease-out-expo',
          toastVariants[variant],
        )}
      >
        {icons[variant] && <div className="shrink-0">{icons[variant]}</div>}
        <div className="min-w-0 flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && <div className="mt-1 text-sm text-foreground">{description}</div>}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Dismiss notification"
            className="shrink-0 rounded-sm p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export function ToastContainer({ children }: { children: ReactNode }) {
  return <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md flex-col gap-2">{children}</div>
}
