# Physics Classroom - Navigation Map & Page Hierarchy

## Overview
This document maps out the complete site navigation structure, page hierarchy, and navigation flows for both student and admin users.

---

## 🏠 Landing Page

**Route:** `/`  
**Component:** `src/app/page.tsx`  
**Access:** Public (no authentication required)

**Navigation:**
- If not authenticated → Sign In button → Google OAuth → Dashboard
- If authenticated → "Launch Classroom" button → Dashboard

**Links to:**
- `/dashboard` (after sign-in or if logged in)

---

## 👤 User Role-Based Navigation

### Authentication System
- **Sign In:** `/auth/signin` - Google OAuth authentication
- **Error:** `/auth/error` - Authentication error handling
- **Navbar:** `src/components/navbar.tsx` - Main navigation bar (appears on all pages when authenticated)

### Role Hierarchy
1. **Student** - Basic access to learning content
2. **Teacher** - Student access + assignment management
3. **Admin** - Full access to all features + admin dashboard

---

## 📱 Main Navbar Navigation

**Location:** `src/components/navbar.tsx`  
**Visible:** All pages when authenticated

### For All Users (Student, Teacher, Admin):
- **Dashboard** → `/dashboard` or `/admin/dashboard` (based on role)
- **Lessons** → `/lessons`
- **Assignments** → `/assignments`
- **Simulations** → `/simulations`
- **Vocabulary Games** → `/vocabulary`
- **Leaderboard** → `/gamification`

### For Admin/Teacher Only:
- **Admin Dashboard** → `/admin/dashboard`
- **Manage Assignments** → `/admin/assignments`
- **Manage Simulations** → `/admin/simulations`
- **Question Bank** → `/admin/question-bank`
- **Manage Vocabulary** → `/admin/vocabulary`

### User Menu (Profile Icon):
- User information
- Role display
- View mode toggle (Admin/Teacher only)
- Sign out

---

## 🎓 Student Dashboard

**Route:** `/dashboard`  
**Component:** `src/app/dashboard/page.tsx`  
**Access:** All authenticated users (redirects admins to admin dashboard unless in student view mode)

### Tabs:
1. **Overview** - Statistics and quick actions
2. **Lessons** - Browse lessons
3. **Assignments** - View all assignments
4. **Games** - Vocabulary games

### Quick Actions (Links):
- **Browse Lessons** → `/lessons`
- **View Assignments** → `/assignments`
- **Vocabulary Games** → `/vocabulary`
- **Simulations** → `/simulations`
- **Slope Calculator** → `/simulations/slope-calculator`
- **Distance vs Displacement** → `/simulations/distance-displacement`
- **Area Under Curve** → `/simulations/area-under-curve`

---

## 📚 Lessons Section

### Lesson List
**Route:** `/lessons`  
**Component:** `src/app/lessons/page.tsx`  
**Access:** All authenticated users

**Links to:**
- Individual lessons → `/lessons/[slug]`

### Individual Lesson
**Route:** `/lessons/[slug]`  
**Component:** `src/app/lessons/[slug]/page.tsx`  
**Access:** All authenticated users

**Features:**
- Lesson content with KaTeX math rendering
- Embedded videos with interactive questions
- Progress tracking

---

## 📝 Assignments Section

### Assignment Hub (New!)
**Route:** `/assignments`  
**Component:** `src/app/assignments/page.tsx`  
**Access:** All authenticated users

**Shows:**
- All assigned work (lessons, homework, simulations)
- Filtered by course
- Status indicators (assigned, in progress, completed, graded, overdue)

**Links to:**
- Individual assignments → `/assignments/[id]`

### Take Assignment
**Route:** `/assignments/[id]`  
**Component:** `src/app/assignments/[id]/page.tsx`  
**Access:** All authenticated users

**Features:**
- Question rendering (multiple choice, numerical, open response, essay)
- Auto-save functionality
- Submit functionality

### Assignment Submitted
**Route:** `/assignments/[id]/submitted`  
**Component:** `src/app/assignments/[id]/submitted/page.tsx`  
**Access:** All authenticated users

**Shows:**
- Confirmation of submission
- Score (if graded)
- Feedback

---

## 🔬 Simulations Section

### Simulation List
**Route:** `/simulations`  
**Component:** `src/app/simulations/page.tsx`  
**Access:** All authenticated users

**Available Simulations:**
- Constant Velocity → `/simulations/constant-velocity`
- Uniformly Accelerated Motion → `/simulations/uniformly-accelerated-motion`
- Freefall Cliff → `/simulations/freefall-cliff`
- Measurement Precision → `/simulations/measurement-precision`
- Projectile Motion → `/simulations/projectile-motion`
- Slope Calculator → `/simulations/slope-calculator`
- Distance vs Displacement → `/simulations/distance-displacement`
- Area Under Curve → `/simulations/area-under-curve`

### Individual Simulation
**Route:** `/simulations/[slug]`  
**Component:** `src/app/simulations/[slug]/page.tsx` (specific simulation pages)
**Access:** All authenticated users

**Available Simulations:**
Each simulation has its own dedicated page:
- `/simulations/constant-velocity` - Constant Velocity Motion Lab
- `/simulations/uniformly-accelerated-motion` - Uniformly Accelerated Motion
- `/simulations/freefall-cliff` - Freefall Cliff Lab
- `/simulations/projectile-motion` - Projectile Motion Lab
- `/simulations/car-race` - Car Race Kinematics
- `/simulations/race-track` - Race Track Analysis
- `/simulations/monkey-hunter` - Monkey Hunter Lab
- `/simulations/vacuum-chamber` - Vacuum Chamber Freefall
- `/simulations/astronaut-thrust` - Astronaut Thrust Lab
- `/simulations/carts-third-law` - Newton's Third Law Carts
- `/simulations/riverboat-crossing` - Riverboat Crossing
- `/simulations/atwood-machine` - Atwood Machine
- `/simulations/maze-vectors` - Vector Maze Navigation
- `/simulations/free-body-diagram` - Free Body Diagram Tool
- `/simulations/sumo-forces` - Sumo Forces Simulation
- `/simulations/measurement-precision` - Measurement & Precision Lab
- `/simulations/slope-calculator` - Slope Calculator Tool
- `/simulations/distance-displacement` - Distance vs Displacement
- `/simulations/area-under-curve` - Area Under Curve Tool

**Features:**
- Interactive physics simulation
- Real-time calculations
- Data collection
- AI assistance (most simulations)
- Activity tracking
- Assignment integration

---

## 🎮 Vocabulary Games Section

### Vocabulary Hub
**Route:** `/vocabulary`  
**Component:** `src/app/vocabulary/page.tsx`  
**Access:** All authenticated users

**Available Games:**
- **Hangman** → `/vocabulary/hangman`
- **Matching** → `/vocabulary/matching`
- **Word Shoot** → `/vocabulary/word-shoot`
- **Concentration** → `/vocabulary/concentration`
- **Crossword** → `/vocabulary/crossword`
- **Quiz Bowl** → `/vocabulary/quiz-bowl`
- **Equation Visualizer** → `/vocabulary/equation-visualizer`

### Individual Game
**Routes:**
- `/vocabulary/hangman`
- `/vocabulary/matching`
- `/vocabulary/word-shoot`
- etc.

**Access:** All authenticated users

**Features:**
- Game-specific mechanics
- Score tracking
- Leaderboard integration

---

## 🏆 Gamification

**Route:** `/gamification`  
**Component:** (needs verification)  
**Access:** All authenticated users

**Features:**
- Leaderboard display
- Point tracking
- Achievement system

---

## 🎯 Admin Dashboard

**Route:** `/admin/dashboard`  
**Component:** `src/app/admin/dashboard/page.tsx`  
**Access:** Admin/Teacher only

### Main Tabs:

#### 1. Overview Tab
**Quick Actions:**
- **Manage Content** (switches to Content tab)
- **Assignment System** (switches to Assignments tab)
- **View Students** (switches to Students tab)
- **Manage Simulations** → `/admin/simulations`

**Navigation Cards:**
- Content Management
- Assignment System
- Student Analytics
- Teaching Tools

#### 2. Content Tab
**Sub-tabs:**
- **Lessons** - View and organize lessons
- **Assignments** - View and manage homework assignments

#### 3. Assignments Tab
**Features:**
- **Lesson Assignments** - Assign lessons to classes/students
- **Homework Assignments** - Assign homework to classes/students
- **Simulation Assignments** - Assign simulations to classes/students

#### 4. Gradebook Tab
**Features:**
- View all student submissions
- Grade assignments
- Export grades
- Sync to Google Classroom

#### 5. Students Tab
**Sub-tabs:**
- **Class Roster** - View student list
- **Analytics** - Student progress and engagement data

#### 6. Tools Tab
**Links:**
- **Question Bank** → `/admin/question-bank`
- **Vocabulary Management** → `/admin/vocabulary`
- **Integrations** (coming soon)

---

## 🔧 Admin Pages

### Assignment Management

#### Create Assignment
**Route:** `/admin/assignments/create`  
**Component:** `src/app/admin/assignments/create/page.tsx`  
**Access:** Admin/Teacher only

**Features:**
- Multi-step assignment builder
- Question editor with AI assistance
- Rubric builder

#### Create Simulation Assignment
**Route:** `/admin/assignments/create-simulation`  
**Component:** `src/app/admin/assignments/create-simulation/page.tsx`  
**Access:** Admin/Teacher only

**Features:**
- Select simulation
- Set rubric criteria
- Assign to classes/students

#### Assignment List
**Route:** `/admin/assignments`  
**Component:** `src/app/admin/assignments/page.tsx`  
**Access:** Admin/Teacher only

**Links to:**
- Create new assignment → `/admin/assignments/create`
- Create simulation assignment → `/admin/assignments/create-simulation`
- Edit assignments (inline)

#### Assignment System
**Route:** `/admin/assignments-system`  
**Component:** `src/app/admin/assignments-system/page.tsx`  
**Access:** Admin/Teacher only

**Features:**
- Unified assignment dashboard
- Lesson assignments
- Homework assignments
- Simulation assignments
- Progress tracking

### Lesson Management

#### Edit Lesson
**Route:** `/admin/lessons/[id]/edit`  
**Component:** `src/app/admin/lessons/[id]/edit/page.tsx`  
**Access:** Admin/Teacher only

**Features:**
- Rich text editor with math support
- Video embedding with interactive questions
- Publish/unpublish

#### Preview Lesson
**Route:** `/admin/lessons/[id]/preview`  
**Component:** `src/app/admin/lessons/[id]/preview/page.tsx`  
**Access:** Admin/Teacher only

**Features:**
- View lesson as students see it
- Test interactive elements

### Simulation Management

#### Manage Simulations
**Route:** `/admin/simulations`  
**Component:** `src/app/admin/simulations/page.tsx`  
**Access:** Admin/Teacher only

**Features:**
- View all simulations
- Edit simulation settings
- Create simulation assignments

**Links to:**
- Simulation analytics → `/admin/simulations/analytics`
- Create simulation assignment → `/admin/assignments/create-simulation`

#### Simulation Analytics
**Route:** `/admin/simulations/analytics`  
**Component:** `src/app/admin/simulations/analytics/page.tsx`  
**Access:** Admin/Teacher only

**Features:**
- Student engagement metrics
- Completion rates
- Time spent analysis

### Question Bank

**Route:** `/admin/question-bank`  
**Component:** `src/app/admin/question-bank/page.tsx`  
**Access:** Admin/Teacher only

**Features:**
- Browse all questions
- Filter by unit, lesson, difficulty, type
- Search functionality
- Add/edit/delete questions
- AI question generation
- Usage analytics

### Vocabulary Management

#### Vocabulary Hub
**Route:** `/admin/vocabulary`  
**Component:** `src/app/admin/vocabulary/page.tsx`  
**Access:** Admin/Teacher only

**Features:**
- Upload vocabulary lists
- Manage terms
- Configure games

#### Individual Game Setup
**Routes:**
- `/admin/vocabulary/hangman`
- `/admin/vocabulary/matching`
- `/admin/vocabulary/word-shoot`
- `/admin/vocabulary/concentration`
- `/admin/vocabulary/crossword`
- `/admin/vocabulary/quiz-bowl`

**Access:** Admin/Teacher only

**Features:**
- Game-specific settings
- Enable/disable games
- Set difficulty levels

### Database Migrations

#### Migration Hub
**Route:** `/admin/migrations`  
**Component:** `src/app/admin/migrations/page.tsx`  
**Access:** Admin only

**Features:**
- Run database migrations
- Check migration status
- Seed missing data

**Links to:**
- Check migration status → `/admin/migrations/check`

#### Migration Check
**Route:** `/admin/migrations/check`  
**Component:** `src/app/admin/migrations/check/page.tsx`  
**Access:** Admin only

**Features:**
- View migration history
- Check database status

---

## 🔗 Navigation Flow Diagrams

### Student User Flow
```
Landing (/) 
  → Sign In (/auth/signin)
  → Dashboard (/dashboard)
    ├→ Lessons (/lessons)
    │   └→ Individual Lesson (/lessons/[slug])
    ├→ Assignments (/assignments)
    │   └→ Take Assignment (/assignments/[id])
    │       └→ Submitted (/assignments/[id]/submitted)
    ├→ Simulations (/simulations)
    │   └→ Individual Simulation (/simulations/[slug])
    └→ Vocabulary (/vocabulary)
        └→ Individual Game (/vocabulary/[game])
```

### Admin/Teacher User Flow
```
Landing (/)
  → Sign In (/auth/signin)
  → Admin Dashboard (/admin/dashboard)
    ├→ Content Management
    │   ├→ Lessons
    │   │   ├→ Edit (/admin/lessons/[id]/edit)
    │   │   └→ Preview (/admin/lessons/[id]/preview)
    │   └→ Assignments
    ├→ Assignment System (/admin/assignments-system)
    │   ├→ Create Assignment (/admin/assignments/create)
    │   ├→ Create Simulation Assignment (/admin/assignments/create-simulation)
    │   └→ Manage Assignments (/admin/assignments)
    ├→ Gradebook
    ├→ Students
    │   ├→ Roster
    │   └→ Analytics
    ├→ Tools
    │   ├→ Question Bank (/admin/question-bank)
    │   ├→ Vocabulary (/admin/vocabulary)
    │   └→ Simulations (/admin/simulations)
    │       └→ Analytics (/admin/simulations/analytics)
    └→ View as Student (toggle)
        └→ Student Dashboard (/dashboard)
```

---

## 📊 API Routes

All API routes are in `src/app/api/` and support the pages above:

### Assignments
- `GET/POST /api/assignments` - Homework assignments CRUD
- `GET /api/assignments/[id]` - Single assignment
- `POST /api/assignments/lessons` - Lesson assignments
- `POST /api/assignments/simulations` - Simulation assignments
- `GET /api/assignments/student` - Student-specific assignments
- `GET /api/assignments/analytics` - Assignment analytics

### Student Activity
- `GET /api/student-activity` - Activity tracking
- `GET /api/student-activity/summary` - Summary statistics
- `GET /api/student-progress/lessons` - Lesson progress
- `GET /api/student-progress/game-scores` - Vocabulary game scores

### Simulations
- `GET /api/simulations` - All simulations
- `GET /api/simulations/[slug]` - Single simulation
- `POST /api/simulations/activity` - Track activity
- `POST /api/simulations/activity/interaction` - Track interactions
- `POST /api/simulations/activity/complete` - Mark complete
- `GET /api/simulations/analytics` - Analytics data
- `POST /api/simulations/ai-assist` - AI assistance

### Lessons
- `GET /api/lessons` - All lessons
- `GET /api/lessons/[id]` - Single lesson
- `GET /api/lessons/published` - Published lessons only
- `GET /api/lessons/[id]/videos` - Interactive video questions

### Vocabulary
- `GET/POST /api/vocabulary` - Vocabulary CRUD
- `POST /api/vocabulary/upload` - Bulk upload

### Question Bank
- `GET/POST /api/question-bank` - Questions CRUD
- `GET /api/question-bank/units` - Physics units
- `POST /api/question-bank/usage` - Track usage

### Rubrics
- `GET/POST /api/rubrics` - Rubric CRUD
- `GET /api/rubrics/assessments` - Rubric assessments

### Grading
- `POST /api/grade-assignment` - Grade assignment
- `POST /api/grade-open-response` - AI grade open response
- `GET /api/gradebook` - View gradebook
- `POST /api/gradebook/sync-to-classroom` - Sync to Google Classroom

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `POST /api/admin/run-migration` - Run migration
- `GET /api/admin/check-migration` - Check migration status
- `GET /api/admin/list-simulations` - List all simulations
- `POST /api/admin/seed-missing-simulations` - Seed database

### Authentication
- `/api/auth/[...nextauth]` - NextAuth.js endpoints

---

## 🎨 Special Features

### View Mode Toggle (Admin/Teacher)
Admins and teachers can toggle between:
- **Admin View** - Full admin capabilities
- **Student View** - See the site as students see it

**Toggle Location:** 
- Navbar (top right)
- Admin Dashboard header

### Mobile Navigation
- Hamburger menu on mobile devices
- Responsive design throughout
- Touch-friendly interactions

### Progressive Enhancement
- Loading states for all async operations
- Error boundaries for graceful failures
- Offline-first where possible (localStorage)

---

## 📝 Notes

1. **Role-based access** is enforced at both the component level and API level
2. **Redirects** happen automatically based on user role and authentication status
3. **Navigation persistence** - Active page highlighted in navbar
4. **Breadcrumbs** available on complex admin pages
5. **Quick actions** throughout the site for common tasks

---

*Last updated: October 8, 2024*

