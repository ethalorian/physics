# Lesson Preview System

A comprehensive preview system that allows administrators and teachers to view lessons from both student and admin perspectives, with device simulation and management tools.

## 🎯 Overview

The Lesson Preview System provides multiple ways to preview and manage lessons:

1. **Student View Preview** - See exactly what students see
2. **Admin Preview** - Enhanced preview with management tools
3. **Device Simulation** - Mobile, tablet, and desktop previews
4. **Quick Access** - Preview from multiple admin locations

## 🔍 Preview Options

### 1. Student View (Blue Eye Icon)
- **What it does**: Opens lesson in new tab exactly as students see it
- **URL**: `/lessons/[slug]`
- **Features**: 
  - Real student experience
  - Activity tracking enabled
  - Mobile-optimized layout
  - YouTube video embedding
  - Interactive objectives

### 2. Admin Preview (Green External Link Icon)
- **What it does**: Opens enhanced admin preview page
- **URL**: `/admin/lessons/[id]/preview`
- **Features**:
  - Student view toggle
  - Device simulation (mobile/tablet/desktop)
  - Video management
  - Content analysis
  - Metadata inspection

## 📱 Device Simulation

The admin preview includes device simulation modes:

- **📱 Mobile**: 384px width with mobile frame styling
- **📋 Tablet**: 768px width with tablet frame
- **🖥️ Desktop**: Full width responsive layout

Each mode shows how the lesson appears on different devices, helping ensure optimal mobile-first experience.

## 🛠 Access Points

### From Lesson Management
**Location**: Admin Dashboard > Content Tab > Lessons

Each lesson card has preview buttons:
```
[👁️] [🔗] [✏️] [🗑️]
 |     |     |     |
 |     |     |     Delete
 |     |     Edit
 |     Admin Preview  
 Student Preview
```

### From Admin Dashboard
**Location**: Admin Dashboard > Overview Tab

The "Recent Lessons" widget shows:
- Last 5 created lessons
- Quick stats (videos, objectives, time)
- Direct preview buttons for each lesson

### Direct URLs
- Student view: `/lessons/[slug]`
- Admin preview: `/admin/lessons/[id]/preview`

## 🎛 Admin Preview Features

### View Mode Toggle
Switch between:
- **Student View**: Exact student experience with device simulation
- **Admin View**: Enhanced management interface

### Admin View Tabs

#### 📊 Content Tab
- Full lesson content with math rendering
- Markdown preview
- Content analysis

#### 🎥 Videos Tab
- List all embedded videos
- YouTube links and metadata
- Duration and start time info
- Direct YouTube access

#### 🎯 Objectives Tab
- All learning objectives
- Numbered list format
- Easy to review and assess

#### 📋 Metadata Tab
- Lesson ID, slug, timestamps
- Publication status
- Direct student URL
- Database information

### Video Management
- **Inline Video Editor**: Add/edit videos directly in preview
- **YouTube Integration**: Paste URLs or IDs
- **Metadata Management**: Title, description, duration, start time
- **Live Updates**: Changes reflect immediately

## 🔧 Technical Implementation

### Components

#### `AdminLessonPreview.tsx`
Main preview component with:
- View mode switching
- Device simulation
- Video management integration
- Tabbed content organization

#### `QuickLessonPreview.tsx`
Dashboard widget showing:
- Recent lessons list
- Quick stats display
- Direct preview access
- Responsive design

#### Enhanced `LessonManagement.tsx`
Added preview buttons to existing lesson cards:
- Student preview (new tab)
- Admin preview (same tab)
- Visual button styling

### API Integration

#### `GET /api/lessons/[id]/videos`
Fetch lesson with parsed video data

#### `PUT /api/lessons/[id]/videos`
Update lesson videos, objectives, and metadata

### Database Schema
Uses existing lessons table with:
- `videos` JSONB column
- `objectives` TEXT[] column
- `estimated_time` INTEGER column

## 🎨 User Experience

### For Admins/Teachers
1. **Quick Preview**: Click eye icon for instant student view
2. **Detailed Analysis**: Use admin preview for comprehensive review
3. **Mobile Testing**: Check mobile experience before publishing
4. **Video Management**: Add/edit videos without leaving preview
5. **Content Validation**: Ensure everything renders correctly

### Visual Indicators
- **Blue Eye**: Student preview (safe, read-only)
- **Green Link**: Admin preview (management tools)
- **Device Icons**: Mobile/tablet/desktop simulation
- **Color-coded Stats**: Videos (blue), objectives (green), time (purple)

## 📊 Preview Analytics

The preview system tracks:
- **Preview Usage**: Which lessons are previewed most
- **Device Preferences**: Which preview modes are used
- **Content Gaps**: Lessons without videos/objectives
- **Recent Activity**: Latest lesson creation and updates

## 🚀 Usage Examples

### Quick Student Check
```
1. Go to Admin Dashboard > Content
2. Find lesson in list
3. Click blue eye icon 👁️
4. New tab opens with student view
```

### Comprehensive Review
```
1. Go to Admin Dashboard > Content  
2. Find lesson in list
3. Click green link icon 🔗
4. Admin preview opens with full tools
5. Toggle between student/admin views
6. Test different device sizes
7. Manage videos if needed
```

### Mobile Testing
```
1. Open admin preview
2. Ensure "Student View" is selected
3. Click mobile device icon 📱
4. Review mobile layout and usability
5. Test video playback and objectives
```

### Video Management
```
1. Open admin preview
2. Switch to "Admin View"
3. Click "Manage Videos" button
4. Add/edit YouTube videos
5. Save changes
6. Switch back to "Student View" to test
```

## 🔄 Workflow Integration

### Content Creation Workflow
1. Create lesson content
2. Add videos via admin preview
3. Set learning objectives
4. Preview on mobile/tablet/desktop
5. Test student experience
6. Publish when satisfied

### Quality Assurance
1. Use admin preview for content review
2. Check mobile responsiveness
3. Verify video playback
4. Test objective interactions
5. Validate math rendering

### Student Support
1. Preview lesson as student would see it
2. Identify potential confusion points
3. Test on different devices
4. Ensure accessibility compliance

## 📈 Benefits

### For Educators
- **Confidence**: See exactly what students see
- **Quality Control**: Catch issues before students do
- **Device Testing**: Ensure mobile-first experience works
- **Content Management**: Edit videos without complex interfaces

### For Students
- **Consistent Experience**: Lessons work well on all devices
- **Quality Content**: Pre-tested videos and interactions
- **Clear Objectives**: Well-defined learning goals
- **Mobile Access**: Optimized for phone/tablet learning

### For Administrators
- **Content Overview**: Quick assessment of lesson quality
- **Usage Analytics**: Understand which lessons are accessed
- **Quality Metrics**: Track video/objective completion rates
- **System Health**: Monitor lesson system performance

The Lesson Preview System ensures high-quality, mobile-first educational content that works seamlessly across all devices and provides teachers with the tools they need to create engaging, effective lessons.
