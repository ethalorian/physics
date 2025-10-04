# 📚 Lessons System - Complete Guide

## Overview

The lessons system is the core educational content delivery mechanism in your Physics Classroom application. It allows teachers to create, manage, and deliver physics lessons to students with support for rich content, videos, objectives, and progress tracking.

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Database      │ ← Stores lesson data in Supabase
│   (lessons)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   API Layer     │ ← /api/lessons handles CRUD operations
│  (route.ts)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Components     │ ← Renders lessons for students & admins
│  (UI Layer)     │
└─────────────────┘
```

---

## 📊 Database Structure

### Lessons Table Schema
Location: `supabase/migrations/create_lessons_table.sql`

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,              -- Unique identifier
  title TEXT NOT NULL,              -- Lesson title
  slug TEXT UNIQUE NOT NULL,        -- URL-friendly identifier (e.g., "intro-to-motion")
  description TEXT,                 -- Brief description
  content TEXT,                     -- Main lesson content (Markdown with KaTeX math)
  unit TEXT NOT NULL,               -- Physics unit (e.g., "unit-1")
  lesson_number INTEGER NOT NULL,   -- Sequential number within unit
  published BOOLEAN DEFAULT FALSE,  -- Visibility control
  
  -- Rich content features
  videos JSONB DEFAULT '[]',        -- Array of YouTube video objects
  estimated_time INTEGER,           -- Minutes to complete
  objectives TEXT[],                -- Learning objectives array
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Video Object Structure (JSONB)
```typescript
{
  id: string           // Unique video ID
  title: string        // Video title
  youtubeId: string    // YouTube video ID (from URL)
  duration?: string    // e.g., "15:30"
  description?: string // Video description
  timestamp?: number   // Playback start position
}
```

### Indexes
- `slug` - Fast lookup by URL
- `unit` - Group lessons by unit
- `lesson_number` - Ordered display
- `published` - Filter published lessons
- `videos` (GIN) - Search within video data
- `objectives` (GIN) - Search objectives

---

## 🔄 Data Flow

### 1. **Admin Creates Lesson**
```
Admin Dashboard
    ↓
LessonManagement Component
    ↓
Supabase INSERT
    ↓
Lessons Table
```

### 2. **Student Views Lesson**
```
/lessons page (list view)
    ↓
Fetch from Supabase (published only)
    ↓
/lessons/[slug] page (individual lesson)
    ↓
Render with StudentLessonViewer
    ↓
Track activity (StudentActivityContext)
```

### 3. **Admin Adds Videos**
```
Admin Dashboard → Manage Lessons
    ↓
LessonVideoManager Component
    ↓
PUT /api/lessons/[id]/videos
    ↓
Update JSONB videos field
```

---

## 🎯 Key Components

### **Student-Facing Components**

#### 1. **`/src/app/lessons/page.tsx`** - Lessons List
- Displays all published lessons
- Groups by physics unit
- Shows "New" and "Interactive" badges
- Server-side rendered

#### 2. **`/src/app/lessons/[slug]/page.tsx`** - Individual Lesson
- Fetches lesson by slug
- Determines which viewer to use:
  - **StudentLessonViewer** - For lessons with videos/objectives
  - **EnhancedLessonView** - For special interactive lessons
  - **Default View** - For basic text lessons
- Wraps in `LessonActivityTracker` for progress monitoring

#### 3. **`StudentLessonViewer.tsx`** - Main Student UI
**Location:** `src/components/lessons/StudentLessonViewer.tsx`

**Features:**
- Embedded YouTube videos with custom controls
- Learning objectives checklist
- Progress tracking (% completion based on objectives)
- Mobile-responsive design
- Expandable content sections

**Props:**
```typescript
{
  lesson: Lesson              // Full lesson data
  onProgress?: (id, %) => void  // Progress callback
  onComplete?: (id) => void     // Completion callback
}
```

#### 4. **`EnhancedLessonView.tsx`** - Interactive Lessons
**Location:** `src/components/lessons/EnhancedLessonView.tsx`

Used for special lessons with interactive features:
- Train Tracks method for unit conversion
- Interactive calculators
- Gamified learning elements

### **Admin Components**

#### 1. **`LessonManagement.tsx`** - CRUD Interface
**Location:** `src/components/admin/LessonManagement.tsx`

**Features:**
- Create new lessons
- Edit existing lessons
- Delete lessons
- Toggle published status
- Preview lessons

**Form Fields:**
- Title
- Slug (URL-friendly)
- Description
- Content (Markdown with math)
- Unit selection
- Lesson number
- Published status

#### 2. **`LessonVideoManager.tsx`** - Video Management
**Location:** `src/components/admin/LessonVideoManager.tsx`

**Features:**
- Add YouTube videos to lessons
- Edit video metadata
- Reorder videos (drag-and-drop)
- Set timestamps for video sections
- Preview videos

#### 3. **`AdminLessonPreview.tsx`** - Preview Before Publishing
**Location:** `src/components/admin/AdminLessonPreview.tsx`

Shows how lesson will appear to students before making it public.

---

## 🔌 API Endpoints

### **GET /api/lessons**
Fetch lessons with optional filters

**Query Parameters:**
- `unit` - Filter by physics unit (e.g., "unit-1")
- `published` - Filter by published status (default: true)

**Response:**
```json
{
  "lessons": [
    {
      "id": "uuid",
      "title": "Introduction to Motion",
      "slug": "intro-to-motion",
      "description": "...",
      "unit": "unit-1",
      "lesson_number": 1,
      "estimated_time": 30,
      "objectives": ["...", "..."],
      "published": true
    }
  ],
  "totalCount": 24
}
```

### **GET /api/lessons/[id]/videos**
Fetch videos for a specific lesson

**Response:**
```json
{
  "id": "lesson-uuid",
  "title": "Lesson Title",
  "videos": [
    {
      "id": "video-1",
      "title": "Introduction",
      "youtubeId": "dQw4w9WgXcQ",
      "duration": "12:30"
    }
  ],
  "objectives": ["..."],
  "estimated_time": 30
}
```

### **PUT /api/lessons/[id]/videos**
Update videos, objectives, and estimated time

**Request Body:**
```json
{
  "videos": [
    {
      "id": "video-1",
      "title": "Introduction",
      "youtubeId": "dQw4w9WgXcQ"
    }
  ],
  "objectives": ["Learn X", "Understand Y"],
  "estimated_time": 30
}
```

---

## 📚 Static Data vs Database

### Static Physics Units (`src/data/physics-units.ts`)
This file defines the curriculum structure:
- 6 physics units (Motion, Forces, Energy, etc.)
- Lesson templates with objectives
- Used as fallback when database isn't initialized

### Database Lessons
Actual lesson content lives in Supabase:
- Full Markdown content
- Videos and rich media
- Publishing status
- Created dynamically by teachers

**Note:** The `unit` field in the database references the `id` from `physics-units.ts` (e.g., "unit-1")

---

## 🎨 Lesson Content Features

### 1. **Markdown Support**
Lessons support full Markdown with the `MathMarkdown` component:

```markdown
# Lesson Title

## Section

Regular text with **bold** and *italics*.

- Bullet points
- Work great

1. Numbered lists
2. Also supported
```

### 2. **Mathematical Expressions (KaTeX)**
```markdown
Inline math: \( F = ma \)

Display math:
\[ v = v_0 + at \]

Physics notation:
\( \Delta x = v_0 t + \frac{1}{2}at^2 \)
```

### 3. **YouTube Videos**
Videos are embedded using the YouTube IFrame API with:
- Custom playback controls
- Volume control
- Fullscreen support
- Timestamp navigation
- Progress tracking

### 4. **Learning Objectives**
Interactive checklist that students can mark as complete:
- Tracks progress percentage
- Visual completion indicators
- Reports back to student activity system

---

## 📍 Integration Points

### 1. **Assignment System**
- Assignments can be linked to lessons
- Students see related lessons for each assignment
- Lesson completion tracked alongside assignment progress

### 2. **Student Activity Tracking**
**Component:** `LessonActivityTracker.tsx`

Automatically tracks:
- When student views a lesson
- Time spent on lesson
- Video watch progress
- Objective completion
- Overall lesson completion

**Data sent to:** `/api/student-activity`

### 3. **Question Bank**
Questions can be tagged with:
- `lesson_id` - Link to specific lesson
- Helps teachers create assignments from relevant questions

### 4. **Google Classroom Integration**
Lessons can be:
- Shared as materials in Google Classroom
- Referenced in assignment descriptions
- Tracked for completion

---

## 🛠️ How to Make Common Changes

### **Add a New Lesson**

1. **Via Admin Dashboard** (Recommended)
   ```
   Admin → Lessons → Create New Lesson
   ```
   - Fill in title, slug, description
   - Write content using Markdown + KaTeX
   - Select unit and lesson number
   - Add objectives
   - Publish when ready

2. **Via Database** (For bulk imports)
   ```sql
   INSERT INTO lessons (
     title, slug, description, content, 
     unit, lesson_number, published
   ) VALUES (
     'Newton''s First Law',
     'newtons-first-law',
     'Understanding inertia and balanced forces',
     '# Newton''s First Law\n\nAn object at rest stays at rest...',
     'unit-2',
     2,
     true
   );
   ```

### **Add Videos to a Lesson**

1. Go to Admin Dashboard → Lessons
2. Click "Manage Videos" on the lesson card
3. Click "Add Video"
4. Enter:
   - Video Title
   - YouTube Video ID (from URL: `youtube.com/watch?v=VIDEO_ID_HERE`)
   - Optional: Duration, Description
5. Click "Save All Changes"

**Programmatically:**
```typescript
await fetch(`/api/lessons/${lessonId}/videos`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videos: [
      {
        id: 'v1',
        title: 'Introduction to Forces',
        youtubeId: 'dQw4w9WgXcQ',
        duration: '12:30'
      }
    ]
  })
})
```

### **Modify Lesson Display**

Want to change how lessons look to students?

**Edit:** `src/components/lessons/StudentLessonViewer.tsx`

Common customizations:
- **Change colors:** Update Tailwind classes
- **Add new sections:** Add new `<Card>` components
- **Modify video player:** Edit `VideoPlayer` component
- **Change progress calculation:** Modify `useEffect` that calculates progress

### **Add a New Lesson Type**

Currently supports 3 lesson types:
1. **Default** - Basic Markdown content
2. **With Videos** - StudentLessonViewer
3. **Interactive** - EnhancedLessonView

To add a new type:

1. Create new component in `src/components/lessons/`
2. Add detection logic in `src/app/lessons/[slug]/page.tsx`:
   ```typescript
   const isNewType = lesson.title.includes('keyword')
   
   if (isNewType) {
     return <NewLessonViewer lesson={lesson} />
   }
   ```

### **Change Lesson URL Structure**

Currently: `/lessons/[slug]`

To change to `/learn/[id]`:

1. Rename folder: `src/app/lessons/` → `src/app/learn/`
2. Update dynamic route: `[slug]/` → `[id]/`
3. Update query logic in `page.tsx` to fetch by `id` instead of `slug`
4. Update all links in components

---

## 🔍 Troubleshooting

### **"Lessons table does not exist"**
Run migration:
```bash
psql $DATABASE_URL -f supabase/migrations/create_lessons_table.sql
```

### **Videos not loading**
- Check YouTube video ID is correct
- Ensure videos JSONB is valid JSON array
- Check browser console for iframe errors

### **Math not rendering**
- Verify KaTeX syntax: `\( inline \)` or `\[ display \]`
- Check that `MathMarkdown` component is being used
- Look for JavaScript errors in console

### **Lesson not appearing**
- Check `published` is set to `true`
- Verify slug is unique
- Ensure user has proper permissions

### **Progress not tracking**
- Verify `LessonActivityTracker` is wrapping the lesson
- Check `/api/student-activity` endpoint is working
- Ensure user is authenticated

---

## 📈 Best Practices

### Content Creation
1. **Use clear, descriptive slugs:** `intro-to-motion` not `lesson1`
2. **Write objectives before content:** Helps structure the lesson
3. **Break long lessons into multiple lessons:** Keep under 30 minutes
4. **Use videos strategically:** Supplement, don't replace text
5. **Test on mobile:** Most students use phones

### Performance
1. **Optimize video thumbnails:** Use YouTube's default thumbnails
2. **Lazy load lesson content:** Current implementation is good
3. **Cache lesson data:** Consider adding Redis for popular lessons
4. **Minimize JSONB queries:** Use specific selects

### Accessibility
1. **Provide text alternatives for videos:** Use descriptions
2. **Use semantic HTML:** Current components do this well
3. **Ensure keyboard navigation works:** Test all interactive elements
4. **High contrast for math:** KaTeX handles this

---

## 🚀 Future Enhancement Ideas

### Potential Upgrades
1. **Lesson Versioning** - Track changes over time
2. **Student Notes** - Let students take notes within lessons
3. **Bookmarks** - Save position in long lessons
4. **Offline Mode** - Download lessons for offline viewing
5. **Lesson Playlists** - Curated lesson sequences
6. **Discussion Boards** - Q&A for each lesson
7. **Interactive Simulations** - PhET simulation embedding
8. **Quizzes in Lessons** - Check understanding as they learn
9. **Adaptive Content** - Show different content based on student level
10. **Video Transcripts** - Auto-generate from YouTube API

---

## 📞 Quick Reference

### Key Files
```
Database Schema:
  - supabase/migrations/create_lessons_table.sql

API Routes:
  - src/app/api/lessons/route.ts
  - src/app/api/lessons/[id]/videos/route.ts

Student UI:
  - src/app/lessons/page.tsx (list)
  - src/app/lessons/[slug]/page.tsx (individual)
  - src/components/lessons/StudentLessonViewer.tsx
  - src/components/lessons/EnhancedLessonView.tsx

Admin UI:
  - src/components/admin/LessonManagement.tsx
  - src/components/admin/LessonVideoManager.tsx
  - src/components/admin/AdminLessonPreview.tsx

Data:
  - src/data/physics-units.ts (static curriculum)
```

### Common Commands
```bash
# Create a lesson (Supabase SQL Editor)
INSERT INTO lessons (...) VALUES (...);

# Fetch all lessons
SELECT * FROM lessons WHERE published = true ORDER BY unit, lesson_number;

# Add videos to lesson
UPDATE lessons SET videos = '[{"id": "v1", ...}]' WHERE id = 'lesson-uuid';

# Check lesson count by unit
SELECT unit, COUNT(*) FROM lessons GROUP BY unit;
```

---

This guide should give you everything you need to understand and modify the lessons system! Let me know if you have questions about any specific part.

