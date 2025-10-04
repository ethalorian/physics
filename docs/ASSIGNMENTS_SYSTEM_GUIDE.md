# 📝 Assignments System - Complete Guide

## Overview

The assignments system is the core assessment mechanism in your Physics Classroom application. It allows teachers to create rich, interactive assignments with multiple question types, AI-powered grading, and comprehensive student progress tracking.

---

## 🏗️ Architecture Overview

```
┌──────────────────┐
│  LocalStorage    │ ← Primary data storage (assignments & submissions)
│  (Browser)       │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ AssignmentContext│ ← State management & CRUD operations
│  (React Context) │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  UI Components   │ ← Builder (teacher) & Renderer (student)
│  (React)         │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  API Routes      │ ← AI grading, generation, analytics
│  (Next.js)       │
└──────────────────┘
```

---

## 📊 Core Data Structures

### Assignment Object
Location: `src/types/assignment.ts`

```typescript
interface Assignment {
  // Identity
  id: string                    // Unique identifier
  
  // Metadata
  title: string                 // Assignment title
  description?: string          // Brief description
  instructions?: string         // Student instructions
  lesson_id?: string           // Optional lesson association
  
  // Content
  questions: Question[]         // Array of questions (mixed types)
  total_points: number         // Sum of all question points
  
  // Settings
  due_date?: string            // ISO 8601 format
  published: boolean           // Visibility control
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (populated)
  lesson?: {
    title: string
    slug: string
  }
}
```

### Submission Object

```typescript
interface Submission {
  id: string
  assignment_id: string
  user_id: string
  answers: Record<string, any>  // Flexible answer storage
  
  // Grading
  score?: number               // Points earned
  max_score?: number          // Total possible points
  feedback?: Record<string, string>  // Per-question feedback
  rubric_grades?: OpenResponseGrade[]  // AI grading results
  
  // Status
  status: 'submitted' | 'graded' | 'partial'
  submitted_at: string
  graded_at?: string
}
```

---

## 🎯 Question Types

Your system supports **8 different question types**:

### 1. Multiple Choice

```typescript
interface MultipleChoiceQuestion {
  type: 'multiple-choice'
  question: string
  options: string[]            // Answer choices
  correctAnswer: number        // Index of correct answer (0-based)
  explanation?: string         // Why answer is correct
  points: number
  scenarioImage?: string       // Optional physics diagram
}
```

**Features:**
- Instant auto-grading
- Optional explanations shown after submission
- AI-generated options available
- AI-generated physics diagrams

**Used for:** Quick concept checks, formula selection, terminology

### 2. Numerical Answer

```typescript
interface NumericalQuestion {
  type: 'numerical'
  question: string
  correctValue: number         // Expected numeric answer
  tolerance?: number           // Acceptable error (default 0)
  unit?: string               // Required unit (e.g., "m/s")
  unitOptions?: string[]      // Unit dropdown choices
  points: number
  scenarioImage?: string
}
```

**Features:**
- Auto-grading with tolerance
- Unit validation
- Physics calculator can auto-fill answers
- Incorrect unit options generated automatically

**Used for:** Physics calculations, quantitative problems

### 3. Open Response (AI-Graded)

```typescript
interface OpenResponseQuestion {
  type: 'open-response'
  question: string
  rubric: RubricCriterion[]    // Detailed grading criteria
  correctConcepts?: string[]   // Key physics concepts
  commonMisconceptions?: string[]  // Wrong ideas to check
  sampleAnswer?: string        // Example answer
  autoGrade?: boolean          // Enable AI grading
  gradePrompt?: string         // Custom grading instructions
  minLength?: number           // Character minimum
  maxLength?: number           // Character limit
  points: number
}
```

**Rubric Structure:**
```typescript
interface RubricCriterion {
  id: string
  name: string                 // e.g., "Understanding"
  description: string          // What this measures
  maxPoints: number
  levels: {
    score: number
    description: string        // What earns this score
  }[]
}
```

**Features:**
- AI grading with GPT-4
- Multi-criteria rubric scoring
- Identifies misconceptions
- Provides detailed feedback
- Sample answer generation

**Used for:** Explanations, concept understanding, problem-solving

### 4. Essay (Manual Grading)

```typescript
interface EssayQuestion {
  type: 'essay'
  question: string
  rubric?: string              // Grading guidelines
  minLength?: number
  maxLength?: number
  autoGrade?: boolean          // Can enable AI grading
  points: number
}
```

**Used for:** Long-form responses, research, analysis

### 5-8. Vocabulary Questions

Four specialized vocabulary question types for physics terminology:

#### Vocabulary Matching
```typescript
interface VocabularyMatchingQuestion {
  type: 'vocabulary-matching'
  vocabularyTerms: VocabularyTerm[]
  instructions?: string
  points: number
}
```
Drag-and-drop matching of terms to definitions.

#### Vocabulary Crossword
```typescript
interface VocabularyCrosswordQuestion {
  type: 'vocabulary-crossword'
  vocabularyTerms: VocabularyTerm[]
  gridSize?: number           // Default 15x15
  instructions?: string
  points: number
}
```
Auto-generated crossword puzzle from terms.

#### Vocabulary Fill-in-the-Blank
```typescript
interface VocabularyFillBlankQuestion {
  type: 'vocabulary-fill-blank'
  vocabularyTerms: VocabularyTerm[]
  sentences: {
    id: string
    text: string              // Text with {term} placeholders
    termId: string
  }[]
  showWordBank?: boolean
  points: number
}
```
AI-generated contextual sentences with blanks.

#### Vocabulary Hangman
```typescript
interface VocabularyHangmanQuestion {
  type: 'vocabulary-hangman'
  vocabularyTerms: VocabularyTerm[]
  difficulty?: 'easy' | 'medium' | 'hard'
  maxWrongGuesses?: number    // Default 6
  showDefinitions?: boolean
  wordsPerGame?: number       // Default 10
  points: number
}
```
Classic hangman game with physics terms.

---

## 🔄 Data Flow

### Assignment Creation (Teacher)

```
Teacher → Admin Dashboard
    ↓
Create Assignment Page
    ↓
Assignment Builder Form:
  • Title, description, instructions
  • Question editor (add/edit/delete)
  • AI assistance (options, answers, images)
  • Question bank browser (import)
  • Preview mode
    ↓
Save to AssignmentContext
    ↓
LocalStorage persistence
    ↓
Toggle "Published" for student visibility
```

### Assignment Taking (Student)

```
Student → /assignments/[id]
    ↓
Fetch from AssignmentContext
    ↓
Check for existing submission
    ↓
Render QuestionRenderer for each question
    ↓
Auto-save answers as student types
    ↓
Submit button → validate all required
    ↓
Auto-grade (MC, numerical)
    ↓
AI grade (open-response) via API
    ↓
Create Submission object
    ↓
Save to LocalStorage
    ↓
Show results page
```

### Grading Flow

```
Submission created
    ↓
Auto-gradable questions:
  • Multiple choice: Check correctAnswer
  • Numerical: Check within tolerance + unit
    ↓
AI-gradable questions (open-response):
  ↓
POST /api/grade-assignment
  ↓
For each open-response:
  • Send to OpenAI GPT-4
  • Apply rubric criteria
  • Check for concepts
  • Identify misconceptions
  • Generate feedback
  ↓
Receive grades array
  ↓
Calculate total score
  ↓
Update submission with:
  • score, max_score
  • rubric_grades
  • feedback per question
  • status: 'graded'
  ↓
Save to LocalStorage
  ↓
Student views results
```

---

## 🎨 Key Components

### **Teacher/Admin Components**

#### 1. **`/src/app/admin/assignments/create/page.tsx`** - Assignment Builder
Main assignment creation interface.

**Features:**
- Assignment metadata form
- Question management (add, edit, delete, reorder)
- Question type selector
- Question bank browser integration
- Live preview mode
- Auto-calculate total points

**Workflow:**
1. Fill in title, description, instructions
2. Optionally link to a lesson
3. Add questions (or import from question bank)
4. Configure each question
5. Preview assignment
6. Save as draft or publish

#### 2. **`QuestionEditor.tsx`** - Question Configuration
Location: `src/components/assignment-builder/question-editor.tsx`

**Features per question type:**

**Multiple Choice:**
- Text input for question
- 4+ option inputs
- Correct answer selector
- Explanation field
- AI-generate options button
- AI-generate scenario image
- Add to question bank

**Numerical:**
- Question text
- Auto-calculate button (uses physics calculator)
- Correct value input
- Tolerance slider
- Unit input
- Unit options (auto-generated incorrect units)

**Open Response:**
- Question text
- Rubric builder
- Key concepts input
- Common misconceptions input
- Sample answer generator (AI)
- Auto-grade toggle
- Min/max length

**Vocabulary:**
- Specialized `VocabularyQuestionEditor`
- Browse vocabulary sets
- Add custom terms
- Auto-generate sentences (for fill-blank)
- Configure game settings

#### 3. **`RubricBuilder.tsx`** - Grading Criteria
Location: `src/components/assignment-builder/rubric-builder.tsx`

**Features:**
- Add/remove criteria
- Define max points per criterion
- Create scoring levels
- Level descriptions
- Visual rubric preview

#### 4. **`/src/app/admin/assignments/page.tsx`** - Assignment Management
List all assignments with management actions.

**Displays:**
- Assignment cards with metadata
- Published status badges
- Question count and total points
- Question type breakdown
- Due dates

**Actions:**
- Create new assignment
- View assignment (student view)
- Delete assignment

### **Student Components**

#### 1. **`/src/app/assignments/[id]/page.tsx`** - Assignment Taking
Main student interface for completing assignments.

**Features:**
- Assignment header (title, description, instructions)
- Progress bar (questions answered / total)
- Question-by-question rendering
- Auto-save answers
- Save progress button
- Submit button (validates required questions)
- Timer display (time spent)

**State Management:**
- Fetches assignment from context
- Loads existing submission (if any)
- Tracks answers in local state
- Records start time for analytics

#### 2. **`QuestionRenderer.tsx`** - Question Display
Location: `src/components/assignment-taking/question-renderer.tsx`

**Renders each question type:**

**Multiple Choice:**
- Radio button group
- Visual selection feedback
- Shows correct answer after submission (if feedback enabled)
- Explanation display

**Numerical:**
- Number input
- Unit selector (if unitOptions provided)
- Validation feedback
- Shows correct answer with tolerance

**Open Response:**
- Textarea with character counter
- Min/max length validation
- Shows rubric feedback after grading
- Displays AI-generated feedback

**Essay:**
- Large textarea
- Character counter
- Rubric display (if provided)

**Vocabulary:**
- Renders specialized game components
- Interactive gameplay
- Real-time scoring

#### 3. **`ProgressScoreboard.tsx`** - Live Progress Tracking
Location: `src/components/assignment-taking/ProgressScoreboard.tsx`

**Displays:**
- Questions answered count
- Points earned (for auto-gradable)
- Progress percentage
- Mobile-friendly drawer view
- Per-question status indicators

---

## 🤖 AI-Powered Features

### 1. **Multiple Choice Option Generation**

**Endpoint:** `POST /api/generate-mc-options`

**How it works:**
```javascript
// Teacher clicks "Generate Options" button
// → API call with question text and topic
// → GPT-4 generates:
//   • 1 correct answer
//   • 3 plausible distractors based on common misconceptions
//   • Explanations for each option
// → Auto-populates options in editor
```

**Prompt strategy:**
- Focuses on high school physics level
- Includes common misconceptions
- Generates explanations for learning

### 2. **Physics Scenario Image Generation**

**Endpoint:** `POST /api/generate-scenario-image`

**How it works:**
```javascript
// Teacher clicks "Generate Image" button
// → API extracts physics context from question
// → DALL-E 3 generates diagram
// → Returns base64 image
// → Embedded in question
```

**Use cases:**
- Free body diagrams
- Motion diagrams
- Circuit diagrams
- Wave illustrations

### 3. **Answer Generation**

**Endpoint:** `POST /api/generate-answer`

**How it works:**
```javascript
// Teacher clicks "Generate Sample Answer"
// → GPT-4 creates model response
// → Shows step-by-step reasoning
// → Uses appropriate physics terminology
// → Includes relevant formulas
// → Stored as sampleAnswer
```

**Used for:**
- Creating answer keys
- Providing examples to students
- Training AI grading model

### 4. **Auto-Calculate (Numerical)**

**Function:** `calculatePhysicsSolution()`
Location: `src/utils/physics-calculator.ts`

**How it works:**
```javascript
// Parses question text for:
//   • Given values and units
//   • Physics formulas mentioned
//   • What's being asked
// → Identifies relevant equation
// → Performs calculation
// → Returns value and unit
// → Generates incorrect unit options
```

**Supports:**
- Kinematic equations
- Force calculations (F=ma)
- Energy equations
- Power calculations
- More can be added

### 5. **AI Grading (Open Response)**

**Endpoint:** `POST /api/grade-open-response` or `POST /api/grade-assignment` (batch)

**How it works:**
```javascript
Student submits open-response answer
    ↓
API receives:
  • Question text
  • Student answer
  • Rubric criteria
  • Correct concepts
  • Common misconceptions
  • Sample answer
    ↓
GPT-4 evaluates:
  • Check concepts mentioned
  • Identify misconceptions
  • Score each rubric criterion
  • Generate specific feedback
  • Provide improvement suggestions
    ↓
Returns:
  • Score per criterion
  • Total score
  • Concepts identified
  • Misconceptions found
  • Strengths
  • Areas for improvement
  • Overall feedback message
    ↓
Displayed to student
```

**Grading prompt design:**
- Emphasizes high school level
- Looks for conceptual understanding
- Identifies ACTUAL misconceptions (not hypothetical)
- Provides constructive feedback
- Encouraging tone

**Fallback:** If GPT-4 fails, tries GPT-3.5-turbo

### 6. **Vocabulary Sentence Generation**

**Endpoint:** `POST /api/generate-vocab-sentences`

**How it works:**
```javascript
// For fill-in-the-blank vocabulary questions
// → AI generates contextual physics sentences
// → Each sentence uses one vocabulary term
// → Sentences are educational and relevant
// → Returns array of sentences with term IDs
```

---

## 💾 Storage System

### LocalStorage Architecture

**Why LocalStorage?**
- Fast, no server required
- Instant save/load
- Works offline
- Easy development/testing
- No database setup needed

**Storage Keys:**
- `physics-assignments` - All assignments
- `physics-submissions` - All submissions

**Storage Strategy:**
```typescript
// Assignments are stripped of large data before storage
function stripLargeData(assignment: Assignment): Assignment {
  return {
    ...assignment,
    questions: assignment.questions.map(q => ({
      ...q,
      // Remove base64 images (can be large)
      scenarioImage: q.scenarioImage?.startsWith('data:image') 
        ? null 
        : q.scenarioImage
    }))
  }
}
```

**Quota Management:**
```typescript
// Monitors storage usage
// If quota exceeded:
//   1. Strip images from older assignments
//   2. Remove old submissions
//   3. Show warning to user
```

### Data Persistence Flow

```
User action (create, update, delete)
    ↓
Update React state (AssignmentContext)
    ↓
Transform data (stripLargeData if needed)
    ↓
JSON.stringify()
    ↓
localStorage.setItem()
    ↓
Handle quota errors gracefully
```

---

## 🔗 Integration Points

### 1. **Question Bank Integration**

**Component:** `QuestionBankBrowser`

**Features:**
- Browse existing questions
- Filter by unit, lesson, difficulty, type
- Search by text
- Preview questions
- Select multiple for import
- Track usage statistics

**Workflow:**
```
Assignment Builder → "Browse Question Bank"
    ↓
QuestionBankBrowser modal opens
    ↓
Apply filters (unit, difficulty, etc.)
    ↓
Select questions
    ↓
Click "Add Selected"
    ↓
Questions imported into assignment
    ↓
Automatically added to questions array
```

**Reverse flow:**
```
Assignment Builder → Question Editor
    ↓
Click "Add to Question Bank"
    ↓
AddToQuestionBankModal opens
    ↓
Fill in metadata (unit, lesson, topics, difficulty)
    ↓
Save
    ↓
Question stored in question bank
    ↓
Available for future assignments
```

### 2. **Lesson Association**

Assignments can be linked to specific lessons:

**Benefits:**
- Students see related lesson content
- Context for the assessment
- Progress tracking per lesson
- Assignment appears in lesson view

**Implementation:**
```typescript
assignment.lesson_id = "lesson-uuid"

// Populated with lesson data
assignment.lesson = {
  title: "Newton's Laws",
  slug: "newtons-laws"
}
```

### 3. **Student Activity Tracking**

**Hook:** `useActivityTracking()`

**Records:**
- When student starts assignment
- Time spent on assignment
- When student submits
- Submission data and score

**Sent to:** `/api/student-activity` and `/api/assignment-submissions`

### 4. **Vocabulary System Integration**

Vocabulary questions pull from the vocabulary system:

**Context:** `VocabularyContext`

**Features:**
- Browse vocabulary sets by unit/lesson
- Import terms into questions
- Track vocabulary game scores
- Sync with vocabulary games section

### 5. **Google Classroom (Future)**

**File:** `src/lib/google-classroom.ts`

Planned integration:
- Export assignments to Google Classroom
- Sync student rosters
- Grade passback
- Material sharing

---

## 🎓 Grading Workflows

### Automatic Grading

**Multiple Choice:**
```typescript
if (answer === question.correctAnswer) {
  score = question.points
} else {
  score = 0
}
```

**Numerical:**
```typescript
const valueCorrect = Math.abs(answer - correctValue) <= tolerance
const unitCorrect = !unitOptions || selectedUnit === correctUnit

if (valueCorrect && unitCorrect) {
  score = question.points
} else if (valueCorrect) {
  score = question.points * 0.5  // Half credit for correct value, wrong unit
} else {
  score = 0
}
```

### AI Grading

**Triggered by:**
- `question.autoGrade = true`
- Student submits assignment
- Teacher clicks "Grade with AI"

**Process:**
1. Collect all open-response questions with autoGrade enabled
2. Batch request to `/api/grade-assignment`
3. For each question:
   - Send to GPT-4 with rubric
   - Receive structured grade object
4. Update submission with:
   - `rubric_grades` array
   - `feedback` per question
   - Total `score`
   - `status = 'graded'`
5. Save submission
6. Display results to student

### Manual Grading

**For essays and complex responses:**

**Workflow:**
1. Teacher views submissions
2. Reads student response
3. Applies rubric manually
4. Enters score and feedback
5. Updates submission
6. Student sees results

**UI:** (Not yet fully implemented - opportunity for enhancement)

---

## 🛠️ How to Make Common Changes

### Add a New Question Type

**1. Define TypeScript interface**
```typescript
// src/types/assignment.ts
export interface NewQuestionType extends BaseQuestion {
  type: 'new-question-type'
  customField: string
  // ... other fields
}

// Update Question union type
export type Question = 
  | MultipleChoiceQuestion 
  | ... 
  | NewQuestionType
```

**2. Add to question editor**
```typescript
// src/components/assignment-builder/question-editor.tsx

// In type selector dropdown:
<SelectItem value="new-question-type">New Type</SelectItem>

// In renderInput() switch:
case 'new-question-type':
  return <NewQuestionTypeEditor />
```

**3. Add to question renderer**
```typescript
// src/components/assignment-taking/question-renderer.tsx

// In renderInput() switch:
case 'new-question-type':
  return <NewQuestionTypeInput />
```

**4. Add grading logic**
```typescript
// If auto-gradable:
// In submission grading logic

// If AI-gradable:
// Add to /api/grade-assignment

// If manual:
// No changes needed
```

### Modify AI Grading Behavior

**Location:** `src/app/api/grade-open-response/route.ts`

**To change grading criteria:**
```typescript
const systemPrompt = `
You are an expert HIGH SCHOOL physics teacher.

// Modify these instructions:
Your task is to evaluate based on:
1. [Your criteria here]
2. [Your criteria here]
...
`
```

**To adjust scoring:**
```typescript
// Modify temperature (0-1):
temperature: 0.3  // Lower = more consistent, Higher = more creative

// Modify max_tokens:
max_tokens: 800  // Increase for longer feedback
```

**To change model:**
```typescript
model: "gpt-4"          // Best quality
// or
model: "gpt-3.5-turbo"  // Faster, cheaper
```

### Change Assignment Storage

**To switch from localStorage to database:**

1. **Create migration:**
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  title TEXT,
  questions JSONB,
  -- ... other fields
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id),
  -- ... other fields
);
```

2. **Update AssignmentContext:**
```typescript
// Replace localStorage calls with Supabase:
const { data, error } = await supabase
  .from('assignments')
  .insert(assignment)
```

3. **Update API routes:**
Create CRUD endpoints similar to lessons API.

### Customize Question Points

**Default points by type:**
```typescript
// src/app/admin/assignments/create/page.tsx

const addQuestion = (type: Question['type']) => {
  const defaultPoints = {
    'multiple-choice': 5,
    'numerical': 10,
    'open-response': 20,
    'essay': 30,
    'vocabulary-matching': 10,
    'vocabulary-crossword': 15,
    // ... etc
  }
  
  // Modify defaults here
}
```

### Add Question Import/Export

**Export to JSON:**
```typescript
const exportAssignment = (assignment: Assignment) => {
  const json = JSON.stringify(assignment, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${assignment.title}.json`
  a.click()
}
```

**Import from JSON:**
```typescript
const importAssignment = async (file: File) => {
  const text = await file.text()
  const assignment = JSON.parse(text) as Assignment
  await createAssignment(assignment)
}
```

---

## 🔍 Troubleshooting

### "Assignment not found"
- Check assignment.published = true
- Verify assignment ID in URL
- Check localStorage data integrity

### "AI grading failed"
- Verify OPENAI_API_KEY in .env
- Check API quota/billing
- Look for errors in console
- Try GPT-3.5 fallback

### "Answers not saving"
- Check localStorage quota
- Look for JavaScript errors
- Verify AssignmentContext is wrapping app
- Check browser localStorage support

### "Question bank not showing"
- Verify user has teacher/admin role
- Check QuestionBankContext initialization
- Database connection issues
- Empty question bank

### "Math not rendering in questions"
- Use proper KaTeX syntax: `\( inline \)` or `\[ display \]`
- Check for backslash escaping
- Verify KaTeX is loaded

### "Large assignments won't save"
- Reduce scenario image sizes
- Use image URLs instead of base64
- Clear old submissions
- Monitor localStorage quota

---

## 📈 Best Practices

### Assignment Design

1. **Mix question types** - Use variety for engagement
2. **Clear instructions** - Students should know exactly what to do
3. **Appropriate points** - Weight questions by difficulty/importance
4. **Use rubrics** - Especially for open-response
5. **Test first** - Preview assignment as student before publishing

### Question Writing

1. **Clear and concise** - Avoid ambiguous wording
2. **Age-appropriate** - High school level physics
3. **One concept per question** - Don't mix multiple topics
4. **Provide context** - Use scenario images when helpful
5. **Fair distractors** - MC options should be plausible

### AI Features

1. **Review AI-generated content** - Always check before using
2. **Customize prompts** - Add specific context for your class
3. **Provide sample answers** - Improves AI grading accuracy
4. **Define misconceptions** - Helps AI identify errors
5. **Use rubrics** - Required for consistent AI grading

### Grading

1. **Auto-grade when possible** - MC and numerical for instant feedback
2. **AI for open-response** - Saves time, provides consistency
3. **Manual review** - Check AI grades periodically
4. **Detailed feedback** - Use AI's suggestions but personalize
5. **Grade promptly** - Students appreciate quick turnaround

---

## 🚀 Future Enhancement Ideas

### Potential Upgrades

1. **Database Storage** - Move from localStorage to Supabase
2. **Real-time Collaboration** - Multiple teachers editing
3. **Assignment Templates** - Pre-made assignment sets
4. **Question Pools** - Random question selection
5. **Adaptive Difficulty** - Adjust questions based on performance
6. **Peer Grading** - Students grade each other (with review)
7. **Video Responses** - Record answer videos
8. **Drawing Tools** - For physics diagrams in answers
9. **Assignment Scheduling** - Auto-publish on date/time
10. **Grade Analytics** - Class performance insights
11. **Assignment Revision** - Version control for assignments
12. **Student Notes** - Annotations on questions
13. **Hints System** - Progressive hints for students
14. **Time Limits** - Timed assessments
15. **Proctoring** - Basic anti-cheating measures

---

## 📞 Quick Reference

### Key Files
```
Types:
  - src/types/assignment.ts

Context:
  - src/contexts/AssignmentContext.tsx

Teacher UI:
  - src/app/admin/assignments/page.tsx (list)
  - src/app/admin/assignments/create/page.tsx (builder)
  - src/components/assignment-builder/question-editor.tsx
  - src/components/assignment-builder/rubric-builder.tsx

Student UI:
  - src/app/assignments/[id]/page.tsx (take assignment)
  - src/components/assignment-taking/question-renderer.tsx
  - src/components/assignment-taking/ProgressScoreboard.tsx

API Routes:
  - src/app/api/grade-assignment/route.ts
  - src/app/api/grade-open-response/route.ts
  - src/app/api/generate-mc-options/route.ts
  - src/app/api/generate-answer/route.ts
  - src/app/api/generate-scenario-image/route.ts
  - src/app/api/assignment-submissions/route.ts

Utilities:
  - src/utils/physics-calculator.ts
  - src/utils/storage-utils.ts
```

### Common Commands

```javascript
// Get assignment by ID
const assignment = getAssignmentById('assignment-123')

// Create new assignment
await createAssignment({
  title: 'Newton\'s Laws Quiz',
  questions: [...],
  published: true
})

// Update assignment
await updateAssignment('assignment-123', {
  title: 'Updated Title'
})

// Delete assignment
await deleteAssignment('assignment-123')

// Get student submission
const submission = getSubmissionByAssignmentId('assignment-123', 'user-123')
```

---

This guide covers everything you need to understand and modify the assignments system! Let me know if you have questions about any specific part.

