import { Badge } from '@/components/ui/badge'
import { Info, Calculator, Users, BookOpen } from 'lucide-react'
import { PHYSICS_LEVEL } from '@/config/physics-level'

interface PhysicsLevelBadgeProps {
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export function PhysicsLevelBadge({ variant = 'default', className = '' }: PhysicsLevelBadgeProps) {
  if (variant === 'compact') {
    return (
      <Badge className={`bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary ${className}`}>
        <BookOpen className="h-3 w-3 mr-1" />
        HS Conceptual Physics
      </Badge>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-gradient-to-r from-primary/15 to-primary/5 dark:from-primary/15/20 dark:to-primary/5/20 rounded-lg p-4 border border-primary/30 dark:border-primary/30 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 dark:bg-primary/30 rounded-lg">
            <BookOpen className="h-5 w-5 text-primary dark:text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-primary dark:text-primary mb-2">
              High School Conceptual Physics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary dark:text-primary" />
                <span className="text-primary dark:text-primary">Ages 14-18</span>
              </div>
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary dark:text-primary" />
                <span className="text-primary dark:text-primary">Algebra 1 Level</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-primary dark:text-primary">
              <p className="mb-1">• Uses g = 10 m/s² for simplicity</p>
              <p className="mb-1">• Focuses on conceptual understanding</p>
              <p className="mb-1">• No calculus or advanced trig required</p>
              <p>• Everyday examples and simple numbers</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/30 rounded-md ${className}`}>
      <BookOpen className="h-4 w-4 text-primary dark:text-primary" />
      <div className="text-sm">
        <span className="font-medium text-primary dark:text-primary">
          High School Conceptual Physics
        </span>
        <span className="text-primary dark:text-primary ml-2">
          • Algebra 1 • Ages 14-18
        </span>
      </div>
    </div>
  )
}

/**
 * Info card that can be shown on assignment creation pages
 */
export function PhysicsLevelInfo() {
  return (
    <div className="bg-primary/5 dark:bg-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-primary dark:text-primary mt-0.5" />
        <div>
          <h4 className="font-semibold text-primary dark:text-primary mb-2">
            Course Level Information
          </h4>
          <div className="text-sm text-primary dark:text-primary space-y-2">
            <p>
              This system is designed for <strong>High School Conceptual Physics</strong> courses
              with students who have completed <strong>Algebra 1</strong>.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="font-medium mb-1">Appropriate Topics:</p>
                <ul className="text-xs space-y-0.5 ml-3">
                  <li>• Motion & Kinematics</li>
                  <li>• Forces & Newton&apos;s Laws</li>
                  <li>• Energy & Work</li>
                  <li>• Basic Electricity</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Math Skills Used:</p>
                <ul className="text-xs space-y-0.5 ml-3">
                  <li>• Basic algebra (solve for x)</li>
                  <li>• Simple formulas (F=ma)</li>
                  <li>• Unit conversions</li>
                  <li>• No calculus needed</li>
                </ul>
              </div>
            </div>
            <p className="text-xs mt-3 text-primary dark:text-primary">
              💡 Tip: Questions auto-generate with appropriate difficulty and use g=10 m/s² for simplicity
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Quick reference card for teachers
 */
export function FormulasQuickReference() {
  const { formulas } = PHYSICS_LEVEL
  
  return (
    <div className="bg-muted dark:bg-gray-800/50 rounded-lg p-4">
      <h4 className="font-semibold text-foreground dark:text-muted-foreground mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        Quick Formula Reference
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {Object.entries(formulas).slice(0, 12).map(([name, formula]) => (
          <div key={name} className="bg-white dark:bg-gray-800 rounded px-2 py-1 border border-border dark:border-border">
            <span className="text-muted-foreground dark:text-muted-foreground">{name.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
            <span className="ml-1 font-mono font-medium text-foreground dark:text-muted-foreground">{formula}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
        Using g = 10 m/s² for all calculations
      </p>
    </div>
  )
}
