# Monkey Hunter: The Classic Projectile Motion Problem

## 🎯 The Setup

**The Scenario:**

A monkey hangs from a tree branch 12 meters high, 13 meters away horizontally. You have a dart gun aimed directly at the monkey. The clever monkey sees you aim and decides to drop at the exact instant you fire.

**The Question:**

**"Should you still aim directly at the monkey, or should you aim above it to account for the drop?"**

**Most students think:** *"Aim above! The monkey will fall while the dart is flying!"*

**The surprising answer:** **AIM DIRECTLY AT THE MONKEY!** The dart will hit it anyway!

## 🤯 Why This Is Counterintuitive

Students naturally think:
- The monkey will drop while dart is in flight
- The dart will pass above where the monkey falls to
- Need to aim lower to compensate

**But they're wrong! Here's why:**

## 🔬 The Physics Explanation

### The Key Insight

**Both the dart AND the monkey are affected by gravity!**

- **Dart:** Falls as it flies (projectile motion)
- **Monkey:** Falls as it drops (free fall)
- **Critical:** They **fall at the same rate** (g = 9.8 m/s²)

**Result:** The dart "drops" just as much as the monkey, so the aim line stays true!

### Independence of Motion (2D Kinematics)

**Horizontal Motion (x-direction):**
- **Dart:** Moves at constant velocity v<sub>x</sub>
- **Monkey:** Doesn't move horizontally (x stays constant)
- **No gravity** in horizontal direction

**Vertical Motion (y-direction):**
- **Dart:** Affected by gravity (falls from initial trajectory)
- **Monkey:** Affected by gravity (falls from branch)
- **Both accelerate** downward at g = 9.8 m/s²

**Independence:** Horizontal and vertical motions happen simultaneously but don't affect each other!

### The Mathematics

**Dart Equations (Projectile Motion):**

Horizontal:
\[
x_{\text{dart}} = x_0 + v_x t
\]

Vertical:
\[
y_{\text{dart}} = y_0 + v_y t - \frac{1}{2}gt^2
\]

**Monkey Equations (Free Fall from Rest):**

Horizontal:
\[
x_{\text{monkey}} = x_0 \quad \text{(doesn't move sideways)}
\]

Vertical:
\[
y_{\text{monkey}} = y_0 - \frac{1}{2}gt^2 \quad \text{(drops from initial height)}
\]

### When Do They Meet? (Systems of Equations!)

**Condition 1: Same horizontal position**
\[
x_{\text{dart}} = x_{\text{monkey}}
\]
\[
x_0 + v_x t = x_0^{(\text{monkey})}
\]

Solving for time:
\[
t = \frac{x_0^{(\text{monkey})} - x_0}{v_x}
\]

**Condition 2: Same vertical position (at that time)**
\[
y_{\text{dart}} = y_{\text{monkey}}
\]
\[
y_0 + v_y t - \frac{1}{2}gt^2 = y_0^{(\text{monkey})} - \frac{1}{2}gt^2
\]

**Notice:** The \(-\frac{1}{2}gt^2\) terms **cancel**!

\[
y_0 + v_y t = y_0^{(\text{monkey})}
\]

This simplifies to:
\[
v_y t = y_0^{(\text{monkey})} - y_0
\]

**This is satisfied** when we aim directly at the monkey because:
- v<sub>y</sub> is chosen so the dart would reach the monkey's initial height
- The drop cancels out due to equal gravity!

### The Proof (Why Direct Aim Works)

**Step 1:** Hunter aims at monkey's original position  
- Launch angle θ points from hunter to monkey
- v<sub>x</sub> = v₀ cos(θ)
- v<sub>y</sub> = v₀ sin(θ)

**Step 2:** Calculate time to reach monkey's horizontal position  
\[
t = \frac{x_{\text{monkey}} - x_{\text{hunter}}}{v_x}
\]

**Step 3:** Calculate where dart WOULD be (without gravity)  
\[
y_{\text{no gravity}} = y_{\text{hunter}} + v_y t
\]

This equals the monkey's original height! (We aimed there)

**Step 4:** Calculate how much dart drops due to gravity  
\[
\text{drop}_{\text{dart}} = \frac{1}{2}gt^2
\]

**Step 5:** Calculate how much monkey drops  
\[
\text{drop}_{\text{monkey}} = \frac{1}{2}gt^2
\]

**They drop the same amount!** So:
\[
y_{\text{dart actual}} = y_{\text{no gravity}} - \frac{1}{2}gt^2 = y_{\text{monkey original}} - \frac{1}{2}gt^2 = y_{\text{monkey actual}}
\]

**They meet!** 🎯

## 🎓 Learning Objectives

Students will:

1. **Understand** that horizontal and vertical motion are independent
2. **Apply** projectile motion equations in 2D
3. **Recognize** that gravity affects all objects equally
4. **Solve** systems of equations for when/where objects meet in 2D
5. **Predict** collision points using kinematics
6. **Explain** the counterintuitive result using physics
7. **Analyze** motion from different reference frames
8. **Calculate** trajectories with multiple objects

## 🎯 Classroom Activities

### Activity 1: The Classic Demonstration (10 min)

**Poll Students:**
"Should you aim AT the monkey or ABOVE it?"
- Most say: "Above!" (to account for drop)
- Record predictions

**Run Simulation:**
1. Aim AT monkey (direct aim mode)
2. Fire dart
3. Watch monkey drop
4. **Dart hits anyway!** 🎯

**Student Reaction:** "Wait... WHAT?!"

**Discussion:**
- Why did it hit?
- What fell faster - dart or monkey?
- Neither! They fell at the **same rate**!

### Activity 2: Test the "Aim Above" Strategy (10 min)

**Hypothesis:** If we aim above to compensate, we'll hit better

**Test:**
1. Switch to "Above (Compensate)" mode
2. This aims higher than the monkey
3. Fire dart
4. **Dart misses!** Goes above the monkey!

**Why?**
- By aiming above, we gave dart extra upward velocity
- Monkey still drops at g
- Now dart drops PLUS has extra height
- **Over-compensation!**

**Lesson:** The physics does the compensation automatically - don't try to "help"!

### Activity 3: Vary Parameters (20 min)

**Systematic Testing:**

**Test 1:** Different Heights
- Monkey at 8m, 12m, 14m
- All hit! (when aimed directly)
- **Conclusion:** Height doesn't matter

**Test 2:** Different Distances
- Monkey at 8m, 13m, 18m away
- All hit!
- **Conclusion:** Distance doesn't matter

**Test 3:** Different Dart Speeds
- Launch at 15 m/s, 20 m/s, 25 m/s
- All hit!
- **Conclusion:** Speed doesn't matter

**What DOES matter?** Only that you **aim directly at the original position**!

### Activity 4: Mathematical Analysis (25 min)

**Given Default Setup:**
- Monkey: x = 15m, y = 12m
- Hunter: x = 2m, y = 0m
- Dart speed: 20 m/s

**Calculate:**

**1. Launch angle:**
\[
\theta = \arctan\left(\frac{12 - 0}{15 - 2}\right) = \arctan\left(\frac{12}{13}\right) \approx 42.7°
\]

**2. Velocity components:**
\[
v_x = 20 \cos(42.7°) \approx 14.7 \text{ m/s}
\]
\[
v_y = 20 \sin(42.7°) \approx 13.6 \text{ m/s}
\]

**3. Time to reach monkey's horizontal position:**
\[
t = \frac{13}{14.7} \approx 0.88 \text{ seconds}
\]

**4. Vertical positions at t = 0.88s:**

Dart:
\[
y_{\text{dart}} = 0 + 13.6(0.88) - \frac{1}{2}(9.8)(0.88)^2
\]
\[
y_{\text{dart}} = 12.0 - 3.8 = 8.2 \text{ m}
\]

Monkey:
\[
y_{\text{monkey}} = 12 - \frac{1}{2}(9.8)(0.88)^2
\]
\[
y_{\text{monkey}} = 12.0 - 3.8 = 8.2 \text{ m}
\]

**Same height! They meet!** 🎯

**Verify in simulation:** Hit time should be ~0.88s

## 📐 Detailed Mathematical Treatment

### Setting Up the System

**Dart trajectory equations:**
\[
\begin{cases}
x_d(t) = 2 + v_x t \\
y_d(t) = 0 + v_y t - \frac{1}{2}gt^2
\end{cases}
\]

**Monkey trajectory equations:**
\[
\begin{cases}
x_m(t) = 15 \\
y_m(t) = 12 - \frac{1}{2}gt^2
\end{cases}
\]

### Solving for Collision

**When x coordinates match:**
\[
2 + v_x t = 15
\]
\[
t = \frac{13}{v_x}
\]

**Substitute into y equations:**

Dart y-position:
\[
y_d = v_y t - \frac{1}{2}gt^2 = v_y \left(\frac{13}{v_x}\right) - \frac{1}{2}g\left(\frac{13}{v_x}\right)^2
\]

Monkey y-position:
\[
y_m = 12 - \frac{1}{2}gt^2 = 12 - \frac{1}{2}g\left(\frac{13}{v_x}\right)^2
\]

**For collision, set y_d = y_m:**
\[
v_y \left(\frac{13}{v_x}\right) - \frac{1}{2}g\left(\frac{13}{v_x}\right)^2 = 12 - \frac{1}{2}g\left(\frac{13}{v_x}\right)^2
\]

**The gravity terms cancel:**
\[
v_y \left(\frac{13}{v_x}\right) = 12
\]

**This means:**
\[
\frac{v_y}{v_x} = \frac{12}{13}
\]

**But this is exactly the condition for aiming at the monkey!**

\[
\tan(\theta) = \frac{v_y}{v_x} = \frac{12}{13}
\]

**Conclusion:** If you aim at the monkey, you'll hit it!

## 🎯 Systems of Equations Perspective

This problem involves solving:

**System:**
\[
\begin{cases}
x_d(t) = x_m(t) \\
y_d(t) = y_m(t)
\end{cases}
\]

**Expanded:**
\[
\begin{cases}
2 + v_x t = 15 \\
v_y t - \frac{1}{2}gt^2 = 12 - \frac{1}{2}gt^2
\end{cases}
\]

**Solution:**
- From equation 1: t = 13/v_x
- Equation 2 simplifies (gravity cancels): v_y t = 12
- These are consistent when tan(θ) = 12/13 (aiming at monkey!)

**This is a 2D system of equations!**

## 📊 Assessment Questions

### Multiple Choice

**Q1:** Why does the dart hit the monkey even though the monkey drops?
- a) The dart is too fast for the monkey to dodge
- b) Both dart and monkey fall at the same rate due to gravity ✓
- c) The hunter compensates for the drop
- d) The monkey doesn't actually drop very far

**Q2:** What happens to the horizontal velocity of the dart during flight?
- a) It increases due to gravity
- b) It decreases due to air resistance
- c) It remains constant ✓
- d) It becomes zero

**Q3:** If you aimed ABOVE the monkey to compensate for its drop, what would happen?
- a) You would hit it more reliably
- b) You would miss (dart goes too high) ✓
- c) You would hit it at the same time
- d) The dart would fall faster

### Numerical Problems

**Problem 1:**
The monkey is 10m high and 12m away horizontally. The dart is fired at 18 m/s.

a) Calculate the launch angle  
b) Calculate the time until collision  
c) Calculate the height where they meet

**Solutions:**
```
a) θ = arctan(10/12) = arctan(0.833) = 39.8°

b) v_x = 18 cos(39.8°) = 13.8 m/s
   t = 12/13.8 = 0.87 seconds

c) Drop = ½gt² = ½(9.8)(0.87)² = 3.7m
   Meeting height = 10 - 3.7 = 6.3m
```

**Problem 2:**
At what speed must the dart be fired to hit the monkey (at x=15m, y=12m) in exactly 1.0 second?

**Solution:**
```
Time constraint: t = 1.0s
Horizontal: x = v_x × t → v_x = 13/1.0 = 13 m/s

For collision: v_y × 1.0 = 12 (from simplified equation)
So: v_y = 12 m/s

Launch speed: v₀ = √(v_x² + v_y²) = √(169 + 144) = √313 = 17.7 m/s
```

### Open Response

**Q1:** "Explain why aiming directly at the monkey works, even though the monkey drops. Use the concepts of independent motion and gravity in your answer."

**Expected Answer:**
- Horizontal and vertical motions are independent
- Dart has horizontal velocity (constant) and vertical velocity (affected by gravity)
- Monkey only has vertical motion (affected by gravity)
- Both fall at g = 9.8 m/s² (gravity is same for both)
- Dart drops ½gt² and monkey drops ½gt² - same amount!
- Since dart was aimed at original position and both drop equally, they meet
- The gravity terms "cancel out" when we solve the equations

**Q2:** "A student says 'We should aim above the monkey because it will fall while the dart is in the air.' Explain what is incorrect about this reasoning."

**Expected Answer:**
- The reasoning ignores that the DART also falls
- Yes, monkey falls, but dart falls too!
- Both fall at same rate (g)
- If you aim above, you give dart extra upward velocity
- Now dart is higher than needed AND still falls at g
- Result: dart passes above the falling monkey
- Correct strategy: Aim at original position, let physics handle it

## 🔬 Detailed Worked Example

**Scenario:**
- Monkey: (15m, 12m)
- Hunter: (2m, 0m)
- Dart speed: 20 m/s

### Step 1: Calculate Launch Angle

Distance components:
- Δx = 15 - 2 = 13m (horizontal)
- Δy = 12 - 0 = 12m (vertical)

Launch angle:
\[
\theta = \arctan\left(\frac{12}{13}\right) = 42.7°
\]

### Step 2: Calculate Velocity Components

\[
v_x = 20 \cos(42.7°) = 14.7 \text{ m/s}
\]
\[
v_y = 20 \sin(42.7°) = 13.6 \text{ m/s}
\]

### Step 3: Calculate Time to Collision

From horizontal motion (constant velocity):
\[
t = \frac{\Delta x}{v_x} = \frac{13}{14.7} = 0.88 \text{ seconds}
\]

### Step 4: Verify Vertical Positions Match

**Dart vertical position at t = 0.88s:**
\[
y_d = 0 + 13.6(0.88) - \frac{1}{2}(9.8)(0.88)^2
\]
\[
y_d = 12.0 - 3.8 = 8.2 \text{ m}
\]

**Monkey vertical position at t = 0.88s:**
\[
y_m = 12 - \frac{1}{2}(9.8)(0.88)^2
\]
\[
y_m = 12.0 - 3.8 = 8.2 \text{ m}
\]

**Both at 8.2 meters! COLLISION! ✓**

### Step 5: Calculate How Much Each Fell

**Amount dropped:**
\[
\Delta y = \frac{1}{2}gt^2 = \frac{1}{2}(9.8)(0.88)^2 = 3.8 \text{ m}
\]

**Both dropped exactly 3.8 meters!**

- Dart: Started at 12m trajectory, ended at 8.2m → dropped 3.8m
- Monkey: Started at 12m, ended at 8.2m → dropped 3.8m

**Same drop! This is why it works!**

## 🎮 Suggested Simulation Activities

### Activity 1: The Surprise (5 min)

1. Load simulation with defaults
2. Ask: "Will it hit if monkey drops?"
3. Poll class
4. Run simulation (aim AT monkey)
5. **Hits!** Students amazed!

### Activity 2: Test the Alternative (5 min)

1. Switch to "Aim Above" mode
2. Ask: "Will this work better?"
3. Fire
4. **Misses!** Goes above monkey
5. **Lesson:** Don't try to outsmart physics!

### Activity 3: Vary Everything (15 min)

**Systematic tests:**
- Change height: Always hits
- Change distance: Always hits
- Change speed: Always hits
- **Conclusion:** Parameters don't matter!

**The only rule:** Aim at the original position!

### Activity 4: Calculate Before Shooting (20 min)

**Challenge:** Predict hit time before running

**Given:**
- Monkey at (15, 12)
- Hunter at (2, 0)
- Dart speed 20 m/s

**Calculate:**
1. Δx = 13m, Δy = 12m
2. θ = arctan(12/13) = ?
3. v_x = 20 cos(θ) = ?
4. t = 13/v_x = ?

**Run simulation:**
- Verify hit time matches
- Build confidence in equations!

## 📚 Connection to Curriculum

### Prerequisite Concepts
- Constant velocity motion (x = v_x t)
- Free fall (y = y₀ - ½gt²)
- Basic trigonometry
- Vectors and components

### This Simulation Teaches
- **2D kinematics** (projectile motion)
- **Independence of x and y motion**
- **Gravity affects all objects equally**
- **Systems of equations in 2D**
- **Trajectory analysis**

### Leads To
- General projectile motion problems
- Range and maximum height calculations
- Projectiles launched from height
- Air resistance effects
- Optimal launch angles

## 🌟 Why This Demonstration Is Powerful

### 1. **Deeply Counterintuitive**
Goes against common sense - creates memorable learning

### 2. **Beautiful Physics**
Shows elegant principle: gravity affects all equally

### 3. **Real-World Application**
- Baseball: Ball drops as it flies to catcher
- Basketball: Ball falls as it goes toward hoop
- Military: Bullets drop in flight

### 4. **Multiple Concepts**
- Projectile motion
- Independence of motion
- Gravity
- 2D kinematics
- Systems of equations

### 5. **Testable**
Students can verify with calculations

## 🔢 Extension: What If We Miss the Equations?

### Student Misconception Work

**Misconception:** "We need to aim below to lead the falling monkey"

**Test it:**
1. What if we aim at where monkey will be?
2. Calculate: Monkey falls to ~8.2m in 0.88s
3. Aim at (15, 8.2) instead of (15, 12)
4. **Result:** Miss! (Goes below)

**Why?**
- By aiming lower, we reduced v_y
- Dart still drops ½gt²
- Now dart ends up BELOW where we aimed
- **Double drop!**

### The Genius of Direct Aim

**By aiming at original position:**
- We set up the "perfect" trajectory
- Gravity pulls both down
- The aim line stays valid!

**If we try to compensate:**
- We break the symmetry
- Now physics works against us
- Miss!

## 📊 Data Analysis

### What to Track

**For each trial:**
- Monkey initial height
- Horizontal distance
- Dart speed
- Hit time
- Meeting height

**Analysis:**
- Does hit time match prediction?
- Is meeting height = initial height - ½gt²?
- Do all parameter combinations work?

### Graphing Exercise

**Plot:**
- Dart trajectory (parabola)
- Monkey drop path (vertical line)
- Should intersect!

**In Desmos:**
- Parametric equations for dart
- Vertical line for monkey
- Find intersection point

## 🎯 Real-World Applications

### Sports

**Basketball Free Throw:**
- Aim at hoop
- Ball drops as it flies
- Hoop doesn't move, but principle is same
- Gravity pulls ball down throughout flight

**Baseball:**
- Pitcher aims at catcher
- Ball drops significantly over 60 feet
- Catcher doesn't "drop" but concept applies

### Nature

**Falcon Hunting:**
- Falcon dives at prey
- Prey may drop/flee
- Both affected by gravity
- Falcon's strategy uses this physics!

### Historical

**Artillery:**
- Cannons must account for drop
- Aim above target
- But if target is falling... aim at it!

## ✅ Learning Outcomes

Students demonstrate mastery when they can:

✅ Explain why direct aim works despite the drop  
✅ Write equations for both dart and monkey motion  
✅ Solve for collision time and position  
✅ Recognize independence of x and y motion  
✅ Understand gravity affects both objects equally  
✅ Calculate trajectory components  
✅ Predict outcomes before running simulation  
✅ Apply to real-world scenarios  

## 🎉 The "Aha!" Moment

**Setup:** "Monkey drops when dart is fired - what should you do?"

**Intuition:** "Aim below to where it will fall!"

**Physics:** "Aim directly at it - you'll hit!"

**Simulation:** Proves physics is right!

**Understanding:** "Oh! They BOTH fall! The falling cancels out!"

This is one of the **most memorable** physics demonstrations because it violates intuition but follows perfect logic!

---

**Created:** October 11, 2025  
**Unit:** Kinematics (Unit 1) / Projectile Motion  
**Difficulty:** Intermediate  
**Duration:** 20 minutes  
**Famous for:** The counterintuitive result that teaches deep physics

**Perfect for:**
- Introducing projectile motion
- Teaching independence of x/y motion
- Demonstrating gravity's universality
- Systems of equations in physics
- Making students go "Wait, WHAT?!"

---

## 🚀 Quick Start

```bash
# Run migration
psql -h your-db -f scripts/add-monkey-hunter-simulation.sql

# Access at
/simulations/monkey-hunter
```

**First demo:** Use default settings, aim AT monkey, watch students' faces when it hits! 🎯🐵

