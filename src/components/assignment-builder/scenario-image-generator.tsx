"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Sparkles, 
  Image as ImageIcon, 
  RefreshCw, 
  Trash2, 
  Download,
  AlertCircle
} from 'lucide-react'

interface ScenarioImageGeneratorProps {
  questionText: string
  currentImage?: string
  onImageGenerated: (imageUrl: string) => void
  onImageRemoved: () => void
}

export default function ScenarioImageGenerator({
  questionText,
  currentImage,
  onImageGenerated,
  onImageRemoved
}: ScenarioImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string | null>(null)

  const generateImage = async () => {
    if (!questionText.trim()) {
      setError('Please enter question text before generating an image')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-scenario-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: customPrompt || questionText,
          questionType: 'physics-problem'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      onImageGenerated(data.imageUrl)
      setLastGeneratedPrompt(data.prompt)
      setShowCustomPrompt(false)
      setCustomPrompt('')
    } catch (err: any) {
      console.error('Error generating image:', err)
      setError(err.message || 'Failed to generate scenario image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async () => {
    if (!currentImage) return

    try {
      // Handle base64 data URLs
      if (currentImage.startsWith('data:')) {
        // Extract base64 data from data URL
        const base64Data = currentImage.split(',')[1]
        const mimeType = currentImage.match(/data:([^;]+);/)?.[1] || 'image/png'
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: mimeType })
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `physics-scenario-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // Handle regular URLs (shouldn't happen with new implementation)
        const response = await fetch(currentImage)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `physics-scenario-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Error downloading image:', err)
      setError('Failed to download image')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Scenario Visualization</Label>
        {!currentImage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
          >
            {showCustomPrompt ? 'Use Question Text' : 'Custom Prompt'}
          </Button>
        )}
      </div>

      {showCustomPrompt && !currentImage && (
        <div className="space-y-2">
          <Label htmlFor="custom-prompt" className="text-sm">
            Custom Image Description (Optional)
          </Label>
          <Textarea
            id="custom-prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe the physics scenario you want to visualize in detail..."
            rows={3}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Provide a detailed description of the scene you want. The AI will create a Netflix-style cinematic visualization with dark, moody atmosphere.
          </p>
        </div>
      )}

      {currentImage ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={currentImage}
                alt="Physics scenario visualization"
                className="w-full h-auto max-h-96 object-contain bg-gray-50"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={downloadImage}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={generateImage}
                  disabled={isGenerating}
                  className="bg-white/90 hover:bg-white"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onImageRemoved()
                    setLastGeneratedPrompt(null)
                  }}
                  className="bg-white/90 hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              No scenario visualization yet
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Create a Netflix-style cinematic scene
            </p>
            <Button
              type="button"
              onClick={generateImage}
              disabled={isGenerating || !questionText.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Artwork...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Netflix Scene
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {lastGeneratedPrompt && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            View generated prompt
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-wrap">
            {lastGeneratedPrompt}
          </pre>
        </details>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Extracts the exact scenario from your question text for accurate visualization</p>
        <p>• Creates Netflix-style cinematography like Stranger Things or Dark</p>
        <p>• Dark, moody atmosphere with dramatic lighting and deep shadows</p>
        <p>• Teal and orange color grading with premium streaming quality</p>
        <p>• Regenerate to explore different dramatic lighting setups</p>
        <p>• Images are embedded directly for reliable display</p>
      </div>
    </div>
  )
}
