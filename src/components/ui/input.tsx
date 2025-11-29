import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Apple-style input with clean aesthetics
        "flex h-11 w-full min-w-0 rounded-xl border bg-background px-4 py-2.5 text-base transition-all duration-200 outline-none",
        "border-border/60 shadow-sm",
        // Placeholder and selection
        "placeholder:text-muted-foreground/60 selection:bg-primary/20 selection:text-foreground",
        // Focus state - Apple-style ring
        "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
        // File input styling
        "file:text-foreground file:inline-flex file:h-8 file:border-0 file:bg-muted file:rounded-lg file:px-3 file:text-sm file:font-medium file:mr-3",
        // Dark mode
        "dark:bg-input/50 dark:border-border/40 dark:focus-visible:ring-primary/20",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/30",
        // Responsive text size
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
