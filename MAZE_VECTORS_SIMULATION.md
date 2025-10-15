# Maze Navigator: Vector Addition Simulation

## 🎯 Overview

A new interactive simulation where students guide a mouse 🐭 through a maze to find cheese 🧀 while learning about **vector addition** and **vector components**. The simulation provides real-time visual feedback showing how position vectors are composed of x and y components.

## ✨ Key Features

### 🎮 Interactive Maze Navigation
- **10x10 grid maze** with walls and pathways
- **Keyboard controls**: Arrow keys or WASD to move
- **Smooth movement** through the maze
- **Visual feedback**: Mouse emoji moves in real-time
- **Win condition**: Reach the cheese!

### 📊 Real-Time Vector Visualization

The simulation displays three vectors simultaneously:

1. **Red X-Component Vector** (→)
   - Horizontal component from origin
   - Shows distance along x-axis
   - Labeled with current x value

2. **Blue Y-Component Vector** (↓)
   - Vertical component from origin
   - Shows distance along y-axis
   - Labeled with current y value

3. **Purple Resultant Vector** (diagonal dashed line)
   - Direct path from origin to mouse position
   - Sum of x and y components
   - Shows magnitude using Pythagorean theorem

### 📐 Live Mathematics Display

**Position Vector Formula:**
```
r⃗ = x⃗ + y⃗
= x x̂ + y ŷ
```

**Magnitude Calculation:**
```
|r⃗| = √(x² + y²)
```

Updates in real-time as the mouse moves!

## 🎓 Learning Objectives

Students will learn:

1. **Vector Components**
   - Position vectors have x and y components
   - Components are perpendicular to each other
   - Each component is measured along its axis

2. **Vector Addition**
   - Resultant vector = sum of component vectors
   - Geometric interpretation: "tip-to-tail" method
   - Algebraic: add x-components, add y-components separately

3. **Pythagorean Theorem Application**
   - Finding magnitude from components
   - Formula: |r⃗| = √(x² + y²)
   - 3-4-5 triangle as special case

4. **Coordinate Systems**
   - Origin as reference point
   - Positive directions for x and y
   - Position vectors from origin

## 🎨 Visual Design

### Color Coding
- 🔴 **Red**: X-component (horizontal)
- 🔵 **Blue**: Y-component (vertical)
- 🟣 **Purple**: Resultant vector (diagonal)
- 🟢 **Green**: Start position
- 🧀 **Yellow**: Goal (cheese)
- ⚫ **Gray**: Walls

### Display Cards
Three live-updating cards show:
1. **X-Component**: Current x value with "→ Horizontal" label
2. **Y-Component**: Current y value with "↓ Vertical" label
3. **Magnitude**: Calculated |r⃗| with "Resultant" label

### Educational Panels
- **Vector Addition Formula**: Shows r⃗ = x⃗ + y⃗ with current values
- **Magnitude Formula**: Shows Pythagorean theorem calculation
- **Key Concepts**: Explains each component type
- **Try This**: Suggested activities and challenges

## 🎮 How to Play

### Controls
- **Arrow Keys** or **WASD** to move the mouse
- Navigate through white pathways
- Avoid gray walls
- Reach the cheese at position (8, 8)

### Learning Activities

**Activity 1: Component Recognition**
1. Move to position (3, 0) - only x-component
2. Move to position (0, 3) - only y-component
3. Move to position (3, 3) - both components equal

**Activity 2: Pythagorean Triples**
1. Find position where x=3, y=4
2. Observe magnitude = 5 (3-4-5 triangle!)
3. Try x=6, y=8 → magnitude = 10 (double)

**Activity 3: Vector Addition**
1. Start at origin (0, 0)
2. Move 3 units right (x=3)
3. Then 4 units down (y=4)
4. See how the purple vector "adds" these movements

**Activity 4: Find the Cheese**
- Navigate from (1, 1) to (8, 8)
- Calculate expected magnitude: √(8² + 8²) ≈ 11.31m
- Verify when you arrive!

## 📊 Sample Values

| Position | X-Component | Y-Component | Magnitude |
|----------|-------------|-------------|-----------|
| (1, 1) | 1.0m | 1.0m | 1.41m |
| (3, 4) | 3.0m | 4.0m | 5.00m ✨ |
| (5, 5) | 5.0m | 5.0m | 7.07m |
| (6, 8) | 6.0m | 8.0m | 10.00m ✨ |
| (8, 8) | 8.0m | 8.0m | 11.31m 🧀 |

✨ = Pythagorean triple

## 🎯 Assessment Ideas

### Multiple Choice
**Q:** "If the x-component is 3m and y-component is 4m, what is the magnitude of the position vector?"
- a) 7m
- b) 5m ✓
- c) 12m
- d) 1m

### Numerical
**Q:** "The mouse is at position (6, 8). Calculate the magnitude of its position vector."
- **Answer:** 10m (using √(36 + 64) = √100 = 10)

### Open Response
**Q:** "Explain how the resultant vector (purple) is related to the component vectors (red and blue). Use the concept of vector addition in your answer."

**Expected:** Student should mention:
- Resultant is the sum of components
- Red vector (x) goes horizontally
- Blue vector (y) goes vertically
- Purple vector is the diagonal (direct path)
- Pythagorean theorem connects them

## 🔧 Technical Implementation

### Maze System
- 10×10 grid with predefined wall pattern
- Collision detection prevents moving through walls
- Smooth sub-grid movement for natural control

### Vector Rendering
- Canvas-based drawing with arrows
- Real-time position tracking
- Component vectors drawn first (red, blue)
- Resultant vector overlaid (purple, dashed)

### Math Updates
- Position updates on every movement
- Magnitude calculated: `Math.sqrt(x² + y²)`
- Formulas display with current values
- All values rounded to 2 decimal places

## 📚 Key Concepts Taught

### 1. **Position Vectors**
- Every point in space can be described by a position vector
- Position vector points from origin to the location
- Measured in x and y directions

### 2. **Vector Components**
- Any vector can be broken into perpendicular components
- X-component: parallel to x-axis
- Y-component: parallel to y-axis
- Components are scalar values (just numbers with direction)

### 3. **Vector Addition (Component Method)**
```
r⃗₁ = x₁ x̂ + y₁ ŷ
r⃗₂ = x₂ x̂ + y₂ ŷ
r⃗₁ + r⃗₂ = (x₁ + x₂) x̂ + (y₁ + y₂) ŷ
```

### 4. **Pythagorean Theorem**
```
|r⃗| = √(x² + y²)
```
This connects algebra to geometry!

### 5. **Right Triangle Relationship**
The three vectors form a right triangle:
- X-component = base
- Y-component = height
- Resultant = hypotenuse

## 🎓 Common Student Insights

### "Aha!" Moments

1. **"The purple vector is the shortcut!"**
   - Students realize the resultant is the direct path
   - Component vectors are the "step-by-step" path

2. **"It's just like the Pythagorean theorem!"**
   - Connection between vectors and right triangles
   - Math they already know applies to physics

3. **"Moving right then down = moving diagonally!"**
   - Vector addition as combination of movements
   - Order doesn't matter (commutative property)

4. **"3-4-5 works every time!"**
   - Recognition of Pythagorean triples
   - Can predict magnitude without calculator

## 🚀 Extension Activities

### Challenge 1: Shortest Path
Find the path to the cheese that minimizes the magnitude at each step.

### Challenge 2: Predict Before Move
Before moving, predict what the new magnitude will be. Then check!

### Challenge 3: Zero Component
Can you reach a position where only one component is zero?

### Challenge 4: Equal Components
Find three different positions where x = y. What's special about these?

## 📊 Data Tracking

The simulation tracks:
- Current position (x, y)
- Magnitude |r⃗|
- Number of moves taken
- Whether cheese was found
- Time to completion

## 🎯 Success Criteria

Students demonstrate understanding when they can:
1. ✅ Identify x and y components from a position
2. ✅ Calculate magnitude using Pythagorean theorem
3. ✅ Explain how resultant = sum of components
4. ✅ Draw vector diagrams showing addition
5. ✅ Recognize perpendicular components

## 📝 Files Created

1. **`src/app/simulations/maze-vectors/page.tsx`** (750+ lines)
   - Complete simulation with maze navigation
   - Real-time vector visualization
   - Educational content panels
   - Assignment system integration

2. **`scripts/add-maze-vectors-simulation.sql`**
   - Database registration
   - 7 learning objectives
   - 11 key concepts
   - Metadata and tags

## 🎉 Ready to Use!

To deploy:

1. **Run the database migration:**
   ```bash
   psql -h your-db-host -U postgres -d postgres -f scripts/add-maze-vectors-simulation.sql
   ```

2. **Access the simulation:**
   - Navigate to `/simulations/maze-vectors`
   - Or find it in the simulations library

3. **Test the controls:**
   - Use arrow keys or WASD to move
   - Watch the vectors update in real-time
   - Try to reach the cheese!

---

**Created:** October 11, 2025  
**Difficulty:** Beginner  
**Estimated Time:** 15 minutes  
**Unit:** Kinematics (Unit 1)  
**Focus:** Vector Addition & Components

**Standards Alignment:**
- NGSS HS-PS2: Motion vectors
- Common Core Math: Coordinate geometry, Pythagorean theorem
- AP Physics 1: Kinematics - vector representation

