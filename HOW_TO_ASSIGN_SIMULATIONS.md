# How to Assign Simulations with Lessons to Students

## 🎯 Quick Answer

The markdown lesson files (`CAR_RACE_MATH_LESSON.md`, etc.) are **teacher guides** for your planning. To actually assign the simulation with lesson content to students, you have **three options**:

## 📋 Option 1: Built-In Simulation Assignment Editor (Easiest!)

### How It Works

Each simulation already has an **assignment system built in**! When you're logged in as admin/teacher:

### Steps to Assign

1. **Go to the simulation** (e.g., `/simulations/car-race`)

2. **Click "Add Assignment"** button (top-right, purple button)

3. **Fill out the assignment form:**
   - **Title**: "Relative Motion Lab: Car Race Analysis"
   - **Instructions**: Copy/paste key parts from the lesson markdown
   - **Questions**: Add questions based on the lesson

4. **Add Questions** (clicking "+ Add Question" button):

#### Example Questions from Car Race Lesson:

**Question 1 (Multiple Choice):**
```
Question: "On a position-time graph, what does the slope represent?"
Options:
  - Time
  - Distance
  - Velocity ✓
  - Acceleration
Points: 5
```

**Question 2 (Numerical):**
```
Question: "Car A travels at 18 m/s starting at t=0. Car B travels at 24 m/s starting at t=6s. Calculate when Car B catches Car A."

Answer: 18 seconds
Tolerance: 0.5
Unit: seconds
Points: 10
```

**Question 3 (Open Response):**
```
Question: "Explain how you can tell from a position-time graph which car will eventually overtake the other. Use the concept of slope in your answer."

Rubric:
  - Mentions slope represents velocity (3 pts)
  - Compares slopes of both lines (3 pts)
  - Concludes steeper slope will catch up (4 pts)
Points: 10
```

5. **Assign to Students:**
   - Select course (from Google Classroom)
   - OR select individual students
   - Set due date
   - Click "Create Assignment"

### Where Students Access It

**Students see assigned simulations in three places:**

1. **Dashboard** (`/dashboard`)
   - Shows all assignments
   - Click to open simulation

2. **Assignments Page** (`/assignments`)
   - Lists all assigned work
   - Shows due dates and status

3. **Direct Link** to simulation
   - They can access `/simulations/car-race` directly
   - Assigned questions appear automatically when they complete it

### What Students Experience

1. **Open simulation** from assignment or dashboard
2. **Complete the interactive activity** (run the race, collect data)
3. **Questions appear** when they finish or pause
4. **Answer questions** based on their data
5. **Submit assignment** when done
6. **See score** (auto-graded for MC and numerical)

## 📚 Option 2: Create Interactive Lesson (Most Comprehensive)

### What This Is

An **interactive lesson** is a multi-step guided experience that can include:
- Content sections (text, math, explanations)
- Embedded simulations
- Questions
- AI assistance

### How to Create One

**Currently:** This requires database setup. Here's the structure:

#### Step 1: Create the Lesson in Database

You'd need to add a record to the `interactive_lessons` table with steps like:

```sql
INSERT INTO interactive_lessons (lesson_id, steps) VALUES (
  'your-lesson-id',
  '[
    {
      "id": "step-1",
      "type": "content",
      "title": "Introduction to Relative Motion",
      "content": {
        "markdown": "# Relative Motion\n\nWhen two objects move at different speeds..."
      },
      "order": 1
    },
    {
      "id": "step-2",
      "type": "simulation",
      "title": "Car Race Simulation",
      "content": {
        "simulation_id": "car-race-simulation-id",
        "initial_parameters": {
          "velocityA": 20,
          "velocityB": 25,
          "startDelayB": 5
        }
      },
      "order": 2
    },
    {
      "id": "step-3",
      "type": "question",
      "title": "Analysis Questions",
      "content": {
        "question": {
          "type": "numerical",
          "question": "Calculate when Car B catches Car A...",
          "correctValue": 25,
          "unit": "seconds"
        }
      },
      "order": 3
    }
  ]'::jsonb
);
```

**Note:** This requires more setup but gives you the most control over lesson flow.

## 📝 Option 3: Create Regular Lesson with Simulation Link (Simplest)

### Steps

1. **Create a lesson** in your CMS/database

2. **Add content** from the markdown lesson file

3. **Embed simulation link:**

```markdown
# Car Race: Relative Motion

[Introduction content from lesson...]

## Interactive Simulation

Complete the [Car Race Simulation](/simulations/car-race) to explore this concept.

**Before you start:**
- Predict when Car B will catch Car A
- Calculate using the equations above
- Then verify with the simulation!

[More lesson content...]
```

4. **Assign the lesson** using the existing lesson assignment system

## 🎯 Recommended Approach (For You Right Now)

### Use Option 1: Built-In Simulation Assignments

**Why?**
- ✅ Already implemented
- ✅ No additional code needed
- ✅ Works immediately
- ✅ Students get questions with simulation
- ✅ Auto-grading included

**How to do it:**

### 1. Access the Simulation

Visit: `http://localhost:3000/simulations/car-race`

### 2. Click "Add Assignment"

You'll see this button in the header (purple gradient button)

### 3. Fill Out the Form

**Title Example:**
```
"Relative Motion Lab: Predicting the Overtake"
```

**Instructions Example:**
```
In this lab, you will:

1. Analyze the motion of two cars with different speeds and start times
2. Use kinematics equations to predict when Car B overtakes Car A
3. Run the simulation to verify your prediction
4. Answer questions about relative motion and position-time graphs

Before starting:
- Review constant velocity motion: x = vt
- Remember that slope on position-time graphs represents velocity
- Calculate your prediction before running the simulation!
```

**Questions to Add:**

**Question 1:**
```
Type: Multiple Choice
Question: "Car A starts at t=0s moving at 20 m/s. Car B starts at t=5s moving at 25 m/s. Which statement is true?"
Options:
  - Car A will always be ahead
  - Car B will immediately be ahead
  - Car B will eventually catch Car A ✓
  - They will never meet
Points: 5
Explanation: "Car B has a higher velocity (steeper slope on graph), so despite starting later, it will eventually catch up."
```

**Question 2:**
```
Type: Numerical
Question: "Using the default settings (Car A: 20 m/s, no delay; Car B: 25 m/s, 5s delay), calculate when Car B catches Car A. Use the equation: 20t = 25(t-5)"
Correct Answer: 25
Tolerance: 0.5
Unit: seconds
Points: 10
```

**Question 3:**
```
Type: Numerical  
Question: "At what position (in meters) does the overtake occur?"
Correct Answer: 500
Tolerance: 10
Unit: meters
Points: 10
```

**Question 4:**
```
Type: Open Response
Question: "Calculate the relative velocity of Car B with respect to Car A. Then explain how you can use this to determine when Car B catches up."

Rubric:
  Criterion 1: Calculates relative velocity (v_B - v_A = 5 m/s) [4 points]
  Criterion 2: Identifies Car A's head start (100m) [3 points]
  Criterion 3: Uses gap/relative velocity to find time (100/5 = 20s) [3 points]

Points: 10
Auto-grade: Yes
```

**Question 5:**
```
Type: Open Response
Question: "Export your simulation data to Desmos. Describe what the intersection point on the graph represents physically. Include the coordinates and explain what each value means."

Rubric:
  Criterion 1: Correctly identifies intersection coordinates [3 points]
  Criterion 2: Explains time coordinate (when they meet) [3 points]
  Criterion 3: Explains position coordinate (where they meet) [4 points]

Points: 10
```

### 4. Set Assignment Options

- **Show questions when**: "After completion" or "On start"
- **Allow skip**: Your choice
- **Time limit**: None (or set one)
- **Max attempts**: 1 or unlimited

### 5. Assign to Students

- **Course**: Select from dropdown (pulls from Google Classroom)
- **OR Individual Students**: Pick specific students
- **Due Date**: Set deadline

### 6. Click "Save Assignment"

Done! Students will see it in their dashboard.

## 📱 What Students See

### Step 1: Dashboard Shows Assignment

**In `/dashboard` or `/assignments`:**
```
┌─────────────────────────────────────────┐
│ 📊 Relative Motion Lab: Predicting...  │
│ Simulation: Car Race                    │
│ Due: Oct 15, 2025                      │
│ Status: Not Started                     │
│ [START ASSIGNMENT]                      │
└─────────────────────────────────────────┘
```

### Step 2: They Open Simulation

Clicking starts the simulation with:
- Tracking enabled
- Time spent recorded
- Instructions displayed

### Step 3: They Complete Simulation

- Run the race
- Collect data
- Export if required
- See overtake happen

### Step 4: Questions Appear

After completion (or when paused), a modal/panel shows:
```
┌─────────────────────────────────────────┐
│ Assignment Questions (5)                │
├─────────────────────────────────────────┤
│ Question 1: Multiple Choice             │
│ [Radio buttons]                         │
│                                         │
│ Question 2: Calculate...                │
│ [Number input] seconds                  │
│                                         │
│ Question 3: Explain...                  │
│ [Text area]                             │
│                                         │
│ [SUBMIT ASSIGNMENT]                     │
└─────────────────────────────────────────┘
```

### Step 5: They Submit

- Auto-graded questions scored immediately
- Open-response questions queued for teacher review or AI grading
- Assignment marked as "Submitted"
- Student sees score

## 🔍 Where to Find Assignment Creation

### In Each Simulation Page

Look for these buttons in the header (when logged in as admin/teacher):

```
┌──────────────────────────────────────────────┐
│  Car Race: Relative Motion & Kinematics     │
│                                              │
│  [1 Assignment] [+ Add Assignment] [Manage] │
└──────────────────────────────────────────────┘
```

**"+Add Assignment"** opens the editor!

### The Assignment Editor

**File**: `src/components/simulations/SimulationAssignmentEditor.tsx`

This component provides:
- Title and instructions fields
- Question builder (with AI assistance!)
- Settings for timing and attempts
- Course/student selector
- Preview mode

## 📊 Tracking & Grading

### What Gets Tracked

For each student:
- **Time spent** in simulation
- **Interactions** (what they clicked/changed)
- **Data collected** (number of data points)
- **Data exported** (yes/no)
- **Completion status**
- **Question responses**
- **Score** (auto-calculated for MC/numerical)

### Teacher View

You can see:
- Who has started
- Who has completed
- Time spent by each student
- Individual scores
- Need to grade open-response questions

### Where to Grade

**Global Assignment Hub** (`/admin/assignment-hub`)
- View all assignments
- See student submissions
- Grade open responses
- Provide feedback
- Export grades

## 💡 Pro Tips

### Creating Good Simulation Assignments

**DO:**
- ✅ Have students **predict before running** (engages critical thinking)
- ✅ Require **data export** (ensures they collect data)
- ✅ Ask for **explanations** not just numbers (deeper learning)
- ✅ Include **graph interpretation** questions
- ✅ Reference **specific parts of the simulation**

**DON'T:**
- ❌ Just ask "what happened?" (too vague)
- ❌ Make all questions multiple choice (no critical thinking)
- ❌ Skip the prediction step (reduces engagement)
- ❌ Forget to set due dates (students need deadlines)

### Using the Lesson Markdown Files

**These are for YOU (the teacher):**

The markdown files I created (`CAR_RACE_MATH_LESSON.md`, etc.) are:
- **Planning guides** for your lesson
- **Background information** on the physics/math
- **Activity suggestions** for classroom use
- **Sample problems** to adapt into assignments
- **Assessment rubrics** to use

**How to use them:**

1. **Read before class** to understand the simulation
2. **Choose activities** from the suggestions
3. **Adapt questions** into simulation assignments
4. **Use teaching tips** during instruction
5. **Reference during live demos**

You can also:
- Share markdown with students directly (as reading)
- Convert to PDF for handouts
- Copy sections into assignment instructions
- Use problems for homework

## 🎓 Complete Workflow Example

### Example: Assigning Car Race Simulation

**Before Class:**
1. Read `CAR_RACE_MATH_LESSON.md`
2. Note key concepts: relative motion, position equations, graph interpretation
3. Plan 25-minute lesson

**Create Assignment:**
1. Go to `/simulations/car-race`
2. Click "+ Add Assignment"
3. Title: "Lab 5: Relative Motion Analysis"
4. Instructions:
```
Complete this simulation to analyze relative motion between two cars.

BEFORE YOU START:
1. Write position equations for both cars
2. Calculate when Car B will catch Car A
3. Predict the position where overtake occurs

DURING SIMULATION:
4. Run the race and observe the overtake
5. Export data to Desmos
6. Graph both positions vs. time

Answer the questions below based on your predictions and observations.
```

5. Add 5-7 questions covering:
   - Kinematics equations
   - Relative velocity
   - Graph interpretation
   - Data analysis
   - Prediction vs. observation

6. Assign to your Period 3 class
7. Set due date: Next Friday

**In Class:**
1. **Demo** the simulation (5 min)
2. **Guided practice** - work through one example together (10 min)
3. **Independent work** - students complete assignment (30 min)
4. **Discussion** - share findings (10 min)

**After Class:**
1. **Review submissions** in assignment hub
2. **Grade open responses** (or use AI grading)
3. **Provide feedback**
4. **Use data** to identify struggling students

## 🚀 Quick Start Guide

### First Time Using Simulation Assignments

**1. Run database migrations** (if not done):
```bash
# These should already be run if simulations exist:
psql -h your-db -f supabase/migrations/create_simulation_tool_system.sql
psql -h your-db -f supabase/migrations/create_simulation_assignments.sql
psql -h your-db -f scripts/add-car-race-simulation.sql
```

**2. Log in as admin/teacher**

**3. Go to any simulation:**
- `/simulations/race-track`
- `/simulations/car-race`
- `/simulations/astronaut-thrust`
- etc.

**4. Look for purple "Add Assignment" button**

**5. Click it and create your first assignment!**

## 📍 Where Everything Lives

### Teacher-Facing

**Simulation Management:**
- `/simulations/[slug]` - View simulation, see assignment button
- `/admin/assignment-hub` - Manage all assignments

**Assignment Creation:**
- Button appears on each simulation page
- Opens modal editor
- Save creates assignment in database

**Grading:**
- `/admin/assignment-hub` - See all submissions
- Click assignment to see student responses
- Grade and provide feedback

### Student-Facing

**Finding Assignments:**
- `/dashboard` - Shows all assigned work
- `/assignments` - Filtered view of assignments
- Notifications (if enabled)

**Completing Work:**
- Click assignment → Opens simulation
- Complete simulation activity
- Answer questions
- Submit

**Checking Grades:**
- `/assignments` - Shows scores
- Individual assignment page shows feedback

## 🎨 Customization Options

### Assignment Instructions

You can include:
- Links to external resources
- Embedded images (if hosted)
- Math expressions using KaTeX: `\\( x = vt \\)`
- Step-by-step procedures
- Grading rubric preview

### Question Types Available

1. **Multiple Choice**
   - Auto-graded
   - Can include explanations
   - Good for concept checks

2. **Numerical**
   - Auto-graded with tolerance
   - Requires unit specification
   - Perfect for calculations

3. **Open Response**
   - Can be AI-graded or manual
   - Use rubrics for consistency
   - Best for explanations

4. **Essay** (if needed)
   - Always manually graded
   - For longer responses

## 💡 Best Practices

### Creating Effective Assignments

**Pre-Lab Questions:**
```
Q: "Before running the simulation, predict when Car B will catch Car A. Show your work."
→ Forces students to engage with kinematics first
```

**During-Sim Questions:**
```
Q: "While running the simulation, what do you notice about the slopes of the two lines on the position-time graph?"
→ Encourages observation during activity
```

**Post-Lab Analysis:**
```
Q: "Compare your prediction to the actual overtake time shown by the simulation. Calculate your percent error."
→ Develops scientific thinking
```

**Data Analysis:**
```
Q: "From your exported data, calculate the slope of Car A's position-time graph. What does this value represent?"
→ Connects data to concepts
```

### Typical Assignment Structure

**Good Pattern:**
1. Prediction question (before simulation)
2. Calculation question (using kinematics)
3. Simulation completion (tracked automatically)
4. Observation question (what did you see?)
5. Data analysis question (export and analyze)
6. Reflection question (physics concepts)

## 🔧 Technical Details

### Assignment Data Storage

**Database Tables:**
- `simulation_embedded_assignments` - Assignment metadata
- `simulation_assignment_submissions` - Student responses
- `simulation_activity` - Student interaction with simulation

**API Endpoints:**
- `POST /api/simulations/assignments` - Create assignment
- `GET /api/simulations/assignments?simulation_slug=car-race` - Get assignments
- `POST /api/simulations/assignments/[id]/submit` - Submit responses

### Assignment Configuration Options

```typescript
{
  simulation_slug: 'car-race',
  title: 'Relative Motion Lab',
  description: 'Analyze overtaking using kinematics',
  instructions: 'Complete simulation and answer questions...',
  questions: [...],  // Array of question objects
  total_points: 50,
  show_on_start: false,  // Show questions before or after?
  show_on_complete: true,
  allow_skip: false,
  required_for_progress: true,
  time_limit: null,  // Optional time limit in minutes
  available_after: 0,  // Delay in seconds after starting
  max_attempts: 1,
  allow_late_submission: true,
  published: true
}
```

## 📚 Converting Markdown Lessons to Assignments

### From Your Lesson Files

**For Car Race (`CAR_RACE_MATH_LESSON.md`):**

Take content from these sections:
- **Learning Objectives** → Assignment instructions
- **Step-by-step walkthrough** → Instructions/guidance
- **Sample calculations** → Example in instructions
- **Assessment questions** → Actual assignment questions
- **Activity procedures** → Step-by-step instructions

**Example conversion:**

**From lesson file:**
```markdown
### Activity 1: Kinematics Problem-Solving (15 min)

**Task 1:** Analyze motion using kinematics
- Identify initial conditions
- Write position equations
- Solve for intersection
```

**To assignment instructions:**
```
STEP 1: ANALYZE THE MOTION
Before running the simulation, complete these tasks:

1. Identify the initial conditions:
   - What is each car's velocity?
   - When does each car start?

2. Write the position equation for each car using x = v(t - t_start)

3. Set the equations equal and solve for t (when they meet)

4. Calculate the position where the overtake occurs

5. Record your prediction!

STEP 2: RUN THE SIMULATION
Click "Start Race" and observe...
```

## ✅ Summary

**The lesson markdown files are teacher guides.**

**To assign to students:**
1. Use the **built-in "Add Assignment" button** on each simulation
2. Add **questions based on the lesson**
3. Students **access via dashboard/assignments**
4. They **complete sim + answer questions**
5. You **grade and provide feedback**

**No additional coding needed** - the system is already built! Just click the purple button! 🟣

---

**Need Help?**
- Check existing simulations for examples
- Look at `/simulations/constant-velocity` - it has assignment examples
- Review `docs/SIMULATION_TOOL_ARCHITECTURE.md` for technical details

