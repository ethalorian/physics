# 🚀 Quick Start: Simulation Assignment System

## ✅ System Complete - 100% Built!

All 9 phases implemented. Here's your 5-minute setup guide.

---

## Step 1: Run Database Migrations (5 minutes)

Open Supabase SQL Editor:
**https://supabase.com/dashboard/project/lknifmjxelphrkwddnpw/sql**

Run these 4 scripts in order:

### Script 1: Add Constant Velocity Simulation
```bash
# Copy contents from: add-constant-velocity.sql
# Paste in SQL Editor → Click "Run"
```

### Script 2: Disable Student AI
```bash
# Copy contents from: disable-student-ai.sql
# Paste in SQL Editor → Click "Run"
```

### Script 3: Create Assignment Tables
```bash
# Copy contents from: supabase/migrations/create_simulation_assignments.sql
# Paste in SQL Editor → Click "Run"
```

### Script 4: Create Rubric System
```bash
# Copy contents from: supabase/migrations/create_simulation_rubrics.sql
# Paste in SQL Editor → Click "Run"
```

**✅ Done! Database is ready.**

---

## Step 2: Test Teacher Workflow (2 minutes)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Create assignment:**
   - Visit: http://localhost:3000/admin/assignments/create-simulation
   - Select: "Constant Velocity Motion Lab"
   - Set due date, instructions
   - Assign to a course
   - Click "Create Assignment"

3. **Verify:**
   - Visit: http://localhost:3000/admin/assignments
   - Should see your new simulation assignment

---

## Step 3: Test Student Workflow (2 minutes)

1. **Student dashboard:**
   - Visit: http://localhost:3000/dashboard (as student)
   - Should see simulation assignment with purple flask icon 🧪

2. **Complete simulation:**
   - Click "Start Lab"
   - Complete the simulation
   - Export data
   - Returns to dashboard → Status: "Completed"

---

## Step 4: Test Grading (2 minutes)

1. **Grade student:**
   - Visit: http://localhost:3000/admin/assignments/[id]/grade
   - Use rubric sliders to grade each criterion
   - Watch letter grade update in real-time
   - Add feedback
   - Click "Save Grade"

2. **Student sees grade:**
   - Dashboard shows: "Grade: A" (green badge)
   - Click "View Results" to see rubric details

---

## 🎯 What You Get

### Teachers Can:
✅ Assign simulations to classes
✅ Set requirements (time, data export)
✅ Grade with A/B/C/Fail rubrics
✅ Track completion rates

### Students Can:
✅ See simulation assignments in dashboard
✅ Work independently (no AI hints)
✅ Export data from simulations
✅ Receive letter grades with feedback

---

## 🔧 Troubleshooting

### Simulations not showing?
- Check: http://localhost:3000/simulations
- Should see 4 simulations (including Constant Velocity)
- Badge should say "Database Active" (not "Mock Data")

### Can't create assignment?
- Verify migrations ran: Check Supabase SQL history
- Verify logged in as teacher/admin
- Check browser console for errors

### Students don't see assignments?
- Verify assignment is published
- Verify student is in the assigned course
- Check `student_simulation_assignments` table has records

---

## 📁 Key Files Reference

**For Teachers:**
- `/admin/assignments/create-simulation` - Create assignments
- `/admin/assignments/[id]/grade` - Grade students
- `RubricGrader` component - Interactive grading

**For Students:**
- `/dashboard` - See all assignments
- `/simulations/[slug]` - Complete simulations
- `StudentAssignmentView` - Assignment list

**APIs:**
- `/api/assignments/simulations` - Assignment CRUD
- `/api/rubrics` - Rubric management
- `/api/rubrics/assessments` - Grading

**Database:**
- `simulation_assignments` - Assignments table
- `student_simulation_assignments` - Progress table
- `simulation_rubrics` - Rubric templates
- `rubric_assessments` - Student grades

---

## 🎊 You're Ready!

Everything is built and ready to use. Just:
1. ✅ Run the 4 SQL migrations
2. ✅ Create your first simulation assignment
3. ✅ Have students complete it
4. ✅ Grade with the rubric system

**Enjoy your new simulation assignment system! 🚀**

---

For full details, see: `SIMULATION_ASSIGNMENT_SYSTEM_COMPLETE.md`

