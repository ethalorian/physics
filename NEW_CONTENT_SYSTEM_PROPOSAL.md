# New Content System Architecture - Proposal

## 🎯 Your Vision

**OLD (Current):**
- Lessons = Markdown content (upload text files)
- Simulations = Separate interactive activities
- Video Lessons = EdPuzzle-style with questions
- Assignments = Separate system linking to lessons

**NEW (Proposed):**
- **Two types of lessons ONLY:**
  1. **Video Lessons** (keep as-is - they work great!)
  2. **Simulation Lessons** (simulations ARE lessons with embedded questions)
- **No more markdown uploads**
- **Unified assignment system** for both types

---

## 🏗️ New Architecture

### Content Types (Simplified)

```
PHYSICS CLASSROOM CONTENT
├── 📹 VIDEO LESSONS
│   ├── YouTube video with EdPuzzle-style pausing
│   ├── Interactive questions at timestamps
│   ├── Auto-grading for MC/numerical
│   └── Progress tracking
│
└── 🔬 SIMULATION LESSONS
    ├── Interactive physics simulation
    ├── Embedded questions (before/during/after)
    ├── Real-time data collection
    ├── Auto-grading + manual grading
    └── Progress tracking
```

**NO MORE:**
- ❌ Markdown content lessons
- ❌ Separate text-based lessons
- ❌ Uploading lesson files

---

## 📊 Database Changes

### Current `lessons` Table

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT,
  content TEXT,              -- ❌ Remove this (markdown)
  video_url TEXT,            -- ✅ Keep for video lessons
  video_questions JSONB,     -- ✅ Keep for video lessons
  objectives TEXT[],
  ...
);
```

### New `lessons` Table (Proposed)

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Lesson type (simplified)
  lesson_type TEXT CHECK (lesson_type IN ('video', 'simulation')) NOT NULL,
  
  -- For VIDEO lessons
  video_url TEXT,                    -- YouTube URL
  video_questions JSONB DEFAULT '[]', -- EdPuzzle-style questions
  
  -- For SIMULATION lessons
  simulation_id UUID REFERENCES simulations(id), -- Links to simulation
  embedded_questions JSONB DEFAULT '[]',         -- Questions to show
  question_timing TEXT DEFAULT 'after',          -- 'before', 'during', 'after'
  
  -- Common fields
  unit_id TEXT NOT NULL,
  objectives TEXT[],
  prerequisites TEXT[],
  difficulty TEXT,
  estimated_time INTEGER,
  order_index INTEGER,
  published BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
```

**Key Changes:**
- ✅ Added `lesson_type` field ('video' or 'simulation')
- ✅ Added `simulation_id` to link to simulations table
- ✅ Added `embedded_questions` for simulation questions
- ✅ Added `question_timing` (when to show questions)
- ❌ Removed `content` field (no more markdown)

---

## 🔄 How It Works

### Creating a Video Lesson

**Teacher workflow (stays the same):**
1. Go to Admin → Lessons
2. Click "Create Lesson" → Choose "Video Lesson"
3. Enter YouTube URL
4. Add questions at specific timestamps
5. Publish

**Student experience (stays the same):**
1. Open lesson
2. Video plays
3. Auto-pauses at question timestamps
4. Answer to continue
5. Complete lesson

### Creating a Simulation Lesson (NEW!)

**Teacher workflow:**
1. Go to Admin → Lessons
2. Click "Create Lesson" → Choose **"Simulation Lesson"**
3. **Select simulation** from dropdown:
   ```
   Choose Simulation:
   [Select ▼]
    ├─ Race Track: Distance vs Displacement
    ├─ Monkey Hunter: Projectile Motion
    ├─ Atwood Machine: Forces & Equilibrium
    ├─ Car Race: Relative Motion
    └─ ... (all your simulations)
   ```

4. **Add embedded questions** (from question bank or create new):
   ```
   Embedded Questions:
   
   [+ Add Question from Bank] [+ Create New Question]
   
   Question 1 (before simulation):
   - "Predict what will happen when..."
   - Type: Open Response
   - Timing: Show before simulation
   
   Question 2 (after simulation):
   - "Calculate the acceleration using a = g(m1-m2)/(m1+m2)"
   - Type: Numerical
   - Timing: Show after completion
   
   Question 3 (data analysis):
   - "Export your data and graph position vs time..."
   - Type: Open Response
   - Timing: Show after completion
   ```

5. **Set question timing:**
   - `Before`: Questions block access to simulation until answered
   - `After`: Simulation first, then questions appear
   - `Mixed`: Some before, some after

6. **Publish lesson**

**Student experience:**
1. Open lesson (e.g., "Lesson 2-3: Newton's Second Law")
2. See lesson intro with objectives
3. **If "before" questions**: Answer prediction questions first
4. **Access simulation**: Complete the interactive activity
5. **If "after" questions**: Questions appear in modal
6. Submit answers
7. Lesson marked complete

---

## 🎓 Student View Comparison

### OLD: Markdown Lesson

```
┌─────────────────────────────────────┐
│ Lesson 1-1: Introduction to Motion │
├─────────────────────────────────────┤
│ [Lots of text content]              │
│ [Math equations]                    │
│ [Static diagrams]                   │
│ [More text]                         │
│                                     │
│ 😴 Students get bored reading       │
└─────────────────────────────────────┘
```

### NEW: Simulation Lesson

```
┌─────────────────────────────────────┐
│ Lesson 1-1: Distance vs Displacement│
├─────────────────────────────────────┤
│ 🎯 Learning Objectives:             │
│ • Distinguish distance from displace│
│ • Understand scalar vs vector       │
│                                     │
│ 📝 Pre-Lab Questions (2)            │
│ [Answer before accessing sim]       │
│                                     │
│ ──────────────────────────           │
│                                     │
│ 🔬 INTERACTIVE SIMULATION           │
│ [Race Track simulation loads]       │
│ [Student explores, collects data]   │
│                                     │
│ ──────────────────────────           │
│                                     │
│ 📊 Analysis Questions (3)           │
│ [Based on simulation experience]    │
│                                     │
│ ✅ Submit Lesson                    │
│                                     │
│ 🎉 Students stay engaged!           │
└─────────────────────────────────────┘
```

---

## 💡 Benefits of New System

### For Teachers

✅ **Simpler workflow**: No markdown to write/upload  
✅ **Better engagement**: All lessons are interactive  
✅ **Reuse questions**: Pull from question bank  
✅ **Consistent interface**: All lessons work the same way  
✅ **Less prep time**: Simulations already have content  
✅ **Better data**: Track student interactions in sims  

### For Students

✅ **More engaging**: Interactive instead of reading  
✅ **Hands-on learning**: Explore concepts directly  
✅ **Immediate feedback**: See results in real-time  
✅ **Better retention**: Active learning beats passive reading  
✅ **Clearer structure**: Know what to expect  

### For System

✅ **Cleaner codebase**: Remove markdown rendering complexity  
✅ **Unified tracking**: One system for all content  
✅ **Better analytics**: Simulation interactions are rich data  
✅ **Easier maintenance**: Fewer content types  

---

## 🔧 Implementation Plan

### Phase 1: Extend Lessons Table (1 hour)

**Migration file:** `add_simulation_lessons_support.sql`

```sql
-- Add new fields to lessons table
ALTER TABLE lessons 
  ADD COLUMN IF NOT EXISTS lesson_type TEXT 
    CHECK (lesson_type IN ('video', 'simulation')) 
    DEFAULT 'video';

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS simulation_id UUID 
    REFERENCES simulations(id) ON DELETE SET NULL;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS embedded_questions JSONB 
    DEFAULT '[]';

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS question_timing TEXT 
    DEFAULT 'after'
    CHECK (question_timing IN ('before', 'after', 'mixed'));

-- Mark existing markdown lessons as deprecated
UPDATE lessons 
SET lesson_type = 'video' 
WHERE content IS NOT NULL AND video_url IS NULL;

-- Mark video lessons
UPDATE lessons 
SET lesson_type = 'video' 
WHERE video_url IS NOT NULL;
```

### Phase 2: Create Simulation Lessons (1 hour)

**For each of your new simulations, create a lesson:**

```sql
-- Example: Race Track becomes Lesson 1-1
INSERT INTO lessons (
  slug,
  title,
  description,
  lesson_type,
  simulation_id,
  unit_id,
  objectives,
  difficulty,
  estimated_time,
  order_index,
  published
) VALUES (
  'lesson-1-1-distance-displacement',
  'Distance vs. Displacement',
  'Explore the difference between distance and displacement using an interactive race track',
  'simulation',  -- ← Simulation lesson!
  (SELECT id FROM simulations WHERE slug = 'race-track'),
  'unit-1',
  ARRAY[
    'Distinguish between distance and displacement',
    'Understand scalar vs vector quantities',
    'Calculate both for curved paths'
  ],
  'beginner',
  20,
  1,
  TRUE
);
```

### Phase 3: Update Lesson Viewer Component (2 hours)

**File:** `src/components/lessons/StudentLessonViewer.tsx`

**Add conditional rendering based on lesson type:**

```typescript
export default function StudentLessonViewer({ lesson }: Props) {
  // Check lesson type
  if (lesson.lesson_type === 'video') {
    return <VideoLessonView lesson={lesson} />
  }
  
  if (lesson.lesson_type === 'simulation') {
    return <SimulationLessonView lesson={lesson} />
  }
  
  // Fallback for old markdown lessons (deprecated)
  return <LegacyMarkdownView lesson={lesson} />
}
```

### Phase 4: Create SimulationLessonView Component (3 hours)

**New component:** `src/components/lessons/SimulationLessonView.tsx`

```typescript
export function SimulationLessonView({ lesson }: { lesson: Lesson }) {
  const [preQuestionsAnswered, setPreQuestionsAnswered] = useState(false)
  const [postQuestions, setPostQuestions] = useState<Question[]>([])
  const [simulationCompleted, setSimulationCompleted] = useState(false)
  
  // Load simulation component dynamically
  const SimulationComponent = loadSimulation(lesson.simulation_id)
  
  // Filter questions by timing
  const beforeQuestions = lesson.embedded_questions.filter(q => q.timing === 'before')
  const afterQuestions = lesson.embedded_questions.filter(q => q.timing === 'after')
  
  return (
    <div>
      {/* Lesson Header */}
      <LessonHeader 
        title={lesson.title}
        objectives={lesson.objectives}
        estimatedTime={lesson.estimated_time}
      />
      
      {/* Pre-Simulation Questions */}
      {!preQuestionsAnswered && beforeQuestions.length > 0 && (
        <QuestionBlock 
          questions={beforeQuestions}
          onComplete={() => setPreQuestionsAnswered(true)}
          title="Answer these questions before starting the simulation"
        />
      )}
      
      {/* Simulation */}
      {(preQuestionsAnswered || beforeQuestions.length === 0) && (
        <SimulationComponent
          onComplete={(data) => {
            setSimulationCompleted(true)
            setPostQuestions(afterQuestions)
          }}
        />
      )}
      
      {/* Post-Simulation Questions */}
      {simulationCompleted && afterQuestions.length > 0 && (
        <QuestionBlock 
          questions={afterQuestions}
          onComplete={() => {
            // Mark lesson as complete
            completelesson(lesson.id)
          }}
          title="Analyze your simulation results"
        />
      )}
    </div>
  )
}
```

### Phase 5: Admin Interface Updates (2 hours)

**Update lesson creation form** to support simulation lessons:

```typescript
// In lesson creation modal
<Select value={lessonType} onValueChange={setLessonType}>
  <SelectItem value="video">📹 Video Lesson</SelectItem>
  <SelectItem value="simulation">🔬 Simulation Lesson</SelectItem>
</Select>

{lessonType === 'simulation' && (
  <>
    {/* Simulation Selector */}
    <Select value={simulationId} onValueChange={setSimulationId}>
      <SelectItem value="race-track">Race Track: Distance vs Displacement</SelectItem>
      <SelectItem value="monkey-hunter">Monkey Hunter: Projectile Motion</SelectItem>
      <SelectItem value="atwood-machine">Atwood Machine: Forces & Equilibrium</SelectItem>
      {/* ... all simulations */}
    </Select>
    
    {/* Question Manager */}
    <QuestionEmbedManager 
      questions={embeddedQuestions}
      onAddFromBank={() => openQuestionBank()}
      onCreateNew={() => openQuestionEditor()}
      onSetTiming={(qId, timing) => updateQuestionTiming(qId, timing)}
    />
  </>
)}
```

---

## 📚 Lesson Organization

### Unit 1: Kinematics

**Before (with markdown):**
```
Lesson 1-1: Introduction to Motion [TEXT]
Lesson 1-2: Velocity [TEXT + VIDEO]
Lesson 1-3: Acceleration [TEXT]
Lesson 1-4: Graphs [TEXT]
```

**After (simulations as lessons):**
```
Lesson 1-1: Distance vs. Displacement [SIMULATION: Race Track]
Lesson 1-2: Vector Addition [SIMULATION: Maze Navigator]
Lesson 1-3: Relative Motion [SIMULATION: Car Race]  
Lesson 1-4: Projectile Motion [SIMULATION: Monkey Hunter]
Lesson 1-5: Kinematics Review [VIDEO with questions]
```

### Unit 2: Forces

**After:**
```
Lesson 2-1: Gravity & Air Resistance [SIMULATION: Vacuum Chamber]
Lesson 2-2: Newton's 1st & 2nd Laws [SIMULATION: Astronaut Thrust]
Lesson 2-3: Newton's 3rd Law [SIMULATION: Carts & Springs]
Lesson 2-4: Equilibrium & Tension [SIMULATION: Atwood Machine]
Lesson 2-5: Forces Review [VIDEO with questions]
```

---

## 🎯 Question Bank Integration

### How Teachers Add Questions to Simulation Lessons

**Option A: Browse Question Bank**

```
┌────────────────────────────────────────┐
│ Add Questions from Question Bank      │
├────────────────────────────────────────┤
│ Filter: [Unit 1 ▼] [Kinematics ▼]    │
│                                        │
│ ☐ Calculate velocity from slope (5pts)│
│ ☐ What is displacement? (MC, 3pts)    │
│ ☐ Explain scalar vs vector (10pts)    │
│ ☑ Predict race outcome (8pts)         │
│                                        │
│ [Add Selected Questions (1)]           │
└────────────────────────────────────────┘
```

**Option B: Create New Question**

```
┌────────────────────────────────────────┐
│ Create New Question                    │
├────────────────────────────────────────┤
│ Type: [Numerical ▼]                    │
│                                        │
│ Question:                              │
│ [After running the race simulation    │
│  for one complete lap, what was the   │
│  displacement? Use your data.]         │
│                                        │
│ Correct Value: [0]                     │
│ Tolerance: [0.5]                       │
│ Unit: [meters]                         │
│                                        │
│ Timing: ○ Before  ● After  ○ During   │
│                                        │
│ [Save & Add to Lesson]                 │
└────────────────────────────────────────┘
```

**Option C: AI Generate Questions**

```
┌────────────────────────────────────────┐
│ AI Question Generator                  │
├────────────────────────────────────────┤
│ Based on: Race Track Simulation        │
│                                        │
│ Generate questions about:              │
│ ☑ Concept understanding               │
│ ☑ Calculations from data              │
│ ☑ Graph interpretation                │
│ ☐ Real-world applications             │
│                                        │
│ Difficulty: [Mixed ▼]                 │
│ Number of questions: [5]               │
│                                        │
│ [Generate Questions with AI]           │
└────────────────────────────────────────┘
```

---

## 🎮 Student Experience

### Viewing a Simulation Lesson

**URL:** `/lessons/lesson-1-1-distance-displacement`

**Page Layout:**

```
┌──────────────────────────────────────────────┐
│ 📍 Unit 1: Kinematics                        │
│ Lesson 1-1: Distance vs. Displacement        │
│ 🔬 Interactive Simulation | ⏱️ 20 minutes    │
├──────────────────────────────────────────────┤
│                                              │
│ 🎯 Learning Objectives:                     │
│ • Distinguish between distance and displace  │
│ • Understand scalar vs vector quantities     │
│ • Calculate both for curved paths            │
│                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                              │
│ 📝 Pre-Lab Questions (2 questions)          │
│                                              │
│ Question 1: Predict...                       │
│ [Answer field]                               │
│                                              │
│ Question 2: What do you think will...       │
│ [Answer field]                               │
│                                              │
│ [UNLOCK SIMULATION →]                        │
│                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                              │
│ 🔬 RACE TRACK SIMULATION                    │
│ [Full simulation embedded here]              │
│ [Student interacts, explores, collects data] │
│                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                              │
│ 📊 Analysis Questions (3 questions)         │
│ [Appears after completing simulation]        │
│                                              │
│ Question 3: From your data, what was...     │
│ [Answer field]                               │
│                                              │
│ Question 4: Calculate...                     │
│ [Numerical input]                            │
│                                              │
│ Question 5: Explain the difference...       │
│ [Text area]                                  │
│                                              │
│ [SUBMIT LESSON →]                            │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🔄 Migration Strategy

### Step 1: Database Migration (Safe, Non-Breaking)

```sql
-- Add new columns (doesn't affect existing system)
ALTER TABLE lessons ADD COLUMN lesson_type TEXT DEFAULT 'video';
ALTER TABLE lessons ADD COLUMN simulation_id UUID;
ALTER TABLE lessons ADD COLUMN embedded_questions JSONB DEFAULT '[]';
ALTER TABLE lessons ADD COLUMN question_timing TEXT DEFAULT 'after';

-- Add constraint
ALTER TABLE lessons ADD CONSTRAINT fk_simulation
  FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE SET NULL;
```

**This doesn't break anything!** Existing lessons continue to work.

### Step 2: Create Simulation Lessons (Parallel)

**Create new lessons** that reference your simulations:

```sql
-- Link Race Track simulation to a lesson
INSERT INTO lessons (
  slug, title, lesson_type, simulation_id, unit_id, ...
) VALUES (
  'lesson-1-1', 'Distance vs Displacement', 'simulation',
  (SELECT id FROM simulations WHERE slug = 'race-track'),
  'unit-1', ...
);
```

**Now you have BOTH** old and new lessons working simultaneously!

### Step 3: Update UI Components (Gradual)

1. **Update StudentLessonViewer** to handle both types
2. **Create SimulationLessonView** component
3. **Add lesson type selector** to admin interface
4. **Test with one lesson**
5. **Rollout to all lessons**

### Step 4: Deprecate Markdown (When Ready)

**Only after testing:**

```sql
-- Make content field nullable (it's deprecated)
ALTER TABLE lessons ALTER COLUMN content DROP NOT NULL;

-- Eventually, you can remove it entirely:
-- ALTER TABLE lessons DROP COLUMN content;
```

---

## 📋 Embedded Questions Structure

### Question Object (JSONB)

```typescript
interface EmbeddedQuestion {
  id: string
  timing: 'before' | 'after'  // When to show
  order: number                // Display order
  
  // The actual question (from question bank or custom)
  question: {
    type: 'multiple-choice' | 'numerical' | 'open-response'
    question: string
    points: number
    // ... question-specific fields
  }
  
  // Simulation-specific context
  requires_simulation_data?: boolean
  references_specific_trial?: boolean
}
```

### Example in Database

```json
{
  "embedded_questions": [
    {
      "id": "q1",
      "timing": "before",
      "order": 1,
      "question": {
        "type": "open-response",
        "question": "Predict: After one complete lap around the track, what will be the displacement? Explain your reasoning.",
        "points": 5
      }
    },
    {
      "id": "q2",
      "timing": "after",
      "order": 2,
      "requires_simulation_data": true,
      "question": {
        "type": "numerical",
        "question": "From your simulation data, what was the actual displacement after one lap?",
        "correctValue": 0,
        "tolerance": 0.5,
        "unit": "meters",
        "points": 5
      }
    }
  ]
}
```

---

## 🎨 UI Mock-ups

### Lesson List (Students)

```
┌──────────────────────────────────────────┐
│ Unit 1: Kinematics                       │
├──────────────────────────────────────────┤
│                                          │
│ ✅ Lesson 1-1: Distance vs Displacement │
│    🔬 Interactive Simulation | 20 min    │
│    Completed Oct 10 | Score: 45/50      │
│                                          │
│ ▶️  Lesson 1-2: Vector Addition         │
│    🔬 Interactive Simulation | 15 min    │
│    Not Started                           │
│    [START LESSON →]                      │
│                                          │
│ 🔒 Lesson 1-3: Relative Motion          │
│    🔬 Interactive Simulation | 25 min    │
│    Complete Lesson 1-2 to unlock         │
│                                          │
│ ✅ Lesson 1-4: Velocity Review          │
│    📹 Video Lesson | 12 min              │
│    Completed Oct 12 | Score: 18/20      │
│                                          │
└──────────────────────────────────────────┘
```

### Lesson Creation (Teachers)

```
┌──────────────────────────────────────────┐
│ Create New Lesson                        │
├──────────────────────────────────────────┤
│                                          │
│ Lesson Type:                             │
│ ○ 📹 Video Lesson (EdPuzzle-style)      │
│ ● 🔬 Simulation Lesson                  │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ Basic Information:                       │
│ Title: [Atwood Machine Lab]             │
│ Unit: [Unit 2: Forces ▼]                │
│ Order: [4]                               │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ Select Simulation:                       │
│ [Atwood Machine ▼]                      │
│ Preview: Forces & Equilibrium            │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ Embedded Questions (5):                  │
│                                          │
│ Before Simulation (2):                   │
│ 1. Predict acceleration [Open Response]  │
│ 2. Calculate tension [Numerical]         │
│                                          │
│ After Simulation (3):                    │
│ 3. Compare prediction [Open Response]    │
│ 4. Analyze graph [Multiple Choice]       │
│ 5. Calculate error [Numerical]           │
│                                          │
│ [+ Add from Question Bank]               │
│ [+ Create New Question]                  │
│ [🤖 Generate with AI]                   │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ [Save Lesson] [Cancel]                   │
│                                          │
└──────────────────────────────────────────┘
```

---

## ✅ Advantages Summary

### What You Gain

1. **Unified System**: All lessons are either videos or simulations
2. **No File Uploads**: Everything in database
3. **Reusable Questions**: Question bank integration
4. **Better Engagement**: All lessons are interactive
5. **Rich Data**: Track everything students do
6. **Easier Management**: One interface for all content
7. **Flexible Questioning**: Before, after, or mixed
8. **AI Integration**: Generate questions automatically

### What You Keep

✅ Video lessons with EdPuzzle-style questions (they work great!)  
✅ Assignment hub workflow  
✅ Progress tracking  
✅ Auto-grading systems  
✅ All existing simulations  

### What You Lose

❌ Markdown content lessons (replaced by simulations)  
❌ Static text-based learning (good riddance!)  

---

## 🚀 Quick Win: Your 9 Simulations Become 9 Lessons!

**You already have the content!** Just create lesson records:

```sql
-- Lesson 1-1
INSERT INTO lessons (slug, title, lesson_type, simulation_id, unit_id, order_index, published)
VALUES ('lesson-1-1', 'Distance vs Displacement', 'simulation', 
        (SELECT id FROM simulations WHERE slug = 'race-track'), 'unit-1', 1, TRUE);

-- Lesson 1-2
INSERT INTO lessons (slug, title, lesson_type, simulation_id, unit_id, order_index, published)
VALUES ('lesson-1-2', 'Vector Addition', 'simulation',
        (SELECT id FROM simulations WHERE slug = 'maze-vectors'), 'unit-1', 2, TRUE);

-- ... repeat for all 9 simulations
```

**Instant lesson library!** 🎉

---

## 📝 Recommendation

### I Suggest:

**DO THIS NOW (Easy wins):**

1. ✅ Run database migration to add new fields
2. ✅ Create simulation lesson records for your 9 simulations
3. ✅ Keep video lessons as-is (they work!)
4. ✅ Test with one simulation lesson

**DO LATER (When ready):**

1. Update UI components for lesson type switching
2. Build question embed interface
3. Migrate old markdown lessons (or just deprecate them)
4. Polish and refine

**DON'T DO:**

- ❌ Don't delete anything yet
- ❌ Don't break existing video lessons
- ❌ Don't rush the UI updates

---

## 🎯 Next Steps

### Want me to:

1. **Create the database migration** to add new fields?
2. **Write SQL to convert your 9 simulations into lessons**?
3. **Create the SimulationLessonView component**?
4. **Update the lesson creation interface**?
5. **All of the above**?

Let me know and I'll implement the new architecture! This is a significant improvement that will make your content system much cleaner and more engaging! 🚀

---

**Bottom Line:** Your simulations become your lessons, with questions embedded at strategic points. Video lessons stay for review/theory. No more markdown uploads. Cleaner, more interactive, better for students!

