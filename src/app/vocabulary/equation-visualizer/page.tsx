"use client"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calculator, Lightbulb, Target, Eye, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { getUserRole } from '@/lib/permissions'
import EquationVisualizer from '@/components/vocabulary/EquationVisualizer'

export default function EquationVisualizerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Check permissions
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    const userRole = getUserRole(session?.user?.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userRole = getUserRole(session?.user?.email)
  if (userRole !== 'admin' && userRole !== 'teacher') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/vocabulary" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Vocabulary
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calculator className="h-8 w-8 text-purple-600" />
              Physics Equation Visualizer
            </h1>
            <p className="text-gray-600 mt-1">
              Interactive tool to explore how physics terms relate in equations
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-purple-600 border-purple-300">
          Educational Tool
        </Badge>
      </div>

      {/* Instructions Card */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Lightbulb className="h-5 w-5" />
            How to Use the Equation Visualizer
          </CardTitle>
          <CardDescription className="text-blue-600">
            Learn physics relationships by seeing how changing one term affects others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Select an Equation</h4>
                <p className="text-sm text-blue-700">
                  Choose from common physics equations like F = ma, v = d/t, and more
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Adjust the Sliders</h4>
                <p className="text-sm text-blue-700">
                  Move the sliders to change values and watch terms grow or shrink in size
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Toggle Display Modes</h4>
                <p className="text-sm text-blue-700">
                  Switch between vocabulary terms, variables, and units to see different perspectives
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Observe Relationships</h4>
                <p className="text-sm text-blue-700">
                  See how increasing mass affects force, or how velocity squared impacts kinetic energy
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                5
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Learn Dimensional Analysis</h4>
                <p className="text-sm text-blue-700">
                  View units mode to understand how dimensions work in physics equations
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                6
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Reset and Experiment</h4>
                <p className="text-sm text-blue-700">
                  Use the reset button to return to default values and try different scenarios
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 text-lg">
              <Target className="h-5 w-5" />
              Visual Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 text-sm">
              Terms grow and shrink in size to show their relative impact on the equation result
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
              <Eye className="h-5 w-5" />
              Multiple Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 text-sm">
              Switch between vocabulary terms, mathematical variables, and units with dimensional analysis
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
              <RotateCcw className="h-5 w-5" />
              Interactive Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 text-sm">
              Real-time sliders with instant feedback and easy reset to explore different scenarios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualizer */}
      <EquationVisualizer />

      {/* Educational Notes */}
      <Card className="mt-6 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Teaching Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-yellow-800">
            <p className="text-sm">
              <strong>For Force = Mass × Acceleration:</strong> Show students how doubling mass doubles force, 
              while doubling acceleration also doubles force. This demonstrates the linear relationships.
            </p>
            <p className="text-sm">
              <strong>For Kinetic Energy = ½mv²:</strong> Emphasize how velocity is squared - doubling velocity 
              quadruples the energy! This is why car crashes at higher speeds are so much more dangerous.
            </p>
            <p className="text-sm">
              <strong>For Power = Work ÷ Time:</strong> Show how doing the same work in less time requires more power. 
              This helps students understand why rushing tasks often requires more effort.
            </p>
            <p className="text-sm">
              <strong>Dimensional Analysis:</strong> Use the units mode to show students how dimensions must match 
              on both sides of an equation - a fundamental principle of physics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}








