# Simulation Assignment User Flow - Complete Guide

## 🎯 Quick Overview

**Teacher creates assignment** → **Students see in dashboard** → **Students complete sim + questions** → **Teacher grades**

Let me walk you through the **exact steps** for both teachers and students.

---

## 👨‍🏫 TEACHER WORKFLOW

### Step 1: Navigate to a Simulation

**Go to any simulation URL:**
- `/simulations/race-track`
- `/simulations/car-race`
- `/simulations/monkey-hunter`
- `/simulations/vacuum-chamber`
- etc.

**You'll see the simulation page with controls and visualization.**

---

### Step 2: Look for Assignment Buttons (Top Right)

**When logged in as admin/teacher, you'll see:**

```
┌────────────────────────────────────────────────────┐
│  Monkey Hunter: Projectile Motion      [Intermediate]
│
│  [+ Add Assignment]  [⚙ Manage]
│  (purple button)     (if assignments exist)
└────────────────────────────────────────────────────┘
```

**If you already have assignments, you'll also see:**
```
[📄 2 Assignments] [+ Add Assignment] [⚙ Manage]
```

---

### Step 3: Click "+ Add Assignment"

**This opens a modal/dialog with a form. The form has several sections:**

#### Section 1: Basic Information

```
┌─────────────────────────────────────────┐
│ Assignment Title: *                     │
│ [Monkey Hunter Lab: Projectile Motion] │
│                                         │
│ Description (optional):                 │
│ [Study how projectile motion works...] │
│                                         │
│ Instructions:                           │
│ [1. Predict where the collision will   │
│  happen before running                  │
│  2. Calculate the time using kinematics │
│  3. Run simulation and verify           │
│  4. Answer the questions below]         │
└─────────────────────────────────────────┘
```

#### Section 2: Questions

```
┌─────────────────────────────────────────┐
│ Questions                               │
│                                         │
│ [+ Add Question ▼]                     │
│   ├─ Multiple Choice                    │
│   ├─ Numerical Answer                   │
│   ├─ Open Response                      │
│   └─ Essay                              │
└─────────────────────────────────────────┘
```

**Click "+ Add Question" and choose type:**

##### Example: Adding a Multiple Choice Question

```
┌─────────────────────────────────────────┐
│ Question 1: Multiple Choice             │
│                                         │
│ Question Text: *                        │
│ [Why does the dart hit the monkey      │
│  even though the monkey drops?]         │
│                                         │
│ Options:                                │
│ A: [The dart is too fast]              │
│ B: [Both fall at the same rate ✓]     │
│ C: [The monkey doesn't drop far]       │
│ D: [The hunter aims very carefully]    │
│                                         │
│ Correct Answer: ● B                     │
│                                         │
│ Points: [5]                             │
│                                         │
│ Explanation (optional):                 │
│ [Both the dart and monkey experience   │
│  gravity equally (g = 9.8 m/s²)...]    │
│                                         │
│ [Save Question] [Cancel]                │
└─────────────────────────────────────────┘
```

##### Example: Adding a Numerical Question

```
┌─────────────────────────────────────────┐
│ Question 2: Numerical Answer            │
│                                         │
│ Question Text: *                        │
│ [The monkey is 12m high and 13m away.  │
│  If the dart travels at 20 m/s,        │
│  calculate the collision time.]         │
│                                         │
│ Correct Value: [0.88]                  │
│ Tolerance: [0.05]                      │
│ Unit: [seconds]                        │
│                                         │
│ Points: [10]                            │
│                                         │
│ [Save Question] [Cancel]                │
└─────────────────────────────────────────┘
```

##### Example: Adding an Open Response Question

```
┌─────────────────────────────────────────┐
│ Question 3: Open Response               │
│                                         │
│ Question Text: *                        │
│ [Explain why aiming directly at the    │
│  monkey works even though it drops.     │
│  Use the concepts of independence of    │
│  motion and gravity in your answer.]    │
│                                         │
│ Auto-Grade with AI: ☑                  │
│                                         │
│ Rubric:                                 │
│ ┌─ Criterion 1 ────────────────┐      │
│ │ Name: [Independence of motion] │      │
│ │ Points: [4]                    │      │
│ │ Description: [Explains x and y │      │
│ │  motions are independent]      │      │
│ └────────────────────────────────┘      │
│                                         │
│ ┌─ Criterion 2 ────────────────┐      │
│ │ Name: [Gravity affects both]   │      │
│ │ Points: [3]                    │      │
│ │ Description: [Both fall at g]  │      │
│ └────────────────────────────────┘      │
│                                         │
│ Total Points: [10]                      │
│                                         │
│ [+ Add Criterion]                       │
│ [Save Question] [Cancel]                │
└─────────────────────────────────────────┘
```

**Add as many questions as you want!**

---

#### Section 3: Assignment Settings

```
┌─────────────────────────────────────────┐
│ Assignment Settings                     │
│                                         │
│ Show Questions:                         │
│ ○ At Start (before simulation)         │
│ ● After Completion (recommended)        │
│                                         │
│ ☑ Allow Skip (let students skip sim)  │
│ ☐ Required for Progress                │
│                                         │
│ Time Limit: [None ▼]                   │
│ Max Attempts: [Unlimited ▼]            │
│                                         │
│ ☑ Allow Late Submission                │
│ ☑ Published (students can see)         │
└─────────────────────────────────────────┘
```

---

#### Section 4: Assign to Students

```
┌─────────────────────────────────────────┐
│ Assign To:                              │
│                                         │
│ ○ Entire Course                        │
│   [Select Course ▼]                    │
│   └─ Period 3 Physics (24 students)    │
│                                         │
│ ○ Individual Students                  │
│   [Select Students ▼]                  │
│   └─ ☑ John Smith                      │
│       ☑ Jane Doe                       │
│       ☐ Bob Johnson                    │
│                                         │
│ Due Date: [Oct 20, 2025 ▼]            │
└─────────────────────────────────────────┘
```

---

### Step 4: Click "Create Assignment"

**What happens:**
- Assignment is saved to database
- Students are assigned automatically
- Notification can be sent (if enabled)
- You see confirmation message

**You'll see:**
```
✓ Assignment created successfully!
  - Assigned to: Period 3 Physics (24 students)
  - Total Points: 30
  - Due: Oct 20, 2025
```

**The modal closes and the button now shows:**
```
[📄 1 Assignment] [+ Add Assignment] [⚙ Manage]
```

---

### Step 5: Manage Assignments (Optional)

**Click "⚙ Manage" to:**
- Edit existing assignments
- View student progress
- See who has completed
- Delete assignments

---

## 🎓 STUDENT WORKFLOW

### Step 1: Student Logs In

Goes to `/dashboard`

---

### Step 2: Student Sees Assigned Simulations

**On their dashboard, they see:**

```
┌──────────────────────────────────────────────────┐
│ MY ASSIGNMENTS                                   │
├──────────────────────────────────────────────────┤
│                                                  │
│ 📊 Monkey Hunter Lab: Projectile Motion         │
│ Simulation Assignment                            │
│ Due: Oct 20, 2025 (5 days)                      │
│ Status: Not Started                              │
│ Points: 30                                       │
│ [START ASSIGNMENT →]                             │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ 🏁 Race Track Analysis Lab                      │
│ Simulation Assignment                            │
│ Due: Oct 18, 2025 (3 days)                      │
│ Status: In Progress (Questions remaining)        │
│ Points: 25                                       │
│ [CONTINUE →]                                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### Step 3: Student Clicks "START ASSIGNMENT"

**They are taken to the simulation page:**

`/simulations/monkey-hunter`

**At the top, they see a banner:**

```
┌──────────────────────────────────────────────────┐
│ 📋 ASSIGNMENT: Monkey Hunter Lab                │
│ Due: Oct 20, 2025 | Points: 30 | Time: 0:00     │
│ Complete the simulation and answer 5 questions   │
└──────────────────────────────────────────────────┘
```

**The simulation loads normally with all controls.**

---

### Step 4: Student Completes Simulation

**They:**
1. Adjust parameters (monkey height, dart speed)
2. Click "Fire Dart"
3. Watch the collision
4. See "🎯 DIRECT HIT!" message
5. Can reset and try again with different settings

**The system tracks:**
- Time spent
- Number of trials
- Interactions
- Whether they completed it

---

### Step 5: Questions Appear

**After completing the simulation (or immediately if set to "show on start"), a panel/modal appears:**

```
┌──────────────────────────────────────────────────┐
│ Assignment Questions                             │
│ Complete these questions to submit assignment    │
├──────────────────────────────────────────────────┤
│                                                  │
│ Question 1 of 5                          (5 pts) │
│                                                  │
│ Why does the dart hit the monkey even though     │
│ the monkey drops?                                │
│                                                  │
│ ○ A. The dart is too fast                       │
│ ● B. Both fall at the same rate                 │
│ ○ C. The monkey doesn't drop far                │
│ ○ D. The hunter aims very carefully              │
│                                                  │
│ [Next Question →]                                │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Student answers each question...**

```
┌──────────────────────────────────────────────────┐
│ Question 2 of 5                         (10 pts) │
│                                                  │
│ The monkey is 12m high and 13m away. If the     │
│ dart travels at 20 m/s, calculate the collision  │
│ time.                                            │
│                                                  │
│ Answer: [0.88] seconds                          │
│          ↑ student types here                    │
│                                                  │
│ [← Previous] [Next Question →]                  │
└──────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────┐
│ Question 3 of 5                         (10 pts) │
│                                                  │
│ Explain why aiming directly at the monkey works  │
│ even though it drops. Use the concepts of        │
│ independence of motion and gravity.              │
│                                                  │
│ ┌──────────────────────────────────────┐        │
│ │ Both the dart and monkey are affected │        │
│ │ by gravity. Since they both fall at   │        │
│ │ the same rate (g = 9.8 m/s²), the    │        │
│ │ dart drops the same amount as the     │        │
│ │ monkey during flight. The horizontal  │        │
│ │ motion is independent, so...          │        │
│ └──────────────────────────────────────┘        │
│  ↑ student writes explanation here               │
│                                                  │
│ [← Previous] [Next Question →]                  │
└──────────────────────────────────────────────────┘
```

---

### Step 6: Student Submits Assignment

**After answering all questions:**

```
┌──────────────────────────────────────────────────┐
│ Review Your Answers                              │
│                                                  │
│ Question 1: ✓ Answered (Multiple Choice)        │
│ Question 2: ✓ Answered (0.88 seconds)           │
│ Question 3: ✓ Answered (150 words)              │
│ Question 4: ✓ Answered (Numerical)              │
│ Question 5: ⚠ Not Answered                      │
│                                                  │
│ Simulation completed: ✓ Yes                     │
│ Time spent: 12 minutes                           │
│                                                  │
│ [← Back to Edit] [SUBMIT ASSIGNMENT →]          │
└──────────────────────────────────────────────────┘
```

**Click "SUBMIT ASSIGNMENT"**

**Confirmation screen:**
```
┌──────────────────────────────────────────────────┐
│ ✓ Assignment Submitted!                         │
│                                                  │
│ Monkey Hunter Lab: Projectile Motion            │
│ Submitted: Oct 15, 2025 at 2:30 PM             │
│                                                  │
│ Auto-Graded Questions:                          │
│ Question 1 (MC): 5/5 points ✓                   │
│ Question 2 (Numerical): 10/10 points ✓          │
│ Question 4 (Numerical): 8/10 points ✓           │
│                                                  │
│ Pending Grading:                                │
│ Question 3 (Open Response): Awaiting review     │
│ Question 5 (Open Response): Awaiting review     │
│                                                  │
│ Current Score: 23/30 (77%)                      │
│ Final score pending teacher review              │
│                                                  │
│ [VIEW SUBMISSION] [BACK TO DASHBOARD]           │
└──────────────────────────────────────────────────┘
```

---

## 👨‍🏫 TEACHER GRADING WORKFLOW

### Step 1: Access Assignment Hub

**Go to:** `/admin/assignment-hub`

**You'll see all assignments:**

```
┌──────────────────────────────────────────────────┐
│ Assignment Hub                                   │
├──────────────────────────────────────────────────┤
│                                                  │
│ Filter: [All Types ▼] [All Courses ▼] [All ▼]  │
│                                                  │
│ 📊 Monkey Hunter Lab: Projectile Motion         │
│ Simulation | Due: Oct 20 | Period 3             │
│ Progress: 18/24 submitted (75%)                 │
│ Needs Grading: 12 open responses                │
│ [VIEW SUBMISSIONS →]                             │
│                                                  │
│ 🏁 Race Track Analysis Lab                      │
│ Simulation | Due: Oct 18 | Period 2             │
│ Progress: 22/22 submitted (100%)                │
│ Needs Grading: 8 open responses                 │
│ [VIEW SUBMISSIONS →]                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### Step 2: Click "VIEW SUBMISSIONS"

**You see a list of all student submissions:**

```
┌──────────────────────────────────────────────────┐
│ Monkey Hunter Lab - Submissions                 │
│ 18 of 24 students submitted                     │
├──────────────────────────────────────────────────┤
│                                                  │
│ Student         | Score | Status    | Time      │
│ ──────────────────────────────────────────────   │
│ John Smith      | 28/30 | Graded ✓  | 15 min    │
│ Jane Doe        | 23/30 | Pending   | 12 min    │
│ Bob Johnson     | -/30  | Not Sub   | -         │
│ Alice Williams  | 25/30 | Pending   | 18 min    │
│                                                  │
│ [GRADE ALL] [EXPORT GRADES] [DOWNLOAD DATA]     │
└──────────────────────────────────────────────────┘
```

---

### Step 3: Click on a Student to Grade

**Click "Jane Doe" to see her submission:**

```
┌──────────────────────────────────────────────────┐
│ Jane Doe - Monkey Hunter Lab                    │
│ Submitted: Oct 15, 2025 at 2:30 PM             │
│ Time Spent: 12 minutes                           │
├──────────────────────────────────────────────────┤
│                                                  │
│ Simulation Activity:                            │
│ ✓ Completed simulation                          │
│ ✓ Ran 3 trials                                  │
│ ✓ Observed direct hit                           │
│ Time in simulation: 8 minutes                    │
│                                                  │
│ ─────────────────────────────────────────────    │
│                                                  │
│ Q1 (MC): Why does dart hit monkey?              │
│ Student Answer: B. Both fall at same rate       │
│ Correct! ✓ [5/5 points]                         │
│                                                  │
│ ─────────────────────────────────────────────    │
│                                                  │
│ Q2 (Numerical): Calculate collision time        │
│ Student Answer: 0.88 seconds                    │
│ Correct! ✓ [10/10 points]                       │
│ (Expected: 0.88 ± 0.05 seconds)                 │
│                                                  │
│ ─────────────────────────────────────────────    │
│                                                  │
│ Q3 (Open Response): Explain why it works        │
│ Student Answer:                                 │
│ "Both the dart and monkey are affected by       │
│  gravity. Since they both fall at the same      │
│  rate (g = 9.8 m/s²), the dart drops the same  │
│  amount as the monkey during flight. The        │
│  horizontal motion is independent, so the dart  │
│  still reaches the monkey's x-position..."      │
│                                                  │
│ AI Suggestion: 8/10 points                      │
│ - Independence of motion: 3/4 ✓                 │
│ - Gravity affects both: 3/3 ✓                   │
│ - Could elaborate on vertical component: 2/3    │
│                                                  │
│ Your Grade: [8] / 10                            │
│ Feedback: [Good explanation! Could add that     │
│            the -½gt² term appears in both       │
│            equations and cancels out.]           │
│                                                  │
│ [Accept AI Grade] [Override]                    │
│                                                  │
│ ─────────────────────────────────────────────    │
│                                                  │
│ TOTAL: 23/30 (77%)                              │
│                                                  │
│ [SAVE & NEXT STUDENT] [SAVE & EXIT]             │
└──────────────────────────────────────────────────┘
```

---

### Step 4: Teacher Grades Open Responses

**For each open response question:**
- Read student answer
- See AI suggested grade (if enabled)
- Assign points
- Add feedback
- Save

**Click "SAVE & NEXT STUDENT"** to grade next submission.

---

## 📊 SUMMARY VIEW

### Teacher Dashboard Shows:

```
┌──────────────────────────────────────────────────┐
│ Assignment Analytics                            │
│                                                  │
│ Monkey Hunter Lab (Period 3)                    │
│ ─────────────────────────────────────────────    │
│ Assigned: 24 students                           │
│ Submitted: 18 (75%)                             │
│ Graded: 15 (62.5%)                              │
│ Pending: 3 need grading                         │
│ Not Started: 6                                  │
│                                                  │
│ Average Score: 26.2/30 (87%)                    │
│ Time Spent (avg): 14 minutes                    │
│                                                  │
│ Common Issues:                                  │
│ - Q3: 40% didn't mention independence           │
│ - Q5: 30% calculation errors                    │
│                                                  │
│ [VIEW DETAILS] [EXPORT GRADES]                  │
└──────────────────────────────────────────────────┘
```

---

## 🔍 KEY POINTS

### Where Assignment Button Is

**You must be logged in as admin/teacher.**

**Look at the TOP RIGHT of the simulation page:**
- Next to the "Intermediate" difficulty badge
- Purple gradient button says "+ Add Assignment"
- If you don't see it, you're not logged in as admin/teacher

### When Students See Questions

**You choose when questions appear:**

**Option A: "Show on Start"**
- Questions appear BEFORE simulation
- Student must answer questions first
- Then can access simulation
- Good for: Pre-lab predictions

**Option B: "After Completion"** (Recommended)
- Student completes simulation first
- Questions appear when they finish
- Student answers based on experience
- Good for: Post-lab analysis

### Auto-Grading

**Automatically graded:**
- ✅ Multiple Choice (instant score)
- ✅ Numerical (with tolerance checking)

**Needs teacher review:**
- 📝 Open Response (can use AI assist)
- 📝 Essay (always manual)

### Where Everything Lives

**For Teachers:**
- Create: Simulation page → "+ Add Assignment"
- Manage: `/admin/assignment-hub`
- Grade: Click assignment → View submissions

**For Students:**
- Find: `/dashboard` or `/assignments`
- Complete: Click assignment → Opens simulation
- Check score: `/assignments` shows grades

---

## 💡 QUICK START EXAMPLE

### Try This Right Now:

**1. Go to:** `http://localhost:3000/simulations/monkey-hunter`

**2. Look top-right for:** `[+ Add Assignment]` (purple button)

**3. Click it!**

**4. Fill out form:**
- Title: "Test Assignment"
- Add one multiple choice question
- Leave other settings default

**5. Assign to:** Yourself (or a test student)

**6. Click "Create Assignment"**

**7. Log out and log in as student**

**8. Go to:** `/dashboard`

**9. You should see:** The assignment listed!

**10. Click "START" and complete it**

This will show you the entire flow!

---

## 🎯 COMMON QUESTIONS

### Q: "Where do I write the lesson content?"

**A:** In the assignment "Instructions" field. You can copy/paste from the lesson markdown files.

### Q: "Can students access the simulation without the assignment?"

**A:** Yes! Simulations are always available at `/simulations/[slug]`. Assignments just add questions and tracking.

### Q: "What if a student wants to try the simulation before answering questions?"

**A:** Set "Show Questions: After Completion" - they complete sim first, then questions appear.

### Q: "Can I edit an assignment after creating it?"

**A:** Yes! Click "⚙ Manage" button on the simulation page, select the assignment, and edit.

### Q: "How do students know what to do?"

**A:** Put clear instructions in the "Instructions" field when creating the assignment. These appear at the top of the simulation.

### Q: "Can I see student data/graphs?"

**A:** Yes! If you require data export, students must export their data. You can also see their simulation interactions in the grading view.

---

## 📱 VISUAL SUMMARY

```
TEACHER CREATES                STUDENTS ACCESS
     ↓                              ↓
Simulation Page              Dashboard/Assignments
     ↓                              ↓
"+ Add Assignment"            "START ASSIGNMENT"
     ↓                              ↓
Fill Form:                    Opens Simulation
- Title                             ↓
- Instructions                Complete Activity
- Questions                         ↓
- Settings                    Questions Appear
- Assign                            ↓
     ↓                        Answer Questions
"Create Assignment"                 ↓
     ↓                        "SUBMIT ASSIGNMENT"
SAVED IN DATABASE                   ↓
     ↓                        Auto-grade + Pending
Assignment Hub                      ↓
     ↓                        Student sees score
View Submissions                    ↓
     ↓                        DONE ✓
Grade Open Responses
     ↓
Final Scores
```

---

## ✅ TL;DR

1. **Go to simulation page** while logged in as admin/teacher
2. **Click purple "+ Add Assignment" button** (top right)
3. **Add title, instructions, and questions** in the modal
4. **Assign to course or students**, set due date
5. **Click "Create Assignment"**
6. **Students see it in their dashboard**
7. **They complete sim and answer questions**
8. **You grade open responses** in assignment hub
9. **Done!**

**That's it!** The system handles all the tracking, saving, and scoring automatically.

---

**Need help?** 
- Try creating a test assignment for yourself
- See existing simulations (like `/simulations/constant-velocity`) for examples
- The "+ Add Assignment" button is your starting point for everything!

