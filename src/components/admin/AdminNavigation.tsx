"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  FileText, 
  Settings,
  Gamepad2,
  Brain,
  GraduationCap,
  Target,
  Sparkles,
  Image,
  Video,
  Wand2
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
      { href: "/admin/assignment-hub", label: "Global Assignment Hub", icon: Target, description: "Assign and track ALL content types - lessons, homework, vocabulary, and simulations", featured: true },
      { href: "/admin/dashboard", label: "Admin Dashboard", icon: BarChart3, description: "System overview and analytics" }
    ]
  },
  {
    title: "Content Management",
    description: "Create and manage educational content",
    items: [
      { href: "/admin/lessons", label: "Manage Lessons", icon: GraduationCap, description: "View, create, and edit all lesson types (reading, video, simulation)" },
      { href: "/admin/reading-generator", label: "AI Reading Generator", icon: Sparkles, description: "Generate reading lessons with AI - customize mastery level, physics topics, and real-world contexts", featured: true },
      { href: "/admin/media-generator", label: "AI Media Studio", icon: Wand2, description: "Generate physics images and videos with Imagen 4 & Veo 3.1 - diagrams, scenarios, experiments", featured: true },
      { href: "/admin/assignments/create", label: "Homework Question Builder", icon: FileText, description: "Build homework with questions, AI grading, and rubrics" },
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
                const isFeatured = 'featured' in item && item.featured
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "group p-4 rounded-lg border transition-all hover:shadow-md",
                      isFeatured && "border-2 border-primary/40 bg-gradient-to-r from-primary/10 to-secondary/10 shadow-lg",
                      isActive 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : !isFeatured && "border-border hover:border-primary/20 hover:bg-accent/50"
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
                <div className="font-medium text-foreground">Generate AI Media</div>
                <div className="text-muted-foreground">Create physics diagrams, scenarios, and videos instantly</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-foreground">Use AI for Reading Lessons</div>
                <div className="text-muted-foreground">Generate tailored content with embedded questions</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-foreground">Build Question Bank</div>
                <div className="text-muted-foreground">Add questions with AI-generated images to reuse</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
