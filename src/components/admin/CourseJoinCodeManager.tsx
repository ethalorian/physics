"use client"

// React/Next.js imports
import { useState, useEffect } from 'react'

// External imports
import { Copy, Check, RefreshCw, Lock, Unlock, Calendar, Users, X } from 'lucide-react'

// Internal imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/providers/toast-provider'

interface CourseJoinCodeManagerProps {
  courseId: string
  courseName: string
  currentJoinCode?: string | null
  joinCodeEnabled?: boolean
  joinCodeExpiresAt?: string | null
  maxEnrollments?: number | null
  onUpdate?: () => void
}

export default function CourseJoinCodeManager({
  courseId,
  courseName,
  currentJoinCode,
  joinCodeEnabled = false,
  joinCodeExpiresAt,
  maxEnrollments,
  onUpdate
}: CourseJoinCodeManagerProps) {
  const { showToast } = useToast()
  const [joinCode, setJoinCode] = useState(currentJoinCode || '')
  const [isEnabled, setIsEnabled] = useState(joinCodeEnabled)
  const [expiresIn, setExpiresIn] = useState<number | ''>('')
  const [maxStudents, setMaxStudents] = useState<number | ''>(maxEnrollments || '')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setJoinCode(currentJoinCode || '')
    setIsEnabled(joinCodeEnabled)
    setMaxStudents(maxEnrollments || '')
  }, [currentJoinCode, joinCodeEnabled, maxEnrollments])

  const handleGenerateCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/courses/join-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          enabled: true,
          expiresInDays: expiresIn || null,
          maxEnrollments: maxStudents || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate join code')
      }

      setJoinCode(data.joinCode)
      setIsEnabled(true)
      
      showToast({
        title: 'Success',
        description: 'Join code generated successfully!'
      })

      onUpdate?.()

    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate join code',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/courses/join-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          enabled: !isEnabled
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update join code')
      }

      setIsEnabled(!isEnabled)
      
      showToast({
        title: 'Success',
        description: `Join code ${!isEnabled ? 'enabled' : 'disabled'} successfully`
      })

      onUpdate?.()

    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update join code',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (!joinCode) return
    
    navigator.clipboard.writeText(joinCode)
    setCopied(true)
    
    showToast({
      title: 'Copied!',
      description: 'Join code copied to clipboard'
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const getShareableLink = () => {
    if (!joinCode) return ''
    return `${window.location.origin}/enroll?code=${joinCode}`
  }

  const handleCopyLink = () => {
    const link = getShareableLink()
    navigator.clipboard.writeText(link)
    
    showToast({
      title: 'Copied!',
      description: 'Enrollment link copied to clipboard'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Course Join Code
              {isEnabled && joinCode && (
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
              )}
              {!isEnabled && joinCode && (
                <Badge variant="secondary">
                  Disabled
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Allow students to self-enroll using a join code
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Join Code Display */}
        {joinCode && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="join-code">Join Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="join-code"
                    value={joinCode}
                    readOnly
                    className="font-mono text-lg font-bold text-center"
                  />
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={handleToggleEnabled}
                    variant="outline"
                    size="icon"
                    disabled={loading}
                  >
                    {isEnabled ? (
                      <Unlock className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Shareable Link */}
            <div>
              <Label>Shareable Link</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={getShareableLink()}
                  readOnly
                  className="text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Status Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {joinCodeExpiresAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Expires</div>
                    <div>{new Date(joinCodeExpiresAt).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
              {maxEnrollments && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Max Students</div>
                    <div>{maxEnrollments} students</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generate/Regenerate Form */}
        <div className="space-y-3 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expires-in">Expires In (days)</Label>
              <Input
                id="expires-in"
                type="number"
                placeholder="Never"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value ? parseInt(e.target.value) : '')}
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for no expiration
              </p>
            </div>

            <div>
              <Label htmlFor="max-students">Max Students</Label>
              <Input
                id="max-students"
                type="number"
                placeholder="Unlimited"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value ? parseInt(e.target.value) : '')}
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for unlimited
              </p>
            </div>
          </div>

          <Button
            onClick={handleGenerateCode}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {joinCode ? 'Generate New Code' : 'Generate Join Code'}
              </>
            )}
          </Button>

          {joinCode && (
            <p className="text-xs text-muted-foreground text-center">
              Generating a new code will invalidate the current one
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

