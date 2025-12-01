import { Question } from '@/types/assignment'

export interface ParsedAssignment {
  title: string
  description?: string
  instructions?: string
  questions: Question[]
  total_points: number
}

export function parseAssignmentMarkdown(markdown: string): ParsedAssignment {
  const lines = markdown.split('\n')
  let title = ''
  let description = ''
  let instructions = ''
  const questions: Question[] = []
  let currentSection = ''
  let questionBuffer: string[] = []
  let questionCounter = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Extract title (first H1)
    if (line.startsWith('# ') && !title) {
      title = line.substring(2).trim()
      continue
    }

    // Extract description (first paragraph after title)
    if (!description && title && line && !line.startsWith('#') && !line.startsWith('**')) {
      description = line
      continue
    }

    // Section headers
    if (line.startsWith('## ')) {
      // Process any pending question
      if (questionBuffer.length > 0) {
        const question = parseQuestion(questionBuffer.join('\n'), questionCounter++)
        if (question) questions.push(question)
        questionBuffer = []
      }
      
      currentSection = line.substring(3).trim().toLowerCase()
      if (currentSection === 'instructions') {
        // Collect instructions until next section
        let j = i + 1
        const instructionLines = []
        while (j < lines.length && !lines[j].trim().startsWith('##')) {
          if (lines[j].trim()) instructionLines.push(lines[j].trim())
          j++
        }
        instructions = instructionLines.join(' ')
        i = j - 1
      }
      continue
    }

    // Collect question content
    if (currentSection === 'questions' || line.match(/^\d+\./)) {
      if (line.match(/^\d+\./) && questionBuffer.length > 0) {
        // New question starting, process previous one
        const question = parseQuestion(questionBuffer.join('\n'), questionCounter++)
        if (question) questions.push(question)
        questionBuffer = []
      }
      questionBuffer.push(line)
    }
  }

  // Process final question
  if (questionBuffer.length > 0) {
    const question = parseQuestion(questionBuffer.join('\n'), questionCounter++)
    if (question) questions.push(question)
  }

  const total_points = questions.reduce((sum, q) => sum + q.points, 0)

  return {
    title: title || 'Untitled Assignment',
    description,
    instructions,
    questions,
    total_points
  }
}

function parseQuestion(questionText: string, index: number): Question | null {
  const lines = questionText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return null

  // Extract question text (remove numbering)
  let questionLine = lines[0].replace(/^\d+\.\s*/, '').trim()
  
  // Extract points from question (e.g., "Question text (5 pts)")
  let points = 5 // default
  const pointsMatch = questionLine.match(/\((\d+)\s*pts?\)/)
  if (pointsMatch) {
    points = parseInt(pointsMatch[1])
    questionLine = questionLine.replace(pointsMatch[0], '').trim()
  }

  // Determine question type and parse accordingly
  const restOfContent = lines.slice(1).join('\n')

  // Multiple choice detection (a), b), c), d) or A), B), C), D)
  if (restOfContent.match(/[a-d]\)|[A-D]\)/)) {
    return parseMultipleChoice(questionLine, restOfContent, points, `q-${Date.now()}-${index}`)
  }

  // Numerical question detection (looking for units or "Calculate")
  if (questionLine.toLowerCase().includes('calculate') || 
      questionLine.includes('=') || 
      restOfContent.match(/units?:|answer.*\d/i)) {
    return parseNumerical(questionLine, restOfContent, points, `q-${Date.now()}-${index}`)
  }

  // Essay question detection (looking for "explain", "describe", "discuss")
  if (questionLine.toLowerCase().match(/explain|describe|discuss|analyze|compare/)) {
    return parseEssay(questionLine, restOfContent, points, `q-${Date.now()}-${index}`)
  }

  // Default to short answer
  return parseShortAnswer(questionLine, restOfContent, points, `q-${Date.now()}-${index}`)
}

function parseMultipleChoice(question: string, content: string, points: number, id: string): Question {
  const options: string[] = []
  let correctAnswer = 0
  
  const lines = content.split('\n')
  
  lines.forEach((line) => {
    const match = line.match(/^([a-d]|[A-D])\)\s*(.+)/)
    if (match) {
      const optionText = match[2].trim()
      
      // Check if this is marked as correct (look for asterisk or "CORRECT")
      if (optionText.includes('*') || optionText.toUpperCase().includes('CORRECT')) {
        correctAnswer = options.length
        options.push(optionText.replace(/\*|CORRECT/gi, '').trim())
      } else {
        options.push(optionText)
      }
    }
  })

  return {
    id,
    type: 'multiple-choice',
    question,
    points,
    options,
    correctAnswer
  } as Question
}

function parseNumerical(question: string, content: string, points: number, id: string): Question {
  let correctValue = 0
  let tolerance = 0.1
  let unit = ''

  // Look for answer in content
  const answerMatch = content.match(/answer:?\s*([0-9.]+)/i)
  if (answerMatch) {
    correctValue = parseFloat(answerMatch[1])
  }

  // Look for tolerance
  const toleranceMatch = content.match(/tolerance:?\s*([0-9.]+)/i)
  if (toleranceMatch) {
    tolerance = parseFloat(toleranceMatch[1])
  }

  // Look for unit
  const unitMatch = content.match(/unit:?\s*([a-zA-Z\/²³°]+)/i)
  if (unitMatch) {
    unit = unitMatch[1]
  }

  return {
    id,
    type: 'numerical',
    question,
    points,
    correctValue,
    tolerance,
    unit
  } as Question
}

function parseShortAnswer(question: string, content: string, points: number, id: string): Question {
  let expectedAnswer = ''
  let keywords: string[] = []
  let maxLength = 500

  // Look for expected answer
  const answerMatch = content.match(/answer:?\s*(.+)/i)
  if (answerMatch) {
    expectedAnswer = answerMatch[1].trim()
  }

  // Look for keywords
  const keywordsMatch = content.match(/keywords?:?\s*(.+)/i)
  if (keywordsMatch) {
    keywords = keywordsMatch[1].split(',').map(k => k.trim())
  }

  // Look for max length
  const lengthMatch = content.match(/max\s*length:?\s*(\d+)/i)
  if (lengthMatch) {
    maxLength = parseInt(lengthMatch[1])
  }

  return {
    id,
    type: 'open-response',
    question,
    points,
    rubric: [{
      id: 'content',
      name: 'Content Quality',
      description: 'Quality and accuracy of the response',
      maxPoints: points,
      levels: [
        { score: points, description: 'Excellent understanding with all key concepts' },
        { score: Math.floor(points * 0.7), description: 'Good understanding with most key concepts' },
        { score: Math.floor(points * 0.4), description: 'Basic understanding with some key concepts' },
        { score: 0, description: 'Little to no understanding shown' }
      ]
    }],
    correctConcepts: keywords,
    maxLength,
    autoGrade: true
  } as Question
}

// Essay type removed - converted to open-response
function parseEssay(question: string, content: string, points: number, id: string): Question {
  let rubricDescription = ''
  let minLength = 100
  let maxLength = 1000

  // Look for rubric
  const rubricMatch = content.match(/rubric:?\s*([\s\S]+?)(?=min|max|$)/i)
  if (rubricMatch) {
    rubricDescription = rubricMatch[1].trim()
  }

  // Look for length requirements
  const minMatch = content.match(/min\s*length:?\s*(\d+)/i)
  if (minMatch) {
    minLength = parseInt(minMatch[1])
  }

  const maxMatch = content.match(/max\s*length:?\s*(\d+)/i)
  if (maxMatch) {
    maxLength = parseInt(maxMatch[1])
  }

  // Convert to structured open-response format
  return {
    id,
    type: 'open-response',
    question,
    points,
    rubric: [{
      id: `${id}-content`,
      name: 'Content & Understanding',
      description: rubricDescription || 'Demonstrates understanding of the topic',
      maxPoints: Math.floor(points * 0.6),
      levels: [
        { score: Math.floor(points * 0.6), description: 'Excellent - comprehensive understanding with specific details' },
        { score: Math.floor(points * 0.45), description: 'Good - solid understanding with some details' },
        { score: Math.floor(points * 0.3), description: 'Fair - basic understanding' },
        { score: 0, description: 'Limited understanding shown' }
      ]
    }, {
      id: `${id}-explanation`,
      name: 'Explanation & Communication',
      description: 'Clear organization and scientific communication',
      maxPoints: Math.floor(points * 0.4),
      levels: [
        { score: Math.floor(points * 0.4), description: 'Clear, well-organized, uses proper terminology' },
        { score: Math.floor(points * 0.3), description: 'Mostly clear with minor issues' },
        { score: Math.floor(points * 0.2), description: 'Some clarity issues' },
        { score: 0, description: 'Unclear or disorganized' }
      ]
    }],
    minLength,
    maxLength,
    autoGrade: true,
    requiresExplanation: true
  } as Question
}

