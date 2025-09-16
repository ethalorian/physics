"use client"
import { useState, useRef } from 'react'
import { useVocabulary } from '@/contexts/VocabularyContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UploadResult {
  success: boolean
  imported: number
  total: number
  results?: Array<{ id: string, name: string, termsCount: number }>
  errors?: string[]
}

export default function VocabularyUploader() {
  const { refreshVocabularySets, vocabularySets } = useVocabulary()
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        let vocabularyData

        if (file.name.endsWith('.json')) {
          vocabularyData = JSON.parse(content)
        } else if (file.name.endsWith('.csv')) {
          vocabularyData = parseCSV(content, file.name)
        } else {
          throw new Error('Unsupported file format. Please use JSON or CSV files.')
        }

        await uploadVocabulary(vocabularyData)
      } catch (error) {
        setUploadResult({
          success: false,
          imported: 0,
          total: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        })
      }
    }
    reader.readAsText(file)
  }

  const parseCSV = (csvContent: string, fileName?: string) => {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('CSV file must have at least a header row and one data row')

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const termIndex = headers.findIndex(h => h.includes('term') || h.includes('word'))
    const definitionIndex = headers.findIndex(h => h.includes('definition') || h.includes('meaning'))
    
    if (termIndex === -1 || definitionIndex === -1) {
      throw new Error('CSV must have columns for "term" and "definition"')
    }

    const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('topic'))
    const difficultyIndex = headers.findIndex(h => h.includes('difficulty') || h.includes('level'))

    const terms = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      if (values.length < Math.max(termIndex, definitionIndex) + 1) continue

      const term = values[termIndex]
      const definition = values[definitionIndex]
      
      if (term && definition) {
        terms.push({
          term,
          definition,
          category: categoryIndex >= 0 ? values[categoryIndex] : undefined,
          difficulty: difficultyIndex >= 0 ? values[difficultyIndex] : 'medium'
        })
      }
    }

    return [{
      name: `Imported Vocabulary - ${new Date().toLocaleDateString()}`,
      description: `Vocabulary imported from ${fileName || 'uploaded file'}`,
      terms
    }]
  }

  const uploadVocabulary = async (vocabularyData: unknown) => {
    setUploading(true)
    setUploadResult(null)

    try {
      // Ensure vocabularyData is an array
      const vocabularySets = Array.isArray(vocabularyData) ? vocabularyData : [vocabularyData]

      const response = await fetch('/api/vocabulary/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabularySets })
      })

      if (!response.ok) {
        throw new Error('Failed to upload vocabulary')
      }

      const result = await response.json()
      setUploadResult(result)

      if (result.success) {
        // Refresh the vocabulary sets to show the new data
        await refreshVocabularySets()
      }
    } catch (error) {
      setUploadResult({
        success: false,
        imported: 0,
        total: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const file = files.find(f => f.name.endsWith('.json') || f.name.endsWith('.csv'))
    
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const downloadTemplate = () => {
    const template = {
      name: "Sample Physics Vocabulary",
      description: "Example vocabulary set for physics terms",
      unit: "unit-1",
      lesson: "lesson-1-1",
      terms: [
        {
          term: "Velocity",
          definition: "The rate of change of displacement with respect to time",
          category: "Motion",
          difficulty: "medium"
        },
        {
          term: "Acceleration",
          definition: "The rate of change of velocity with respect to time",
          category: "Motion",
          difficulty: "medium"
        }
      ]
    }

    const blob = new Blob([JSON.stringify([template], null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vocabulary-template.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCSVTemplate = () => {
    const csvContent = `term,definition,category,difficulty
Velocity,"The rate of change of displacement with respect to time",Motion,medium
Acceleration,"The rate of change of velocity with respect to time",Motion,medium
Force,"A push or pull that can cause an object to accelerate",Forces,easy`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vocabulary-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAllVocabulary = () => {
    if (vocabularySets.length === 0) return

    const exportData = vocabularySets.map(set => ({
      name: set.name,
      description: set.description,
      unit: set.unit,
      lesson: set.lesson,
      terms: set.terms.map(term => ({
        term: term.term,
        definition: term.definition,
        category: term.category,
        difficulty: term.difficulty
      }))
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vocabulary-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Vocabulary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">
              Drop vocabulary files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports JSON and CSV files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <FileText className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Select File'}
            </Button>
          </div>

          {/* Template Downloads */}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              JSON Template
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCSVTemplate}>
              <Download className="w-4 h-4 mr-2" />
              CSV Template
            </Button>
            {vocabularySets.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportAllVocabulary}>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            )}
          </div>

          {/* Upload Results */}
          {uploadResult && (
            <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {uploadResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription>
                  {uploadResult.success ? (
                    <div>
                      <p className="font-semibold text-green-800">
                        Upload Successful!
                      </p>
                      <p className="text-green-700">
                        Imported {uploadResult.imported} of {uploadResult.total} vocabulary sets
                      </p>
                      {uploadResult.results && (
                        <div className="mt-2 space-y-1">
                          {uploadResult.results.map((result) => (
                            <div key={result.id} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {result.termsCount} terms
                              </Badge>
                              <span className="text-sm">{result.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-red-800">Upload Failed</p>
                      {uploadResult.errors && (
                        <ul className="mt-1 text-sm text-red-700">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* File Format Info */}
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>JSON Format:</strong> Array of vocabulary sets with name, description, and terms</p>
            <p><strong>CSV Format:</strong> Columns: term, definition, category (optional), difficulty (optional)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
