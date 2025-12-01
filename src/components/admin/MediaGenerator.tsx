"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Image as ImageIcon,
  Video,
  Wand2,
  Loader2,
  Download,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  X,
  Copy,
  Atom,
  Zap,
  Clock,
  BookMarked,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  allStandardSets,
  getStandardsBySet,
  getStandardsByTopic,
  type Standard,
  type StandardSet
} from '@/data/physics-standards'

// Types
interface GeneratedImage {
  id: string
  base64: string
  mimeType: string
  prompt: string
  aspectRatio: string
  generatedAt: string
}

interface GeneratedVideo {
  id: string
  uri: string
  generatedAt: string
}

interface MediaGeneratorProps {
  onImageSelect?: (imageData: { base64: string; mimeType: string }) => void
  onVideoSelect?: (videoUri: string) => void
  physicsTopic?: string
  defaultPrompt?: string
  mode?: 'image' | 'video' | 'both'
  triggerLabel?: string
  className?: string
}

const imageTypeOptions = [
  { id: 'diagram', name: 'Diagram', icon: '📊', description: 'Clean educational diagram' },
  { id: 'scenario', name: 'Scenario', icon: '🎬', description: 'Realistic physics scene' },
  { id: 'concept', name: 'Concept', icon: '💡', description: 'Abstract illustration' },
  { id: 'realWorld', name: 'Real World', icon: '🌍', description: 'Everyday application' },
  { id: 'experiment', name: 'Experiment', icon: '🔬', description: 'Lab setup' },
  { id: 'animation', name: 'Animation', icon: '🎞️', description: 'Motion frame' }
]

const videoTypeOptions = [
  { id: 'motion', name: 'Motion Demo', icon: '🏃', description: 'Clear trajectories' },
  { id: 'experiment', name: 'Experiment', icon: '🔬', description: 'Lab demonstration' },
  { id: 'realWorld', name: 'Real World', icon: '🌍', description: 'Everyday physics' },
  { id: 'simulation', name: 'Simulation', icon: '💻', description: 'Physics visualization' }
]

const aspectRatioOptions = {
  image: [
    { id: '1:1', name: 'Square', icon: '⬜' },
    { id: '16:9', name: 'Widescreen', icon: '🖼️' },
    { id: '9:16', name: 'Portrait', icon: '📱' },
    { id: '4:3', name: 'Standard', icon: '📺' }
  ],
  video: [
    { id: '16:9', name: 'Widescreen', icon: '🖼️' },
    { id: '9:16', name: 'Portrait', icon: '📱' }
  ]
}

const physicsTopicOptions = [
  { id: 'kinematics', name: 'Motion & Kinematics', icon: '🏃' },
  { id: 'forces', name: 'Forces & Newton\'s Laws', icon: '💪' },
  { id: 'energy', name: 'Energy & Work', icon: '⚡' },
  { id: 'momentum', name: 'Momentum & Collisions', icon: '🎱' },
  { id: 'waves', name: 'Waves & Sound', icon: '🌊' },
  { id: 'electricity', name: 'Electricity & Circuits', icon: '🔌' },
  { id: 'optics', name: 'Light & Optics', icon: '💡' },
  { id: 'magnetism', name: 'Magnetism', icon: '🧲' },
  { id: 'thermodynamics', name: 'Heat & Thermodynamics', icon: '🔥' },
  { id: 'rotational', name: 'Rotational Motion', icon: '🔄' },
  { id: 'fluids', name: 'Fluids & Pressure', icon: '💧' },
  { id: 'modern-physics', name: 'Modern Physics', icon: '⚛️' }
]

export default function MediaGenerator({
  onImageSelect,
  onVideoSelect,
  physicsTopic: defaultTopic,
  defaultPrompt = '',
  mode = 'both',
  triggerLabel = 'Generate Media',
  className
}: MediaGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'image' | 'video'>(mode === 'video' ? 'video' : 'image')
  
  // Image generation state
  const [imagePrompt, setImagePrompt] = useState(defaultPrompt)
  const [imageType, setImageType] = useState('scenario')
  const [imageAspectRatio, setImageAspectRatio] = useState('16:9')
  const [imageTopic, setImageTopic] = useState(defaultTopic || '')
  const [imageCount, setImageCount] = useState(1)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)

  // Video generation state
  const [videoPrompt, setVideoPrompt] = useState(defaultPrompt)
  const [videoType, setVideoType] = useState('motion')
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9')
  const [videoTopic, setVideoTopic] = useState(defaultTopic || '')
  const [videoDuration, setVideoDuration] = useState<number>(6)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null)
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([])
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)

  // Standards alignment state
  const [selectedStandardSet, setSelectedStandardSet] = useState<string>('')
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [showStandards, setShowStandards] = useState(false)

  // Update prompts when default changes
  useEffect(() => {
    if (defaultPrompt) {
      setImagePrompt(defaultPrompt)
      setVideoPrompt(defaultPrompt)
    }
  }, [defaultPrompt])

  useEffect(() => {
    if (defaultTopic) {
      setImageTopic(defaultTopic)
      setVideoTopic(defaultTopic)
    }
  }, [defaultTopic])

  // Get current topic based on active tab
  const currentTopic = activeTab === 'image' ? imageTopic : videoTopic

  // Get all standards - show all when no topic selected, filter when topic is selected
  const allStandards = allStandardSets.flatMap(set => set.standards)
  const topicFilteredStandards = currentTopic && currentTopic !== 'none'
    ? allStandards.filter(s => s.topics.includes(currentTopic))
    : allStandards // Show ALL standards when no topic selected

  // Further filter by selected framework (if any)
  const availableStandards = selectedStandardSet && selectedStandardSet !== 'none'
    ? topicFilteredStandards.filter(s => {
        const set = allStandardSets.find(ss => ss.id === selectedStandardSet)
        return set?.standards.some(ss => ss.id === s.id)
      })
    : topicFilteredStandards

  // Count standards per framework for the current topic
  const standardCounts = allStandardSets.map(set => ({
    id: set.id,
    count: currentTopic && currentTopic !== 'none'
      ? set.standards.filter(s => s.topics.includes(currentTopic)).length
      : set.standards.length
  }))

  // Toggle individual standard selection
  const toggleStandard = useCallback((standardId: string) => {
    setSelectedStandards(prev =>
      prev.includes(standardId)
        ? prev.filter(id => id !== standardId)
        : [...prev, standardId]
    )
  }, [])

  // Generate image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return
    
    setGeneratingImage(true)
    setImageError(null)
    setGeneratedImages([])

    try {
      const response = await fetch('/api/generate-media/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          physicsTopic: imageTopic || undefined,
          imageType,
          aspectRatio: imageAspectRatio,
          sampleCount: imageCount,
          enhanceForPhysics: true,
          selectedStandardSet: selectedStandardSet || undefined,
          selectedStandards: selectedStandards.length > 0 ? selectedStandards : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      setGeneratedImages(data.images)
    } catch (err) {
      console.error('Image generation error:', err)
      setImageError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setGeneratingImage(false)
    }
  }

  // Generate video
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return
    
    setGeneratingVideo(true)
    setVideoError(null)
    setGeneratedVideos([])
    setVideoProgress(0)

    try {
      const response = await fetch('/api/generate-media/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          physicsTopic: videoTopic || undefined,
          videoType,
          aspectRatio: videoAspectRatio,
          duration: videoDuration,
          enhanceForPhysics: true,
          selectedStandardSet: selectedStandardSet || undefined,
          selectedStandards: selectedStandards.length > 0 ? selectedStandards : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start video generation')
      }

      setVideoOperationName(data.operationName)
      // Start polling for status
      pollVideoStatus(data.operationName)
    } catch (err) {
      console.error('Video generation error:', err)
      setVideoError(err instanceof Error ? err.message : 'Failed to generate video')
      setGeneratingVideo(false)
    }
  }

  // Poll video generation status
  const pollVideoStatus = useCallback(async (operationName: string) => {
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max

    const poll = async () => {
      attempts++
      setVideoProgress(Math.min((attempts / maxAttempts) * 100, 95))

      try {
        const response = await fetch('/api/generate-media/video/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName })
        })

        const data = await response.json()

        if (data.status === 'complete') {
          setGeneratedVideos(data.videos)
          setGeneratingVideo(false)
          setVideoProgress(100)
          setVideoOperationName(null)
          return
        }

        if (data.status === 'failed' || data.error) {
          setVideoError(data.error || 'Video generation failed')
          if (data.details) {
            console.log('Video error details:', data.details)
          }
          setGeneratingVideo(false)
          setVideoOperationName(null)
          return
        }

        // Still processing, poll again
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000) // Poll every 5 seconds
        } else {
          setVideoError('Video generation timed out. Please try again.')
          setGeneratingVideo(false)
          setVideoOperationName(null)
        }
      } catch (err) {
        console.error('Polling error:', err)
        setVideoError('Failed to check video status')
        setGeneratingVideo(false)
        setVideoOperationName(null)
      }
    }

    poll()
  }, [])

  // Select image
  const handleSelectImage = (image: GeneratedImage) => {
    if (onImageSelect) {
      onImageSelect({
        base64: image.base64,
        mimeType: image.mimeType
      })
      setOpen(false)
    }
  }

  // Select video
  const handleSelectVideo = (video: GeneratedVideo) => {
    if (onVideoSelect) {
      onVideoSelect(video.uri)
      setOpen(false)
    }
  }

  // Download image
  const downloadImage = (image: GeneratedImage) => {
    const link = document.createElement('a')
    link.href = `data:${image.mimeType};base64,${image.base64}`
    link.download = `physics-${image.id}.png`
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn("gap-2", className)}>
          <Wand2 className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI Media Generator
          </DialogTitle>
          <DialogDescription>
            Generate physics education images and videos using Google Vertex AI
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'image' | 'video')}>
          <TabsList className="grid w-full grid-cols-2">
            {(mode === 'both' || mode === 'image') && (
              <TabsTrigger value="image" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Image
              </TabsTrigger>
            )}
            {(mode === 'both' || mode === 'video') && (
              <TabsTrigger value="video" className="gap-2">
                <Video className="h-4 w-4" />
                Video
              </TabsTrigger>
            )}
          </TabsList>

          {/* Image Generation Tab */}
          <TabsContent value="image" className="space-y-4">
            <div className="grid gap-4">
              {/* Prompt Input */}
              <div>
                <Label htmlFor="image-prompt">Describe the image you want to generate</Label>
                <Textarea
                  id="image-prompt"
                  placeholder="e.g., A diagram showing the forces on a ball rolling down an inclined plane, with labeled arrows for gravity, normal force, and friction"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="mt-1.5 min-h-[100px]"
                />
              </div>

              {/* Options Row */}
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Physics Topic */}
                <div>
                  <Label>Physics Topic</Label>
                  <Select value={imageTopic} onValueChange={setImageTopic}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select topic (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific topic</SelectItem>
                      {physicsTopicOptions.map(topic => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.icon} {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Type */}
                <div>
                  <Label>Image Style</Label>
                  <Select value={imageType} onValueChange={setImageType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {imageTypeOptions.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon} {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <Label>Aspect Ratio</Label>
                  <Select value={imageAspectRatio} onValueChange={setImageAspectRatio}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatioOptions.image.map(ratio => (
                        <SelectItem key={ratio.id} value={ratio.id}>
                          {ratio.icon} {ratio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Standards Alignment */}
              <Collapsible open={showStandards} onOpenChange={setShowStandards}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <BookMarked className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Standards Alignment</span>
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                        {availableStandards.length} {imageTopic && imageTopic !== 'none' ? 'matching' : 'total'}
                      </Badge>
                      {selectedStandards.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {selectedStandards.length} selected
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-slate-500 transition-transform",
                      showStandards && "rotate-180"
                    )} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                    {/* Topic filter info */}
                    {imageTopic && imageTopic !== 'none' && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-2">
                        <span>Filtered by: <strong>{physicsTopicOptions.find(t => t.id === imageTopic)?.name}</strong></span>
                      </div>
                    )}

                    {/* Framework Filter */}
                    <div>
                      <Label className="text-sm">Filter by Framework</Label>
                      <Select value={selectedStandardSet} onValueChange={(v) => {
                        setSelectedStandardSet(v)
                        setSelectedStandards([])
                      }}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="All frameworks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">All frameworks</SelectItem>
                          {allStandardSets.map(set => {
                            const counts = standardCounts.find(c => c.id === set.id)
                            return (
                              <SelectItem key={set.id} value={set.id} disabled={counts?.count === 0}>
                                {set.icon} {set.shortName} ({counts?.count || 0})
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Standards List */}
                    {availableStandards.length > 0 ? (
                      <div>
                        <Label className="text-sm mb-2 block">Select Standards ({availableStandards.length} available)</Label>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {availableStandards.slice(0, 20).map(standard => {
                            const set = allStandardSets.find(s => s.standards.some(st => st.id === standard.id))
                            return (
                              <div
                                key={standard.id}
                                onClick={() => toggleStandard(standard.id)}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-sm",
                                  selectedStandards.includes(standard.id)
                                    ? "bg-blue-100"
                                    : "hover:bg-slate-100"
                                )}
                              >
                                <Checkbox checked={selectedStandards.includes(standard.id)} />
                                <span className="font-medium text-blue-700">{standard.code}</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0">{set?.shortName}</Badge>
                                <span className="text-slate-600 truncate flex-1">{standard.title}</span>
                              </div>
                            )
                          })}
                          {availableStandards.length > 20 && (
                            <p className="text-xs text-slate-500 text-center py-2">
                              Showing 20 of {availableStandards.length} - select a topic or framework to narrow results
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No standards found for this combination</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateImage}
                disabled={!imagePrompt.trim() || generatingImage}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>

              {/* Error Display */}
              {imageError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {imageError}
                </div>
              )}

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <div className="space-y-3">
                  <Label>Generated Images</Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {generatedImages.map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="relative aspect-video bg-slate-100">
                          <img
                            src={`data:${image.mimeType};base64,${image.base64}`}
                            alt="Generated physics image"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex gap-2">
                            {onImageSelect && (
                              <Button
                                size="sm"
                                onClick={() => handleSelectImage(image)}
                                className="flex-1"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Use This
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadImage(image)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Video Generation Tab */}
          <TabsContent value="video" className="space-y-4">
            <div className="grid gap-4">
              {/* Prompt Input */}
              <div>
                <Label htmlFor="video-prompt">Describe the video you want to generate</Label>
                <Textarea
                  id="video-prompt"
                  placeholder="e.g., A slow-motion demonstration of a pendulum swinging back and forth, showing the conversion between potential and kinetic energy"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  className="mt-1.5 min-h-[100px]"
                />
              </div>

              {/* Options Row */}
              <div className="grid sm:grid-cols-4 gap-4">
                {/* Physics Topic */}
                <div>
                  <Label>Physics Topic</Label>
                  <Select value={videoTopic} onValueChange={setVideoTopic}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific topic</SelectItem>
                      {physicsTopicOptions.map(topic => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.icon} {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Video Type */}
                <div>
                  <Label>Video Style</Label>
                  <Select value={videoType} onValueChange={setVideoType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {videoTypeOptions.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon} {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div>
                  <Label>Duration</Label>
                  <Select value={videoDuration.toString()} onValueChange={(v) => setVideoDuration(parseInt(v))}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 5, 6, 7, 8].map(d => (
                        <SelectItem key={d} value={d.toString()}>
                          {d} seconds
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <Label>Aspect Ratio</Label>
                  <Select value={videoAspectRatio} onValueChange={setVideoAspectRatio}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatioOptions.video.map(ratio => (
                        <SelectItem key={ratio.id} value={ratio.id}>
                          {ratio.icon} {ratio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Standards Alignment for Video */}
              <Collapsible open={showStandards} onOpenChange={setShowStandards}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <BookMarked className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Standards Alignment</span>
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                        {availableStandards.length} {videoTopic && videoTopic !== 'none' ? 'matching' : 'total'}
                      </Badge>
                      {selectedStandards.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {selectedStandards.length} selected
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-slate-500 transition-transform",
                      showStandards && "rotate-180"
                    )} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                    {/* Topic filter info */}
                    {videoTopic && videoTopic !== 'none' && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-2">
                        <span>Filtered by: <strong>{physicsTopicOptions.find(t => t.id === videoTopic)?.name}</strong></span>
                      </div>
                    )}

                    {/* Framework Filter */}
                    <div>
                      <Label className="text-sm">Filter by Framework</Label>
                      <Select value={selectedStandardSet} onValueChange={(v) => {
                        setSelectedStandardSet(v)
                        setSelectedStandards([])
                      }}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="All frameworks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">All frameworks</SelectItem>
                          {allStandardSets.map(set => {
                            const counts = standardCounts.find(c => c.id === set.id)
                            return (
                              <SelectItem key={set.id} value={set.id} disabled={counts?.count === 0}>
                                {set.icon} {set.shortName} ({counts?.count || 0})
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Standards List */}
                    {availableStandards.length > 0 ? (
                      <div>
                        <Label className="text-sm mb-2 block">Select Standards ({availableStandards.length} available)</Label>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {availableStandards.slice(0, 20).map(standard => {
                            const set = allStandardSets.find(s => s.standards.some(st => st.id === standard.id))
                            return (
                              <div
                                key={standard.id}
                                onClick={() => toggleStandard(standard.id)}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-sm",
                                  selectedStandards.includes(standard.id)
                                    ? "bg-blue-100"
                                    : "hover:bg-slate-100"
                                )}
                              >
                                <Checkbox checked={selectedStandards.includes(standard.id)} />
                                <span className="font-medium text-blue-700">{standard.code}</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0">{set?.shortName}</Badge>
                                <span className="text-slate-600 truncate flex-1">{standard.title}</span>
                              </div>
                            )
                          })}
                          {availableStandards.length > 20 && (
                            <p className="text-xs text-slate-500 text-center py-2">
                              Showing 20 of {availableStandards.length} - select a topic or framework to narrow results
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No standards found for this combination</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateVideo}
                disabled={!videoPrompt.trim() || generatingVideo}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {generatingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Video... ({Math.round(videoProgress)}%)
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>

              {/* Progress Bar */}
              {generatingVideo && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Video generation in progress...
                    </span>
                    <span>{Math.round(videoProgress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Video generation typically takes 30-120 seconds. Please wait...
                  </p>
                </div>
              )}

              {/* Error Display */}
              {videoError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {videoError}
                </div>
              )}

              {/* Generated Videos */}
              {generatedVideos.length > 0 && (
                <div className="space-y-3">
                  <Label>Generated Videos</Label>
                  <div className="grid gap-4">
                    {generatedVideos.map((video) => (
                      <Card key={video.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100">
                                <Video className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">Generated Video</p>
                                <p className="text-sm text-slate-500">
                                  {new Date(video.generatedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {onVideoSelect && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSelectVideo(video)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Use This
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a href={video.uri} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Quick generate button component for inline use
export function QuickMediaButton({
  prompt,
  topic,
  onImageGenerated,
  className
}: {
  prompt: string
  topic?: string
  onImageGenerated: (imageData: { base64: string; mimeType: string }) => void
  className?: string
}) {
  const [generating, setGenerating] = useState(false)

  const handleQuickGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/generate-media/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          physicsTopic: topic,
          imageType: 'scenario',
          aspectRatio: '16:9',
          sampleCount: 1,
          enhanceForPhysics: true
        })
      })

      const data = await response.json()
      if (data.success && data.images?.length > 0) {
        onImageGenerated({
          base64: data.images[0].base64,
          mimeType: data.images[0].mimeType
        })
      }
    } catch (error) {
      console.error('Quick generate failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleQuickGenerate}
      disabled={generating}
      className={cn("gap-1", className)}
    >
      {generating ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Wand2 className="h-3 w-3" />
      )}
      Generate
    </Button>
  )
}

