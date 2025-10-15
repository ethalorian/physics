# Car Race: Relative Motion & Kinematics - Complete Lesson

## 🎯 The Kinematics Problem

**Classic Physics Scenario:**

> *"Car A travels at constant velocity of 20 m/s and starts immediately. Car B travels at constant velocity of 25 m/s but waits 5 seconds before starting. When and where does Car B catch up to Car A?"*

This simulation teaches students how to **analyze relative motion, apply kinematics equations, and solve multi-object problems** using both graphical and algebraic methods!

## 📚 Learning Objectives (Kinematics Focus)

Students will learn to:

1. **Apply kinematics equations** for constant velocity motion (x = x₀ + vt)
2. **Account for initial conditions** (start delays, initial positions)
3. **Analyze relative motion** between two objects
4. **Interpret position-time graphs** for multiple objects
5. **Use mathematical tools** (systems of equations) to solve physics problems
6. **Predict when objects meet** using both graphical and algebraic methods
7. **Understand reference frames** and how different observers see motion
8. **Connect slope to velocity** in position-time graphs
9. **Verify predictions** using simulation data
10. **Apply problem-solving strategies** to complex motion scenarios

## 🔬 The Kinematics

### Fundamental Equation: Position with Constant Velocity

**Basic kinematic equation:**
\[
x = x_0 + vt
\]

Where:
- x = final position
- x₀ = initial position
- v = constant velocity
- t = time elapsed

**With start delays:** The car doesn't move until its start time, so:
\[
x = v \cdot (t - t_{\text{start}})
\]

This accounts for the "effective time" the car has been moving.

### Step 1: Analyze Each Car's Motion Independently

**Car A - Kinematic Analysis:**
- Initial position: x₀ = 0 m
- Constant velocity: v_A = 20 m/s
- Starts at: t_start = 0 s
- **Position equation:** 
\[
x_A = 0 + 20(t - 0) = 20t
\]

**Car B - Kinematic Analysis:**
- Initial position: x₀ = 0 m
- Constant velocity: v_B = 25 m/s
- Starts at: t_start = 5 s (delayed)
- **Position equation:**
\[
x_B = 0 + 25(t - 5) = 25t - 125
\]

**Physical Meaning:**
- For t < 5s: Car B hasn't started, so x_B = 0
- For t ≥ 5s: Car B moves according to equation above

### Step 2: Set Up the Overtake Condition

**Physics Question:** When are the cars at the same position?

**Mathematical Condition:**
\[
x_A = x_B
\]

**This creates a system of equations:**
\[
\begin{cases}
x_A = 20t \\
x_B = 25t - 125 \\
\text{Condition: } x_A = x_B
\end{cases}
\]

### Step 3: Solve Using Algebra (Mathematical Tool for Physics)

Set the equations equal:
\[
20t = 25t - 125
\]

Solve for t:
\[
20t - 25t = -125
\]
\[
-5t = -125
\]
\[
t = 25 \text{ seconds}
\]

### Step 4: Find the Position

Substitute t = 25 back into either equation:
\[
x_A = 20(25) = 500 \text{ meters}
\]

Verify with the other equation:
\[
x_B = 25(25) - 125 = 625 - 125 = 500 \text{ meters} \,\checkmark
\]

### Step 5: Interpret the Solution (Physics Context)

**Physical Interpretation:**
- **At t = 25 seconds:** Both cars are at the same location
- **At x = 500 meters:** This is where the overtake happens
- **Before t = 25s:** Car A is ahead (had head start)
- **After t = 25s:** Car B pulls ahead (higher velocity)

**Velocity Analysis:**
- Car A: Constant 20 m/s throughout
- Car B: Constant 25 m/s (when moving)
- **Relative velocity:** v_B - v_A = 5 m/s (B approaches at 5 m/s faster)

**Distance Analysis:**
- At t = 5s (when B starts): A is already at 100m
- B needs to close 100m gap
- Closing rate: 5 m/s
- Time to close: 100m ÷ 5 m/s = 20s more
- Total time: 5s + 20s = 25s ✓

## 📊 Position-Time Graphs in Kinematics

### Understanding Position-Time Graphs

**In physics, position-time graphs reveal motion characteristics:**

**Slope = Velocity:**
\[
\text{slope} = \frac{\Delta x}{\Delta t} = \frac{\text{change in position}}{\text{change in time}} = \text{velocity}
\]

**Car A Graph:** \( x_A = 20t \)
- **Slope:** 20 m/s (velocity)
- **Starts at origin:** (0, 0)
- **Constant slope:** Uniform motion, no acceleration

**Car B Graph:** \( x_B = 25t - 125 \)
- **Slope:** 25 m/s (steeper = faster!)
- **Y-intercept:** -125 (mathematical artifact of delay)
- **Physically meaningful for t ≥ 5s only**

### Reading the Graph Physically

**Before t = 5s:**
- Only Car A's line exists (B hasn't started)
- Car A building a lead

**At t = 5s:**
- Car B starts from origin
- Car A is already at 100m (head start!)
- Gap = 100 meters

**Between t = 5s and t = 25s:**
- Both cars moving
- Gap shrinking (B is faster)
- Lines approaching each other

**At t = 25s (Intersection Point):**
- **Lines cross:** Cars at same position!
- **Coordinates (25, 500):** When and where
- This is the overtake moment!

**After t = 25s:**
- B's line above A's line
- B is ahead (and pulling away)
- Gap growing (B maintains speed advantage)

### Why Intersection = Overtake

**Physical Reasoning:**
1. **Same time** (x-coordinate): Both measured at t = 25s
2. **Same position** (y-coordinate): Both at x = 500m
3. **Two objects** can't occupy same space without interaction
4. **Overtake** is the moment they're briefly at same position

**Kinematic Reasoning:**
- Before: x_A > x_B (A ahead)
- At intersection: x_A = x_B (exactly equal)
- After: x_B > x_A (B ahead)
- **Crossing point** = change in who's leading!

## 🎓 Classroom Activities

### Activity 1: Kinematics Problem-Solving (15 min)

**Learning Goal:** Apply kinematic equations to solve a relative motion problem

**Given:**
- Car A: v = 20 m/s, delay = 0s
- Car B: v = 25 m/s, delay = 5s

**Task 1:** Analyze motion using kinematics
```
Students identify for each car:
- Initial position: x₀ = 0
- Velocity: v (constant)
- Start time: t_start
- Write position equation: x = v(t - t_start)

Car A: x_A = 20t
Car B: x_B = 25(t - 5) = 25t - 125
```

**Task 2:** Find when positions are equal (overtake condition)
```
20t = 25t - 125
-5t = -125
t = 25 seconds

x = 20(25) = 500 meters
```

**Task 3:** Run simulation and verify!
- Start race
- Watch for purple "OVERTAKE!" line
- Check: Should be at 25s and 500m
- Compare to prediction ✓

**Physics Discussion:**
- Did your kinematic analysis match the simulation?
- What does the intersection mean physically? (Same place, same time)
- How do you know B will eventually catch A? (Higher velocity = steeper slope)
- What is the relative velocity? (v_B - v_A = 5 m/s)
- How much head start did A have? (100m when B started)

### Activity 2: Position-Time Graph Analysis (20 min)

**Learning Goal:** Interpret kinematics from position-time graphs

**Procedure:**
1. Run simulation with default settings
2. Let it collect data
3. View "Position Graph" tab
4. Observe both lines

**Questions for Students:**

1. **Before intersection:**
   - Which line is higher? (Blue - Car A)
   - What does this mean? (A is ahead)

2. **At intersection:**
   - What are the coordinates? (~25s, ~500m)
   - Why is this significant? (Cars are at same place at same time)

3. **After intersection:**
   - Which line is higher? (Red - Car B)
   - What does this mean? (B pulls ahead)

4. **Slopes:**
   - Which slope is steeper? (Red - Car B)
   - What does slope represent? (Velocity!)
   - How do you know B will catch A? (Steeper slope!)

**Export to Desmos:**
- Copy data
- Plot both curves
- Add intersection marker
- Calculate slopes (should match velocities)

### Activity 3: Scenario Testing (20 min)

**Challenge:** Test different scenarios

**Scenario 1:** Equal Speeds
- Car A: 25 m/s, delay = 0s
- Car B: 25 m/s, delay = 5s
- **Question:** Will B ever catch A?
- **Answer:** No! (Parallel lines never intersect)
- **Equation:** 25t = 25t - 125 → 0 = -125 (no solution!)

**Scenario 2:** A Faster
- Car A: 30 m/s, delay = 0s
- Car B: 20 m/s, delay = 5s
- **Question:** Will B ever catch A?
- **Answer:** No! (B slower AND starts later)
- **Graph:** Lines diverge

**Scenario 3:** Close Race
- Car A: 22 m/s, delay = 0s
- Car B: 25 m/s, delay = 8s
- **Calculate:** When does B catch A?
- **Solve:** 22t = 25(t - 8) → t = ?

### Activity 4: Design Your Own Race (15 min)

**Challenge:** Create a race that meets specific criteria

**Criteria 1:** B catches A at exactly 30 seconds
- Given: v_A = 20 m/s, d_A = 0
- Find: What should v_B and d_B be?
- Multiple solutions possible!

**Criteria 2:** B catches A at exactly 600 meters
- Given: v_A = 20 m/s, d_A = 0
- Find: v_B and d_B combinations

**Students:**
1. Set up equations with unknowns
2. Solve for required values
3. Test in simulation
4. Verify their design works!

## 📐 Detailed Mathematical Walkthrough

### General Form

**Position equations with delays:**
\[
x_A = v_A(t - d_A)
\]
\[
x_B = v_B(t - d_B)
\]

**Overtake condition:**
\[
x_A = x_B
\]

**Solving:**
\[
v_A(t - d_A) = v_B(t - d_B)
\]
\[
v_A t - v_A d_A = v_B t - v_B d_B
\]
\[
v_A t - v_B t = v_A d_A - v_B d_B
\]
\[
t(v_A - v_B) = v_A d_A - v_B d_B
\]
\[
t = \frac{v_A d_A - v_B d_B}{v_A - v_B}
\]

### Example Calculation

**Given:**
- v_A = 20 m/s, d_A = 0 s
- v_B = 25 m/s, d_B = 5 s

**Solve:**
\[
t = \frac{20(0) - 25(5)}{20 - 25} = \frac{0 - 125}{-5} = \frac{-125}{-5} = 25 \text{ s}
\]

**Find position:**
\[
x = 20(25) = 500 \text{ m}
\]

**Verify:**
\[
x_B = 25(25 - 5) = 25(20) = 500 \text{ m} \,\checkmark
\]

### Graphical Interpretation

**Slope-Intercept Form:**

**Car A:** 
\[
x_A = 20t + 0
\]
- Slope (m) = 20
- Intercept (b) = 0

**Car B:**
\[
x_B = 25t - 125
\]
- Slope (m) = 25
- Intercept (b) = -125

**Key Observations:**
- **Different slopes** → lines will intersect (unless one doesn't "exist" yet)
- **Steeper slope** (Car B) → catches up
- **Negative intercept** → Car B starts "behind" on graph

## 🔬 Relative Motion & Reference Frames

### What is Relative Motion?

**Relative motion** describes how the position or velocity of one object appears from the perspective of another moving object.

**In this simulation:**
- **From ground observer:** Both cars move at their actual velocities
- **From Car A's perspective:** Car B approaches at (v_B - v_A) = 5 m/s
- **From Car B's perspective:** Car A appears to move backward at 5 m/s

### Relative Velocity

**Definition:** The velocity of one object relative to another

\[
v_{B \text{ rel to } A} = v_B - v_A = 25 - 20 = 5 \text{ m/s}
\]

**Physical Meaning:**
- Car B closes the gap at 5 m/s
- From A's viewpoint, B approaches at 5 m/s
- This is the "closing speed"

**Application to Overtake:**
- Gap at t = 5s: 100 meters (A's head start)
- Closing rate: 5 m/s
- Time to close gap: Δt = 100m / 5m/s = 20 seconds
- Overtake time: 5s + 20s = 25s ✓

**This matches our algebraic solution!**

### Reference Frames

**Ground Reference Frame (Stationary Observer):**
- Car A: x_A = 20t
- Car B: x_B = 25t - 125
- Both velocities are positive (both moving forward)

**Car A Reference Frame (Moving with A):**
- Car A: x_A' = 0 (always at origin in its own frame!)
- Car B relative position: x_B' = x_B - x_A = (25t - 125) - 20t = 5t - 125
- Car B approaches at constant 5 m/s

**Finding overtake in A's frame:**
\[
x_B' = 0 \text{ (when B reaches A)}
\]
\[
5t - 125 = 0
\]
\[
t = 25 \text{ seconds} \,\checkmark
\]

**Same answer! Physics is consistent across reference frames.**

### Connection to Real Physics

**Highway Passing:**
- You're driving 100 km/h
- Car ahead at 90 km/h
- How fast are they "coming at you"? 0 km/h (pulling away!)
- How fast are you approaching them? 10 km/h (relative velocity)

**Overtaking Problem:**
- If they're 100m ahead
- You approach at 10 km/h ≈ 2.78 m/s relative
- Time to catch: 100m / 2.78 m/s ≈ 36 seconds

**Same physics as our simulation!**

## 🔍 Common Student Questions

### Q: "Why is the y-intercept negative for Car B?"

**A:** The equation x = 25t - 125 represents the full line. At t = 0, Car B would be at position -125m if it were moving. But it's NOT moving yet (waiting for delay)! The negative intercept shows it "needs to make up" that distance.

**Better way to think about it:**
- Car B only moves when t ≥ 5
- For t < 5: x_B = 0 (not moving)
- For t ≥ 5: x_B = 25(t - 5)

### Q: "What if the slopes are equal?"

**A:** Equal slopes = parallel lines!
- v_A = v_B → lines never intersect
- If Car A starts first, it always stays ahead
- No solution to the system (except if they start at same position)

**Example:**
- Both at 25 m/s
- A starts at t = 0, B starts at t = 5
- Equation: 25t = 25t - 125 → 0 = -125 (FALSE!)
- No intersection = B never catches up

### Q: "Can Car A catch Car B?"

**A:** Yes, if Car A is faster!
- Needs: v_A > v_B
- Even if B starts first, A's higher speed wins eventually
- The steeper slope will always catch the shallower one

**Example:**
- Car A: 30 m/s, starts at 0s
- Car B: 20 m/s, starts at 0s (head start of 100m = delay effect)
- Eventually A's steeper slope crosses B's line

### Q: "What if one car is already ahead?"

**A:** We can model initial positions too!

**Modified equations:**
\[
x_A = x_{0A} + v_A t
\]
\[
x_B = x_{0B} + v_B t
\]

This is still a system of linear equations!

## 📊 Assessment Questions

### Multiple Choice

**Q1:** Two cars have position equations x_A = 15t and x_B = 20t - 60. What does the intersection point represent?
- a) When Car A is fastest
- b) When the cars are at the same position ✓
- c) When both cars stop
- d) The average position

**Q2:** If two lines on a position-time graph are parallel, what does this mean?
- a) The cars have equal velocities ✓
- b) The cars will collide
- c) One car is stopped
- d) The cars are accelerating

**Q3:** In the equation x = 25(t - 5), what does the 5 represent?
- a) The velocity
- b) The final position
- c) The start delay ✓
- d) The distance traveled

### Numerical Problems

**Problem 1:**
Car A travels at 18 m/s starting at t = 0. Car B travels at 22 m/s starting at t = 6s.

a) Write the position equation for each car  
b) Solve for when Car B catches Car A  
c) What is their position when they meet?

**Solution:**
```
a) x_A = 18t
   x_B = 22(t - 6) = 22t - 132

b) Set equal:
   18t = 22t - 132
   -4t = -132
   t = 33 seconds

c) x = 18(33) = 594 meters
   Verify: x_B = 22(33) - 132 = 726 - 132 = 594 ✓
```

**Problem 2:**
Two cars start together (no delays) with Car A at 25 m/s and Car B at 30 m/s. After how long is Car B 100 meters ahead?

**Solution:**
```
Gap = x_B - x_A = 100
30t - 25t = 100
5t = 100
t = 20 seconds
```

**Problem 3:**
Car A: 20 m/s, starts at t = 0  
Car B: 15 m/s, starts at t = 0 (but 200m ahead initially)

When does A catch B?

**Solution:**
```
x_A = 20t
x_B = 200 + 15t

Set equal:
20t = 200 + 15t
5t = 200
t = 40 seconds

Position: x = 20(40) = 800 meters
```

### Open Response

**Q1:** "Explain how the intersection point on a position-time graph relates to solving a system of equations. Why does finding where the graphs cross give us the solution?"

**Expected Answer:**
- Each graph represents one equation
- Intersection = point that satisfies BOTH equations
- x-coordinate = time value that solves the system
- y-coordinate = position value (substitute time into either equation)
- This is the graphical method of solving systems
- Proves algebraic and graphical methods give same answer

**Q2:** "Car A travels at 20 m/s starting immediately. Car B travels at 15 m/s. Explain why Car B will never catch Car A, even if it starts first. Use both algebra and graphs in your explanation."

**Expected Answer:**
- Algebraic: If v_B < v_A and B doesn't start ahead enough, equations show no solution
- Graphical: Car A line has steeper slope, so even if B line starts higher, A's line will cross it and stay above
- Once A passes B, the gap only grows (since A is faster)
- For B to win, it needs either higher velocity OR sufficient head start

## 🎯 Step-by-Step Problem Solving Method

### The 5-Step Method

**Step 1: IDENTIFY THE VARIABLES**
- What are we solving for? (Usually time and/or position)
- What information is given? (Speeds, delays, distances)

**Step 2: WRITE THE EQUATIONS**
- Car A: x_A = v_A(t - d_A)
- Car B: x_B = v_B(t - d_B)

**Step 3: SET UP THE SYSTEM**
- What condition are we looking for? (Usually x_A = x_B)
- Create equation by setting positions equal

**Step 4: SOLVE**
- Use algebra to isolate t
- Substitute back to find position

**Step 5: VERIFY & INTERPRET**
- Check solution in both equations
- Make sure answer makes physical sense
- Interpret what it means for the race

## 📈 Graph Analysis Skills

### Reading Position-Time Graphs

**Slope = Velocity:**
- Steeper slope = faster car
- Compare slopes to see who's faster

**Y-Intercept:**
- Where line crosses y-axis (at t = 0)
- Negative intercept = delayed start (in equation form)
- Actual starting position may be different!

**Intersection Point:**
- Where lines cross
- x-coordinate = when they meet
- y-coordinate = where they meet
- **This is the solution!**

**Line Positions:**
- Higher line = car is ahead
- Lines crossing = cars at same position
- After crossing = other car now ahead

### Predicting Race Outcomes from Graphs

**Before running:**
1. Sketch both lines
2. Identify slopes (velocities)
3. Determine if they'll intersect
4. Estimate intersection point
5. Predict winner

**Check predictions:**
- Run simulation
- Compare to sketched graph
- Refine understanding

## 🚗 Sample Scenarios with Solutions

### Scenario 1: Default (B Catches A)

**Setup:**
- Car A: 20 m/s, no delay
- Car B: 25 m/s, 5s delay

**Equations:**
```
x_A = 20t
x_B = 25(t - 5) = 25t - 125
```

**Solution:**
```
20t = 25t - 125
t = 25 seconds
x = 500 meters
```

**Outcome:** B catches A at 500m and pulls ahead. A reaches 1000m first IF race ends before B can get there.

### Scenario 2: Close Race (B Barely Catches A)

**Setup:**
- Car A: 24 m/s, no delay
- Car B: 25 m/s, 8s delay

**Equations:**
```
x_A = 24t
x_B = 25(t - 8) = 25t - 200
```

**Solution:**
```
24t = 25t - 200
-t = -200
t = 200 seconds
x = 24(200) = 4800 meters
```

**Outcome:** B catches A WAY down the track! For 1000m race, A wins because intersection is beyond finish line.

### Scenario 3: Parallel Lines (Never Meet)

**Setup:**
- Car A: 25 m/s, no delay
- Car B: 25 m/s, 5s delay

**Equations:**
```
x_A = 25t
x_B = 25(t - 5) = 25t - 125
```

**Solution:**
```
25t = 25t - 125
0 = -125 (FALSE!)
```

**Outcome:** No solution! Lines are parallel (same slope), never intersect. A maintains 125m lead forever.

### Scenario 4: Reverse (A Catches B)

**Setup:**
- Car A: 30 m/s, 3s delay
- Car B: 20 m/s, no delay

**Equations:**
```
x_A = 30(t - 3) = 30t - 90
x_B = 20t
```

**Solution:**
```
30t - 90 = 20t
10t = 90
t = 9 seconds
x = 20(9) = 180 meters
```

**Outcome:** Despite starting later, A's higher speed catches B at 180m!

## 🧪 Extensions and Advanced Topics

### Extension 1: Three Cars

**Challenge:** Add Car C with different parameters
- Now need to find multiple intersection points
- Three equations, pairs of intersections
- More complex system!

### Extension 2: Acceleration

**What if cars accelerate?**
- Equations become quadratic: x = x₀ + v₀t + ½at²
- System of quadratic equations
- Can have 0, 1, or 2 intersection points!

### Extension 3: Variable Delays

**Problem:** Car B waits until Car A reaches 100m, then starts at 30 m/s
- First: Calculate when A reaches 100m
- Then: Set that as B's start time
- Solve system with calculated delay

### Extension 4: Who Wins the 1000m Race?

**Different question:** Not "when do they meet?" but "who finishes first?"

**Method:**
- Calculate when each reaches 1000m
- Compare times
- Faster time = winner
- May overtake but still lose!

## 📊 Real-World Applications

### Traffic & Passing

**Highway scenario:**
- You're driving 100 km/h
- Car ahead going 90 km/h, 200m ahead
- When will you catch them?

**Same math!**

### Running Races

**Track scenario:**
- Runner A: 5 m/s pace
- Runner B: 6 m/s pace, starts 30s later
- Who wins 5000m race?

### Aviation

**Two planes:**
- Different speeds
- Different departure times
- When does faster plane pass slower one?

## 🎯 Learning Outcomes

After this lesson, students can:

✅ Translate word problems into equations  
✅ Set up systems of linear equations  
✅ Solve systems algebraically  
✅ Graph multiple equations on same axes  
✅ Find intersection points visually  
✅ Interpret intersection in context  
✅ Verify algebraic solutions graphically  
✅ Apply to relative motion problems  
✅ Predict outcomes before calculating  
✅ Understand slope as velocity  

## 🌟 Why This Simulation Works

### 1. **Concrete Context**
- Car race is relatable
- Visual makes it real
- Easy to understand the question

### 2. **Immediate Feedback**
- Calculate, then test
- See if prediction matches
- Purple overtake line confirms solution

### 3. **Multiple Representations**
- Algebraic (equations)
- Graphical (intersection)
- Visual (animated race)
- Numerical (data table)

### 4. **Adjustable Parameters**
- Try different scenarios
- Test edge cases
- Explore systematically

### 5. **Bridges Physics & Math**
- Uses physics context (motion)
- Teaches math skill (systems of equations)
- Shows they're connected!

## 📝 Homework Problems

**Problem Set: Using the Simulation**

1. Set Car A to 18 m/s (no delay) and Car B to 24 m/s (delay 4s). Calculate when B catches A, then verify with simulation.

2. Find settings where Car B catches Car A at exactly t = 30s.

3. Create a race where the cars meet at exactly 600m. Show your equations.

4. Set both cars to 22 m/s with different delays. Explain what happens and why.

5. Car A is at 25 m/s, Car B at 20 m/s. What delay would Car B need to still catch A before 1000m? (Requires reverse calculation!)

---

**Created:** October 11, 2025  
**Topics:** Systems of Equations, Linear Functions, Kinematics  
**Grade Level:** Algebra 1 / Physics  
**Duration:** 25-40 minutes (full lesson)  
**Type:** Integrated Math & Science

**Perfect for:**
- Introducing systems of equations
- Reviewing linear functions
- Applying algebra to physics
- Problem-solving practice
- Graph interpretation skills

