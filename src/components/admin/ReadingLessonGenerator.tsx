"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sparkles,
  BookOpen,
  Target,
  GraduationCap,
  Globe,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Eye,
  RefreshCw,
  Settings2,
  Atom,
  X,
  Save,
  ExternalLink,
  ChevronDown,
  ListChecks,
  HelpCircle,
  MessageSquare,
  CheckSquare,
  Circle,
  CircleDot,
  BookMarked,
  School,
  Bot,
  Cpu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MathMarkdown from '@/components/MathMarkdown'
import MediaGenerator from '@/components/admin/MediaGenerator'
import {
  masteryLevels,
  physicsTopics,
  realWorldEnvironments,
  lessonStructures,
  type MasteryLevel,
  type PhysicsTopic,
  type RealWorldEnvironment,
  type LessonStructure,
  type PhysicsTerm
} from '@/data/reading-lesson-config'
import {
  allStandardSets,
  getStandardsBySet,
  getStandardsByTopic,
  formatStandardsForPrompt,
  type Standard,
  type StandardSet
} from '@/data/physics-standards'

interface EmbeddedQuestion {
  id: string
  type: 'multiple-choice' | 'reflection' | 'quick-check'
  question: string
  placement: 'after-section' | 'inline'  // Where in the content this appears
  sectionIndex: number  // Which section this follows (0-indexed)
  afterSection?: string  // Name of the section this question follows
  options?: string[]  // For multiple choice
  correctAnswer?: number  // Index for multiple choice
  sampleAnswer?: string  // For reflection questions
  explanation?: string  // Shown after answering
  points: number
}

interface GeneratedLesson {
  title: string
  content: string
  objectives: string[]
  keyTerms: {
    term: string
    definition: string
  }[]
  embeddedQuestions?: EmbeddedQuestion[]  // New: questions throughout the lesson
  checkForUnderstanding?: {
    question: string
    answer: string
  }[]
  estimatedReadingTime: number
  masteryLevel: string
  metadata: {
    topic?: string
    environments?: string[]
    generatedAt: string
    wordCount: number
  }
}

export default function ReadingLessonGenerator() {
  const router = useRouter()
  
  // Selection state
  const [selectedMasteryLevel, setSelectedMasteryLevel] = useState<string>('high-school-intro')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [selectedTerms, setSelectedTerms] = useState<string[]>([])
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([])
  const [selectedStructure, setSelectedStructure] = useState<string>('introduction')
  
  // Standards selection state
  const [selectedStandardSets, setSelectedStandardSets] = useState<string[]>([])
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [showAllStandards, setShowAllStandards] = useState<boolean>(false)
  
  // Custom content
  const [lessonTitle, setLessonTitle] = useState<string>('')
  const [customContext, setCustomContext] = useState<string>('')
  
  // AI Model selection
  const [aiModel, setAiModel] = useState<'openai' | 'vertex'>('openai')
  
  // Options
  const [includeFormulas, setIncludeFormulas] = useState<boolean>(true)
  const [includeMisconceptions, setIncludeMisconceptions] = useState<boolean>(true)
  const [includeCheckQuestions, setIncludeCheckQuestions] = useState<boolean>(true)
  const [wordCount, setWordCount] = useState<number>(800)
  
  // Embedded Questions Options
  const [includeEmbeddedQuestions, setIncludeEmbeddedQuestions] = useState<boolean>(true)
  const [questionFrequency, setQuestionFrequency] = useState<'after-each-section' | 'every-other-section' | 'end-only'>('after-each-section')
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple-choice', 'quick-check'])
  
  // UI state
  const [generating, setGenerating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null)
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  
  // Save as Lesson state
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [saveData, setSaveData] = useState({
    slug: '',
    unit: '',
    lessonNumber: 1,
    description: ''
  })
  
  // Collapsible sections state
  const [showCustomContent, setShowCustomContent] = useState<boolean>(false)
  const [showOptions, setShowOptions] = useState<boolean>(false)
  const [showStandards, setShowStandards] = useState<boolean>(false)

  // Student TA reactions state (Jose & Marialys - AP Physics student Teaching Assistants)
  const [taReactions, setTaReactions] = useState<{
    jose?: { reaction: string; taName: string; generatedAt: string }
    marialys?: { reaction: string; taName: string; generatedAt: string }
  }>({})
  const [generatingTaReaction, setGeneratingTaReaction] = useState<'jose' | 'marialys' | null>(null)
  const [selectedReactionType, setSelectedReactionType] = useState<'review' | 'quiz' | 'supplement' | 'debate'>('review')
  const [taReactionModel, setTaReactionModel] = useState<'openai' | 'vertex'>('openai')

  // Get available terms for selected topic
  const availableTerms = selectedTopic && selectedTopic !== 'all'
    ? physicsTopics.find(t => t.id === selectedTopic)?.terms || []
    : []

  // Get recommended environments for selected topic
  const recommendedEnvironments = selectedTopic && selectedTopic !== 'all'
    ? realWorldEnvironments.filter(e => e.bestForTopics.includes(selectedTopic))
    : realWorldEnvironments

  // Get all standards from all sets
  const allStandards = allStandardSets.flatMap(set => set.standards)

  // Filter standards by selected topic (if any) and selected framework sets (if any)
  const filteredStandards = (() => {
    let standards = [...allStandards]

    // Filter by topic if one is selected (show ALL standards when 'all' is selected)
    if (selectedTopic && selectedTopic !== 'all') {
      standards = standards.filter(s => s.topics.includes(selectedTopic))
    }

    // Then filter by selected framework sets (if any selected)
    if (selectedStandardSets.length > 0) {
      const selectedSetStandardIds = new Set(
        selectedStandardSets.flatMap(setId => getStandardsBySet(setId).map(s => s.id))
      )
      standards = standards.filter(s => selectedSetStandardIds.has(s.id))
    }

    // Sort by standard code for better organization
    return standards.sort((a, b) => a.code.localeCompare(b.code))
  })()

  // Count standards by framework for the current topic filter
  const standardCountsByFramework = allStandardSets.map(set => {
    const setStandards = set.standards
    const matchingCount = selectedTopic && selectedTopic !== 'all'
      ? setStandards.filter(s => s.topics.includes(selectedTopic)).length
      : setStandards.length
    return { setId: set.id, count: matchingCount, total: setStandards.length }
  })

  // Handle term selection
  const toggleTerm = useCallback((termId: string) => {
    setSelectedTerms(prev => 
      prev.includes(termId)
        ? prev.filter(id => id !== termId)
        : [...prev, termId]
    )
  }, [])

  // Handle environment selection
  const toggleEnvironment = useCallback((envId: string) => {
    setSelectedEnvironments(prev => 
      prev.includes(envId)
        ? prev.filter(id => id !== envId)
        : [...prev, envId]
    )
  }, [])

  // Handle standard set selection
  const toggleStandardSet = useCallback((setId: string) => {
    setSelectedStandardSets(prev => {
      const isRemoving = prev.includes(setId)
      if (isRemoving) {
        // Remove set and its standards
        const setStandards = getStandardsBySet(setId).map(s => s.id)
        setSelectedStandards(current => 
          current.filter(id => !setStandards.includes(id))
        )
        return prev.filter(id => id !== setId)
      } else {
        return [...prev, setId]
      }
    })
  }, [])

  // Handle individual standard selection
  const toggleStandard = useCallback((standardId: string) => {
    setSelectedStandards(prev => 
      prev.includes(standardId)
        ? prev.filter(id => id !== standardId)
        : [...prev, standardId]
    )
  }, [])

  // Clear topic-dependent selections when topic changes
  useEffect(() => {
    setSelectedTerms([])
  }, [selectedTopic])

  // Generate lesson
  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setGeneratedLesson(null)

    try {
      const response = await fetch('/api/generate-reading-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masteryLevel: selectedMasteryLevel,
          topic: selectedTopic !== 'all' ? selectedTopic : undefined,
          selectedTerms: selectedTerms.length > 0 ? selectedTerms : undefined,
          environments: selectedEnvironments.length > 0 ? selectedEnvironments : undefined,
          customContext: customContext || undefined,
          lessonTitle: lessonTitle || undefined,
          lessonStructure: selectedStructure,
          includeFormulas,
          includeMisconceptions,
          includeCheckQuestions,
          wordCount,
          // Embedded questions settings
          includeEmbeddedQuestions,
          questionFrequency,
          questionTypes,
          // Standards alignment
          selectedStandardSets: selectedStandardSets.length > 0 ? selectedStandardSets : undefined,
          selectedStandards: selectedStandards.length > 0 ? selectedStandards : undefined,
          // AI Model
          aiModel
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to generate lesson'
        throw new Error(errorMessage)
      }

      setGeneratedLesson(data.lesson)
      setShowPreview(true)
    } catch (err) {
      console.error('Error generating lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate lesson')
    } finally {
      setGenerating(false)
    }
  }

  // Copy content to clipboard
  const handleCopy = async () => {
    if (generatedLesson?.content) {
      await navigator.clipboard.writeText(generatedLesson.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Download as markdown file
  const handleDownload = () => {
    if (generatedLesson) {
      const blob = new Blob([generatedLesson.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generatedLesson.title.toLowerCase().replace(/\s+/g, '-')}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Generate TA reaction from Jose or Marialys
  const handleGenerateTaReaction = async (ta: 'jose' | 'marialys') => {
    if (!generatedLesson) return
    
    setGeneratingTaReaction(ta)
    
    try {
      const response = await fetch('/api/generate-cat-reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonContent: generatedLesson.content,
          lessonTitle: generatedLesson.title,
          ta,
          aiModel: taReactionModel,
          reactionType: selectedReactionType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate TA reaction')
      }

      setTaReactions(prev => ({
        ...prev,
        [ta]: data.reaction
      }))
    } catch (err) {
      console.error('Error generating TA reaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate TA reaction')
    } finally {
      setGeneratingTaReaction(null)
    }
  }

  // Open save dialog with pre-filled data
  const openSaveDialog = () => {
    if (generatedLesson) {
      const slug = generatedLesson.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
      
      setSaveData({
        slug,
        unit: generatedLesson.metadata.topic || '',
        lessonNumber: 1,
        description: `${generatedLesson.metadata.wordCount} word reading lesson on ${generatedLesson.metadata.topic || 'physics'}. Reading level: ${generatedLesson.masteryLevel}.`
      })
      setShowSaveDialog(true)
    }
  }

  // Save generated content as a new lesson
  const handleSaveAsLesson = async () => {
    if (!generatedLesson) return
    
    setSaving(true)
    setError(null)

    try {
      // Transform embedded questions to the database format
      const embeddedQuestionsForDb = generatedLesson.embeddedQuestions?.map((q, idx) => ({
        id: q.id || `eq-${idx + 1}`,
        type: q.type === 'quick-check' ? 'multiple-choice' : q.type === 'reflection' ? 'open-response' : 'multiple-choice',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        sampleAnswer: q.sampleAnswer,
        points: q.points,
        timing: 'after', // Questions appear after reading content
        afterSection: q.afterSection // Track which section this follows
      }))

      // Prepare TA reactions if generated
      const taReactionsForDb = (taReactions.jose || taReactions.marialys) ? {
        jose: taReactions.jose ? {
          reaction: taReactions.jose.reaction,
          taName: taReactions.jose.taName,
          generatedAt: taReactions.jose.generatedAt
        } : null,
        marialys: taReactions.marialys ? {
          reaction: taReactions.marialys.reaction,
          taName: taReactions.marialys.taName,
          generatedAt: taReactions.marialys.generatedAt
        } : null
      } : null

      // Prepare key terms for the database
      const keyTermsForDb = generatedLesson.keyTerms?.length > 0 
        ? generatedLesson.keyTerms 
        : null

      // Prepare check for understanding questions
      const checkForUnderstandingForDb = generatedLesson.checkForUnderstanding && generatedLesson.checkForUnderstanding.length > 0
        ? generatedLesson.checkForUnderstanding
        : null

      // Prepare generation metadata
      const generationMetadata = {
        topic: generatedLesson.metadata.topic,
        environments: generatedLesson.metadata.environments,
        wordCount: generatedLesson.metadata.wordCount,
        generatedAt: generatedLesson.metadata.generatedAt,
        aiModel: aiModel
      }

      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedLesson.title,
          slug: saveData.slug,
          description: saveData.description,
          content: generatedLesson.content,
          unit: saveData.unit,
          lesson_number: saveData.lessonNumber,
          lesson_type: 'markdown',
          estimated_time: generatedLesson.estimatedReadingTime,
          objectives: generatedLesson.objectives,
          embedded_questions: embeddedQuestionsForDb,
          ta_reactions: taReactionsForDb,
          key_terms: keyTermsForDb,
          check_for_understanding: checkForUnderstandingForDb,
          mastery_level: generatedLesson.masteryLevel,
          generation_metadata: generationMetadata,
          published: false
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lesson')
      }

      // Success! Redirect to the lesson editor
      setShowSaveDialog(false)
      router.push(`/admin/lessons/${data.data.id}/edit`)
    } catch (err) {
      console.error('Error saving lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to save lesson')
    } finally {
      setSaving(false)
    }
  }

  // Get current mastery level details
  const currentLevel = masteryLevels.find(l => l.id === selectedMasteryLevel)
  const currentStructure = lessonStructures.find(s => s.id === selectedStructure)

  // Calculate completion percentage for progress indicator
  const getCompletionPercentage = () => {
    let completed = 0
    const total = 4
    if (selectedMasteryLevel) completed++
    if (selectedTopic !== 'all' || customContext) completed++
    if (selectedEnvironments.length > 0) completed++
    if (wordCount > 0) completed++
    return (completed / total) * 100
  }

  const completionPercentage = getCompletionPercentage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-200 mb-4">
                <Sparkles className="h-5 w-5 text-violet-600 animate-pulse" />
            <span className="text-sm font-medium text-violet-700">AI-Powered</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-violet-700 bg-clip-text text-transparent mb-3">
            Reading Lesson Generator
          </h1>
              <p className="text-slate-600 max-w-2xl">
            Create engaging physics reading lessons tailored to your students&apos; level. 
              </p>
            </div>
            
            {/* Floating Generate Button (visible when scrolled) */}
            <div className="flex flex-col items-center lg:items-end gap-3">
              {/* AI Model Quick Toggle */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border shadow-sm">
                <span className="text-xs text-slate-500 font-medium">AI:</span>
                <button
                  onClick={() => setAiModel('openai')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                    aiModel === 'openai' 
                      ? "bg-emerald-500 text-white shadow-md" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Bot className="h-3 w-3" /> OpenAI
                </button>
                <button
                  onClick={() => setAiModel('vertex')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                    aiModel === 'vertex' 
                      ? "bg-blue-500 text-white shadow-md" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Cpu className="h-3 w-3" /> Gemini
                </button>
              </div>
              
              {/* Progress Indicator */}
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border shadow-sm">
                <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {completionPercentage >= 100 ? '✓ Ready!' : `${Math.round(completionPercentage)}% configured`}
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick Start Presets */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-100/50 to-fuchsia-100/50 border border-violet-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-800">Quick Start Presets</span>
              <span className="text-xs text-violet-600">(one-click setup)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedMasteryLevel('high-school-intro')
                  setSelectedTopic('kinematics')
                  setSelectedEnvironments(['sports', 'transportation'])
                  setWordCount(800)
                  setIncludeFormulas(true)
                  setIncludeEmbeddedQuestions(true)
                }}
                className="px-4 py-2 rounded-lg bg-white border-2 border-violet-200 hover:border-violet-400 hover:shadow-md transition-all text-sm font-medium text-violet-700 flex items-center gap-2"
              >
                🏃 Motion & Kinematics
              </button>
              <button
                onClick={() => {
                  setSelectedMasteryLevel('high-school-intro')
                  setSelectedTopic('forces')
                  setSelectedEnvironments(['everyday', 'sports'])
                  setWordCount(900)
                  setIncludeFormulas(true)
                  setIncludeEmbeddedQuestions(true)
                }}
                className="px-4 py-2 rounded-lg bg-white border-2 border-fuchsia-200 hover:border-fuchsia-400 hover:shadow-md transition-all text-sm font-medium text-fuchsia-700 flex items-center gap-2"
              >
                💪 Forces & Newton&apos;s Laws
              </button>
              <button
                onClick={() => {
                  setSelectedMasteryLevel('high-school-intro')
                  setSelectedTopic('energy')
                  setSelectedEnvironments(['amusement-park', 'sports'])
                  setWordCount(850)
                  setIncludeFormulas(true)
                  setIncludeEmbeddedQuestions(true)
                }}
                className="px-4 py-2 rounded-lg bg-white border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all text-sm font-medium text-emerald-700 flex items-center gap-2"
              >
                ⚡ Energy & Work
              </button>
              <button
                onClick={() => {
                  setSelectedMasteryLevel('high-school-intro')
                  setSelectedTopic('waves')
                  setSelectedEnvironments(['music', 'nature'])
                  setWordCount(750)
                  setIncludeFormulas(false)
                  setIncludeEmbeddedQuestions(true)
                }}
                className="px-4 py-2 rounded-lg bg-white border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-sm font-medium text-blue-700 flex items-center gap-2"
              >
                🌊 Waves & Sound
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Mastery Level Selection */}
            <Card className="border-violet-100 shadow-lg shadow-violet-100/50 overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-violet-50 to-fuchsia-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                <CardTitle className="flex items-center gap-2 text-violet-800">
                  <GraduationCap className="h-5 w-5" />
                      Who&apos;s Reading This?
                </CardTitle>
                <CardDescription>
                      Select the appropriate reading level for your students
                </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {masteryLevels.map((level, idx) => {
                    const levelEmojis = ['📚', '🎓', '🚀', '🔬', '🧪', '💡']
                    return (
                    <button
                      key={level.id}
                      onClick={() => setSelectedMasteryLevel(level.id)}
                      className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-lg group",
                        selectedMasteryLevel === level.id
                            ? "border-violet-500 bg-gradient-to-br from-violet-50 to-fuchsia-50 shadow-lg ring-2 ring-violet-200"
                            : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/30"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xl">{levelEmojis[idx % levelEmojis.length]}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800 group-hover:text-violet-800 transition-colors">
                              {level.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{level.gradeRange}</div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "mt-2 text-[10px] transition-colors",
                                selectedMasteryLevel === level.id
                                  ? "border-violet-400 text-violet-700 bg-violet-100"
                                  : "border-slate-200 text-slate-500"
                              )}
                            >
                              {level.readingLevel}
                            </Badge>
                          </div>
                          {selectedMasteryLevel === level.id && (
                            <CheckCircle className="h-5 w-5 text-violet-500" />
                          )}
                        </div>
                    </button>
                    )
                  })}
                </div>
                {currentLevel && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200">
                    <div className="text-sm font-semibold text-violet-800 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      What makes {currentLevel.name} special:
                    </div>
                    <ul className="text-sm text-slate-600 space-y-1.5">
                      {currentLevel.characteristics.slice(0, 3).map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Physics Topic & Terms Selection */}
            <Card className="border-fuchsia-100 shadow-lg shadow-fuchsia-100/50 overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-fuchsia-50 to-pink-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                <CardTitle className="flex items-center gap-2 text-fuchsia-800">
                  <Atom className="h-5 w-5" />
                      What Are We Learning?
                </CardTitle>
                <CardDescription>
                      Pick a physics topic and specific concepts to explore
                </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Topic Selection */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Physics Topic
                  </Label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a physics topic..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics (General)</SelectItem>
                      {physicsTopics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.icon} {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Terms Selection */}
                {selectedTopic !== 'all' && availableTerms.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">
                      Select Terms to Cover ({selectedTerms.length} selected)
                    </Label>
                    <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                      {availableTerms.map((term) => (
                        <div
                          key={term.id}
                          onClick={() => toggleTerm(term.id)}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all",
                            selectedTerms.includes(term.id)
                              ? "border-fuchsia-400 bg-fuchsia-50"
                              : "border-slate-200 hover:border-fuchsia-200 bg-white"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={selectedTerms.includes(term.id)}
                              className="mt-0.5"
                            />
                            <div>
                              <div className="font-medium text-sm text-slate-800">
                                {term.term}
                                {term.symbol && (
                                  <span className="text-fuchsia-600 ml-1">({term.symbol})</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 line-clamp-2">
                                {term.definition}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedTerms.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTerms([])}
                        className="mt-2 text-slate-500"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Selection
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Real-World Environments */}
            <Card className="border-emerald-100 shadow-lg shadow-emerald-100/50 overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Globe className="h-5 w-5" />
                      Make It Real!
                </CardTitle>
                <CardDescription>
                      Choose contexts your students can relate to
                  {selectedTopic !== 'all' && (
                        <span className="text-emerald-600 font-medium"> (★ = perfect for this topic!)</span>
                  )}
                </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {realWorldEnvironments.map((env) => {
                    const isRecommended = selectedTopic !== 'all' && env.bestForTopics.includes(selectedTopic)
                    return (
                      <button
                        key={env.id}
                        onClick={() => toggleEnvironment(env.id)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-center transition-all relative",
                          selectedEnvironments.includes(env.id)
                            ? "border-emerald-500 bg-emerald-50"
                            : isRecommended
                              ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-400"
                              : "border-slate-200 hover:border-emerald-200"
                        )}
                      >
                        {isRecommended && (
                          <span className="absolute -top-1 -right-1 text-amber-500 text-xs">★</span>
                        )}
                        <div className="text-2xl mb-1">{env.icon}</div>
                        <div className="text-xs font-medium text-slate-700">{env.name}</div>
                      </button>
                    )
                  })}
                </div>
                {selectedEnvironments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm text-slate-500">Selected:</span>
                    {selectedEnvironments.map(envId => {
                      const env = realWorldEnvironments.find(e => e.id === envId)
                      return env ? (
                        <Badge
                          key={envId}
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700 gap-1"
                        >
                          {env.icon} {env.name}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleEnvironment(envId)
                            }}
                            className="ml-1 hover:text-emerald-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optional: Standards Alignment */}
            <Card className="border-blue-100 shadow-lg shadow-blue-100/50 overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold text-xs">
                    ⭐
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <BookMarked className="h-5 w-5" />
                  Standards Alignment
                </CardTitle>
                      <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600">
                        Optional
                      </Badge>
                    </div>
                <CardDescription>
                  {selectedTopic !== 'all' 
                        ? `${filteredStandards.length} standards match "${physicsTopics.find(t => t.id === selectedTopic)?.name}"`
                        : `${filteredStandards.length} standards available - pick a topic to see relevant ones`
                  }
                </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Framework Filter Buttons */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Filter by Framework
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {allStandardSets.map((set) => {
                      const counts = standardCountsByFramework.find(c => c.setId === set.id)
                      const hasMatchingStandards = counts && counts.count > 0
                      return (
                        <button
                          key={set.id}
                          onClick={() => toggleStandardSet(set.id)}
                          disabled={!hasMatchingStandards}
                          className={cn(
                            "px-3 py-2 rounded-lg border-2 text-left transition-all flex items-center gap-2",
                            selectedStandardSets.includes(set.id)
                              ? "border-blue-500 bg-blue-50"
                              : hasMatchingStandards
                                ? "border-slate-200 hover:border-blue-200"
                                : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="text-base">{set.icon}</span>
                          <div>
                            <div className="font-medium text-xs text-slate-800">{set.shortName}</div>
                            <div className="text-[10px] text-slate-500">
                              {selectedTopic !== 'all' ? `${counts?.count}/${counts?.total}` : counts?.total} standards
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    {selectedStandardSets.length > 0 && (
                      <button
                        onClick={() => setSelectedStandardSets([])}
                        className="px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 text-xs text-slate-500 flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Clear Filter
                      </button>
                    )}
                  </div>
                </div>

                {/* Topic Filter Info */}
                {selectedTopic !== 'all' && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Filtered to show standards for: <strong>{physicsTopics.find(t => t.id === selectedTopic)?.name}</strong>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTopic('all')}
                      className="ml-auto h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Show All Standards
                    </Button>
                  </div>
                )}

                {/* Standards Selection */}
                {filteredStandards.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Select Standards ({selectedStandards.length} selected)
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllStandards(!showAllStandards)}
                        className="text-xs"
                      >
                        {showAllStandards ? 'Show Less' : `Show All ${filteredStandards.length}`}
                      </Button>
                    </div>

                    {/* Standards Grid */}
                    <div className={cn(
                      "grid gap-2 max-h-96 overflow-y-auto p-2 border rounded-lg bg-slate-50",
                      showAllStandards ? "grid-cols-1" : "sm:grid-cols-2"
                    )}>
                      {(showAllStandards ? filteredStandards : filteredStandards.slice(0, 12)).map((standard) => {
                        const set = allStandardSets.find(s => s.standards.some(st => st.id === standard.id))
                        const isTopicMatch = selectedTopic !== 'all' && standard.topics.includes(selectedTopic)
                        return (
                          <div
                            key={standard.id}
                            onClick={() => toggleStandard(standard.id)}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all",
                              selectedStandards.includes(standard.id)
                                ? "border-blue-400 bg-blue-50"
                                : "border-slate-200 hover:border-blue-200 bg-white"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <Checkbox
                                checked={selectedStandards.includes(standard.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm text-blue-700">{standard.code}</span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {set?.shortName}
                                  </Badge>
                                </div>
                                <div className="text-xs font-medium text-slate-800 mt-0.5">{standard.title}</div>
                                {showAllStandards && (
                                  <>
                                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                                      {standard.description}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {standard.topics.map(topic => (
                                        <span 
                                          key={topic}
                                          className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded",
                                            topic === selectedTopic
                                              ? "bg-blue-200 text-blue-800"
                                              : "bg-slate-200 text-slate-600"
                                          )}
                                        >
                                          {physicsTopics.find(t => t.id === topic)?.name || topic}
                                        </span>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {selectedStandards.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStandards([])}
                        className="mt-2 text-slate-500"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Selection
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic p-4 text-center border rounded-lg bg-slate-50">
                    No standards found for this combination of topic and framework filters
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advanced Settings - Collapsible Cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Settings2 className="h-4 w-4" />
                <span className="font-medium">Advanced Settings</span>
                <span className="text-xs">(optional but powerful!)</span>
              </div>
              
              {/* Custom Content */}
              <Card className="border rounded-xl border-slate-200 bg-white shadow-sm overflow-hidden group">
                <button
                  onClick={() => setShowCustomContent(!showCustomContent)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      showCustomContent ? "bg-slate-700 text-white" : "bg-slate-100 group-hover:bg-slate-200"
                    )}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium block">Custom Title & Instructions</span>
                      <span className="text-xs text-slate-500">Add your own title or special requirements</span>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-slate-400 transition-transform duration-300",
                    showCustomContent && "rotate-180"
                  )} />
                </button>
                {showCustomContent && (
                  <CardContent className="px-5 pb-5 pt-0 space-y-4 border-t animate-in slide-in-from-top-2">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">
                        💡 Custom Lesson Title
                      </Label>
                      <Input
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        placeholder="e.g., The Magic of Momentum"
                        className="border-slate-200 focus:border-violet-400"
                      />
                      <p className="text-xs text-slate-400 mt-1">Leave blank to let AI create one</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">
                        📝 Special Instructions for AI
                      </Label>
                      <Textarea
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                        placeholder="e.g., Focus on car safety features, avoid complex calculus, include a fun experiment idea..."
                        rows={4}
                        className="border-slate-200 focus:border-violet-400"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Generation Options */}
              <Card className="border rounded-xl border-slate-200 bg-white shadow-sm overflow-hidden group">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      showOptions ? "bg-slate-700 text-white" : "bg-slate-100 group-hover:bg-slate-200"
                    )}>
                      <Settings2 className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium block">Lesson Configuration</span>
                      <span className="text-xs text-slate-500">Structure, length, questions & more</span>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-slate-400 transition-transform duration-300",
                    showOptions && "rotate-180"
                  )} />
                </button>
                {showOptions && (
                  <CardContent className="px-5 pb-5 pt-0 space-y-6 border-t animate-in slide-in-from-top-2">
                    {/* AI Model Selection - Moved to Header but keeping here as secondary */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">AI Model:</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              aiModel === 'openai' 
                                ? "border-emerald-300 text-emerald-700 bg-emerald-50" 
                                : "border-blue-300 text-blue-700 bg-blue-50"
                            )}
                          >
                            {aiModel === 'openai' ? 'OpenAI GPT-4o' : 'Google Gemini'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setAiModel('openai')}
                          className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            aiModel === 'openai'
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
                            )}
                          >
                            <Bot className="h-3 w-3 inline mr-1" /> OpenAI
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiModel('vertex')}
                          className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            aiModel === 'vertex'
                                ? "bg-blue-500 text-white shadow-sm"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
                            )}
                          >
                            <Cpu className="h-3 w-3 inline mr-1" /> Gemini
                        </button>
                        </div>
                      </div>
                    </div>

                    {/* Lesson Structure */}
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">
                        Lesson Structure
                      </Label>
                      <Select value={selectedStructure} onValueChange={setSelectedStructure}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lessonStructures.map((structure) => (
                            <SelectItem key={structure.id} value={structure.id}>
                              {structure.name} - {structure.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {currentStructure && (
                        <div className="mt-2 text-xs text-slate-500">
                          Sections: {currentStructure.sections.join(' → ')}
                        </div>
                      )}
                    </div>

                    {/* Word Count - Visual Slider */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-semibold text-violet-800">
                          📏 Lesson Length
                      </Label>
                        <Badge className="bg-violet-100 text-violet-700 font-bold">
                          ~{wordCount} words
                        </Badge>
                      </div>
                      <Slider
                        value={[wordCount]}
                        onValueChange={([value]) => setWordCount(value)}
                        min={400}
                        max={2000}
                        step={100}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs mt-2">
                        <span className="text-slate-400">Quick Read (400)</span>
                        <span className="text-violet-500 font-medium">~{Math.round(wordCount / 200)} min read</span>
                        <span className="text-slate-400">Deep Dive (2000)</span>
                      </div>
                    </div>

                    {/* Content Features - Visual Toggles */}
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                        ✨ Content Features
                        </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setIncludeFormulas(!includeFormulas)}
                          className={cn(
                            "p-3 rounded-lg border-2 text-left transition-all",
                            includeFormulas
                              ? "border-violet-400 bg-violet-50"
                              : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {includeFormulas ? (
                              <CheckCircle className="h-4 w-4 text-violet-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300" />
                            )}
                            <span className="text-sm font-medium">🔢 Formulas</span>
                      </div>
                          <p className="text-[10px] text-slate-500 mt-1 ml-6">Math equations</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIncludeMisconceptions(!includeMisconceptions)}
                          className={cn(
                            "p-3 rounded-lg border-2 text-left transition-all",
                            includeMisconceptions
                              ? "border-amber-400 bg-amber-50"
                              : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {includeMisconceptions ? (
                              <CheckCircle className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300" />
                            )}
                            <span className="text-sm font-medium">💭 Myths</span>
                      </div>
                          <p className="text-[10px] text-slate-500 mt-1 ml-6">Clear up confusion</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIncludeCheckQuestions(!includeCheckQuestions)}
                          className={cn(
                            "p-3 rounded-lg border-2 text-left transition-all",
                            includeCheckQuestions
                              ? "border-emerald-400 bg-emerald-50"
                              : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {includeCheckQuestions ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300" />
                            )}
                            <span className="text-sm font-medium">❓ Summary Q&apos;s</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 ml-6">End review</p>
                        </button>
                      </div>
                    </div>

                    {/* Embedded Questions Section - Highlighted Feature */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-500 text-white">
                            <ListChecks className="h-5 w-5" />
                          </div>
                        <div>
                            <Label className="text-sm font-bold text-blue-800 block">
                              📚 Interactive Reading Checks
                          </Label>
                            <p className="text-xs text-blue-600 mt-0.5">
                              Keep students engaged with questions throughout
                          </p>
                        </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIncludeEmbeddedQuestions(!includeEmbeddedQuestions)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            includeEmbeddedQuestions
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-white border border-blue-300 text-blue-600"
                          )}
                        >
                          {includeEmbeddedQuestions ? '✓ ON' : 'OFF'}
                        </button>
                      </div>

                      {includeEmbeddedQuestions && (
                        <div className="space-y-4 mt-4 pt-4 border-t border-blue-200">
                          {/* Question Frequency - Visual Options */}
                          <div>
                            <Label className="text-xs font-semibold text-blue-700 mb-2 block">
                              How often?
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: 'after-each-section', label: 'Every Section', emoji: '📖📖📖' },
                                { value: 'every-other-section', label: 'Alternating', emoji: '📖⬜📖' },
                                { value: 'end-only', label: 'End Only', emoji: '⬜⬜📝' },
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setQuestionFrequency(opt.value as 'after-each-section' | 'every-other-section' | 'end-only')}
                                  className={cn(
                                    "p-2 rounded-lg border text-center transition-all",
                                    questionFrequency === opt.value
                                      ? "border-blue-400 bg-blue-100 text-blue-800"
                                      : "border-blue-200 bg-white hover:border-blue-300"
                                  )}
                                >
                                  <div className="text-xs mb-1">{opt.emoji}</div>
                                  <div className="text-[10px] font-medium">{opt.label}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Question Types - Chips */}
                          <div>
                            <Label className="text-xs font-semibold text-blue-700 mb-2 block">
                              Question types to include:
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { id: 'multiple-choice', label: '🔘 Multiple Choice', color: 'blue' },
                                { id: 'quick-check', label: '✓ Quick Check', color: 'green' },
                                { id: 'reflection', label: '💭 Reflection', color: 'purple' },
                              ].map(type => (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() => {
                                    if (questionTypes.includes(type.id)) {
                                      setQuestionTypes(questionTypes.filter(t => t !== type.id))
                                    } else {
                                      setQuestionTypes([...questionTypes, type.id])
                                    }
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                                    questionTypes.includes(type.id)
                                      ? "bg-blue-500 text-white shadow-md"
                                      : "bg-white border border-blue-200 text-blue-700 hover:border-blue-400"
                                  )}
                                >
                                  {questionTypes.includes(type.id) && <CheckCircle className="h-3 w-3" />}
                                  {type.label}
                                </button>
                              ))}
                              </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Generate Section - The Main CTA */}
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-100 via-fuchsia-100 to-violet-100 rounded-2xl transform -skew-y-1" />
              
              <div className="relative p-6 rounded-2xl border-2 border-violet-200 bg-white/80 backdrop-blur-sm">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-violet-800 mb-1">Ready to Create Your Lesson?</h3>
                  <p className="text-sm text-violet-600">
                    {selectedTopic !== 'all' 
                      ? `Creating a ${currentLevel?.name} lesson on ${physicsTopics.find(t => t.id === selectedTopic)?.name}`
                      : 'Select a topic above for a more focused lesson'}
                  </p>
                </div>
                
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                size="lg"
                    className={cn(
                      "px-12 py-6 text-lg shadow-xl transition-all",
                      generating
                        ? "bg-violet-400"
                        : "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-violet-700 hover:scale-105 hover:shadow-2xl shadow-violet-300"
                    )}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Magic...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                        ✨ Generate Lesson ✨
                  </>
                )}
              </Button>
              
              {/* Media Generator */}
              <MediaGenerator
                physicsTopic={selectedTopic !== 'all' ? selectedTopic : undefined}
                defaultPrompt={lessonTitle || customContext}
                mode="both"
                    triggerLabel="🎨 Add Media"
                onImageSelect={(imageData) => {
                  const dataUrl = `data:${imageData.mimeType};base64,${imageData.base64}`
                  navigator.clipboard.writeText(`![Physics Image](${dataUrl})`)
                  alert('Image markdown copied to clipboard! Paste it into your lesson content.')
                }}
                    className="px-6 py-6 text-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all"
                  />
                </div>
                
                {/* Helpful Tips */}
                <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-500">✓</span> No account needed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-500">✓</span> ~30 seconds to generate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-500">✓</span> Edit before saving
                  </span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Getting Started Card - Show only when no lesson generated */}
              {!generatedLesson && !generating && (
                <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg text-violet-800">Ready to Create!</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-violet-700">
                      Configure your lesson options on the left, then hit generate. Here&apos;s what makes a great lesson:
                    </p>
                    <ul className="text-xs text-violet-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Pick a topic</strong> to focus the content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Add real-world contexts</strong> students can relate to</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Enable embedded questions</strong> to check understanding</span>
                      </li>
                    </ul>
                    
                    {/* Animated hint */}
                    <div className="pt-3 border-t border-violet-200">
                      <div className="flex items-center gap-2 text-xs text-violet-500">
                        <span className="animate-bounce">👇</span>
                        <span>Start by selecting a mastery level below</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generation In Progress Animation */}
              {generating && (
                <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 overflow-hidden">
                  <CardContent className="py-8">
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center animate-pulse">
                          <Sparkles className="h-8 w-8 text-white animate-spin" />
                        </div>
                        <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full border-4 border-violet-300 border-t-transparent animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-violet-800">Creating Your Lesson</h3>
                        <p className="text-sm text-violet-600 mt-1">
                          AI is crafting engaging content...
                        </p>
                      </div>
                      <div className="flex justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{animationDelay: '0ms'}} />
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{animationDelay: '150ms'}} />
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{animationDelay: '300ms'}} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selection Summary - Always visible */}
              <Card className={cn(
                "border-slate-200 transition-all",
                generatedLesson && "opacity-75"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Your Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Level:</span>
                    <Badge variant="outline" className="text-violet-700 border-violet-200">
                      {currentLevel?.name || 'Not selected'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Topic:</span>
                    <span className="text-slate-700 font-medium">
                      {selectedTopic !== 'all' ? physicsTopics.find(t => t.id === selectedTopic)?.name : 'General'}
                    </span>
                  </div>
                  {selectedTerms.length > 0 && (
                    <div className="flex justify-between items-center">
                    <span className="text-slate-500">Terms:</span>
                      <Badge variant="secondary" className="bg-fuchsia-100 text-fuchsia-700">
                        {selectedTerms.length} selected
                      </Badge>
                  </div>
                  )}
                  {selectedEnvironments.length > 0 && (
                    <div className="flex justify-between items-center">
                    <span className="text-slate-500">Contexts:</span>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {selectedEnvironments.length} selected
                      </Badge>
                  </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Length:</span>
                    <span className="text-slate-700">~{wordCount} words</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">AI Model:</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        aiModel === 'openai' 
                          ? "text-emerald-700 border-emerald-200" 
                          : "text-blue-700 border-blue-200"
                      )}
                    >
                      {aiModel === 'openai' ? 'OpenAI GPT' : 'Google Gemini'}
                    </Badge>
                  </div>
                  {selectedStandards.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Standards:</span>
                      <Badge variant="outline" className="text-blue-700 border-blue-200">
                        {selectedStandards.length} aligned
                      </Badge>
                    </div>
                  )}
                  
                  {/* Quick Generate Button in Summary */}
                  {!generatedLesson && !generating && (
                    <div className="pt-3 border-t mt-3">
                      <Button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Lesson
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generated Lesson Preview - Success State */}
              {generatedLesson && (
                <Card className="border-emerald-300 shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden relative">
                  {/* Celebration particles */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400" />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-emerald-800 flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-emerald-500">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        🎉 Lesson Ready!
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopy}
                          className="h-8 w-8 p-0 hover:bg-emerald-100"
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-emerald-700" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDownload}
                          className="h-8 w-8 p-0 hover:bg-emerald-100"
                          title="Download as markdown"
                        >
                          <Download className="h-4 w-4 text-emerald-700" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title and Stats */}
                    <div className="p-3 rounded-lg bg-white/70 border border-emerald-200">
                      <div className="font-semibold text-slate-800 text-sm">{generatedLesson.title}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                          {generatedLesson.metadata.wordCount} words
                        </Badge>
                        <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-xs">
                          {generatedLesson.estimatedReadingTime} min read
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-white/50">
                        <div className="text-lg font-bold text-emerald-700">{generatedLesson.objectives.length}</div>
                        <div className="text-[10px] text-emerald-600">Objectives</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/50">
                        <div className="text-lg font-bold text-teal-700">{generatedLesson.keyTerms.length}</div>
                        <div className="text-[10px] text-teal-600">Key Terms</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/50">
                        <div className="text-lg font-bold text-blue-700">{generatedLesson.embeddedQuestions?.length || 0}</div>
                        <div className="text-[10px] text-blue-600">Questions</div>
                      </div>
                    </div>

                    {/* Primary Actions */}
                    <div className="space-y-2">
                    <Button
                      onClick={openSaveDialog}
                      size="sm"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save as Lesson
                    </Button>

                      <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setShowPreview(!showPreview)}
                      variant="outline"
                      size="sm"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                          <Eye className="h-4 w-4 mr-1" />
                          {showPreview ? 'Hide' : 'Preview'}
                    </Button>
                    <Button
                      onClick={handleGenerate}
                          variant="outline"
                      size="sm"
                          className="border-slate-300 text-slate-600 hover:bg-slate-50"
                      disabled={generating}
                    >
                          <RefreshCw className={cn("h-4 w-4 mr-1", generating && "animate-spin")} />
                          Redo
                    </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Student TA Section - Jose & Marialys (AP Physics TAs!) */}
              {generatedLesson && (
                <Card className="border-2 border-indigo-300 shadow-xl bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">⚽🏐</span>
                      <div>
                        <div className="font-bold text-white text-sm drop-shadow">Ask Your Student TAs!</div>
                        <div className="text-[10px] text-indigo-100">Jose & Marialys are here to help 🎓</div>
                      </div>
                      <span className="text-xl">🏃‍♀️🥏</span>
                    </div>
                  </div>
                  
                  <CardContent className="space-y-4 pt-4">
                    {/* Meet the TAs - Expandable */}
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 hover:text-indigo-800">
                        <School className="h-3 w-3" />
                        <span>Meet Your AP Physics TAs</span>
                        <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-2 p-3 rounded-lg bg-white/70 border border-indigo-200 text-xs text-indigo-700 space-y-2">
                        <p><strong>⚽🏐 Jose</strong> - Volleyball & soccer player who&apos;s obsessed with energy and electromagnetism. He sees physics in every game!</p>
                        <p><strong>🏃‍♀️🥏 Marialys</strong> - Track & field athlete (sprinter + thrower) who thinks about forces and acceleration constantly. Physics improved her throwing!</p>
                        <p className="italic text-indigo-500">Both are AP Physics students working as classroom TAs - they know what it&apos;s like to learn this stuff!</p>
                      </div>
                    </details>

                    {/* What should they do? */}
                    <div>
                      <Label className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-1">
                        💬 What do you need?
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'review', emoji: '📝', label: 'Review' },
                          { value: 'quiz', emoji: '❓', label: 'Quiz Me' },
                          { value: 'supplement', emoji: '💡', label: 'Cool Facts' },
                          { value: 'debate', emoji: '🤔', label: 'Discuss' },
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedReactionType(option.value as 'review' | 'quiz' | 'supplement' | 'debate')}
                            className={cn(
                              "p-2 rounded-lg border text-xs transition-all flex items-center gap-2 justify-center",
                              selectedReactionType === option.value
                                ? "border-indigo-400 bg-indigo-100 font-medium text-indigo-800"
                                : "border-indigo-200 hover:border-indigo-300 text-indigo-600"
                            )}
                          >
                            <span>{option.emoji}</span>
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Model Selector */}
                    <div className="flex items-center gap-2 text-xs text-indigo-600">
                      <span>AI:</span>
                      <button
                        onClick={() => setTaReactionModel('openai')}
                        className={cn(
                          "px-2 py-1 rounded-full transition-all",
                          taReactionModel === 'openai' 
                            ? "bg-indigo-200 font-medium" 
                            : "hover:bg-indigo-100"
                        )}
                      >
                        OpenAI
                      </button>
                      <button
                        onClick={() => setTaReactionModel('vertex')}
                        className={cn(
                          "px-2 py-1 rounded-full transition-all",
                          taReactionModel === 'vertex' 
                            ? "bg-indigo-200 font-medium" 
                            : "hover:bg-indigo-100"
                        )}
                      >
                        Gemini
                      </button>
                    </div>

                    {/* TA Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleGenerateTaReaction('jose')}
                        disabled={generatingTaReaction !== null}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg",
                          taReactions.jose 
                            ? "border-blue-400 bg-gradient-to-br from-blue-100 to-indigo-100" 
                            : "border-indigo-200 bg-white hover:border-blue-400"
                        )}
                      >
                        {generatingTaReaction === 'jose' ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-2xl animate-pulse">⚽🏐</div>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-[10px] text-blue-500">Thinking...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{taReactions.jose ? '⚽🏐✨' : '⚽🏐'}</span>
                            <span className="text-xs font-bold text-blue-800">Jose</span>
                            <span className="text-[10px] text-blue-500 leading-tight text-center">
                              {taReactions.jose ? 'Ask again!' : 'Energy & Sports Guy'}
                            </span>
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => handleGenerateTaReaction('marialys')}
                        disabled={generatingTaReaction !== null}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg",
                          taReactions.marialys 
                            ? "border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100" 
                            : "border-indigo-200 bg-white hover:border-purple-400"
                        )}
                      >
                        {generatingTaReaction === 'marialys' ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-2xl animate-pulse">🏃‍♀️🥏</div>
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            <span className="text-[10px] text-purple-500">Thinking...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{taReactions.marialys ? '🏃‍♀️🥏✨' : '🏃‍♀️🥏'}</span>
                            <span className="text-xs font-bold text-purple-800">Marialys</span>
                            <span className="text-[10px] text-purple-500 leading-tight text-center">
                              {taReactions.marialys ? 'Ask again!' : 'Forces & Track Star'}
                            </span>
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Display TA Reactions */}
                    {(taReactions.jose || taReactions.marialys) && (
                      <div className="space-y-3 pt-3 border-t-2 border-indigo-200 border-dashed">
                        {taReactions.jose && (
                          <TAReactionDisplay 
                            ta="jose" 
                            reaction={taReactions.jose}
                          />
                        )}
                        {taReactions.marialys && (
                          <TAReactionDisplay 
                            ta="marialys" 
                            reaction={taReactions.marialys}
                          />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Full Preview Modal/Section */}
        {showPreview && generatedLesson && (
          <Card className="mt-8 border-violet-200 shadow-xl">
            <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-fuchsia-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-violet-800">
                    {generatedLesson.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <Badge variant="outline" className="text-violet-600 border-violet-200">
                      {generatedLesson.masteryLevel}
                    </Badge>
                    {generatedLesson.metadata.topic && (
                      <Badge variant="outline" className="text-fuchsia-600 border-fuchsia-200">
                        {generatedLesson.metadata.topic}
                      </Badge>
                    )}
                    <span className="text-slate-500">
                      {generatedLesson.metadata.wordCount} words • {generatedLesson.estimatedReadingTime} min
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={openSaveDialog}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Lesson
                  </Button>
                  <MediaGenerator
                    physicsTopic={generatedLesson?.metadata?.topic ? 
                      physicsTopics.find(t => t.name === generatedLesson.metadata.topic)?.id : undefined}
                    defaultPrompt={generatedLesson?.title}
                    mode="image"
                    triggerLabel="Add Image"
                    onImageSelect={(imageData) => {
                      const dataUrl = `data:${imageData.mimeType};base64,${imageData.base64}`
                      navigator.clipboard.writeText(`![Physics Diagram](${dataUrl})`)
                      alert('Image markdown copied! Paste it into the lesson content when editing.')
                    }}
                    className="h-9"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {/* Learning Objectives */}
              {generatedLesson.objectives.length > 0 && (
                <div className="mb-8 p-4 rounded-lg bg-violet-50 border border-violet-100">
                  <h3 className="font-semibold text-violet-800 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Learning Objectives
                  </h3>
                  <ul className="space-y-1">
                    {generatedLesson.objectives.map((obj, i) => (
                      <li key={i} className="text-sm text-violet-700 flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main Content */}
              <div className="prose prose-violet max-w-none">
                <MathMarkdown content={generatedLesson.content} skipAutoDetect={true} />
              </div>

              {/* Embedded Questions */}
              {generatedLesson.embeddedQuestions && generatedLesson.embeddedQuestions.length > 0 && (
                <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Embedded Questions ({generatedLesson.embeddedQuestions.length})
                  </h3>
                  <div className="space-y-4">
                    {generatedLesson.embeddedQuestions.map((q, i) => (
                      <EmbeddedQuestionPreview key={q.id} question={q} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Key Terms */}
              {generatedLesson.keyTerms.length > 0 && (
                <div className="mt-8 p-4 rounded-lg bg-fuchsia-50 border border-fuchsia-100">
                  <h3 className="font-semibold text-fuchsia-800 mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Key Terms
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {generatedLesson.keyTerms.map((term, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white border border-fuchsia-100">
                        <div className="font-medium text-fuchsia-700">{term.term}</div>
                        <div className="text-sm text-slate-600">{term.definition}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Check for Understanding */}
              {generatedLesson.checkForUnderstanding && generatedLesson.checkForUnderstanding.length > 0 && (
                <div className="mt-8 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                  <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Check for Understanding
                  </h3>
                  <div className="space-y-4">
                    {generatedLesson.checkForUnderstanding.map((item, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white border border-emerald-100">
                        <div className="font-medium text-emerald-700 mb-2">
                          Q{i + 1}: {item.question}
                        </div>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-emerald-600 hover:text-emerald-700">
                            Show Answer
                          </summary>
                          <div className="mt-2 p-2 rounded bg-emerald-50 text-slate-700">
                            {item.answer}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student TA Reactions in Preview */}
              {(taReactions.jose || taReactions.marialys) && (
                <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-2 border-indigo-200">
                  <h3 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2 text-lg">
                    <School className="h-5 w-5" />
                    💬 Your Student TAs Weigh In!
                  </h3>
                  <p className="text-sm text-indigo-600 mb-4">
                    Reactions from your AP Physics student Teaching Assistants, Jose and Marialys.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {taReactions.jose && (
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-300 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">⚽🏐</span>
                          <div>
                            <div className="font-bold text-blue-900">Jose</div>
                            <div className="text-xs text-blue-700">Volleyball & Soccer • Energy Enthusiast</div>
                          </div>
                        </div>
                        <div className="text-sm text-blue-900 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                          {taReactions.jose.reaction}
                        </div>
                      </div>
                    )}
                    {taReactions.marialys && (
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">🏃‍♀️🥏</span>
                          <div>
                            <div className="font-bold text-purple-900">Marialys</div>
                            <div className="text-xs text-purple-700">Track & Field • Forces Expert</div>
                          </div>
                        </div>
                        <div className="text-sm text-purple-900 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                          {taReactions.marialys.reaction}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save as Lesson Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-emerald-600" />
                Save as Lesson
              </DialogTitle>
              <DialogDescription>
                Create a new lesson from this generated content. You can edit it further after saving.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Title Preview */}
              <div className="p-3 rounded-lg bg-slate-50 border">
                <div className="text-xs text-slate-500 mb-1">Lesson Title</div>
                <div className="font-medium">{generatedLesson?.title}</div>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={saveData.slug}
                  onChange={(e) => setSaveData({ ...saveData, slug: e.target.value })}
                  placeholder="e.g., newtons-first-law"
                />
                <p className="text-xs text-slate-500">
                  Will be accessible at: /lessons/{saveData.slug || 'your-slug'}
                </p>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  value={saveData.unit}
                  onChange={(e) => setSaveData({ ...saveData, unit: e.target.value })}
                  placeholder="e.g., Unit 1: Kinematics"
                />
              </div>

              {/* Lesson Number */}
              <div className="space-y-2">
                <Label htmlFor="lessonNumber">Lesson Number *</Label>
                <Input
                  id="lessonNumber"
                  type="number"
                  min="1"
                  value={saveData.lessonNumber}
                  onChange={(e) => setSaveData({ ...saveData, lessonNumber: parseInt(e.target.value) || 1 })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={saveData.description}
                  onChange={(e) => setSaveData({ ...saveData, description: e.target.value })}
                  placeholder="Brief description of the lesson..."
                  rows={3}
                />
              </div>

              {/* Info */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  The lesson will be saved as a <strong>draft</strong>. You can publish it from the lesson editor.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAsLesson}
                disabled={saving || !saveData.slug || !saveData.unit}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Edit Lesson
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// Embedded Question Preview Component
interface EmbeddedQuestionPreviewProps {
  question: EmbeddedQuestion
  index: number
}

function EmbeddedQuestionPreview({ question, index }: EmbeddedQuestionPreviewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [reflectionAnswer, setReflectionAnswer] = useState('')

  const isCorrect = question.type !== 'reflection' && selectedAnswer === question.correctAnswer

  const getTypeIcon = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <ListChecks className="h-4 w-4" />
      case 'quick-check':
        return <CheckSquare className="h-4 w-4" />
      case 'reflection':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <HelpCircle className="h-4 w-4" />
    }
  }

  const getTypeBadge = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Multiple Choice</Badge>
      case 'quick-check':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Quick Check</Badge>
      case 'reflection':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Reflection</Badge>
      default:
        return null
    }
  }

  return (
    <div className="p-4 rounded-lg bg-white border border-blue-200 shadow-sm">
      {/* Question Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="font-semibold text-slate-700">Question {index + 1}</span>
          {getTypeBadge()}
        </div>
        <span className="text-xs text-slate-500">
          After: {question.afterSection}
        </span>
      </div>

      {/* Question Text */}
      <p className="text-slate-800 mb-4 font-medium">{question.question}</p>

      {/* Multiple Choice Options */}
      {question.type === 'multiple-choice' && question.options && (
        <div className="space-y-2 mb-4">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedAnswer(i)
                setShowExplanation(true)
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                selectedAnswer === null && "border-slate-200 hover:border-blue-300 hover:bg-blue-50",
                selectedAnswer === i && i === question.correctAnswer && "border-emerald-500 bg-emerald-50",
                selectedAnswer === i && i !== question.correctAnswer && "border-red-500 bg-red-50",
                selectedAnswer !== null && i === question.correctAnswer && selectedAnswer !== i && "border-emerald-300 bg-emerald-50/50"
              )}
            >
              {selectedAnswer === null ? (
                <Circle className="h-4 w-4 text-slate-400 flex-shrink-0" />
              ) : i === question.correctAnswer ? (
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : selectedAnswer === i ? (
                <X className="h-4 w-4 text-red-600 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300 flex-shrink-0" />
              )}
              <span className={cn(
                "text-sm",
                selectedAnswer === i && i === question.correctAnswer && "text-emerald-700",
                selectedAnswer === i && i !== question.correctAnswer && "text-red-700"
              )}>
                {option}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Quick Check (True/False) */}
      {question.type === 'quick-check' && question.options && (
        <div className="flex gap-3 mb-4">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedAnswer(i)
                setShowExplanation(true)
              }}
              className={cn(
                "flex-1 p-3 rounded-lg border font-medium transition-all",
                selectedAnswer === null && "border-slate-200 hover:border-amber-300 hover:bg-amber-50",
                selectedAnswer === i && i === question.correctAnswer && "border-emerald-500 bg-emerald-50 text-emerald-700",
                selectedAnswer === i && i !== question.correctAnswer && "border-red-500 bg-red-50 text-red-700",
                selectedAnswer !== null && i === question.correctAnswer && selectedAnswer !== i && "border-emerald-300 bg-emerald-50/50"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Reflection Input */}
      {question.type === 'reflection' && (
        <div className="mb-4">
          <Textarea
            placeholder="Share your thoughts..."
            value={reflectionAnswer}
            onChange={(e) => setReflectionAnswer(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowExplanation(true)}
            disabled={!reflectionAnswer.trim()}
            className="mt-2"
          >
            Submit & See Sample Answer
          </Button>
        </div>
      )}

      {/* Explanation */}
      {showExplanation && (
        <div className={cn(
          "p-3 rounded-lg text-sm",
          question.type === 'reflection' ? "bg-purple-50 border border-purple-200" :
          isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"
        )}>
          <div className="font-medium mb-1 flex items-center gap-2">
            {question.type === 'reflection' ? (
              <>
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700">Sample Answer</span>
              </>
            ) : isCorrect ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Correct!</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700">Not quite right</span>
              </>
            )}
          </div>
          <p className="text-slate-600">
            {question.type === 'reflection' ? question.sampleAnswer : question.explanation}
          </p>
        </div>
      )}

      {/* Points */}
      <div className="mt-3 flex justify-end">
        <span className="text-xs text-slate-500">{question.points} point{question.points !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

// TA Reaction Display Component
interface TAReactionDisplayProps {
  ta: 'jose' | 'marialys'
  reaction: {
    reaction: string
    taName: string
    generatedAt: string
  }
}

function TAReactionDisplay({ ta, reaction }: TAReactionDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  
  const taInfo = {
    jose: {
      emoji: '⚽🏐',
      name: 'Jose',
      title: 'Volleyball & Soccer Player • Energy Expert',
      bgClass: 'bg-gradient-to-r from-blue-100 to-indigo-100',
      borderClass: 'border-blue-300',
      textClass: 'text-blue-900',
      accentClass: 'text-blue-600'
    },
    marialys: {
      emoji: '🏃‍♀️🥏',
      name: 'Marialys',
      title: 'Track & Field Athlete • Forces Expert',
      bgClass: 'bg-gradient-to-r from-purple-100 to-pink-100',
      borderClass: 'border-purple-300',
      textClass: 'text-purple-900',
      accentClass: 'text-purple-600'
    }
  }

  const info = taInfo[ta]
  const previewLength = 250

  return (
    <div className={cn(
      "rounded-lg border-2 overflow-hidden transition-all",
      info.bgClass,
      info.borderClass
    )}>
      {/* Header */}
      <div className="p-3 flex items-center gap-3">
        <span className="text-2xl">{info.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className={cn("font-bold text-sm", info.textClass)}>
            {info.name}
          </div>
          <div className={cn("text-xs", info.accentClass)}>
            {info.title}
          </div>
        </div>
      </div>
      
      {/* Reaction Content - clean plain text */}
      <div className="px-3 pb-3">
        <div className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap",
          info.textClass,
          !expanded && "max-h-40 overflow-hidden"
        )}>
          {reaction.reaction}
        </div>
        {!expanded && reaction.reaction.length > 200 && (
          <div className={cn("text-xs mt-1 italic cursor-pointer hover:underline", info.accentClass)} onClick={() => setExpanded(true)}>
            Click to expand...
          </div>
        )}
        
        {reaction.reaction.length > previewLength && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn("mt-2 text-xs font-medium flex items-center gap-1", info.accentClass, `hover:${info.textClass}`)}
          >
            {expanded ? (
              <>
                <ChevronDown className="h-3 w-3 rotate-180" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Read Full Response
              </>
            )}
          </button>
        )}
        
        <div className={cn("mt-2 text-[10px]", info.accentClass)}>
          {new Date(reaction.generatedAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
