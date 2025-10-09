// React/Next.js imports
import * as React from "react"
import Link from "next/link"

// External package imports
import { LucideIcon } from "lucide-react"

// Internal imports
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export interface QuickActionCardProps {
  icon: LucideIcon
  title: string
  description: string
  href?: string
  onClick?: () => void
  className?: string
  iconColor?: string
}

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  onClick,
  className,
  iconColor = "text-primary"
}: QuickActionCardProps) {
  const content = (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02] hover:border-primary/20",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className={cn(
            "p-2 sm:p-3 bg-primary/10 rounded-lg transition-colors",
            "group-hover:bg-primary/20"
          )}>
            <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm sm:text-base text-foreground mb-1 group-hover:text-primary transition-colors">
              {title}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {description}
            </div>
          </div>

          {/* Arrow Indicator */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 text-primary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

// Grid container for quick actions
export function QuickActionsGrid({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
      className
    )}>
      {children}
    </div>
  )
}

