# User Context Sheet - Implementation Guide

## Overview
The User Context Sheet is a slide-out panel that displays complete student progress, game scores, and learning statistics. It features smooth animations, mobile swipe support, and a prominent close button.

## Access Points

### For Students & Teachers:
1. Click user avatar (top right)
2. Select **"My Progress"** from dropdown
3. Sheet slides in from right with smooth animation

## Visual Design

### Desktop View (Slides from Right):
```
[Main Screen Content]
                    │
                    │ ┌─ MY PROGRESS ─────────────┐
                    │ │ [X Close Button]          │
                    │ │                           │
                    │ │ 👤 John Doe               │
                    │ │    john@email.com         │
                    │ │    [Student Badge]        │
                    │ │                           │
                    │ │ ┌─ Quick Stats ─────────┐ │
                    │ │ │ 12 Lessons│45 Games   │ │
                    │ │ │ 87% Score │8 Perfect  │ │
                    │ │ └───────────────────────┘ │
                    │ │                           │
                    │ │ [Lessons] [Games]         │
                    │ │                           │
                    │ │ [Scrollable Content]      │
                    │ │                           │
                    │ └───────────────────────────┘
```

### Mobile View (Full Width, Swipe to Close):
```
┌─────────────────────────────────────────┐
│ ════ Swipe Indicator ════    [X Close]  │
│                                         │
│ 👤 John Doe                             │
│    john@email.com                       │
│    [Student Badge]                      │
│                                         │
│ ┌─ Quick Stats ───────────────────────┐ │
│ │ 12 Lessons Completed                │ │
│ │ 45 Games Played                     │ │
│ │ 87% Average Score                   │ │
│ │ 8 Perfect Games                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Lessons Tab] [Games Tab]               │
│                                         │
│ [Full height scrollable content]        │
│ [...]                                   │
│                                         │
└─────────────────────────────────────────┘
```

## Features

### 1. Smooth Slide Animation
- **Opens**: Slides in from right with smooth easing (0.5s)
- **Closes**: Slides out to right (0.3s)
- **Backdrop**: Fades in/out with blur effect
- **Animation Curve**: `cubic-bezier(0.16, 1, 0.3, 1)` for natural feel

### 2. Multiple Close Methods
- ✅ **Close Button** - Prominent X button (top right)
- ✅ **Click Outside** - Click backdrop to close
- ✅ **ESC Key** - Press Escape to close
- ✅ **Mobile Swipe** - Swipe right to close (built-in)

### 3. Mobile Optimizations
- **Full Width on Mobile** - `w-full` → `sm:w-3/4` → `sm:max-w-xl`
- **Touch-Friendly** - All buttons have `touch-manipulation`
- **Swipe Indicator** - Visual cue at top (mobile only)
- **Smooth Scrolling** - Vertical scroll with momentum
- **No Horizontal Scroll** - Prevents accidental dismissal

### 4. Visual Enhancements
- **Sticky Header** - Stays visible while scrolling
- **Gradient Header** - Blue to purple gradient background
- **Prominent Avatar** - Large circular avatar with gradient
- **Shadow Effects** - Depth with shadow-2xl
- **Backdrop Blur** - Modern glassmorphism effect

## Content Sections

### Quick Stats (Top)
Displays key metrics in 2x2 grid:
- Lessons Completed
- Games Played
- Average Game Score (%)
- Perfect Games Count

### Tabs (Lessons & Games)

#### Lessons Tab:
Each lesson card shows:
- Lesson title/slug
- Status badge (completed/in-progress)
- Progress bar with percentage
- Objectives completion (X/Y)
- Videos watched (X/Y)
- Video questions performance
- Time spent

#### Games Tab:
Each game card shows:
- Game type (capitalized)
- Difficulty badge
- Perfect game indicator (if applicable)
- Score (points/max)
- Accuracy percentage
- Time spent

### Total Learning Time (Bottom)
Summary card showing:
- Combined total time (lessons + games)
- Breakdown by activity type
- Gradient styling for emphasis

## Technical Implementation

### Component Structure
**File**: [src/components/UserContextSheet.tsx](mdc:src/components/UserContextSheet.tsx)

```typescript
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild>{children}</SheetTrigger>
  
  <SheetContent 
    side="right"
    className="w-full sm:max-w-xl overflow-y-auto p-0"
    onInteractOutside={() => setOpen(false)}
  >
    {/* Sticky Header */}
    <div className="sticky top-0 z-10 bg-gradient-to-br from-blue-50 to-purple-50 border-b p-6">
      {/* User info */}
      {/* Swipe indicator (mobile only) */}
    </div>
    
    {/* Scrollable Content */}
    <div className="p-6">
      {/* Stats, tabs, and cards */}
    </div>
  </SheetContent>
</Sheet>
```

### Sheet Component Enhancements
**File**: [src/components/ui/sheet.tsx](mdc:src/components/ui/sheet.tsx)

Enhanced animations:
```typescript
const sheetVariants = cva(
  "... shadow-2xl transition-all ease-in-out ...",
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 h-full w-full sm:w-3/4 
                data-[state=closed]:slide-out-to-right-full 
                data-[state=open]:slide-in-from-right-full 
                sm:max-w-xl touch-pan-y"
      }
    }
  }
)
```

Enhanced close button:
```typescript
<SheetPrimitive.Close 
  className="absolute right-4 top-4 
             rounded-full p-2 bg-white shadow-md 
             opacity-90 hover:opacity-100 
             hover:scale-110 transition-all 
             z-50 touch-manipulation"
>
  <X className="h-5 w-5 text-gray-700" />
</SheetPrimitive.Close>
```

### Custom Animations
**File**: [src/app/globals.css](mdc:src/app/globals.css)

Custom keyframes for smooth full-width slides:
```css
@keyframes slide-in-from-right-full {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slide-out-to-right-full {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}

/* Applied with data attributes */
.animate-in[data-state=open].slide-in-from-right-full {
  animation: slide-in-from-right-full 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Data Flow

### On Sheet Open:
1. User clicks "My Progress"
2. `setOpen(true)` triggered
3. `useEffect` fires → `fetchUserData()`
4. API calls to:
   - `/api/student-progress/game-scores`
   - `/api/student-progress/lessons`
5. Data displayed in tabs
6. Statistics calculated

### On Sheet Close:
- Click X button
- Click outside overlay
- Press ESC key
- Swipe right on mobile
- All trigger `setOpen(false)`

## Mobile Swipe Behavior

### How It Works:
Radix UI Dialog (Sheet's base) includes built-in swipe-to-dismiss:
- **Touch-friendly** - Large touch targets (44px+)
- **Swipe right** - Natural dismissal gesture
- **Momentum** - Follows finger with physics
- **Threshold** - Must swipe past certain point
- **Cancel** - Release early to cancel close

### Visual Indicators:
- Swipe handle bar at top (mobile only)
- Backdrop darkens on drag
- Sheet follows finger position
- Snaps closed when threshold reached

## Responsive Behavior

### Mobile (< 640px):
- Full screen width
- Swipe indicator visible
- Touch-optimized spacing
- Larger touch targets
- Vertical scroll only

### Tablet (640px - 1024px):
- 75% screen width
- Swipe still works
- Close button more prominent
- Side-by-side stats

### Desktop (> 1024px):
- Max 640px width (xl)
- Hover effects enabled
- Mouse click outside to close
- Keyboard shortcuts work

## Accessibility

### Keyboard Navigation:
- **Tab** - Navigate through content
- **ESC** - Close sheet
- **Enter/Space** - Activate focused button

### Screen Readers:
- Proper ARIA labels
- Sheet announces as dialog
- Close button has "Close" label
- Content properly structured

### Focus Management:
- Focus trapped in sheet when open
- Returns to trigger on close
- Logical tab order

## Integration Points

### Navbar Integration:
**File**: [src/components/navbar.tsx](mdc:src/components/navbar.tsx)

```typescript
<UserContextSheet>
  <DropdownMenuItem 
    onSelect={(e) => e.preventDefault()}
    className="cursor-pointer"
  >
    <Users className="h-4 w-4 mr-2" />
    My Progress
  </DropdownMenuItem>
</UserContextSheet>
```

### API Integration:
- Game scores from `/api/student-progress/game-scores`
- Lesson progress from `/api/student-progress/lessons`
- Real-time data fetching on open
- Automatic statistic calculations

## Best Practices

### Performance:
- Lazy load data (only fetch on open)
- Debounced updates
- Optimistic UI updates
- Efficient re-renders

### UX:
- Clear visual hierarchy
- Color-coded information
- Progress bars for visual feedback
- Badges for status indicators
- Time formatting (minutes/seconds)

### Mobile:
- Large touch targets (minimum 44px)
- Clear swipe affordance
- Smooth animations
- No accidental triggers
- Easy dismissal

## Customization Options

### Adjusting Width:
```typescript
<SheetContent className="w-full sm:max-w-2xl"> // Wider
<SheetContent className="w-full sm:max-w-md">  // Narrower
```

### Changing Side:
```typescript
<SheetContent side="left">  // Slide from left
<SheetContent side="bottom"> // Slide from bottom
```

### Animation Speed:
Adjust in globals.css:
```css
animation: slide-in-from-right-full 0.3s ... // Faster
animation: slide-in-from-right-full 0.7s ... // Slower
```

## Troubleshooting

### Sheet Won't Open:
- Check `open` state is controlled
- Verify trigger is properly wrapped
- Check for z-index conflicts

### Swipe Not Working:
- Ensure `touch-pan-y` class present
- Check for conflicting touch handlers
- Verify Radix Dialog version is up to date

### Animation Stuttering:
- Check for heavy computations during render
- Use React.memo for expensive components
- Debounce data fetching

### Close Button Not Visible:
- Check z-index (should be z-50)
- Verify absolute positioning
- Ensure parent has relative/static position

## Files Modified

- [src/components/UserContextSheet.tsx](mdc:src/components/UserContextSheet.tsx) - Main component
- [src/components/ui/sheet.tsx](mdc:src/components/ui/sheet.tsx) - Enhanced animations
- [src/app/globals.css](mdc:src/app/globals.css) - Custom keyframes
- [src/components/navbar.tsx](mdc:src/components/navbar.tsx) - Integration

---

**Result**: Beautiful, mobile-friendly slide-out panel with smooth animations and multiple close methods! 🎉
