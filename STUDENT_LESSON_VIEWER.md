# Student Lesson Viewer - YouTube Video Integration

A mobile-first, responsive lesson viewer component that enables embedding of instructional YouTube videos with interactive learning objectives and progress tracking.

## 🎯 Features

### Mobile-First Design
- **Responsive Layout**: Optimized for mobile devices with desktop enhancements
- **Touch-Friendly**: Large touch targets and intuitive interactions
- **Progressive Enhancement**: Works on all screen sizes with appropriate layouts

### YouTube Video Integration
- **Embedded Player**: Native YouTube iframe embedding with custom controls
- **Multiple Videos**: Support for multiple videos per lesson with easy navigation
- **Start Times**: Videos can start at specific timestamps
- **External Links**: Quick access to open videos in YouTube app/website

### Interactive Learning
- **Learning Objectives**: Checkable objectives with progress tracking
- **Progress Bar**: Visual progress indicator based on completed objectives  
- **Collapsible Sections**: Organized content in expandable sections
- **Completion Status**: Clear indication when lesson is complete

### Content Organization
- **Structured Layout**: Header with lesson info, videos, objectives, and content
- **Math Support**: Full KaTeX math rendering in lesson content
- **Responsive Cards**: Clean card-based layout that adapts to screen size

## 🛠 Implementation

### Core Components

#### `StudentLessonViewer.tsx`
Main component that orchestrates the lesson viewing experience:

```typescript
interface StudentLessonViewerProps {
  lesson: {
    id: string
    title: string
    description?: string
    content?: string
    unit: string
    lesson_number: number
    objectives?: string[]
    videos?: LessonVideo[]
    estimated_time?: number
  }
  onProgress?: (lessonId: string, progress: number) => void
  onComplete?: (lessonId: string) => void
}
```

#### `YouTubeEmbed` Component
Handles YouTube video embedding with:
- 16:9 aspect ratio container
- Loading states and error handling
- Touch-friendly controls overlay
- External link to YouTube

#### `LearningObjectives` Component
Interactive checklist with:
- Click to toggle completion
- Visual completion states
- Progress calculation

### Database Schema

The lesson viewer requires these database columns:

```sql
-- Added to existing lessons table
ALTER TABLE lessons 
ADD COLUMN videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN objectives TEXT[] DEFAULT '{}',
ADD COLUMN estimated_time INTEGER;
```

#### Video JSON Structure
```json
[
  {
    "id": "video-1",
    "title": "Introduction to Velocity",
    "youtubeId": "dQw4w9WgXcQ", 
    "duration": "8:42",
    "description": "Basic concepts of velocity and speed",
    "timestamp": 30
  }
]
```

### Integration Points

#### Lesson Page Router
The viewer automatically activates for lessons with videos or objectives:

```typescript
// In src/app/lessons/[slug]/page.tsx
if (lesson.videos?.length > 0 || lesson.objectives?.length > 0) {
  return (
    <LessonActivityTracker lessonId={lesson.id}>
      <StudentLessonViewer lesson={lesson} />
    </LessonActivityTracker>
  )
}
```

#### Activity Tracking
Integrates with existing `LessonActivityTracker` for:
- Session duration tracking
- Progress persistence
- Analytics data collection

### API Endpoints

#### `PUT /api/lessons/[id]/videos`
Update lesson videos, objectives, and estimated time:

```typescript
const response = await fetch(`/api/lessons/${lessonId}/videos`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videos: [...],
    objectives: [...],
    estimated_time: 25
  })
})
```

## 📱 Mobile-First Design Principles

### Layout Strategy
1. **Vertical Stacking**: All content stacks vertically on mobile
2. **Sticky Header**: Key lesson info stays visible while scrolling
3. **Full-Width Videos**: Videos use full container width with proper aspect ratio
4. **Touch Targets**: Minimum 44px touch targets for all interactive elements

### Responsive Breakpoints
- **Mobile**: `< 768px` - Single column, full-width components
- **Tablet**: `768px - 1024px` - Larger text, more spacing
- **Desktop**: `> 1024px` - Max-width container, enhanced typography

### Performance Optimizations
- **Lazy Loading**: YouTube iframes load on demand
- **Progressive Enhancement**: Core content loads first, videos enhance
- **Efficient Rendering**: Minimized re-renders with proper state management

## 🎨 Visual Design

### Design System Integration
- Uses existing shadcn/ui components
- Consistent with physics classroom theme
- Accessible color contrast and typography

### Interactive States
- **Hover Effects**: Subtle animations on desktop
- **Focus States**: Clear keyboard navigation
- **Loading States**: Smooth loading transitions
- **Completion States**: Green success indicators

### Mobile UX Enhancements
- **Swipe-Friendly**: Easy navigation between videos
- **Thumb-Friendly**: Controls positioned for one-handed use
- **Readable Text**: Optimal font sizes for mobile reading
- **Minimal Scrolling**: Content organized to minimize vertical scrolling

## 🔧 Admin Management

### `LessonVideoManager.tsx`
Admin component for managing lesson videos:

- **Video Editor**: Form for adding/editing videos
- **URL Validation**: Automatic YouTube URL/ID extraction
- **Drag & Drop**: Reorder videos (future enhancement)
- **Live Preview**: Test videos before saving

### YouTube URL Support
Accepts multiple YouTube URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `VIDEO_ID` (direct ID)

## 🚀 Usage Examples

### Basic Lesson with Videos
```typescript
const lesson = {
  id: "lesson-1",
  title: "Introduction to Motion",
  description: "Learn the basics of motion",
  unit: "Unit 1: Kinematics",
  lesson_number: 1,
  videos: [
    {
      id: "v1",
      title: "What is Motion?",
      youtubeId: "ZM8ECpBuQYE",
      duration: "8:42"
    }
  ],
  objectives: [
    "Define motion and position",
    "Calculate displacement"
  ],
  estimated_time: 15
}

<StudentLessonViewer 
  lesson={lesson}
  onProgress={(id, progress) => console.log(`Lesson ${id}: ${progress}%`)}
  onComplete={(id) => console.log(`Lesson ${id} completed!`)}
/>
```

### Admin Video Management
```typescript
<LessonVideoManager
  lessonId="lesson-1"
  lessonTitle="Introduction to Motion"
  initialVideos={existingVideos}
  onSave={async (videos) => {
    await updateLessonVideos(lessonId, videos)
  }}
/>
```

## 📊 Analytics & Tracking

The viewer integrates with the existing student activity system:

### Progress Tracking
- **Objective Completion**: Tracks which objectives are completed
- **Video Engagement**: Could track video play/pause events (future)
- **Time Spent**: Integrates with session duration tracking
- **Completion Status**: Marks lesson complete when all objectives done

### Data Points Collected
- Lesson view events
- Progress percentage updates
- Completion timestamps
- Session duration
- Device/screen size information

## 🔄 Future Enhancements

### Planned Features
1. **Video Bookmarks**: Save specific timestamps in videos
2. **Interactive Transcripts**: Clickable video transcripts
3. **Video Quizzes**: Embedded questions within videos
4. **Offline Support**: Download videos for offline viewing
5. **Accessibility**: Enhanced screen reader support
6. **Video Analytics**: Detailed viewing statistics

### Technical Improvements
1. **Video Preloading**: Smart preloading of next videos
2. **Adaptive Quality**: Automatic quality selection based on connection
3. **Picture-in-Picture**: Continue watching while browsing content
4. **Keyboard Shortcuts**: Video control shortcuts
5. **Gesture Support**: Swipe navigation between videos

## 📋 Sample Data

To test the viewer, you can run the sample SQL script:

```bash
# Apply the migration first
psql -d your_database -f supabase/migrations/add_lesson_videos_support.sql

# Add sample lesson
psql -d your_database -f src/scripts/create-sample-lesson.sql
```

This creates a demo lesson at `/lessons/intro-to-motion-demo` with:
- 3 physics YouTube videos
- 5 learning objectives  
- 25-minute estimated completion time
- Full lesson content with math equations

## 🎓 Educational Benefits

### For Students
- **Visual Learning**: Video content supports different learning styles
- **Self-Paced**: Students control their learning pace
- **Clear Goals**: Objectives provide clear learning targets
- **Progress Tracking**: Visual feedback on completion
- **Mobile Access**: Learn anywhere, anytime

### For Teachers
- **Easy Content Creation**: Simple video embedding process
- **Progress Monitoring**: Track student engagement and completion
- **Flexible Organization**: Multiple videos per lesson
- **Analytics**: Understand how students interact with content
- **Time Estimation**: Help students plan their study time

The Student Lesson Viewer transforms static lesson content into an engaging, interactive learning experience optimized for modern mobile-first education.
