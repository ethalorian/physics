"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Trash2, AlertTriangle, HardDrive, RefreshCw } from 'lucide-react'
import {
  getStorageStats,
  clearPhysicsStorage,
  clearImageData,
  smartCleanup
} from '@/utils/storage-utils'

export function StorageManager() {
  const [stats, setStats] = useState(getStorageStats())
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState('')

  const refreshStats = () => {
    setStats(getStorageStats())
  }

  useEffect(() => {
    refreshStats()
  }, [])

  const handleClearImages = async () => {
    setIsClearing(true)
    setMessage('')
    try {
      clearImageData()
      refreshStats()
      setMessage('Image data cleared successfully')
    } catch {
      setMessage('Error clearing image data')
    } finally {
      setIsClearing(false)
    }
  }

  const handleSmartCleanup = async () => {
    setIsClearing(true)
    setMessage('')
    try {
      const success = smartCleanup()
      refreshStats()
      setMessage(success ? 'Smart cleanup completed' : 'Cleanup had limited effect')
    } catch {
      setMessage('Error during cleanup')
    } finally {
      setIsClearing(false)
    }
  }

  const handleClearAll = async () => {
    if (confirm('This will delete all saved assignments and submissions. Are you sure?')) {
      setIsClearing(true)
      setMessage('')
      try {
        clearPhysicsStorage()
        refreshStats()
        setMessage('All physics data cleared')
        // Reload page to reset state
        setTimeout(() => window.location.reload(), 1500)
      } catch {
        setMessage('Error clearing storage')
      } finally {
        setIsClearing(false)
      }
    }
  }

  const isNearLimit = stats.percentUsed > 80
  const isCritical = stats.percentUsed > 95

  return (
    <div className="space-y-4">
      {isCritical && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage Critical</AlertTitle>
          <AlertDescription>
            Your browser storage is almost full. Please clear some data to continue saving assignments.
          </AlertDescription>
        </Alert>
      )}

      {isNearLimit && !isCritical && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage Warning</AlertTitle>
          <AlertDescription>
            Browser storage is {stats.percentUsed.toFixed(0)}% full. Consider clearing old data.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Storage Usage</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStats}
            disabled={isClearing}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Used</span>
            <span className="font-medium">{stats.totalSizeMB.toFixed(2)} MB</span>
          </div>
          <Progress 
            value={stats.percentUsed} 
            className={`h-2 ${
              isCritical ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : ''
            }`}
          />
          <div className="text-xs text-gray-500">
            {stats.percentUsed.toFixed(0)}% of estimated 5MB limit
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium">{stats.assignmentsSizeMB.toFixed(2)} MB</div>
            <div className="text-gray-500">Assignments</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium">{stats.submissionsSizeMB.toFixed(2)} MB</div>
            <div className="text-gray-500">Submissions</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium">{stats.otherSizeMB.toFixed(2)} MB</div>
            <div className="text-gray-500">Other</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearImages}
            disabled={isClearing}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Images
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSmartCleanup}
            disabled={isClearing}
            className="flex-1"
          >
            Smart Cleanup
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAll}
            disabled={isClearing}
            className="flex-1"
          >
            Clear All
          </Button>
        </div>

        {message && (
          <div className="text-sm text-center text-gray-600 dark:text-gray-400">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
