"use client"
import { useState, useEffect, useCallback } from 'react'
import { Assignment, MultipleChoiceQuestion, NumericalQuestion } from '@/types/assignment'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Trophy, Target, CheckCircle2, Zap, ChevronRight, ChevronLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressScoreboardProps {
  assignment: Assignment
  answers: Record<string, string | number | string[] | Record<string, any>>
  className?: string
}

export default function ProgressScoreboard({ 
  assignment, 
  answers, 
  className
}: ProgressScoreboardProps) {
  const [pointsEarned, setPointsEarned] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Calculate points earned from current answers
  const calculatePointsEarned = useCallback(() => {
    let earned = 0
    let answered = 0

    assignment.questions.forEach((question) => {
      const answer = answers[question.id]
      const hasAnswer = answer !== undefined && answer !== '' && answer !== null

      if (hasAnswer) {
        answered++
        
        // Only calculate points for auto-gradable questions
        if (question.type === 'multiple-choice') {
          const mcQuestion = question as MultipleChoiceQuestion
          if (answer === mcQuestion.correctAnswer) {
            earned += question.points
          }
        } else if (question.type === 'numerical') {
          const numQuestion = question as NumericalQuestion
          let numAnswer: number
          let selectedUnit = ''
          
          if (numQuestion.unitOptions && typeof answer === 'string' && answer.includes('|')) {
            const parts = (answer as string).split('|')
            numAnswer = parseFloat(parts[0])
            selectedUnit = parts[1] || ''
          } else {
            numAnswer = parseFloat(answer as string)
          }
          
          const correct = numQuestion.correctValue
          const tolerance = numQuestion.tolerance || 0
          
          const valueCorrect = !isNaN(numAnswer) && Math.abs(numAnswer - correct) <= tolerance
          const unitCorrect = !numQuestion.unitOptions || selectedUnit === numQuestion.unit
          
          if (valueCorrect && unitCorrect) {
            earned += question.points
          }
        }
        // For other question types (open-response, essay, vocabulary), we can't pre-calculate points
        // so we don't add anything to earned points until graded
      }
    })

    return { earned, answered }
  }, [assignment.questions, answers])

  useEffect(() => {
    const { earned, answered } = calculatePointsEarned()
    setPointsEarned(earned)
    setQuestionsAnswered(answered)
  }, [calculatePointsEarned])

  const totalQuestions = assignment.questions.length
  const totalPoints = assignment.total_points
  const remainingPoints = totalPoints - pointsEarned
  const progressPercentage = (questionsAnswered / totalQuestions) * 100
  const pointsPercentage = totalPoints > 0 ? (pointsEarned / totalPoints) * 100 : 0

  // Get potential points from unanswered auto-gradable questions
  const getPotentialPoints = () => {
    let potential = 0
    assignment.questions.forEach((question) => {
      const answer = answers[question.id]
      const hasAnswer = answer !== undefined && answer !== '' && answer !== null
      
      if (!hasAnswer && (question.type === 'multiple-choice' || question.type === 'numerical')) {
        potential += question.points
      }
    })
    return potential
  }

  const potentialPoints = getPotentialPoints()

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50 h-16 w-12 rounded-r-xl rounded-l-none shadow-2xl",
          "bg-gradient-to-b from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
          "border-0 text-white transition-all duration-300",
          isDrawerOpen ? "right-full sm:right-80 md:right-96" : "right-0",
          className
        )}
      >
        <div className="flex flex-col items-center gap-1">
          {isDrawerOpen ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
          <div className="text-xs font-bold rotate-90 whitespace-nowrap">
            {pointsEarned}/{totalPoints}
          </div>
        </div>
      </Button>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div className={cn(
        "fixed top-0 right-0 h-full z-50 transform transition-all duration-300 ease-in-out",
        "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl",
        "w-full sm:w-80 md:w-96 border-l border-white/20",
        isDrawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-40 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                <Trophy className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Progress</h2>
                <p className="text-sm text-white/80">Assignment Score</p>
              </div>
            </div>
            <Button
              onClick={() => setIsDrawerOpen(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Main Score Display */}
            <div className="text-center space-y-4">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-white drop-shadow-lg">
                  {pointsEarned}
                </span>
                <span className="text-2xl text-white/80">/ {totalPoints}</span>
                <span className="text-lg text-white/60 ml-2">points</span>
              </div>
              
              {/* Points Progress Bar */}
              <div className="space-y-2">
                <Progress 
                  value={pointsPercentage} 
                  className="h-4 bg-white/20"
                />
                <div className="flex justify-between text-sm text-white/80">
                  <span>Points Earned</span>
                  <span>{Math.round(pointsPercentage)}% Complete</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Questions Completed */}
              <div className="bg-white/15 rounded-xl p-4 backdrop-blur border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-300" />
                  <span className="text-sm text-white/90 font-medium">Completed</span>
                </div>
                <div className="text-2xl font-bold">
                  {questionsAnswered}
                </div>
                <div className="text-sm text-white/70">
                  of {totalQuestions} questions
                </div>
              </div>

              {/* Remaining Points */}
              <div className="bg-white/15 rounded-xl p-4 backdrop-blur border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-orange-300" />
                  <span className="text-sm text-white/90 font-medium">Remaining</span>
                </div>
                <div className="text-2xl font-bold">
                  {remainingPoints}
                </div>
                <div className="text-sm text-white/70">
                  points available
                </div>
              </div>
            </div>

            {/* Potential Points Alert */}
            {potentialPoints > 0 && (
              <div className="bg-gradient-to-r from-yellow-400/25 to-orange-400/25 rounded-xl p-4 border border-yellow-400/40">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="h-5 w-5 text-yellow-300" />
                  <span className="text-sm text-white font-semibold">Quick Points Available!</span>
                </div>
                <div className="text-white/90">
                  <span className="text-lg font-bold text-yellow-300">{potentialPoints}</span> points from auto-graded questions
                </div>
                <div className="text-xs text-white/70 mt-1">
                  Answer multiple choice and numerical questions for instant points
                </div>
              </div>
            )}

            {/* Question Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/90 font-medium">Question Progress</span>
                <span className="text-sm text-white/90 font-bold">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-3 bg-white/20"
              />
              <div className="text-xs text-white/70 text-center">
                {totalQuestions - questionsAnswered} questions remaining
              </div>
            </div>

            {/* Motivational Section */}
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur border border-white/20 text-center">
              <div className="text-lg mb-2">
                {progressPercentage === 100 ? (
                  <span className="text-green-300">🎉</span>
                ) : progressPercentage >= 75 ? (
                  <span className="text-blue-300">🚀</span>
                ) : progressPercentage >= 50 ? (
                  <span className="text-purple-300">💪</span>
                ) : progressPercentage >= 25 ? (
                  <span className="text-indigo-300">⭐</span>
                ) : (
                  <span className="text-white/80">🎯</span>
                )}
              </div>
              <div className="text-sm text-white/90 font-medium">
                {progressPercentage === 100 ? (
                  "All questions completed! Ready to submit?"
                ) : progressPercentage >= 75 ? (
                  "Almost there! Keep going!"
                ) : progressPercentage >= 50 ? (
                  "Great progress! You're halfway done!"
                ) : progressPercentage >= 25 ? (
                  "Good start! Keep building momentum!"
                ) : (
                  "Ready to earn some points? Let's go!"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
