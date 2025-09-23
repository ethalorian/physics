"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuestionBank } from '@/contexts/QuestionBankContext'
import QuestionBankBrowser from '@/components/question-bank/QuestionBankBrowser'
import QuestionBankQuestionEditor from '@/components/question-bank/QuestionEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Download, Upload, Plus, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function QuestionBankPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { stats, exportQuestions, importQuestions, refreshQuestions, ensureInitialized } = useQuestionBank()
  const [importing, setImporting] = useState(false)
  const [showQuestionEditor, setShowQuestionEditor] = useState(false)

  // Ensure question bank data is loaded when component mounts
  useEffect(() => {
    ensureInitialized()
  }, [ensureInitialized])

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Please sign in to access the question bank.</p>
            <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleExport = () => {
    const questions = exportQuestions()
    const dataStr = JSON.stringify(questions, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `question-bank-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const questions = JSON.parse(text)
      
      if (Array.isArray(questions)) {
        importQuestions(questions)
        alert(`Successfully imported ${questions.length} questions!`)
      } else {
        alert('Invalid file format. Please upload a valid question bank JSON file.')
      }
    } catch (error) {
      console.error('Error importing questions:', error)
      alert('Failed to import questions. Please check the file format.')
    } finally {
      setImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Question Bank</h1>
              <p className="text-muted-foreground">Manage and organize your physics questions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowQuestionEditor(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Create Question
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/assignments/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              title="Export all questions as JSON"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                disabled={importing}
                title="Import questions from JSON file"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_questions}</div>
              <p className="text-xs text-muted-foreground mt-1">In your bank</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">By Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {stats.by_difficulty.easy} Easy
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  {stats.by_difficulty.medium} Med
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {stats.by_difficulty.hard} Hard
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Question Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.by_type).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{type.replace('-', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Most Used</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.most_used.length > 0 ? (
                <div className="space-y-1">
                  {stats.most_used.slice(0, 3).map((q) => (
                    <div key={q.id} className="text-xs">
                      <div className="truncate text-muted-foreground">
                        {q.question.question.substring(0, 30)}...
                      </div>
                      <div className="font-medium">{q.usage_count} uses</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No questions used yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Question Browser */}
      <QuestionBankBrowser />

      {/* Question Editor Modal */}
      {showQuestionEditor && (
        <QuestionBankQuestionEditor
          onClose={() => setShowQuestionEditor(false)}
          onSave={() => {
            refreshQuestions()
            setShowQuestionEditor(false)
          }}
        />
      )}
    </div>
  )
}
