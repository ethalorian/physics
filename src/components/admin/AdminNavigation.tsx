"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  FileText, 
  BookOpen, 
  Users, 
  Settings,
  Gamepad2,
  Brain,
  GraduationCap,
  Calendar,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminNavigationProps {
  className?: string
}

const navigationSections = [
  {
    title: "Dashboard & Analytics",
    description: "Monitor student progress and system overview",
    items: [
      { href: "/admin/dashboard", label: "Admin Dashboard", icon: BarChart3, description: "System overview and analytics" },
      { href: "/admin/assignments-system", label: "Assignment System", icon: Calendar, description: "Manage lesson and homework assignments" }
    ]
  },
  {
    title: "Content Management",
    description: "Create and manage educational content",
    items: [
      { href: "/admin/lessons", label: "Manage Lessons", icon: GraduationCap, description: "Create and edit physics lessons" },
      { href: "/admin/assignments", label: "Manage Assignments", icon: FileText, description: "Create and manage homework assignments" },
      { href: "/admin/question-bank", label: "Question Bank", icon: Brain, description: "Centralized question repository" }
    ]
  },
  {
    title: "Interactive Learning",
    description: "Vocabulary games and student engagement tools",
    items: [
      { href: "/admin/vocabulary", label: "Vocabulary Management", icon: Settings, description: "Upload and manage vocabulary sets" },
      { href: "/vocabulary", label: "Play Vocabulary Games", icon: Gamepad2, description: "Test vocabulary games as student" }
    ]
  }
]

export default function AdminNavigation({ className }: AdminNavigationProps) {
  const pathname = usePathname()

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Admin Control Panel</h2>
        <p className="text-muted-foreground">
          Manage your physics classroom and monitor student progress
        </p>
      </div>

      {navigationSections.map((section) => (
        <Card key={section.title} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3">
              {section.items.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "group p-4 rounded-lg border transition-all hover:shadow-md",
                      isActive 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border hover:border-primary/20 hover:bg-accent/50"
                    )}>
                      <div className="flex items-start space-x-4">
                        <div className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted group-hover:bg-primary/10"
                        )}>
                          <IconComponent className={cn(
                            "h-5 w-5",
                            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "font-medium transition-colors",
                            isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                          )}>
                            {item.label}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </div>
                        </div>
                        {isActive && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quick Stats Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Quick Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-foreground">Start with Lessons</div>
                <div className="text-muted-foreground">Create physics lessons before building assignments</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-foreground">Build Question Bank</div>
                <div className="text-muted-foreground">Add questions to reuse across multiple assignments</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-foreground">Upload Vocabulary</div>
                <div className="text-muted-foreground">Add vocabulary sets for interactive games</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
