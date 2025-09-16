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
      <Badge className={`bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ${className}`}>
        <BookOpen className="h-3 w-3 mr-1" />
        HS Conceptual Physics
      </Badge>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              High School Conceptual Physics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300">Ages 14-18</span>
              </div>
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300">Algebra 1 Level</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
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
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md ${className}`}>
      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <div className="text-sm">
        <span className="font-medium text-blue-800 dark:text-blue-200">
          High School Conceptual Physics
        </span>
        <span className="text-blue-600 dark:text-blue-400 ml-2">
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
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Course Level Information
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
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
            <p className="text-xs mt-3 text-blue-600 dark:text-blue-400">
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
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        Quick Formula Reference
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {Object.entries(formulas).slice(0, 12).map(([name, formula]) => (
          <div key={name} className="bg-white dark:bg-gray-800 rounded px-2 py-1 border border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">{name.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
            <span className="ml-1 font-mono font-medium text-gray-700 dark:text-gray-300">{formula}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Using g = 10 m/s² for all calculations
      </p>
    </div>
  )
}
