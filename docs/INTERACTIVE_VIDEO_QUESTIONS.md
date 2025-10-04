# Interactive Video Questions - EdPuzzle-Style Feature

## 🎬 Overview

The Interactive Video Questions feature allows teachers to add questions at specific timestamps in lesson videos. When students watch videos, they automatically pause at these points and require answers before continuing - just like EdPuzzle!

## ✨ Key Features

### For Teachers
- 📍 **Visual Timeline Editor** - Click anywhere on the timeline to add questions
- 🎯 **Precise Timing** - Set exact timestamps (in seconds) for each question
- 🎨 **Full Question Types** - Multiple choice, numerical, open response, essay
- 🤖 **AI Integration** - Use existing OpenAI tools for option generation and grading
- 👀 **Live Preview** - Preview exact timestamp on YouTube while editing
- 📊 **Analytics Dashboard** - See question counts and total points at a glance

### For Students
- ⏸️ **Auto-Pause** - Videos automatically pause at question timestamps
- 💬 **Clear Prompts** - Beautiful modal with instructions
- ✅ **Instant Feedback** - Immediate validation for MC and numerical questions
- 🔒 **No Skipping** - Must answer correctly to continue
- 📱 **Mobile-Friendly** - Works perfectly on all devices

## 🎓 How to Use (Teacher Guide)

### Step 1: Navigate to Lesson Management

1. Go to **Admin Dashboard** → **Content** tab → **Lessons**
2. Find the lesson with the video you want to enhance
3. Click the **purple video icon** (🎬) to manage videos

### Step 2: Access Question Editor

1. In the video list, find the video you want to add questions to
2. Click the **purple AlertCircle icon** (⚡) - "Add Interactive Questions"
3. The Visual Question Editor will appear

### Step 3: Add Questions Using Timeline

#### Visual Timeline Interface:
```
┌────────────────────────────────────────┐
│ 0:00        [Click to add]       5:30  │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬    │
│   ⓵    ⓷              ⓹              │
│  45s  2:15           4:30             │
└────────────────────────────────────────┘
```

**To add a question:**
1. **Click anywhere** on the colored timeline bar
2. The timestamp will be automatically set
3. Question editor appears with your selected time

**To edit a question:**
1. **Click the numbered circle** on the timeline
2. The question loads for editing

### Step 4: Create Your Question

The question editor uses your existing question builder with all its features:

#### Multiple Choice Questions
```typescript
Question: "What is velocity?"
Options:
  - Speed with direction ✓
  - Just speed
  - Acceleration
  - Distance
Explanation: "Velocity is a vector..."
Points: 3
```

**AI Features Available:**
- 🤖 Generate options automatically
- 📝 Get explanations from OpenAI
- 🎨 Create scenario images

#### Numerical Questions
```typescript
Question: "Calculate the speed..."
Correct Value: 25
Unit: m/s
Tolerance: 0.1
Points: 5
```

#### Open Response Questions
```typescript
Question: "Explain Newton's First Law..."
Rubric: [Your custom rubric]
Auto-Grade: ✓ Enable AI grading
Points: 10
```

### Step 5: Set Precise Timing

You can adjust the timestamp in two ways:

1. **Direct Input**: Enter seconds manually
   ```
   Pause Video At: [120] seconds (2:00)
   ```

2. **Preview Link**: Click "Preview timestamp" to see exact moment on YouTube

### Step 6: Save and Deploy

1. Click **"Save All Questions"** (green button, top right)
2. Questions are immediately added to the video
3. Students will encounter them during video playback

## 📊 Dashboard Overview

### Stats Display
When editing questions, you'll see:

```
┌─────────────────────────────────────┐
│  📋 5 Total Questions               │
│  ⏱️ 8:45 Video Length               │
│  ✅ 23 Total Points                 │
└─────────────────────────────────────┘
```

### Question List
All questions are shown in chronological order:

```
1. [0:45] multiple-choice - "What is velocity?" (3 pts)
2. [2:15] numerical - "Calculate speed..." (5 pts)
3. [4:30] open-response - "Explain Newton's Law" (10 pts)
```

## 🎮 Student Experience

### When Students Watch Videos

1. **Video Starts** → Plays normally
2. **Reaches Question Timestamp** → Video auto-pauses
3. **Modal Appears**:
   ```
   ┌────────────────────────────────┐
   │ ⚠️ Video Paused                │
   │ Answer this question to continue│
   │                                │
   │ Worth 3 points                 │
   │                                │
   │ [Question displays here]       │
   │                                │
   │ [Submit Answer]                │
   └────────────────────────────────┘
   ```

4. **Student Answers**:
   - Multiple Choice → Instant feedback
   - Numerical → Tolerance checking
   - Open Response → Submitted for grading

5. **Correct Answer**:
   ```
   ┌────────────────────────────────┐
   │ ✓ Correct!                     │
   │ [▶ Continue Video]             │
   └────────────────────────────────┘
   ```

6. **Incorrect Answer** (MC/Numerical):
   ```
   ┌────────────────────────────────┐
   │ ✗ Not quite. Try again.        │
   │ [explanation if available]     │
   │                                │
   │ [Submit Answer]                │
   └────────────────────────────────┘
   ```

## 🎯 Best Practices

### Timing Your Questions

1. **After Key Concepts** - Pause after explaining important ideas
   ```
   0:00-2:30: Explain velocity
   2:30: QUESTION - "What is velocity?"
   2:30-5:00: Continue with examples
   ```

2. **Before Transitions** - Test understanding before moving on
   ```
   5:00: Complete kinematics basics
   5:00: QUESTION - "Calculate velocity"
   5:00-8:00: Move to acceleration
   ```

3. **Strategic Spacing** - Don't overwhelm students
   - **Recommended**: 1 question per 2-3 minutes
   - **Maximum**: 1 question per minute

### Question Design Tips

1. **Multiple Choice** - Test conceptual understanding
   - Use common misconceptions as distractors
   - Provide clear explanations

2. **Numerical** - Test calculations
   - Use realistic scenarios
   - Set appropriate tolerance (typically 1-5%)

3. **Open Response** - Test deeper understanding
   - Require explanations, not just facts
   - Use AI grading for instant feedback

### Points Allocation

Consider this breakdown:
- **Quick checks** (MC): 1-3 points
- **Calculations** (Numerical): 3-5 points  
- **Explanations** (Open Response): 5-10 points

## 🔧 Technical Details

### Data Structure
Questions are stored in the `lessons` table:

```json
{
  "videos": [
    {
      "id": "vid-123",
      "title": "Introduction to Velocity",
      "youtubeId": "abc123",
      "duration": "8:45",
      "questions": [
        {
          "id": "vq-1",
          "timestamp": 45,
          "question": {
            "type": "multiple-choice",
            "question": "What is velocity?",
            "options": ["...", "...", "..."],
            "correctAnswer": 0,
            "points": 3
          }
        }
      ]
    }
  ]
}
```

### API Integration

Questions use your existing infrastructure:
- **Question Types**: `/src/types/assignment.ts`
- **Question Renderer**: `/src/components/assignment-taking/question-renderer.tsx`
- **AI Grading**: `/src/app/api/grade-open-response/route.ts`

### Performance

- ✅ Questions check every 500ms (imperceptible to users)
- ✅ Video only pauses within 1-second window of timestamp
- ✅ Questions only shown once per viewing session
- ✅ Efficient state management with React hooks

## 🚀 Future Enhancements

Possible improvements:
- 📊 Analytics: Track which questions students struggle with
- 🎥 Video Editor: Scrub timeline to find exact moments
- 📝 Question Bank Integration: Add questions from existing bank
- 🔄 Question Pools: Randomize questions for each student
- ⏰ Time Limits: Optional countdown for each question
- 💾 Draft Mode: Save questions without publishing

## 🐛 Troubleshooting

### Questions Not Appearing?

1. **Check timestamp** - Must be within video duration
2. **Save All Questions** - Click green save button
3. **Refresh page** - Ensure changes are loaded
4. **Check browser console** - Look for JavaScript errors

### Video Not Pausing?

1. **Check YouTube API** - Ensure scripts loaded (check Network tab)
2. **CSP Headers** - Verify YouTube domains are allowed
3. **Timestamp Window** - Question triggers within ±1 second

### Questions Repeating?

- This is by design - questions show once per session
- Refreshing the page resets the session
- Questions track by `answered` state in component

## 📚 Related Documentation

- [Assignment System Guide](./ASSIGNMENTS_SYSTEM_GUIDE.md)
- [Question Bank System](./QUESTION_BANK_SYSTEM.md)
- [Lesson Management](./LESSONS_SYSTEM_GUIDE.md)

## 💡 Examples

### Example 1: Conceptual Check
```json
{
  "timestamp": 180,
  "question": {
    "type": "multiple-choice",
    "question": "A ball is thrown upward. At the highest point, what is its velocity?",
    "options": [
      "Maximum",
      "Zero",
      "Same as initial",
      "Negative maximum"
    ],
    "correctAnswer": 1,
    "explanation": "At the highest point, velocity is momentarily zero before the ball starts falling.",
    "points": 3
  }
}
```

### Example 2: Calculation Practice
```json
{
  "timestamp": 240,
  "question": {
    "type": "numerical",
    "question": "A car travels 150 meters in 10 seconds. Calculate its average speed in m/s.",
    "correctValue": 15,
    "tolerance": 0.1,
    "unit": "m/s",
    "points": 5
  }
}
```

### Example 3: Deep Understanding
```json
{
  "timestamp": 360,
  "question": {
    "type": "open-response",
    "question": "Explain why objects in space continue moving without a force acting on them. Use Newton's First Law in your explanation.",
    "rubric": [...],
    "autoGrade": true,
    "correctConcepts": ["inertia", "Newton's First Law", "no friction"],
    "points": 10
  }
}
```

---

**Happy Teaching! 🎓✨**

For questions or issues, check the browser console or contact the development team.



