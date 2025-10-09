# 🛡️ Safe Migration Plan - Simulation Infrastructure

## Current State (Nothing Will Break!)

### ✅ Existing Setup
- **Simulations Page**: Uses hardcoded mock data array
- **Individual Simulations**: Standalone page components (no dependencies)
- **No Database**: Simulations don't touch database yet
- **No API**: No simulation API routes exist
- **No Context**: No SimulationContext provider

### ✅ What This Means
Your existing simulations will continue working **exactly as they do now**. We're adding infrastructure AROUND them, not changing them.

---

## 📋 Backward-Compatible Implementation

### Phase 1: Add Infrastructure (Won't Affect Existing Code)

#### Step 1.1: Run Migration (Safe)
```bash
# This creates NEW tables, doesn't touch existing ones
# Uses IF NOT EXISTS so it's safe to run multiple times
```

**What it creates:**
- `simulations` table (NEW)
- `tools` table (NEW)
- `interactive_lessons` table (NEW)
- `simulation_activity` table (NEW)
- `interactive_lesson_progress` table (NEW)

**What it doesn't touch:**
- ❌ lessons table (unchanged)
- ❌ assignments table (unchanged)
- ❌ Any existing tables

#### Step 1.2: Create API Routes (Additive Only)
```typescript
// NEW files, no conflicts:
src/app/api/simulations/route.ts          // GET/POST simulations
src/app/api/simulations/[slug]/route.ts   // GET specific simulation
src/app/api/tools/route.ts                // GET/POST tools
src/app/api/interactive-lessons/route.ts  // Manage interactive lessons
```

**Won't break anything because:**
- These are NEW routes
- No existing code calls them
- Existing simulations don't use APIs

#### Step 1.3: Create Context Provider (Optional Usage)
```typescript
// NEW file:
src/contexts/SimulationContext.tsx

// Add to layout.tsx ONLY when ready:
<SimulationProvider>  // ← Optional wrapper
  <AssignmentProvider>
    {/* existing providers */}
  </AssignmentProvider>
</SimulationProvider>
```

**Won't break anything because:**
- Provider is optional
- Existing simulations don't use context
- Can be added gradually

---

### Phase 2: Dual-Mode Simulations Page (Backward Compatible)

Update the simulations page to support BOTH modes:

```typescript
// src/app/simulations/page.tsx

export default function SimulationsPage() {
  const [useMockData, setUseMockData] = useState(true) // ← Start with mock data
  const [simulationsFromDB, setSimulationsFromDB] = useState([])
  
  useEffect(() => {
    // Try to load from database
    async function loadSimulations() {
      try {
        const res = await fetch('/api/simulations')
        if (res.ok) {
          const data = await res.json()
          setSimulationsFromDB(data.simulations)
          setUseMockData(false) // Switch to DB if available
        }
      } catch (err) {
        // Fail gracefully - keep using mock data
        console.log('Using mock data (database not set up yet)')
      }
    }
    
    loadSimulations()
  }, [])
  
  // Use DB data if available, otherwise mock data
  const simulations = useMockData ? MOCK_SIMULATIONS : simulationsFromDB
  
  // Rest of component stays the same...
}
```

**Benefits:**
- ✅ Works with OR without database
- ✅ Graceful fallback to mock data
- ✅ Existing simulations keep working
- ✅ No breaking changes

---

### Phase 3: Optional Simulation Wrapper (Add When Ready)

Individual simulations can OPTIONALLY use tracking:

```typescript
// BEFORE (still works):
export default function MySimulation() {
  // Standalone simulation
  return <div>...</div>
}

// AFTER (when ready to add tracking):
import { SimulationWrapper } from '@/components/simulations/SimulationWrapper'

export default function MySimulation() {
  return (
    <SimulationWrapper 
      simulationSlug="my-simulation"
      trackProgress={true}  // ← Optional feature
    >
      {({ onInteraction, onComplete }) => (
        <div>
          {/* Simulation with optional callbacks */}
        </div>
      )}
    </SimulationWrapper>
  )
}
```

**Benefits:**
- ✅ Existing simulations work without wrapper
- ✅ Add wrapper when YOU want tracking
- ✅ No forced migration
- ✅ Progressive enhancement

---

## 🎯 Implementation Order (Safe & Gradual)

### Week 1: Foundation (Nothing breaks)
- [ ] Run database migration
- [ ] Create API routes (new files only)
- [ ] Create SimulationContext (optional provider)
- [ ] Update simulations page to support both modes
- [ ] Test: Verify existing simulations still work

### Week 2: Optional Enhancement (One at a time)
- [ ] Create SimulationWrapper component
- [ ] Wrap ONE simulation as a test
- [ ] Verify tracking works
- [ ] If good, wrap others

### Week 3: New Features (Build on stable base)
- [ ] Add AI assistant for simulations
- [ ] Create interactive lesson player
- [ ] Build tool library

---

## 🧪 Testing Checklist

Before each change, verify:

### ✅ Existing Simulations Work
```bash
# Visit each simulation directly:
/simulations/measurement-precision      # ← Should work
/simulations/freefall-cliff             # ← Should work
/simulations/uniformly-accelerated-motion # ← Should work
```

### ✅ Simulations Page Works
```bash
# Should show all 3 simulations:
/simulations  # ← Should list simulations
```

### ✅ Navigation Works
```bash
# Navbar should have Simulations link:
Click "Simulations" → Should navigate properly
```

---

## 🔒 Rollback Plan (If Needed)

If something breaks, here's how to rollback:

### Rollback Database Migration
```sql
-- Remove new tables (simulations won't be affected)
DROP TABLE IF EXISTS simulation_activity CASCADE;
DROP TABLE IF EXISTS interactive_lesson_progress CASCADE;
DROP TABLE IF EXISTS interactive_lessons CASCADE;
DROP TABLE IF EXISTS tools CASCADE;
DROP TABLE IF EXISTS simulations CASCADE;
```

### Rollback Code Changes
```bash
# If context provider causes issues:
git checkout src/contexts/SimulationContext.tsx

# If API routes cause issues:
rm -rf src/app/api/simulations
rm -rf src/app/api/tools

# If simulations page breaks:
git checkout src/app/simulations/page.tsx
```

---

## 📊 Feature Flags (Extra Safety)

We can add feature flags for gradual rollout:

```typescript
// src/lib/feature-flags.ts

export const FEATURE_FLAGS = {
  USE_SIMULATION_DATABASE: false,  // ← Start disabled
  SIMULATION_TRACKING: false,
  AI_ASSISTANCE: false,
  INTERACTIVE_LESSONS: false
}

// Enable one feature at a time:
if (FEATURE_FLAGS.USE_SIMULATION_DATABASE) {
  // Load from database
} else {
  // Use mock data (current behavior)
}
```

---

## 🎯 Recommended Next Steps

**I recommend we:**

1. **First**: Create a "compatibility layer" that makes existing simulations work with new system
2. **Then**: Run migration and create API routes
3. **Then**: Update simulations page to support both modes
4. **Finally**: Test thoroughly before adding tracking

**Would you like me to:**
- **Option A**: Create the compatibility layer first (safest)
- **Option B**: Run migration and create API routes (infrastructure)
- **Option C**: Show me a detailed diff of what will change (review first)

Which approach would you prefer? 🤔
