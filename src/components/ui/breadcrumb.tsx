// React/Next.js imports
import * as React from "react"
import Link from "next/link"

// External package imports
import { ChevronRight } from "lucide-react"

// Internal imports
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav 
      aria-label="Breadcrumb navigation" 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight 
              className="h-4 w-4 mx-1 flex-shrink-0" 
              aria-hidden="true" 
            />
          )}
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-foreground transition-colors truncate"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium truncate">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

// Separator component for custom usage
export function BreadcrumbSeparator() {
  return (
    <ChevronRight 
      className="h-4 w-4 mx-1 text-muted-foreground" 
      aria-hidden="true"
    />
  )
}

