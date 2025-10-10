"use client"

// React/Next.js imports
import { useState } from 'react'

// External imports
import { Check, Key, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'

// Internal imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/providers/toast-provider'

interface JoinCourseWithCodeProps {
  onSuccess?: (course: any) => void
}

export default function JoinCourseWithCode({ onSuccess }: JoinCourseWithCodeProps) {
  const { showToast } = useToast()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    course?: { name: string; section?: string }
    message?: string
  } | null>(null)

  const handleValidateCode = async () => {
    if (!joinCode.trim()) return

    setValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch(`/api/courses/enroll?code=${encodeURIComponent(joinCode.trim())}`)
      const data = await response.json()

      setValidationResult(data)

      if (!data.valid) {
        showToast({
          title: 'Invalid Code',
          description: data.message || 'This join code is not valid',
          variant: 'error'
        })
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to validate join code',
        variant: 'error'
      })
    } finally {
      setValidating(false)
    }
  }

  const handleJoinCourse = async () => {
    if (!joinCode.trim()) {
      showToast({
        title: 'Error',
        description: 'Please enter a join code',
        variant: 'error'
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join course')
      }

      showToast({
        title: 'Success!',
        description: `You&apos;ve been enrolled in ${data.course.name}`
      })

      setJoinCode('')
      setValidationResult(null)

      onSuccess?.(data.course)

    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join course',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // Convert to uppercase and remove spaces
    const cleanCode = value.toUpperCase().replace(/\s/g, '')
    setJoinCode(cleanCode)
    setValidationResult(null)
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Join a Course
        </CardTitle>
        <CardDescription>
          Enter the join code provided by your teacher to enroll in a course
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="join-code">Join Code</Label>
          <div className="flex gap-2">
            <Input
              id="join-code"
              value={joinCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              onBlur={handleValidateCode}
              placeholder="Enter 6-character code"
              className="font-mono text-lg uppercase"
              maxLength={6}
              disabled={loading}
            />
            {validationResult?.valid && (
              <div className="flex items-center justify-center px-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            )}
          </div>

          {validating && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Validating code...
            </p>
          )}

          {validationResult?.valid && validationResult.course && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Course found!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {validationResult.course.name}
                {validationResult.course.section && ` - ${validationResult.course.section}`}
              </p>
            </div>
          )}

          {validationResult && !validationResult.valid && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {validationResult.message}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleJoinCourse}
          disabled={loading || !joinCode.trim() || validating || (validationResult !== null && !validationResult.valid)}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Joining Course...
            </>
          ) : (
            <>
              Join Course
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Don&apos;t have a join code?</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ask your teacher for the course join code. It&apos;s a 6-character code that allows you to enroll in their class.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

