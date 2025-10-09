# Simulation Assignment Integration Plan

## Vision
Transform simulations into assignable lessons with standards-based assessment, integrated into the existing assignment system.

## Current State vs. Target State

### Current State ❌
- Simulations are standalone activities
- AI hints for students during simulation
- No formal assessment/grading
- Not integrated with assignment system
- Teachers can't assign simulations
- No standards-based rubrics

### Target State ✅
- Simulations are assignable lessons
- NO AI help during simulation (students work independently)
- AI helps TEACHERS create questions/assessments
- Standards-based rubric: A, B, C, Fail
- Full integration with existing assignment/lesson system
- Teachers assign, students complete, automatic grading

---

## Phase 1: Standards-Based Rubric System

### Rubric Structure
```typescript
interface SimulationRubric {
  simulation_id: string
  levels: {
    A: { // Advanced/Exceeds Standards
      min_score: 85
      criteria: string[]
      description: string
    }
    B: { // Proficient/Meets Standards
      min_score: 70
      criteria: string[]
      description: string
    }
    C: { // Basic/Approaching Standards
      min_score: 50
      criteria: string[]
      description: string
    }
    Fail: { // Below Standards
      max_score: 49
      criteria: string[]
      description: string
    }
  }
  assessment_criteria: {
    data_collection: number    // Points for data collection (e.g., 25)
    analysis: number           // Points for analysis (e.g., 25)
    calculations: number       // Points for calculations (e.g., 25)
    understanding: number      // Points for concept questions (e.g., 25)
  }
}
```

### Database Table
```sql
CREATE TABLE simulation_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id),
  level_a_min INTEGER DEFAULT 85,
  level_b_min INTEGER DEFAULT 70,
  level_c_min INTEGER DEFAULT 50,
  criteria JSONB NOT NULL, -- Detailed criteria for each level
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 2: Simulation Assignment Type

### New Assignment Type
Extend existing assignment system to include "simulation" type assignments:

```typescript
interface SimulationAssignment extends Assignment {
  type: 'simulation'  // New type alongside 'homework', 'quiz', etc.
  simulation_id: string
  simulation_slug: string
  
  // Questions to accompany the simulation
  questions: Question[]  // Uses existing Question types
  
  // Rubric for grading
  rubric_id: string
  
  // Submission requirements
  requires_data_export: boolean
  requires_screenshots: boolean
  min_time_spent: number // minutes
}
```

### Database Schema
```sql
-- Extend existing assignments table or create simulation_assignments
ALTER TABLE assignments ADD COLUMN simulation_id UUID REFERENCES simulations(id);
ALTER TABLE assignments ADD COLUMN rubric_id UUID REFERENCES simulation_rubrics(id);
ALTER TABLE assignments ADD COLUMN requires_data_export BOOLEAN DEFAULT FALSE;
```

---

## Phase 3: Teacher AI Assistant for Question Generation

### AI Question Generator
Teachers can generate questions based on simulation content:

```typescript
interface QuestionGeneratorRequest {
  simulation_id: string
  simulation_context: {
    title: string
    objectives: string[]
    key_concepts: string[]
  }
  question_types: ('multiple-choice' | 'numerical' | 'open-response')[]
  difficulty: 'easy' | 'medium' | 'hard'
  num_questions: number
}
```

### Teacher UI Flow
1. Teacher selects simulation from list
2. Clicks "Create Assignment from Simulation"
3. AI generates suggested questions based on simulation objectives
4. Teacher reviews, edits, and approves questions
5. Teacher sets due date and assigns to students
6. Assignment appears in student dashboard

### API Endpoint
```typescript
// POST /api/simulations/generate-questions
{
  simulation_id: "uuid",
  question_types: ["multiple-choice", "numerical"],
  num_questions: 5,
  difficulty: "medium"
}

// Response: Array of generated questions
```

---

## Phase 4: Student Workflow Integration

### Student Experience
1. **Assignment appears in dashboard**
   - Shows up in existing assignment list
   - Labeled as "Simulation Lab"
   - Shows due date, estimated time

2. **Complete simulation**
   - Click to open simulation
   - Complete activities (data collection, experiments)
   - Export data if required
   - Simulation tracks time spent and interactions

3. **Answer questions**
   - After completing simulation, answer assessment questions
   - Questions reference simulation experience
   - Can include uploaded data/screenshots

4. **Submit assignment**
   - Automatic grading for MC and numerical
   - Rubric-based scoring for overall performance
   - Receives letter grade (A, B, C, Fail)

### Progress Tracking
```typescript
interface SimulationSubmission {
  assignment_id: string
  student_id: string
  
  // Simulation completion
  simulation_completed: boolean
  time_spent: number
  interactions_count: number
  data_exported: boolean
  
  // Question responses
  question_responses: QuestionResponse[]
  
  // Grading
  questions_score: number  // Out of 100
  overall_score: number    // Out of 100
  letter_grade: 'A' | 'B' | 'C' | 'Fail'
  rubric_feedback: string
  
  submitted_at: string
}
```

---

## Phase 5: Teacher Management Interface

### Assignment Creation
**Location**: `/admin/assignments/create-simulation`

Features:
- Browse available simulations
- Select simulation
- AI-generate questions (or create manually)
- Configure rubric and grading criteria
- Set requirements (min time, data export, etc.)
- Assign to courses/students
- Set due dates

### Grading Dashboard
**Location**: `/admin/assignments/[id]/grade`

Features:
- View all student submissions
- See simulation completion metrics
- Review question responses
- Apply rubric for letter grade
- Provide feedback
- Export grades

---

## Phase 6: Remove Student AI Assistance

### Changes to SimulationWrapper
```typescript
// Remove AI hint functionality
export function SimulationWrapper({
  simulationSlug,
  trackProgress = true,
  aiEnabled = false,  // Always false for students
  // ... other props
}) {
  // Remove:
  // - requestAIHint function
  // - AI hint button
  // - AI loading states
  
  // Keep:
  // - Progress tracking
  // - Interaction logging
  // - Completion detection
}
```

### Update Database
```sql
-- Remove has_ai_guide flag or set all to false
UPDATE simulations SET has_ai_guide = FALSE;
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create simulation_rubrics table
- [ ] Create standards-based rubric UI component
- [ ] Add default rubrics for existing simulations
- [ ] Test rubric grading logic

### Phase 2: Assignment Integration (Week 2)
- [ ] Extend Assignment type to support simulations
- [ ] Create SimulationAssignment creation flow
- [ ] Update assignment list to show simulation assignments
- [ ] Integrate with existing assignment context

### Phase 3: AI Question Generator (Week 3)
- [ ] Build AI question generation endpoint
- [ ] Create teacher UI for question generation
- [ ] Allow editing AI-generated questions
- [ ] Save questions to assignment

### Phase 4: Student Workflow (Week 4)
- [ ] Update submission flow for simulation assignments
- [ ] Implement rubric-based grading
- [ ] Show letter grades on student dashboard
- [ ] Allow data export from simulations

### Phase 5: Teacher Tools (Week 5)
- [ ] Create simulation assignment builder
- [ ] Build grading dashboard
- [ ] Add bulk assignment features
- [ ] Export grades to existing gradebook

### Phase 6: Cleanup (Week 6)
- [ ] Remove student AI assistance
- [ ] Update documentation
- [ ] Create teacher training materials
- [ ] Test end-to-end workflow

---

## Sample User Stories

### Teacher
> "I want to assign the Constant Velocity Lab to my Period 2 class. I'll have the AI generate 5 questions about velocity calculations, then I'll edit them to match what we covered in class. Students need to spend at least 10 minutes in the simulation and export their data table. They'll be graded A/B/C/Fail based on whether they correctly calculate velocity from their graph."

### Student
> "I have a simulation assignment due Friday. I'll open the Constant Velocity Lab, collect data by moving the walker, export my data to a CSV file, and then answer 5 questions about my results. The system will grade my questions automatically and give me a letter grade based on how well I understood constant velocity."

### Admin
> "I can see that 85% of students got an A or B on the Constant Velocity simulation, which tells me they understand the concept well. For the students who got a C or Fail, I can see they struggled with calculating slope, so I'll review that in class."

---

## Technical Stack

### Existing Systems to Leverage
- ✅ Assignment creation/management (AssignmentContext)
- ✅ Question types (multiple-choice, numerical, open-response)
- ✅ Grading system (auto-grade for MC/numerical)
- ✅ Student dashboard (shows assignments)
- ✅ Course/student management (Google Classroom integration)

### New Components to Build
- 🆕 SimulationRubric component
- 🆕 SimulationAssignmentBuilder component
- 🆕 AI Question Generator API
- 🆕 Letter grade calculator
- 🆕 Simulation assignment type in UI

### Database Changes
- 🆕 simulation_rubrics table
- 🆕 simulation_assignments table (or extend assignments)
- 🆕 simulation_submissions table (or extend submissions)
- 🔄 Update simulations table (remove has_ai_guide)

---

## Next Steps

1. **Run `add-constant-velocity.sql`** to fix immediate issue
2. **Review this plan** - does this match your vision?
3. **Prioritize features** - what's most important?
4. **Start with Phase 1** - build rubric system first
5. **Iterate** - test with real assignments and students

Would you like me to start implementing any specific phase?
