"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Copy,
  Trash2,
  Clock,
  Zap,
  ChevronRight,
  FolderOpen,
  Plus,
  ImagePlus
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface GeneratedImage {
  id: string
  base64: string
  mimeType: string
  prompt: string
  aspectRatio: string
  generatedAt: string
  topic?: string
}

interface GeneratedVideo {
  id: string
  uri: string
  prompt: string
  generatedAt: string
  topic?: string
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

const quickPrompts = {
  image: [
    "Free body diagram showing forces on a block on an inclined plane",
    "Projectile motion trajectory with labeled velocity components",
    "Wave interference pattern showing constructive and destructive interference",
    "Electric circuit with resistors in series and parallel",
    "Light ray diagram through a convex lens showing focal point",
    "Pendulum at different positions showing energy transformation",
    "Collision between two objects showing momentum before and after",
    "Magnetic field lines around a bar magnet"
  ],
  video: [
    "Ball rolling down an inclined plane and continuing on flat surface",
    "Pendulum swinging back and forth showing energy conversion",
    "Two balls colliding and bouncing apart showing momentum transfer",
    "Wave pulse traveling along a rope and reflecting at the end",
    "Object in free fall with slowing time to show acceleration",
    "Spinning figure skater pulling arms in to spin faster"
  ]
}

export default function MediaGeneratorPage() {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image')
  
  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageType, setImageType] = useState('scenario')
  const [imageAspectRatio, setImageAspectRatio] = useState('16:9')
  const [imageTopic, setImageTopic] = useState('')
  const [imageCount, setImageCount] = useState(2)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  // Video generation state
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoType, setVideoType] = useState('motion')
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9')
  const [videoTopic, setVideoTopic] = useState('')
  const [videoDuration, setVideoDuration] = useState<number>(6)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)

  // Gallery state
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([])

  // Generate image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return
    
    setGeneratingImage(true)
    setImageError(null)

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
          enhanceForPhysics: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      // Add to gallery with topic info
      const newImages = data.images.map((img: GeneratedImage) => ({
        ...img,
        topic: imageTopic,
        prompt: imagePrompt
      }))
      setGeneratedImages(prev => [...newImages, ...prev])
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
          enhanceForPhysics: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start video generation')
      }

      setVideoOperationName(data.operationName)
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
    const maxAttempts = 60

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
          const newVideos = data.videos.map((vid: GeneratedVideo) => ({
            ...vid,
            topic: videoTopic,
            prompt: videoPrompt
          }))
          setGeneratedVideos(prev => [...newVideos, ...prev])
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

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
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
  }, [videoTopic, videoPrompt])

  // Download image
  const downloadImage = (image: GeneratedImage) => {
    const link = document.createElement('a')
    link.href = `data:${image.mimeType};base64,${image.base64}`
    link.download = `physics-${image.id}.png`
    link.click()
  }

  // Copy image to clipboard
  const copyImageToClipboard = async (image: GeneratedImage) => {
    const dataUrl = `data:${image.mimeType};base64,${image.base64}`
    await navigator.clipboard.writeText(`![Physics Image](${dataUrl})`)
    alert('Image markdown copied to clipboard!')
  }

  // Delete from gallery
  const deleteImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id))
  }

  const deleteVideo = (id: string) => {
    setGeneratedVideos(prev => prev.filter(vid => vid.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-200 mb-4">
            <Wand2 className="h-5 w-5 text-violet-600" />
            <span className="text-sm font-medium text-violet-700">Powered by Imagen 4 & Veo 3.1</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            AI Media Studio
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Generate stunning physics diagrams, scenarios, and demonstration videos for your lessons.
            All media is optimized for educational use.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Generator Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'image' | 'video')}>
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="image" className="gap-2 text-base">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="video" className="gap-2 text-base">
                  <Video className="h-4 w-4" />
                  Videos
                </TabsTrigger>
              </TabsList>

              {/* Image Tab */}
              <TabsContent value="image" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ImagePlus className="h-5 w-5 text-violet-600" />
                      Generate Image
                    </CardTitle>
                    <CardDescription>Describe the physics image you want to create</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Prompts */}
                    <div>
                      <Label className="text-xs text-slate-500 mb-2 block">Quick Start Ideas</Label>
                      <div className="flex flex-wrap gap-1">
                        {quickPrompts.image.slice(0, 4).map((prompt, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setImagePrompt(prompt)}
                          >
                            {prompt.substring(0, 25)}...
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Prompt */}
                    <div>
                      <Label htmlFor="img-prompt">Prompt</Label>
                      <Textarea
                        id="img-prompt"
                        placeholder="e.g., A diagram showing the forces on a ball rolling down an inclined plane..."
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="mt-1.5 min-h-[100px]"
                      />
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Topic</Label>
                        <Select value={imageTopic} onValueChange={setImageTopic}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Any topic" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any topic</SelectItem>
                            {physicsTopicOptions.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Style</Label>
                        <Select value={imageType} onValueChange={setImageType}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {imageTypeOptions.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Aspect Ratio</Label>
                        <Select value={imageAspectRatio} onValueChange={setImageAspectRatio}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">🖼️ Widescreen (16:9)</SelectItem>
                            <SelectItem value="1:1">⬜ Square (1:1)</SelectItem>
                            <SelectItem value="9:16">📱 Portrait (9:16)</SelectItem>
                            <SelectItem value="4:3">📺 Standard (4:3)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Count</Label>
                        <Select value={imageCount.toString()} onValueChange={(v) => setImageCount(parseInt(v))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 image</SelectItem>
                            <SelectItem value="2">2 images</SelectItem>
                            <SelectItem value="3">3 images</SelectItem>
                            <SelectItem value="4">4 images</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerateImage}
                      disabled={!imagePrompt.trim() || generatingImage}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                      size="lg"
                    >
                      {generatingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating with Imagen 4...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Images
                        </>
                      )}
                    </Button>

                    {imageError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {imageError}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Video Tab */}
              <TabsContent value="video" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Video className="h-5 w-5 text-cyan-600" />
                      Generate Video
                    </CardTitle>
                    <CardDescription>Describe the physics demonstration video</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Prompts */}
                    <div>
                      <Label className="text-xs text-slate-500 mb-2 block">Quick Start Ideas</Label>
                      <div className="flex flex-wrap gap-1">
                        {quickPrompts.video.slice(0, 3).map((prompt, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setVideoPrompt(prompt)}
                          >
                            {prompt.substring(0, 30)}...
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Prompt */}
                    <div>
                      <Label htmlFor="vid-prompt">Prompt</Label>
                      <Textarea
                        id="vid-prompt"
                        placeholder="e.g., A pendulum swinging back and forth showing energy conversion..."
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        className="mt-1.5 min-h-[100px]"
                      />
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Topic</Label>
                        <Select value={videoTopic} onValueChange={setVideoTopic}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Any topic" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any topic</SelectItem>
                            {physicsTopicOptions.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Style</Label>
                        <Select value={videoType} onValueChange={setVideoType}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {videoTypeOptions.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <Select value={videoDuration.toString()} onValueChange={(v) => setVideoDuration(parseInt(v))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[4, 5, 6, 7, 8].map(d => (
                              <SelectItem key={d} value={d.toString()}>{d} seconds</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Aspect Ratio</Label>
                        <Select value={videoAspectRatio} onValueChange={setVideoAspectRatio}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">🖼️ Widescreen</SelectItem>
                            <SelectItem value="9:16">📱 Portrait</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerateVideo}
                      disabled={!videoPrompt.trim() || generatingVideo}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                      size="lg"
                    >
                      {generatingVideo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating with Veo 3.1... ({Math.round(videoProgress)}%)
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Generate Video
                        </>
                      )}
                    </Button>

                    {/* Progress */}
                    {generatingVideo && (
                      <div className="space-y-2">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${videoProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Video generation takes 30-120 seconds...
                        </p>
                      </div>
                    )}

                    {videoError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {videoError}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Model Info */}
            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-700">Latest AI Models</div>
                    <div className="text-slate-500 mt-1">
                      Images: <span className="text-violet-600 font-medium">Imagen 4</span> •
                      Videos: <span className="text-cyan-600 font-medium">Veo 3.1</span> (1080p)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gallery Panel */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-slate-600" />
                    Generated Media
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{generatedImages.length} images</Badge>
                    <Badge variant="secondary">{generatedVideos.length} videos</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {generatedImages.length === 0 && generatedVideos.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No media generated yet</p>
                    <p className="text-sm mt-1">Create physics images and videos using the generator</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Images */}
                    {generatedImages.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Images ({generatedImages.length})
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {generatedImages.map((image) => (
                            <div key={image.id} className="group relative rounded-lg overflow-hidden border bg-white shadow-sm hover:shadow-md transition-shadow">
                              <div className="aspect-video bg-slate-100">
                                <img
                                  src={`data:${image.mimeType};base64,${image.base64}`}
                                  alt="Generated physics image"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                  <p className="text-white text-xs line-clamp-2 mb-2">{image.prompt}</p>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => downloadImage(image)}>
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => copyImageToClipboard(image)}>
                                      <Copy className="h-3 w-3 mr-1" />
                                      Copy
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white hover:text-red-400 hover:bg-red-500/20" onClick={() => deleteImage(image.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {image.topic && (
                                <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                                  {physicsTopicOptions.find(t => t.id === image.topic)?.icon} {image.topic}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {generatedVideos.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Videos ({generatedVideos.length})
                        </h3>
                        <div className="space-y-3">
                          {generatedVideos.map((video) => (
                            <div key={video.id} className="flex items-center gap-4 p-4 rounded-lg border bg-white">
                              <div className="p-3 rounded-lg bg-cyan-100">
                                <Video className="h-6 w-6 text-cyan-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{video.prompt}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(video.generatedAt).toLocaleString()}
                                  {video.topic && (
                                    <span className="ml-2">
                                      • {physicsTopicOptions.find(t => t.id === video.topic)?.name}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <a href={video.uri} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </a>
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteVideo(video.id)}>
                                  <Trash2 className="h-4 w-4 text-slate-400" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

