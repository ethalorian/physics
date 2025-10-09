// React/Next.js imports
import * as React from "react"
import { useRouter } from "next/navigation"

// External package imports
import { ArrowLeft } from "lucide-react"

// Internal imports
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb"

export interface PageHeaderProps {
  title: string
  description?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  breadcrumb?: BreadcrumbItem[]
  showBack?: boolean
  onBack?: () => void
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumb,
  showBack = false,
  onBack,
  className
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className={cn("space-y-4 mb-8", className)}>
      {/* Breadcrumb and Back Button Row */}
      {(breadcrumb || showBack) && (
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2 hover:bg-accent"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          {breadcrumb && <Breadcrumb items={breadcrumb} />}
        </div>
      )}

      {/* Title and Actions Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Title with Badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground relative">
              {title}
              <div className="absolute -bottom-2 left-0 w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
            </h1>
            {badge && <div className="mt-1">{badge}</div>}
          </div>

          {/* Description */}
          {description && (
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

