# Lessons System - Quick Visual Reference

## 🎯 The Big Picture

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                 LESSONS SYSTEM                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

         ┌─────────────────────────────────┐
         │   👨‍🏫 ADMIN/TEACHER CREATES      │
         │                                 │
         │  • Write Markdown content       │
         │  • Add YouTube videos           │
         │  • Set learning objectives      │
         │  • Publish when ready           │
         └────────────┬────────────────────┘
                      │
                      ↓
         ┌─────────────────────────────────┐
         │   💾 STORED IN DATABASE         │
         │                                 │
         │  Table: lessons                 │
         │  • Content (Markdown)           │
         │  • Videos (JSONB array)         │
         │  • Objectives (TEXT array)      │
         │  • Published status             │
         └────────────┬────────────────────┘
                      │
                      ↓
         ┌─────────────────────────────────┐
         │   🌐 API LAYER                  │
         │                                 │
         │  GET /api/lessons               │
         │  • Fetch by unit                │
         │  • Filter published             │
         │  • Sort by lesson_number        │
         └────────────┬────────────────────┘
                      │
                      ↓
         ┌─────────────────────────────────┐
         │   👨‍🎓 STUDENT VIEWS              │
         │                                 │
         │  /lessons (list all)            │
         │  /lessons/[slug] (individual)   │
         │  • Watch videos                 │
         │  • Check off objectives         │
         │  • Track progress               │
         └─────────────────────────────────┘
```

---

## 📊 Data Structure

### Lesson Object
```javascript
{
  // Core Identity
  id: "550e8400-e29b-41d4-a716-446655440000",  // UUID
  slug: "intro-to-motion",                      // URL identifier
  title: "Introduction to Motion",
  
  // Content
  description: "Learn about position, distance, and displacement",
  content: "# Introduction\n\nMotion is...",  // Markdown with math
  
  // Organization
  unit: "unit-1",                              // Links to physics-units.ts
  lesson_number: 1,                            // Order within unit
  published: true,                             // Visibility
  
  // Learning Features
  videos: [                                    // JSONB array
    {
      id: "video-1",
      title: "What is Motion?",
      youtubeId: "dQw4w9WgXcQ",
      duration: "12:30",
      description: "Introduction video"
    }
  ],
  objectives: [                                // TEXT array
    "Define position and displacement",
    "Calculate average velocity",
    "Interpret position-time graphs"
  ],
  estimated_time: 30,                          // Minutes
  
  // Metadata
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-20T15:30:00Z"
}
```

---

## 🔄 Component Flow for Students

### When Student Clicks on a Lesson

```
User clicks on lesson card
        ↓
/lessons/[slug] page loads
        ↓
Server fetches from database
        ↓
Determines lesson type:
        ↓
┌───────┴───────┬────────────────┐
│               │                │
Has videos?   Enhanced?      Plain text?
│               │                │
↓               ↓                ↓
StudentLessonViewer  EnhancedLessonView  Default View
│               │                │
└───────┬───────┴────────────────┘
        ↓
Wrapped in LessonActivityTracker
        ↓
Tracks student progress
        ↓
Sends data to /api/student-activity
```

---

## 🎨 Student View Components

### StudentLessonViewer Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📱 MOBILE-FIRST LESSON VIEWER              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌──────────────────────────────────────────┐
│  STICKY HEADER                           │
│  • Unit badge • Lesson # • Time          │
│  • Title                                 │
│  • Description                           │
│  • Progress Bar (0-100%)                 │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  📹 VIDEO SECTION (if videos exist)      │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │     YouTube Video Player           │  │
│  │     with Custom Controls           │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Video 1 of 3: "Introduction"           │
│  [Previous]           [Next]             │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  🎯 LEARNING OBJECTIVES                  │
│  [ ] Define position and displacement    │
│  [✓] Calculate average velocity          │
│  [ ] Interpret position-time graphs      │
│                                          │
│  Completed: 1/3 (33%)                    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  📖 LESSON CONTENT                       │
│  [Expand/Collapse]                       │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  # Motion Fundamentals             │  │
│  │                                    │  │
│  │  Position is \( \vec{x} \)...      │  │
│  │                                    │  │
│  │  The velocity equation:            │  │
│  │  \[ v = \frac{\Delta x}{\Delta t} \]  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 🛠️ Admin Management Flow

### Creating a New Lesson

```
Admin Dashboard → Lessons
        ↓
Click "Create New Lesson"
        ↓
┌───────────────────────────────┐
│  LESSON FORM                  │
│  • Title: _________________   │
│  • Slug: __________________   │
│  • Description: ___________   │
│  • Content (Markdown): ____   │
│  • Unit: [dropdown]           │
│  • Lesson #: [1]              │
│  • Published: [ ]             │
│                               │
│  [Save]  [Cancel]             │
└───────────────────────────────┘
        ↓
Saved to database
        ↓
Now visible in list
        ↓
Click "Manage Videos"
        ↓
┌───────────────────────────────┐
│  VIDEO MANAGER                │
│                               │
│  [+ Add Video]                │
│                               │
│  Video 1:                     │
│  • Title: ________________    │
│  • YouTube ID: ___________    │
│  • Duration: ______________   │
│                               │
│  [↑] [↓] [Edit] [Delete]      │
│                               │
│  [Save All Changes]           │
└───────────────────────────────┘
        ↓
Lesson is ready!
        ↓
Toggle "Published" to make visible to students
```

---

## 📂 File Structure Map

```
physics-classroom/
│
├── 💾 DATABASE
│   └── supabase/migrations/
│       └── create_lessons_table.sql         ← Schema definition
│
├── 🌐 API ROUTES
│   └── src/app/api/lessons/
│       ├── route.ts                         ← GET lessons, POST new
│       └── [id]/videos/
│           └── route.ts                     ← GET/PUT videos
│
├── 📄 STUDENT PAGES
│   └── src/app/lessons/
│       ├── page.tsx                         ← List all lessons
│       └── [slug]/
│           └── page.tsx                     ← Individual lesson
│
├── 🎨 STUDENT COMPONENTS
│   └── src/components/lessons/
│       ├── StudentLessonViewer.tsx          ← Main viewer (with videos)
│       ├── EnhancedLessonView.tsx           ← Interactive lessons
│       └── LessonActivityTracker.tsx        ← Progress tracking
│
├── 👨‍💼 ADMIN COMPONENTS
│   └── src/components/admin/
│       ├── LessonManagement.tsx             ← CRUD operations
│       ├── LessonVideoManager.tsx           ← Video management
│       └── AdminLessonPreview.tsx           ← Preview before publish
│
└── 📊 STATIC DATA
    └── src/data/
        └── physics-units.ts                 ← Curriculum structure
```

---

## 🎯 Common Tasks Cheat Sheet

### For Teachers/Admins

| Task | Where to Go |
|------|-------------|
| Create a new lesson | Admin Dashboard → Lessons → "Create New" |
| Add videos to lesson | Admin Dashboard → Lessons → "Manage Videos" |
| Preview before publishing | Edit lesson → "Preview" button |
| Unpublish a lesson | Toggle "Published" switch off |
| Reorder lessons | Change `lesson_number` field |
| Add learning objectives | Edit lesson → Objectives field |

### For Developers

| Task | File to Edit |
|------|-------------|
| Change lesson card design | `src/app/lessons/page.tsx` |
| Modify video player | `src/components/lessons/StudentLessonViewer.tsx` (VideoPlayer function) |
| Add new lesson type | `src/app/lessons/[slug]/page.tsx` (add condition) |
| Change API response | `src/app/api/lessons/route.ts` |
| Add database column | Create new migration in `supabase/migrations/` |
| Modify progress calculation | `StudentLessonViewer.tsx` (useEffect with objectives) |

---

## 🔍 Debugging Quick Checks

### Lesson Not Showing Up?
```
✓ Check: lesson.published = true
✓ Check: No errors in browser console
✓ Check: Lesson has valid slug
✓ Check: Database connection working
```

### Videos Not Loading?
```
✓ Check: YouTube ID is correct (11 characters)
✓ Check: videos JSONB is valid JSON
✓ Check: No CORS errors in console
✓ Check: YouTube video is not restricted
```

### Math Not Rendering?
```
✓ Check: Using \( \) for inline or \[ \] for display
✓ Check: MathMarkdown component is imported
✓ Check: KaTeX is loaded (check Network tab)
✓ Check: Content has correct escaping
```

### Progress Not Tracking?
```
✓ Check: User is logged in
✓ Check: LessonActivityTracker is wrapping component
✓ Check: /api/student-activity endpoint responds
✓ Check: Browser console for errors
```

---

## 💡 Pro Tips

1. **Slugs are important** - They're the URL, so make them descriptive: `newtons-first-law` not `lesson2`

2. **Start with objectives** - Write learning objectives before content. It helps structure your lesson.

3. **Videos supplement, don't replace** - Keep text content comprehensive even with videos.

4. **Test on mobile** - Most students will view on phones. The layout is mobile-first.

5. **Use the preview** - Always preview before publishing to catch formatting issues.

6. **Math syntax** - Remember to escape backslashes in your content: `\\(` or use raw strings.

7. **Estimated time matters** - Students appreciate knowing how long a lesson will take.

8. **Objectives drive progress** - The progress bar is based on checked objectives, so add them!

---

## 📞 Need More Help?

- **Full Documentation**: See `LESSONS_SYSTEM_GUIDE.md` in this directory
- **API Reference**: Check comments in `src/app/api/lessons/route.ts`
- **Component Props**: Look at TypeScript interfaces in component files
- **Database Schema**: Review `supabase/migrations/create_lessons_table.sql`

---

**Last Updated:** January 2025
**Version:** 1.0

