# Assignment Builder Enhancement Plan

**Date:** October 8, 2024  
**Status:** Planning → Implementation

---

## 🎯 **Enhancement Goals**

Transform the assignment creation page from a basic form into a **comprehensive, feature-rich builder** that leverages all available site functionality.

---

## 📊 **Current vs Enhanced**

### **Current Features** ✅
- Basic assignment details (title, description, instructions)
- Question creation with multiple types
- Question Bank integration
- Rubric builder
- Due date setting
- Publish/draft options

### **Missing Features** ❌
- Physics unit/lesson integration
- Tags and topics system
- Difficulty level selection
- Estimated completion time
- AI assistant panel (quick access)
- Template system
- Standards alignment (NGSS)
- Import/export functionality
- Preview mode
- Progress indicator
- Better organization/tabs
- Breadcrumb navigation

---

## ✨ **Proposed Enhancements**

### **1. Organized Tab Structure**
```
┌─────────────────────────────────────────┐
│ [Basics] [Content] [Settings] [Review] │
└─────────────────────────────────────────┘
```

**Tab 1: Basics**
- Title, description, instructions
- Physics unit & lesson selection
- Tags & topics
- Difficulty level
- Estimated time

**Tab 2: Content**
- Question builder (current editor)
- Question Bank access
- AI Assistant panel (sticky sidebar)

**Tab 3: Settings**
- Due date & time
- Attempts allowed
- Time limit (optional)
- Shuffle questions
- Show feedback immediately
- Late submission policy

**Tab 4: Review**
- Preview as student would see
- Summary of all questions
- Point distribution chart
- Quick edit links

### **2. Enhanced Basics Section**

#### **Physics Unit Selection**
```typescript
<Select>
  <SelectItem value="unit-1">Motion and Kinematics</SelectItem>
  <SelectItem value="unit-2">Forces and Newton's Laws</SelectItem>
  <SelectItem value="unit-3">Energy and Work</SelectItem>
  // ... from physics-units.ts
</Select>
```

#### **Lesson Linking**
- Dropdown filtered by selected unit
- Shows lesson objectives
- Optional: Can link multiple lessons

#### **Tags & Topics**
```
Physics Topics:
[×] Velocity  [×] Acceleration  [×] Graphs  [×] Kinematics
+ Add Custom Tag
```

#### **Difficulty Level**
```
○ Beginner    ● Intermediate    ○ Advanced
```

#### **Estimated Time**
```
⏱️ Estimated Completion: [30] minutes
```

### **3. AI Assistant Panel**

**Sticky sidebar with quick AI access:**

```
┌─────────────────────────────┐
│   🤖 AI Assistant           │
├─────────────────────────────┤
│                             │
│ Quick Actions:              │
│                             │
│ [🪄 Generate MC Question]   │
│ [📝 Generate Open Question] │
│ [🖼️  Generate Scenario Image]│
│ [🧮 Calculate Answer]       │
│ [💡 Suggest Topics]         │
│                             │
│ Recent Generations:         │
│ • Option set for Q3         │
│ • Image for Q1              │
│                             │
└─────────────────────────────┘
```

### **4. Template System**

**Start from common templates:**

```
Start with a template:
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Quiz      │ │   Homework  │ │   Lab Report│
│   5-10 MC   │ │   Mixed Qs  │ │   Open Resp │
│   15 min    │ │   30 min    │ │   45 min    │
└─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Concept   │ │   Problem   │ │   Blank     │
│   Check     │ │   Set       │ │   Canvas    │
│   10 MC     │ │   Numerical │ │   Custom    │
└─────────────┘ └─────────────┘ └─────────────┘
```

### **5. Enhanced Settings**

```typescript
interface AssignmentSettings {
  // Timing
  dueDate?: Date
  timeLimit?: number          // Minutes (optional)
  gracePeriod?: number        // Late submission window
  
  // Attempts
  maxAttempts?: number        // 1 = one try, 0 = unlimited
  showBestAttempt?: boolean
  
  // Feedback
  showFeedbackImmediately: boolean
  showCorrectAnswers: boolean
  showScoreBreakdown: boolean
  
  // Behavior
  shuffleQuestions: boolean
  shuffleOptions: boolean
  allowBacktracking: boolean
  
  // Access
  requirePasscode?: string
  availableFrom?: Date
  availableUntil?: Date
}
```

### **6. Preview Mode**

**Full preview as student would see:**
- Exact rendering of questions
- Shows point values
- Shows instructions
- Shows timer (if enabled)
- Navigation between questions
- Can't submit (preview only)

### **7. Standards Alignment**

```
NGSS Standards:
[×] HS-PS2-1: Newton's Laws
[×] HS-PS2-2: Forces & Motion
+ Add Standard

State Standards:
[×] MA.HS.PS.2.1
+ Add Standard
```

### **8. Better UX Elements**

#### **Breadcrumbs**
```
Admin > Assignments > Create New Assignment
```

#### **Progress Indicator**
```
Basics ──── Content ──── Settings ──── Review
  ●            ○            ○            ○
```

#### **Autosave**
```
💾 Saved 2 minutes ago
```

#### **Question Counter**
```
Questions: 5 | Total Points: 75 | Est. Time: 25 min
```

### **9. Import/Export**

```
[📥 Import]  [📤 Export]  [📋 Duplicate]

Import from:
• JSON file
• Previous assignment
• Question Bank selection
• Template

Export as:
• JSON file
• PDF (print version)
• Google Classroom
• Copy share link
```

### **10. Enhanced Question Builder**

**Each question card shows:**
```
┌────────────────────────────────────────┐
│ Question 1: Multiple Choice  [↑][↓][×]│
├────────────────────────────────────────┤
│                                        │
│ What is Newton's Second Law?           │
│                                        │
│ [🤖 AI Options] [🖼️  Image] [💾 To Bank]│
│                                        │
│ ○ Option A                  Points: 5  │
│ ○ Option B                             │
│ ○ Option C                  Tags:      │
│ ○ Option D                  [Newton]   │
│                             [Forces]    │
└────────────────────────────────────────┘
```

---

## 🔧 **Implementation Plan**

### **Phase 1: Structure & Layout** (Priority 1)
1. Add tab navigation
2. Organize existing fields into tabs
3. Add breadcrumb navigation
4. Add progress indicator
5. Implement autosave

### **Phase 2: Physics Integration** (Priority 1)
1. Add physics unit selector
2. Add lesson selector (filtered by unit)
3. Integrate with physics-units.ts data
4. Add tags/topics selection
5. Add difficulty level selector
6. Add estimated time input

### **Phase 3: AI Assistant** (Priority 2)
1. Create AI assistant sidebar component
2. Add quick action buttons
3. Integrate with existing AI endpoints
4. Show recent AI generations
5. Add usage hints/tips

### **Phase 4: Advanced Settings** (Priority 2)
1. Add time limit option
2. Add attempt limits
3. Add feedback settings
4. Add shuffle options
5. Add access control options

### **Phase 5: Templates** (Priority 3)
1. Create template system
2. Define common templates
3. Add template selector
4. Implement "Start from template"
5. Add "Save as template" option

### **Phase 6: Preview & Review** (Priority 3)
1. Create preview mode
2. Add review tab with summary
3. Show point distribution chart
4. Add quick edit links
5. Implement validation checks

### **Phase 7: Import/Export** (Priority 4)
1. Add JSON export
2. Add JSON import
3. Add duplicate functionality
4. Add PDF export (optional)
5. Add share link (optional)

---

## 📐 **Technical Architecture**

### **File Structure**
```
src/app/admin/assignments/create/
  └─ page.tsx (enhanced)

src/components/assignment-builder/
  ├─ question-editor.tsx (existing)
  ├─ assignment-tabs.tsx (new)
  ├─ basics-tab.tsx (new)
  ├─ content-tab.tsx (new)
  ├─ settings-tab.tsx (new)
  ├─ review-tab.tsx (new)
  ├─ ai-assistant-panel.tsx (new)
  ├─ template-selector.tsx (new)
  ├─ preview-mode.tsx (new)
  └─ rubric-builder.tsx (existing)
```

### **State Management**
```typescript
interface EnhancedAssignment extends Assignment {
  // New fields
  unit_id?: string
  tags?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimated_time?: number // minutes
  
  // Settings
  max_attempts?: number
  time_limit?: number
  show_feedback_immediately?: boolean
  shuffle_questions?: boolean
  
  // Standards
  standards?: string[]
}
```

### **API Endpoints**
- Use existing endpoints ✓
- `/api/lessons/published` - Get lessons
- `/api/generate-mc-options` - AI generation
- `/api/generate-scenario-image` - AI images
- `/api/generate-answer` - AI answers
- `/api/question-bank` - Question bank

---

## 🎨 **UI/UX Principles**

1. **Progressive Disclosure**
   - Show basic options first
   - Advanced settings in expandable sections

2. **Contextual Help**
   - Tooltips on hover
   - Info icons with explanations
   - Example text in placeholders

3. **Visual Hierarchy**
   - Clear section headings
   - Card-based layout
   - Color coding for question types

4. **Feedback**
   - Autosave indicator
   - Validation messages
   - Success/error toasts

5. **Efficiency**
   - Keyboard shortcuts
   - Quick actions
   - Bulk operations

---

## ✅ **Success Metrics**

1. **Completeness**
   - All site features accessible
   - All question types supported
   - All AI features available

2. **Usability**
   - Faster assignment creation
   - Fewer clicks to common actions
   - Clear navigation flow

3. **Quality**
   - Better assignment organization
   - More detailed metadata
   - Improved student experience

---

## 📝 **Next Steps**

1. Review and approve enhancement plan
2. Implement Phase 1 (Structure & Layout)
3. Implement Phase 2 (Physics Integration)
4. Test with real use cases
5. Gather feedback
6. Iterate on remaining phases

---

*Enhancement plan created: October 8, 2024*  
*Ready for implementation approval*

