"use client"
import { useState } from 'react'
import { Question } from '@/types/assignment'
import { Button } from '@/components/ui/button'
import { Save, X } from 'lucide-react'
import QuestionEditor from '../assignment-builder/question-editor'
import AddToQuestionBankModal from './AddToQuestionBankModal'

interface QuestionBankQuestionEditorProps {
  onClose: () => void
  onSave?: () => void
}

/**
 * QuestionBankQuestionEditor - Modal wrapper for creating new questions for the question bank.
 * 
 * This component reuses the main QuestionEditor from assignment-builder to avoid code duplication.
 * It adds a modal wrapper and save-to-bank functionality.
 */
export default function QuestionBankQuestionEditor({ onClose, onSave }: QuestionBankQuestionEditorProps) {
  // Initialize with empty question
  const [question, setQuestion] = useState<Question>({
    id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'multiple-choice',
    question: '',
    points: 5,
    options: ['', '', '', ''],
    correctAnswer: 0
  } as Question)

  const [showSaveModal, setShowSaveModal] = useState(false)

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setQuestion(updatedQuestion)
  }

  const handleSaveToBank = () => {
    if (!question.question || question.question.trim() === '') {
      alert('Please enter a question first')
      return
    }
    setShowSaveModal(true)
  }

  // Dummy delete handler - not needed for new question creation
  const handleDelete = () => {
    if (confirm('Are you sure you want to discard this question?')) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Create New Question</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Build a new question for your question bank
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveToBank}
              disabled={!question.question || question.question.trim() === ''}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save to Bank
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content - Reuse the main QuestionEditor */}
        <div className="flex-1 overflow-y-auto p-6">
          <QuestionEditor
            question={question}
            onUpdate={handleQuestionUpdate}
            onDelete={handleDelete}
          />
        </div>
      </div>
      
      {showSaveModal && (
        <AddToQuestionBankModal
          question={question}
          onClose={() => setShowSaveModal(false)}
          onSuccess={() => {
            setShowSaveModal(false)
            if (onSave) onSave()
            onClose()
          }}
        />
      )}
    </div>
  )
}
