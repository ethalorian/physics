"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const initialTheme = savedTheme || systemTheme
      
      setTheme(initialTheme)
      
      // Apply theme class to document
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch {
      // Fallback to light theme
      setTheme('light')
    } finally {
      setMounted(true)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    try {
      localStorage.setItem('theme', newTheme)
    } catch {
      console.warn('Failed to save theme to localStorage')
    }
    
    // Apply theme class to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 px-0 opacity-0 pointer-events-none rounded-full"
        disabled
      >
        <Moon className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-8 w-8 sm:h-9 sm:w-9 px-0 hover:bg-primary/20 hover:text-primary transition-all duration-200 rounded-full touch-manipulation"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-primary hover:text-primary/80 transition-colors" />
      ) : (
        <Sun className="h-3 w-3 sm:h-4 sm:w-4 text-primary hover:text-foreground transition-colors" />
      )}
    </Button>
  )
}
