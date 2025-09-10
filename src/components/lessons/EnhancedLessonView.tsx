"use client"
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BookOpen, 
  Brain, 
  CheckCircle, 
  ChevronRight,
  Lightbulb,
  Target,
  Calculator,
  Sparkles,
  Clock,
  Award
} from 'lucide-react'

interface EnhancedLessonViewProps {
  lesson: {
    unit: string
    lesson_number: number
    title: string
    description: string
    content: string
  }
}

export default function EnhancedLessonView({ lesson }: EnhancedLessonViewProps) {
  const [activeSection, setActiveSection] = useState('overview')
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [showAnswer, setShowAnswer] = useState<{ [key: string]: boolean }>({})
  const [studentAnswers, setStudentAnswers] = useState<{ [key: string]: string }>({})

  const markSectionComplete = (section: string) => {
    if (!completedSections.includes(section)) {
      setCompletedSections([...completedSections, section])
    }
  }

  const progress = (completedSections.length / 4) * 100

  // Parse the lesson content for unit conversions
  // const isUnitConversionLesson = lesson.title.toLowerCase().includes('unit conversion')

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Progress */}
      <div className="apple-card p-6 bg-gradient-to-r from-[#F7F5F3] to-[#F0EDE9]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-gradient-to-r from-[#C5B9E8] to-[#B19CD9] text-[#4A1A4A]">
                  {lesson.unit}
                </Badge>
                <Badge variant="outline" className="text-[#6A4C93] border-[#6A4C93]">
                  Lesson {lesson.lesson_number}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-[#4A1A4A]">{lesson.title}</h1>
              <p className="text-[#6A4C93] mt-1">{lesson.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[#6A4C93]" />
              <span className="text-sm font-medium text-[#4A1A4A]">Today&apos;s Points: 15</span>
            </div>
            <Progress value={progress} className="w-48 h-3" />
            <p className="text-xs text-[#6A4C93] mt-1">{Math.round(progress)}% Complete</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto h-auto p-1">
          <TabsTrigger 
            value="overview" 
            className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6A4C93] data-[state=active]:to-[#9A8AC0] data-[state=active]:text-white"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium">Overview</span>
            {completedSections.includes('overview') && <CheckCircle className="w-3 h-3" />}
          </TabsTrigger>
          <TabsTrigger 
            value="bellringer"
            className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6A4C93] data-[state=active]:to-[#9A8AC0] data-[state=active]:text-white"
          >
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Bell Ringer</span>
            {completedSections.includes('bellringer') && <CheckCircle className="w-3 h-3" />}
          </TabsTrigger>
          <TabsTrigger 
            value="practice"
            className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6A4C93] data-[state=active]:to-[#9A8AC0] data-[state=active]:text-white"
          >
            <Brain className="w-4 h-4" />
            <span className="text-xs font-medium">Practice</span>
            {completedSections.includes('practice') && <CheckCircle className="w-3 h-3" />}
          </TabsTrigger>
          <TabsTrigger 
            value="exit"
            className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6A4C93] data-[state=active]:to-[#9A8AC0] data-[state=active]:text-white"
          >
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium">Exit Ticket</span>
            {completedSections.includes('exit') && <CheckCircle className="w-3 h-3" />}
          </TabsTrigger>
        </TabsList>

        {/* Overview Section */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="apple-card border-[#C5B9E8]">
            <CardHeader className="bg-gradient-to-r from-[#F7F5F3] to-[#F0EDE9]">
              <CardTitle className="flex items-center gap-2 text-[#4A1A4A]">
                <Lightbulb className="w-5 h-5 text-[#6A4C93]" />
                Big Ideas for Today
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#F7F5F3] to-transparent rounded-lg">
                  <div className="w-8 h-8 bg-[#6A4C93] text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-medium text-[#4A1A4A]">Units Tell Us How We Measure</p>
                    <p className="text-sm text-[#6A4C93] mt-1">A unit tells us what we&apos;re measuring - like using a ruler for length or a clock for time.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#F7F5F3] to-transparent rounded-lg">
                  <div className="w-8 h-8 bg-[#6A4C93] text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-medium text-[#4A1A4A]">Same Thing, Different Units</p>
                    <p className="text-sm text-[#6A4C93] mt-1">We can describe the same quantity in different ways (like 60 minutes = 1 hour).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#F7F5F3] to-transparent rounded-lg">
                  <div className="w-8 h-8 bg-[#6A4C93] text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-medium text-[#4A1A4A]">The Train Tracks Method</p>
                    <p className="text-sm text-[#6A4C93] mt-1">A visual method that helps us convert units correctly every time!</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => {
                    markSectionComplete('overview')
                    setActiveSection('bellringer')
                  }}
                  className="bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]"
                >
                  Ready to Start
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bell Ringer Section */}
        <TabsContent value="bellringer" className="space-y-6">
          <Card className="apple-card border-[#C5B9E8]">
            <CardHeader className="bg-gradient-to-r from-[#FFE5B4] to-[#FFD4A3]">
              <CardTitle className="flex items-center gap-2 text-[#4A1A4A]">
                <Clock className="w-5 h-5 text-[#FF8C00]" />
                Bell Ringer (2 points)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <Alert className="border-[#FFD4A3] bg-[#FFF8F0]">
                <AlertDescription className="text-[#4A1A4A]">
                  <strong>Quick Warm-up:</strong> Write the unit we use to measure each of these items. Think about what makes sense!
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-[#F7F5F3] to-transparent rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">✏️</span>
                    <p className="font-medium text-[#4A1A4A]">The length of a pencil</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your answer..."
                    className="w-full p-2 border rounded-lg"
                    onChange={(e) => setStudentAnswers({...studentAnswers, pencil: e.target.value})}
                  />
                  {showAnswer.pencil && (
                    <p className="mt-2 text-sm text-green-600">✓ Answer: centimeters (cm)</p>
                  )}
                </div>

                <div className="p-4 bg-gradient-to-r from-[#F7F5F3] to-transparent rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📺</span>
                    <p className="font-medium text-[#4A1A4A]">The time for a TV commercial</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your answer..."
                    className="w-full p-2 border rounded-lg"
                    onChange={(e) => setStudentAnswers({...studentAnswers, commercial: e.target.value})}
                  />
                  {showAnswer.commercial && (
                    <p className="mt-2 text-sm text-green-600">✓ Answer: seconds (s)</p>
                  )}
                </div>

                <div className="p-4 bg-gradient-to-r from-[#F7F5F3] to-transparent rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🍉</span>
                    <p className="font-medium text-[#4A1A4A]">The mass of a watermelon</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your answer..."
                    className="w-full p-2 border rounded-lg"
                    onChange={(e) => setStudentAnswers({...studentAnswers, watermelon: e.target.value})}
                  />
                  {showAnswer.watermelon && (
                    <p className="mt-2 text-sm text-green-600">✓ Answer: kilograms (kg)</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setShowAnswer({pencil: true, commercial: true, watermelon: true})}
                >
                  Show Answers
                </Button>
                <Button 
                  onClick={() => {
                    markSectionComplete('bellringer')
                    setActiveSection('practice')
                  }}
                  className="bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]"
                >
                  Continue to Practice
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guided Practice Section */}
        <TabsContent value="practice" className="space-y-6">
          <Card className="apple-card border-[#C5B9E8]">
            <CardHeader className="bg-gradient-to-r from-[#E6F3FF] to-[#D4E9FF]">
              <CardTitle className="flex items-center gap-2 text-[#4A1A4A]">
                <Brain className="w-5 h-5 text-[#4169E1]" />
                Guided Practice: The Train Tracks Method (5 points)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Visual Train Tracks Demo */}
              <div className="p-6 bg-gradient-to-r from-[#F0F8FF] to-[#E6F3FF] rounded-xl">
                <h3 className="font-bold text-[#4A1A4A] mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  The Train Tracks Method
                </h3>
                <div className="bg-white p-4 rounded-lg shadow-inner">
                  <p className="text-sm text-[#6A4C93] mb-4">Example: Convert 2 hours to minutes</p>
                  <div className="flex items-center justify-center">
                    <div className="border-2 border-[#6A4C93] rounded-lg p-3 bg-white">
                      <div className="text-center font-mono">
                        <div className="border-b-2 border-[#6A4C93] pb-2 mb-2">2 hours</div>
                        <div className="text-[#9A8AC0]">1</div>
                      </div>
                    </div>
                    <span className="mx-3 text-2xl text-[#6A4C93]">×</span>
                    <div className="border-2 border-[#6A4C93] rounded-lg p-3 bg-white">
                      <div className="text-center font-mono">
                        <div className="border-b-2 border-[#6A4C93] pb-2 mb-2">60 min</div>
                        <div className="text-[#9A8AC0]">1 hour</div>
                      </div>
                    </div>
                    <span className="mx-3 text-2xl text-[#6A4C93]">=</span>
                    <div className="border-2 border-green-500 rounded-lg p-3 bg-green-50">
                      <div className="text-center font-mono font-bold text-green-700">
                        120 min
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#6A4C93] mt-4 text-center">
                    Notice how &ldquo;hours&rdquo; cancels out, leaving us with minutes!
                  </p>
                </div>
              </div>

              {/* Practice Problems */}
              <div className="space-y-4">
                <h3 className="font-bold text-[#4A1A4A]">Try These Problems:</h3>
                
                <div className="p-4 border-2 border-[#C5B9E8] rounded-lg">
                  <p className="font-medium text-[#4A1A4A] mb-2">1. Convert 5 minutes to seconds</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      placeholder="Your answer"
                      className="w-32 p-2 border rounded"
                    />
                    <span className="text-[#6A4C93]">seconds</span>
                  </div>
                  {showAnswer.problem1 && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                      ✓ Correct! 5 min × (60 s / 1 min) = 300 seconds
                    </div>
                  )}
                </div>

                <div className="p-4 border-2 border-[#C5B9E8] rounded-lg">
                  <p className="font-medium text-[#4A1A4A] mb-2">2. Convert 3 meters to centimeters</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      placeholder="Your answer"
                      className="w-32 p-2 border rounded"
                    />
                    <span className="text-[#6A4C93]">centimeters</span>
                  </div>
                  {showAnswer.problem2 && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                      ✓ Correct! 3 m × (100 cm / 1 m) = 300 centimeters
                    </div>
                  )}
                </div>

                <div className="p-4 border-2 border-[#C5B9E8] rounded-lg">
                  <p className="font-medium text-[#4A1A4A] mb-2">3. Convert 200 centimeters to meters</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      placeholder="Your answer"
                      className="w-32 p-2 border rounded"
                    />
                    <span className="text-[#6A4C93]">meters</span>
                  </div>
                  {showAnswer.problem3 && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                      ✓ Correct! 200 cm × (1 m / 100 cm) = 2 meters
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setShowAnswer({...showAnswer, problem1: true, problem2: true, problem3: true})}
                >
                  Check Answers
                </Button>
                <Button 
                  onClick={() => {
                    markSectionComplete('practice')
                    setActiveSection('exit')
                  }}
                  className="bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]"
                >
                  Ready for Exit Ticket
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exit Ticket Section */}
        <TabsContent value="exit" className="space-y-6">
          <Card className="apple-card border-[#C5B9E8]">
            <CardHeader className="bg-gradient-to-r from-[#FFE5E5] to-[#FFD5D5]">
              <CardTitle className="flex items-center gap-2 text-[#4A1A4A]">
                <Target className="w-5 h-5 text-[#DC143C]" />
                Exit Ticket (3 points)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <Alert className="border-[#FFD5D5] bg-[#FFF5F5]">
                <AlertDescription className="text-[#4A1A4A]">
                  <strong>Final Challenge:</strong> Show what you&apos;ve learned by solving this problem using the train tracks method!
                </AlertDescription>
              </Alert>

              <div className="p-6 border-2 border-[#FFD5D5] rounded-lg bg-white">
                <h3 className="font-bold text-[#4A1A4A] mb-4">
                  Convert 4 kilometers into meters
                </h3>
                
                <div className="space-y-4">
                  <p className="text-sm text-[#6A4C93]">Show your train tracks setup:</p>
                  
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="border-2 border-dashed border-[#C5B9E8] rounded p-3 min-h-[80px]">
                      <input
                        type="text"
                        placeholder="Starting value"
                        className="w-full p-1 text-center"
                      />
                    </div>
                    <span className="text-center text-2xl text-[#6A4C93]">×</span>
                    <div className="border-2 border-dashed border-[#C5B9E8] rounded p-3 min-h-[80px]">
                      <input
                        type="text"
                        placeholder="Conversion factor"
                        className="w-full p-1 text-center border-b mb-1"
                      />
                      <input
                        type="text"
                        placeholder="Units"
                        className="w-full p-1 text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <span className="font-medium text-[#4A1A4A]">Final Answer:</span>
                    <input
                      type="number"
                      placeholder="Your answer"
                      className="w-32 p-2 border rounded"
                    />
                    <span className="text-[#6A4C93]">meters</span>
                  </div>

                  {showAnswer.exit && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="font-bold text-green-700 mb-2">✓ Excellent Work!</p>
                      <div className="text-sm text-green-600">
                        <p>Solution: 4 km × (1000 m / 1 km) = 4000 meters</p>
                        <p className="mt-2">The kilometer units cancel out, leaving us with meters!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setShowAnswer({...showAnswer, exit: true})}
                >
                  Show Solution
                </Button>
                <Button 
                  onClick={() => {
                    markSectionComplete('exit')
                    alert('🎉 Congratulations! You&apos;ve completed the lesson!')
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Complete Lesson
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Completion Summary */}
          {completedSections.includes('exit') && (
            <Card className="apple-card bg-gradient-to-r from-green-50 to-green-100 border-green-300">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Lesson Complete!</h3>
                  <p className="text-green-600 mb-4">You&apos;ve mastered one-step unit conversions!</p>
                  <div className="flex justify-center gap-2">
                    <Badge className="bg-green-500">Bell Ringer ✓</Badge>
                    <Badge className="bg-green-500">Practice ✓</Badge>
                    <Badge className="bg-green-500">Exit Ticket ✓</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
