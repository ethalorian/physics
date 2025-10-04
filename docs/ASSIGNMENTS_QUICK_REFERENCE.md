# Assignments System - Quick Visual Reference

## 🎯 The Big Picture

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              ASSIGNMENTS SYSTEM WORKFLOW                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    ┌─────────────────────────────────────────────┐
    │   👨‍🏫 TEACHER CREATES ASSIGNMENT            │
    │                                             │
    │  • Title, description, instructions         │
    │  • Add questions (8 types available)        │
    │  • Configure each question                  │
    │  • Use AI assistance:                       │
    │    - Generate MC options                    │
    │    - Generate answers                       │
    │    - Create physics diagrams                │
    │    - Auto-calculate numerical answers       │
    │  • Import from question bank                │
    │  • Build rubrics for grading                │
    │  • Preview before publishing                │
    └────────────────┬────────────────────────────┘
                     │
                     ↓
    ┌─────────────────────────────────────────────┐
    │   💾 STORED IN LOCALSTORAGE                 │
    │                                             │
    │  Key: physics-assignments                   │
    │  • Assignments array                        │
    │  • Questions (stripped of large images)     │
    │  • Metadata and settings                    │
    └────────────────┬────────────────────────────┘
                     │
                     ↓
    ┌─────────────────────────────────────────────┐
    │   👨‍🎓 STUDENT TAKES ASSIGNMENT               │
    │                                             │
    │  /assignments/[id]                          │
    │  • View questions one-by-one or all         │
    │  • Answer with type-specific inputs         │
    │  • Auto-save progress                       │
    │  • Track time spent                         │
    │  • Submit when complete                     │
    └────────────────┬────────────────────────────┘
                     │
                     ↓
    ┌─────────────────────────────────────────────┐
    │   🤖 AUTOMATIC GRADING                      │
    │                                             │
    │  Multiple Choice:                           │
    │    ✓ Instant - check correctAnswer         │
    │                                             │
    │  Numerical:                                 │
    │    ✓ Instant - check within tolerance      │
    │                                             │
    │  Open Response:                             │
    │    🤖 AI Grading via GPT-4                  │
    │    • Apply rubric criteria                  │
    │    • Check concepts                         │
    │    • Identify misconceptions                │
    │    • Generate feedback                      │
    │                                             │
    │  Essay/Vocabulary:                          │
    │    👨‍🏫 Manual or auto-grade                  │
    └────────────────┬────────────────────────────┘
                     │
                     ↓
    ┌─────────────────────────────────────────────┐
    │   📊 SUBMISSION STORED                      │
    │                                             │
    │  Key: physics-submissions                   │
    │  • Answers for each question                │
    │  • Score and feedback                       │
    │  • Rubric grades                            │
    │  • Status and timestamps                    │
    └─────────────────────────────────────────────┘
```

---

## 📊 Assignment Data Structure

### Complete Assignment Object

```javascript
{
  // Identity
  id: "assignment-1706200000000",
  
  // Metadata
  title: "Newton's Laws Quiz",
  description: "Test your understanding of the three laws",
  instructions: "Answer all questions. Show your work for calculations.",
  lesson_id: "lesson-uuid-here",              // Optional link
  
  // Content
  questions: [
    {
      id: "q1",
      type: "multiple-choice",
      question: "Which law states F=ma?",
      options: ["First", "Second", "Third", "Fourth"],
      correctAnswer: 1,                        // Index
      explanation: "Newton's Second Law...",
      points: 5
    },
    {
      id: "q2",
      type: "numerical",
      question: "Calculate acceleration...",
      correctValue: 5.0,
      tolerance: 0.1,
      unit: "m/s²",
      unitOptions: ["m/s²", "m/s", "m²/s", "s/m"],
      points: 10
    },
    {
      id: "q3",
      type: "open-response",
      question: "Explain Newton's Third Law...",
      rubric: [
        {
          id: "r1",
          name: "Understanding",
          description: "Concept clarity",
          maxPoints: 10,
          levels: [
            { score: 10, description: "Excellent" },
            { score: 5, description: "Partial" },
            { score: 0, description: "Missing" }
          ]
        }
      ],
      correctConcepts: ["action-reaction", "equal force", "opposite direction"],
      autoGrade: true,
      points: 20
    }
  ],
  
  // Settings
  total_points: 35,                           // Auto-calculated
  due_date: "2024-02-15T23:59:59Z",
  published: true,
  
  // Timestamps
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-20T15:30:00Z",
  
  // Relations (populated)
  lesson: {
    title: "Newton's Laws",
    slug: "newtons-laws"
  }
}
```

---

## 🎯 8 Question Types at a Glance

```
┌──────────────────────────────────────────────────────────────┐
│  1. MULTIPLE CHOICE                  [Auto-Grade: ✓]        │
│  • 4+ options                                                │
│  • Single correct answer                                     │
│  • Optional explanation                                      │
│  • AI can generate options                                   │
│  Points: Usually 5                                           │
├──────────────────────────────────────────────────────────────┤
│  2. NUMERICAL ANSWER                 [Auto-Grade: ✓]        │
│  • Number input                                              │
│  • Unit validation                                           │
│  • Tolerance for rounding                                    │
│  • Physics calculator can auto-fill                          │
│  Points: Usually 10                                          │
├──────────────────────────────────────────────────────────────┤
│  3. OPEN RESPONSE                    [AI-Grade: 🤖]         │
│  • Paragraph response                                        │
│  • Multi-criteria rubric                                     │
│  • AI identifies concepts                                    │
│  • AI provides feedback                                      │
│  Points: Usually 20                                          │
├──────────────────────────────────────────────────────────────┤
│  4. ESSAY                            [Manual/AI: 👨‍🏫/🤖]     │
│  • Long-form response                                        │
│  • Word count requirements                                   │
│  • Optional AI grading                                       │
│  Points: Usually 30                                          │
├──────────────────────────────────────────────────────────────┤
│  5. VOCABULARY MATCHING              [Auto-Grade: ✓]        │
│  • Drag-and-drop terms to definitions                        │
│  • Import from vocabulary sets                               │
│  Points: Usually 10                                          │
├──────────────────────────────────────────────────────────────┤
│  6. VOCABULARY CROSSWORD             [Auto-Grade: ✓]        │
│  • Auto-generated puzzle                                     │
│  • Definitions as clues                                      │
│  Points: Usually 15                                          │
├──────────────────────────────────────────────────────────────┤
│  7. VOCABULARY FILL-IN-THE-BLANK     [Auto-Grade: ✓]        │
│  • AI-generated contextual sentences                         │
│  • Word bank optional                                        │
│  Points: Usually 10                                          │
├──────────────────────────────────────────────────────────────┤
│  8. VOCABULARY HANGMAN               [Auto-Grade: ✓]        │
│  • Classic hangman game                                      │
│  • Physics terminology                                       │
│  • Definition hints optional                                 │
│  Points: Usually 10                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Assignment Builder Interface

### Teacher's Assignment Creation Flow

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ASSIGNMENT BUILDER                                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╔════════════════════════════════════════════════════════╗
║  STEP 1: Basic Information                             ║
╠════════════════════════════════════════════════════════╣
║  Title: ___________________________________________    ║
║  Description: _____________________________________    ║
║  Instructions: ____________________________________    ║
║  Related Lesson: [dropdown] ______________________    ║
║  Due Date: [📅 picker] ____________________________    ║
║  Published: [ ] Draft  [✓] Published               ║
╚════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════╗
║  STEP 2: Add Questions                                 ║
╠════════════════════════════════════════════════════════╣
║  [+ Add Question ▼]  [📚 Browse Question Bank]         ║
║    ├─ Multiple Choice                                  ║
║    ├─ Numerical Answer                                 ║
║    ├─ Open Response                                    ║
║    ├─ Essay                                            ║
║    ├─ Vocabulary Matching                              ║
║    ├─ Vocabulary Crossword                             ║
║    ├─ Vocabulary Fill Blank                            ║
║    └─ Vocabulary Hangman                               ║
╚════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════╗
║  QUESTION 1: Multiple Choice                 [🗑️] [⬆️] [⬇️] ║
╠════════════════════════════════════════════════════════╣
║  Question: ________________________________________    ║
║  [🤖 Generate Image] [💾 Add to Bank]                 ║
║                                                        ║
║  Option A: _______________________________________    ║
║  Option B: _______________________________________    ║
║  Option C: _______________________________________    ║
║  Option D: _______________________________________    ║
║  [+ Add Option]  [🪄 AI Generate Options]             ║
║                                                        ║
║  Correct Answer: (•) A  ( ) B  ( ) C  ( ) D          ║
║  Explanation: _____________________________________    ║
║  Points: [5 ▼]                                         ║
╚════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════╗
║  QUESTION 2: Numerical                        [🗑️] [⬆️] [⬇️] ║
╠════════════════════════════════════════════════════════╣
║  Question: ________________________________________    ║
║  [🧮 Auto-Calculate] [💾 Add to Bank]                 ║
║                                                        ║
║  Correct Value: [______] ± Tolerance: [0.1]           ║
║  Unit: [m/s² ▼]                                        ║
║  Unit Options: [✓] Show dropdown with:                ║
║    [✓] m/s²  [✓] m/s  [✓] m²/s  [✓] s/m             ║
║  Points: [10 ▼]                                        ║
╚════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════╗
║  QUESTION 3: Open Response                    [🗑️] [⬆️] [⬇️] ║
╠════════════════════════════════════════════════════════╣
║  Question: ________________________________________    ║
║  [✨ Generate Sample Answer] [💾 Add to Bank]         ║
║                                                        ║
║  Rubric:                                               ║
║  ┌────────────────────────────────────────────────┐  ║
║  │ Criterion 1: Understanding            Max: 10  │  ║
║  │ • 10 pts: Excellent                            │  ║
║  │ •  8 pts: Good                                 │  ║
║  │ •  5 pts: Basic                                │  ║
║  │ •  0 pts: Missing                              │  ║
║  └────────────────────────────────────────────────┘  ║
║  [+ Add Criterion]                                     ║
║                                                        ║
║  Key Concepts: [velocity, acceleration, force]        ║
║  Misconceptions: [confuses speed with velocity]       ║
║  Auto-Grade: [✓] Enable AI Grading                    ║
║  Min Length: [50] characters                           ║
║  Points: [20 ▼]                                        ║
╚════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════╗
║  SUMMARY                                               ║
╠════════════════════════════════════════════════════════╣
║  Total Questions: 3                                    ║
║  Total Points: 35                                      ║
║  Question Types:                                       ║
║    • 1 Multiple Choice                                 ║
║    • 1 Numerical                                       ║
║    • 1 Open Response                                   ║
║                                                        ║
║  [👁️ Preview]  [💾 Save Draft]  [✓ Save & Publish]    ║
╚════════════════════════════════════════════════════════╝
```

---

## 👨‍🎓 Student Assignment Interface

### Taking an Assignment

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  NEWTON'S LAWS QUIZ                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╔══════════════════════════════════════════════════╗
║  📊 PROGRESS                                     ║
╠══════════════════════════════════════════════════╣
║  Questions Answered: 2 / 3                       ║
║  Points Earned: 15 / 35                          ║
║  [████████░░░░░░░░░░] 66% Complete               ║
║  ⏱️ Time: 12:34                                   ║
╚══════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────┐
│  QUESTION 1 of 3                      [5 points] │
├──────────────────────────────────────────────────┤
│                                                  │
│  Which of Newton's laws states F = ma?           │
│                                                  │
│  [IMAGE: Force diagram if provided]              │
│                                                  │
│  ( ) First Law                                   │
│  (•) Second Law          ← Selected              │
│  ( ) Third Law                                   │
│  ( ) Law of Gravitation                          │
│                                                  │
│  ✓ Answered                                      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  QUESTION 2 of 3                     [10 points] │
├──────────────────────────────────────────────────┤
│                                                  │
│  A car accelerates from rest at 2.5 m/s² for    │
│  4 seconds. Calculate the final velocity.        │
│                                                  │
│  Answer: [10   ] Unit: [m/s² ▼]                  │
│                                                  │
│  ✓ Answered                                      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  QUESTION 3 of 3                     [20 points] │
├──────────────────────────────────────────────────┤
│                                                  │
│  Explain Newton's Third Law and give a real-     │
│  world example.                                  │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ For every action, there is an equal and   │ │
│  │ opposite reaction. When you push against   │ │
│  │ a wall, the wall pushes back with equal    │ │
│  │ force...                                   │ │
│  │                                            │ │
│  │ [Cursor here]                              │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Characters: 247 / 500                           │
│  Min: 50 characters                              │
│                                                  │
│  ⚠️ Not yet answered                             │
└──────────────────────────────────────────────────┘

[💾 Save Progress]  [✓ Submit Assignment]
```

---

## 🤖 AI Features Quick Reference

### 1. Generate Multiple Choice Options

```
Teacher enters question:
  "What is the unit of force?"

Click [🪄 AI Generate Options]
    ↓
GPT-4 generates:
  ✓ Newton (N)              [Correct]
  ✗ Joule (J)               [Energy unit - common mistake]
  ✗ Watt (W)                [Power unit]  
  ✗ Pascal (Pa)             [Pressure unit]

Plus explanations for each!
```

### 2. Auto-Calculate Numerical Answers

```
Teacher enters question:
  "A 5 kg object accelerates at 2 m/s². Find force."

Click [🧮 Auto-Calculate]
    ↓
Physics Calculator:
  • Recognizes F = ma
  • Extracts: m = 5 kg, a = 2 m/s²
  • Calculates: F = 5 × 2 = 10 N
  • Generates wrong units: J, W, kg

Auto-fills:
  Correct Value: 10
  Unit: N
  Unit Options: [N, J, W, kg]
```

### 3. Generate Physics Diagrams

```
Teacher enters question:
  "A block slides down a 30° incline..."

Click [🤖 Generate Image]
    ↓
DALL-E 3 creates:
  • Incline plane diagram
  • Block on surface
  • Angle labeled
  • Force vectors
  • Professional physics textbook style

Embedded in question!
```

### 4. AI Grading Workflow

```
Student submits:
  "Newton's Third Law states that forces are equal
   and opposite. Like when you jump, you push Earth
   down and it pushes you up."

AI Grading Process:
    ↓
GPT-4 evaluates:
  ✓ Concept: Action-reaction pairs
  ✓ Concept: Equal magnitude
  ✓ Concept: Opposite direction
  ✓ Example: Jumping (good!)
  ✗ Missing: Different objects affected
    ↓
Applies Rubric:
  • Understanding: 8/10 (good but incomplete)
  • Communication: 9/10 (clear and concise)
  • Examples: 10/10 (perfect!)
    ↓
Generates Feedback:
  "Great job! You correctly identified the key
   aspects of Newton's Third Law. To improve,
   mention that the forces act on DIFFERENT
   objects..."
    ↓
Final Score: 27/30 (90%)
```

---

## 💾 Storage Architecture

### LocalStorage Data Structure

```
localStorage
├─ physics-assignments
│  └─ Array<Assignment>
│     ├─ assignment-1706200000000
│     │  ├─ id, title, description
│     │  ├─ questions[] (no large images)
│     │  ├─ total_points, due_date
│     │  └─ published, timestamps
│     ├─ assignment-1706200001000
│     └─ assignment-1706200002000
│
└─ physics-submissions
   └─ Array<Submission>
      ├─ submission-1706201000000
      │  ├─ assignment_id, user_id
      │  ├─ answers{} (per question)
      │  ├─ score, max_score
      │  ├─ feedback{}, rubric_grades[]
      │  └─ status, timestamps
      ├─ submission-1706201001000
      └─ submission-1706201002000
```

### Storage Flow

```
Create Assignment
    ↓
Transform: stripLargeData()
  • Remove base64 images
  • Keep image URLs only
    ↓
JSON.stringify()
    ↓
Check quota
    ↓
If quota exceeded:
  • Clear old submissions
  • Strip more images
  • Warn user
    ↓
localStorage.setItem('physics-assignments', ...)
    ↓
Update React state
```

---

## 📂 File Structure Map

```
physics-classroom/
│
├── 📊 TYPES
│   └── src/types/
│       └── assignment.ts               ← All question type definitions
│
├── 🎛️ STATE MANAGEMENT
│   └── src/contexts/
│       └── AssignmentContext.tsx       ← CRUD operations, localStorage
│
├── 👨‍🏫 TEACHER UI
│   ├── src/app/admin/assignments/
│   │   ├── page.tsx                    ← Assignment list/management
│   │   └── create/
│   │       └── page.tsx                ← Assignment builder
│   └── src/components/assignment-builder/
│       ├── question-editor.tsx         ← Configure each question
│       ├── rubric-builder.tsx          ← Build grading rubrics
│       ├── VocabularyQuestionEditor.tsx ← Vocab question editor
│       └── scenario-image-generator.tsx ← AI image generation
│
├── 👨‍🎓 STUDENT UI
│   ├── src/app/assignments/
│   │   └── [id]/
│   │       └── page.tsx                ← Take assignment
│   └── src/components/assignment-taking/
│       ├── question-renderer.tsx       ← Render all question types
│       └── ProgressScoreboard.tsx      ← Track progress live
│
├── 🤖 AI & API
│   └── src/app/api/
│       ├── grade-assignment/
│       │   └── route.ts                ← Batch AI grading
│       ├── grade-open-response/
│       │   └── route.ts                ← Single question AI grade
│       ├── generate-mc-options/
│       │   └── route.ts                ← AI option generation
│       ├── generate-answer/
│       │   └── route.ts                ← AI sample answers
│       ├── generate-scenario-image/
│       │   └── route.ts                ← DALL-E diagram generation
│       ├── generate-vocab-sentences/
│       │   └── route.ts                ← AI vocab sentences
│       └── assignment-submissions/
│           └── route.ts                ← Submission CRUD
│
└── 🛠️ UTILITIES
    └── src/utils/
        ├── physics-calculator.ts       ← Auto-calculate answers
        └── storage-utils.ts            ← LocalStorage helpers
```

---

## 🎮 Question Type Quick Setup

### Multiple Choice - 30 seconds

```
1. Select "Multiple Choice" from dropdown
2. Type question
3. Click "Generate Options" (or type manually)
4. Select correct answer
5. Add explanation (optional)
6. Done! ✓
```

### Numerical - 45 seconds

```
1. Select "Numerical Answer"
2. Type question
3. Click "Auto-Calculate" (or type manually)
4. Adjust tolerance if needed
5. Unit dropdown auto-populated
6. Done! ✓
```

### Open Response - 2 minutes

```
1. Select "Open Response"
2. Type question
3. Build rubric (or use default)
4. Add key concepts
5. Add common misconceptions
6. Click "Generate Sample Answer"
7. Enable auto-grade toggle
8. Set min/max length
9. Done! ✓
```

### Vocabulary - 1 minute

```
1. Select vocabulary type
2. Click "Browse Vocabulary Sets"
3. Select a set (or add custom terms)
4. For fill-blank: Click "Generate Sentences"
5. Adjust settings (grid size, word bank, etc.)
6. Done! ✓
```

---

## 🚀 Common Tasks Cheat Sheet

### For Teachers

| Task | Steps |
|------|-------|
| Create assignment | Admin → Assignments → Create → Fill form → Publish |
| Import from question bank | Create assignment → Browse Question Bank → Select → Add |
| Use AI to generate | Question Editor → 🪄 buttons (options, image, answer) |
| Preview assignment | Assignment Builder → 👁️ Preview button |
| Delete assignment | Admin → Assignments → 🗑️ Delete |
| Edit assignment | Currently not supported - would need to recreate |

### For Students

| Task | Steps |
|------|-------|
| View assignments | Dashboard → Assignments section |
| Start assignment | Click assignment → Begin answering |
| Save progress | Answers auto-save OR click 💾 Save Progress |
| Submit assignment | Answer all required → ✓ Submit |
| View results | After submission → See score and feedback |

### For Developers

| Task | File to Edit |
|------|--------------|
| Add question type | `src/types/assignment.ts` + `question-editor.tsx` + `question-renderer.tsx` |
| Modify AI grading | `src/app/api/grade-open-response/route.ts` |
| Change storage | `src/contexts/AssignmentContext.tsx` (switch to Supabase) |
| Adjust point defaults | `src/app/admin/assignments/create/page.tsx` (addQuestion function) |
| Customize rubric | `src/components/assignment-builder/rubric-builder.tsx` |
| Add AI feature | Create new API route + add button to question-editor |

---

## 🔍 Troubleshooting Flowchart

```
Problem: Assignment not showing
    ↓
Is assignment.published = true?
  ├─ No → Publish it
  └─ Yes → Is user logged in?
        ├─ No → Sign in
        └─ Yes → Check localStorage
                  ├─ Empty → Assignment lost (create new)
                  └─ Has data → Browser issue (clear cache)

Problem: AI grading fails
    ↓
Check OpenAI API key
  ├─ Missing → Add to .env.local
  └─ Present → Check API quota/billing
                  ├─ Exceeded → Add credits
                  └─ OK → Check network
                            ├─ Offline → Wait for connection
                            └─ Online → Check console errors

Problem: Can't save (quota exceeded)
    ↓
Clear space:
  1. Delete old submissions
  2. Remove unused assignments
  3. Strip scenario images
  4. Consider switching to database storage

Problem: Math not rendering
    ↓
Check syntax:
  ├─ Inline: Use \( ... \) not $ ... $
  ├─ Display: Use \[ ... \] not $$ ... $$
  └─ Escaping: Use \\ not \ in code
```

---

## 💡 Pro Tips

### Assignment Creation

1. **Start with objectives** - Know what you're assessing before building
2. **Mix question types** - Variety keeps students engaged
3. **Use AI smartly** - Review all AI-generated content
4. **Test yourself** - Take your own assignment before publishing
5. **Clear instructions** - Students should never be confused about what to do

### Question Design

1. **One concept per question** - Don't mix multiple topics
2. **Appropriate difficulty** - Match to student level
3. **Clear wording** - No trick questions or ambiguity
4. **Fair distractors** - MC options should be plausible but distinct
5. **Rubrics for open-ended** - Clear criteria = better grading

### AI Features

1. **Always review** - AI can make mistakes
2. **Customize prompts** - Generic prompts = generic results
3. **Provide context** - Tell AI your students' level
4. **Sample answers** - Improves AI grading accuracy
5. **Check concepts** - Define key concepts for AI to look for

### Performance

1. **Limit images** - Use URLs, not base64 when possible
2. **Monitor storage** - Keep an eye on localStorage quota
3. **Clean old data** - Remove old submissions periodically
4. **Batch operations** - Grade multiple questions together
5. **Cache results** - Don't re-grade unchanged answers

---

## 📈 Future Roadmap Ideas

```
✓ Implemented:
  • 8 question types
  • AI grading
  • Question bank integration
  • Auto-save
  • Progress tracking

🚧 In Progress:
  • Database migration
  • Assignment analytics
  • Better mobile experience

💭 Planned:
  • Assignment templates
  • Question pools (random selection)
  • Time limits per assignment
  • Hints system
  • Video question responses
  • Drawing tools for diagrams
  • Peer grading
  • Grade analytics dashboard
  • Assignment versioning
  • Student notes on questions
```

---

## 📞 Need More Help?

- **Full Documentation**: See `ASSIGNMENTS_SYSTEM_GUIDE.md`
- **Type Definitions**: Check `src/types/assignment.ts`
- **Context API**: Review `src/contexts/AssignmentContext.tsx`
- **Question Editor**: Look at `src/components/assignment-builder/question-editor.tsx`
- **AI Integration**: Check API routes in `src/app/api/`

---

**Last Updated:** January 2025
**Version:** 1.0

