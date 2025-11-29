# Physics Classroom - Assignment Workflow Guide

## 🔑 Key Concept: Content Creation vs. Content Assignment

The assignment system has **two distinct phases** that must be understood:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   PHASE 1: CREATE CONTENT          →        PHASE 2: ASSIGN CONTENT        │
│   (Build the learning material)              (Give to students)             │
│                                                                             │
│   Where: Various admin pages                Where: Global Assignment Hub    │
│   Who: Teacher/Admin only                   Who: Teacher/Admin only         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**⚠️ Critical Understanding:** You cannot assign content that doesn't exist yet. Content must be CREATED and PUBLISHED before it can be ASSIGNED to students.

---

## 📋 Quick Reference: Where to Create Each Content Type

| Content Type | Creation Location | What You Do |
|--------------|-------------------|-------------|
| **Lessons** | Admin Dashboard → Content → New Lesson | Create reading, video, or simulation-based lessons |
| **Homework** | Admin Dashboard → Content → Create Assignment | Build question sets with AI grading |
| **Vocabulary** | Admin Dashboard → Content → Vocabulary | Create word sets for interactive games |
| **Simulations** | Pre-built in codebase | Just toggle "Published" to enable |

---

## 🎯 Complete Workflow for Each Assignment Type

### 1️⃣ Assigning a LESSON

#### Prerequisites
Lessons must exist in the database before assignment.

#### Step-by-Step Flow

```
STEP 1: Create the Lesson
├── Go to: /admin/dashboard → Content tab
├── Click "New Lesson" button
├── Fill in:
│   ├── Title & Slug
│   ├── Unit (e.g., "Unit 1: Kinematics")
│   ├── Lesson Type: Reading, Video, or Simulation
│   ├── Description
│   └── (Optional) Video URL or Simulation selection
├── Click "Create Lesson"
└── Edit the lesson to add full content

STEP 2: Publish the Lesson
├── Go to: /admin/lessons/{id}/edit
├── Review content
└── Toggle "Published" to ON

STEP 3: Assign the Lesson
├── Go to: /admin/dashboard → Assign tab
├── Click "Assign Lesson" (blue button)
│   OR Click "Create Assignment" → Select "Lesson"
├── Select your published lesson from dropdown
├── Choose target: Course or Specific Students
├── Set due date and options
└── Publish the assignment
```

#### Current UX Issues with Lessons
- ✅ Flow is relatively clear
- ⚠️ Must remember to publish BOTH the lesson AND the assignment
- ⚠️ No indication in Assignment Hub that unpublished lessons won't appear

---

### 2️⃣ Assigning a VOCABULARY Set

#### Prerequisites
Vocabulary sets must be created with terms before assignment.

#### Step-by-Step Flow

```
STEP 1: Create the Vocabulary Set
├── Go to: /admin/vocabulary
│   (OR: /admin/dashboard → Content tab → Vocabulary card)
├── Click "Create New Set"
├── Fill in:
│   ├── Set Name (e.g., "Kinematics Terms")
│   ├── Description
│   └── Unit/Lesson categorization
└── Save the set

STEP 2: Add Terms to the Set
├── Open the vocabulary set
├── For each term, add:
│   ├── Term (e.g., "Velocity")
│   ├── Definition
│   └── (Optional) Example, Image, Related Equation
└── Save terms

STEP 3: Publish the Vocabulary Set
├── In the set view, find the "Published" toggle
├── Toggle to ON
└── Set now appears in student vocabulary games AND Assignment Hub

STEP 4: Assign the Vocabulary Set
├── Go to: /admin/dashboard → Assign tab
├── Click "Assign Vocabulary" (purple button)
│   OR Click "Create Assignment" → Select "Vocabulary Set"
├── Select your published vocabulary set from dropdown
├── Choose target: Course or Specific Students
├── Set due date and options
└── Publish the assignment
```

#### Current UX Issues with Vocabulary 🚨
- ❌ **Major confusion**: Users don't realize they need to create sets FIRST
- ❌ No link from Assignment Hub to vocabulary management if no sets exist
- ❌ "No content available" message doesn't explain WHY or WHERE to create content
- ⚠️ Published toggle is buried in the interface
- 💡 **Suggested Fix**: Add "Create Vocabulary Set" button in Assignment Hub when none exist

---

### 3️⃣ Assigning a SIMULATION

#### Prerequisites
Simulations are pre-built in the codebase. They must be:
1. Published in the database
2. Have the corresponding page in `/simulations/[slug]`

#### Step-by-Step Flow

```
STEP 1: Verify Simulation Exists
├── Go to: /simulations (student view)
│   OR: /admin/simulations (admin view)
├── Find the simulation you want to assign
└── Note: Simulations are CODE-BASED, not created in admin UI

STEP 2: Ensure Simulation is Published
├── Go to: /admin/simulations
├── Find the simulation in the list
├── Check "Published" status
└── Toggle ON if needed

STEP 3: Assign the Simulation
├── Go to: /admin/dashboard → Assign tab
├── Click "Assign Simulation" (orange button)
│   OR Click "Create Assignment" → Select "Simulation"
├── Select simulation from dropdown
│   ⚠️ Only PUBLISHED simulations appear here
├── Choose target: Course or Specific Students
├── Set due date and options
└── Publish the assignment
```

#### Current UX Issues with Simulations 🚨
- ❌ **Major confusion**: Users think they need to CREATE simulations
- ❌ No explanation that simulations are pre-built
- ❌ Empty dropdown if no simulations are published
- ❌ No link to /admin/simulations to publish existing ones
- 💡 **Fixed**: Removed confusing "Simulation (with questions)" option
- 💡 **Fixed**: Added explanatory text and link to simulation management

---

### 4️⃣ Assigning HOMEWORK

#### Prerequisites
Homework assignments are created from scratch with questions.

#### Step-by-Step Flow

```
STEP 1: Create the Homework Assignment
├── Go to: /admin/assignments/create
│   (OR: /admin/dashboard → Content tab → Create Assignment)
├── Fill in:
│   ├── Title
│   ├── Description
│   ├── Unit/Topic
│   └── Estimated time
└── Continue to Question Builder

STEP 2: Add Questions
├── For each question:
│   ├── Select type: Multiple Choice, Numerical, Open Response, Essay
│   ├── Enter question text (supports LaTeX math)
│   ├── Add answer options or correct answer
│   ├── Set points value
│   └── (Optional) Add hints, feedback, rubric
├── Use AI generation if available
└── Save the assignment

STEP 3: Publish the Homework
├── Review all questions
└── Toggle "Published" to ON

STEP 4: Assign the Homework
├── Go to: /admin/dashboard → Assign tab
├── Click "Assign Homework" (green button)
│   OR Click "Create Assignment" → Select "Homework Assignment"
├── Select your homework from dropdown
├── Configure:
│   ├── Max attempts
│   ├── Time limit (optional)
│   ├── Allow late submission
│   └── Max score
├── Choose target: Course or Specific Students
├── Set due date
└── Publish the assignment
```

#### Current UX Issues with Homework
- ✅ Flow is the most straightforward
- ⚠️ Still requires two-step: create THEN assign
- 💡 Could add "Assign Immediately" option in creation flow

---

## 🗺️ Visual Flow Diagram

```
                          ┌──────────────────────────────────────────────┐
                          │          TEACHER DASHBOARD                    │
                          │          /admin/dashboard                     │
                          └──────────────────────────────────────────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              │                               │                               │
              ▼                               ▼                               ▼
   ┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
   │    CONTENT TAB      │       │    ASSIGN TAB       │       │    STUDENTS TAB     │
   │  (Create Content)   │       │ (Global Assignment  │       │   (View Progress)   │
   │                     │       │       Hub)          │       │                     │
   └─────────────────────┘       └─────────────────────┘       └─────────────────────┘
              │                               │
              │                               │
   ┌──────────┴──────────────┐    ┌─────────┴─────────────────────┐
   │                         │    │                               │
   ▼                         ▼    ▼                               ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────────────────────────────┐
│Lessons │ │Vocab   │ │Homework│ │        ASSIGNMENT CREATION             │
│Manager │ │Manager │ │Builder │ │                                        │
│        │ │        │ │        │ │  1. Select Type (Lesson/Vocab/Sim/HW)  │
│ ↓      │ │ ↓      │ │ ↓      │ │  2. Select PUBLISHED Content          │
│Create  │ │Create  │ │Create  │ │  3. Choose Course/Students            │
│Publish │ │Terms   │ │Questions│ │  4. Set Due Date & Options            │
│        │ │Publish │ │Publish │ │  5. Publish Assignment                │
└────────┘ └────────┘ └────────┘ └────────────────────────────────────────┘
     │          │          │                      ▲
     └──────────┴──────────┴──────────────────────┘
                     Content flows to Assignment Hub
```

---

## 🔧 Recommended UX Improvements

### Priority 1: Empty State Messaging

**Current Problem:** When no content is available, users see "No content available for this type" with no guidance.

**Recommended Fix:**

```tsx
// In AssignmentCreationModal.tsx, line ~330
{contentOptions.length === 0 && !loading && (
  <div className="text-center py-6 space-y-3">
    <p className="text-sm text-muted-foreground">
      No {assignmentType}s available to assign.
    </p>
    <p className="text-xs text-muted-foreground">
      You need to create and publish {assignmentType}s before you can assign them.
    </p>
    <Button variant="outline" size="sm" asChild>
      <Link href={getContentCreationLink(assignmentType)}>
        Create {assignmentType}
      </Link>
    </Button>
  </div>
)}

// Helper function
function getContentCreationLink(type: AssignmentType): string {
  switch(type) {
    case 'lesson': return '/admin/dashboard?tab=content'
    case 'vocabulary': return '/admin/vocabulary'
    case 'simulation': return '/admin/simulations'
    case 'homework': return '/admin/assignments/create'
    default: return '/admin/dashboard'
  }
}
```

### Priority 2: Add Explanatory Tooltips

Add info icons with tooltips explaining the two-phase process:

```
[i] "Simulations are pre-built interactive labs. 
    Visit Simulation Management to see available simulations 
    and ensure they are published before assigning."
```

### Priority 3: Quick Actions in Assignment Hub

Add "No content? Create some!" links directly in the Quick Create buttons:

```tsx
<Button
  variant="outline"
  className="h-24 flex-col space-y-2"
  onClick={() => handleCreateAssignment('vocabulary')}
>
  <BookMarked className="h-8 w-8 text-purple-600" />
  <div>
    <div className="font-semibold">Assign Vocabulary</div>
    <div className="text-xs text-muted-foreground">
      {dashboardSummary?.assignments_by_type.vocabulary || 0} active
    </div>
  </div>
</Button>
{/* ADD THIS: */}
<Link href="/admin/vocabulary" className="text-xs text-primary hover:underline">
  Manage Sets →
</Link>
```

### Priority 4: Unified Content Check

Before showing the Assignment Creation Modal, verify content exists:

```tsx
const contentCounts = {
  lesson: publishedLessons.length,
  vocabulary: publishedVocabSets.length,
  simulation: publishedSimulations.length,
  homework: publishedHomework.length
}

// Show warning if type has no content
if (contentCounts[selectedType] === 0) {
  return <NoContentWarning type={selectedType} />
}
```

---

## 📱 Student View

Once assignments are created, students see them in:

| Location | What They See |
|----------|---------------|
| `/dashboard` | All their assignments with due dates |
| `/assignments` | Detailed assignment list with progress |
| `/lessons` | Assigned lessons |
| `/vocabulary` | Vocabulary games (if sets are published) |
| `/simulations` | All published simulations (assigned or not) |

---

## ❓ FAQ

### Q: Why don't I see any simulations in the dropdown?
**A:** Simulations must be published in the database. Go to `/admin/simulations` and ensure the simulation you want is toggled to "Published."

### Q: I created a vocabulary set but it doesn't appear when assigning.
**A:** Check that:
1. The set has at least one term
2. The set is toggled to "Published"
3. Try refreshing the page

### Q: How do I add questions to a simulation?
**A:** Simulations currently track student completion (time spent, interactions, data collected). To add formal assessment questions, you have two options:
1. **Create a Homework Assignment** - Build a homework assignment with questions about the simulation
2. **Assign the Simulation as a Lesson** - Create a simulation-based lesson which allows adding questions through the lesson editor

### Q: Can I assign content that isn't published yet?
**A:** No. Content must be published to appear in the assignment dropdown. This is by design to prevent assigning incomplete content.

### Q: How do I track student progress?
**A:** Go to:
- `/admin/dashboard` → Overview tab for summary
- `/admin/dashboard` → Assign tab → "Needs Attention" for pending items
- `/admin/dashboard` → Grades tab for detailed gradebook
- `/admin/dashboard` → Students tab for individual student progress

---

## 📍 Navigation Quick Reference

| Task | Path |
|------|------|
| Create Lesson | `/admin/dashboard` → Content tab → "New Lesson" |
| Edit Lesson | `/admin/lessons/{id}/edit` |
| Create Vocabulary Set | `/admin/vocabulary` |
| Manage Simulations | `/admin/simulations` |
| Create Homework | `/admin/assignments/create` |
| Assign Any Content | `/admin/dashboard` → Assign tab |
| View Student Progress | `/admin/dashboard` → Students tab |
| View Gradebook | `/admin/dashboard` → Grades tab |

---

## 🎓 Summary

The Physics Classroom assignment system follows a **Create → Publish → Assign** workflow:

1. **CREATE** your content in the appropriate admin section
2. **PUBLISH** the content to make it available
3. **ASSIGN** the published content through the Global Assignment Hub
4. **MONITOR** student progress through the dashboard

Understanding this two-phase approach is key to successfully using the assignment system.

