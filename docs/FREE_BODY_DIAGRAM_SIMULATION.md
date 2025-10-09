# Free Body Diagram Simulation

## Overview
An interactive free body diagram simulation that demonstrates Newton's Second Law (F = ma) through a drag-and-drop experience with real-time vector calculations.

## Features

### 🎯 Core Functionality
- **Drag-and-Drop Force Vectors**: Students can drag force arrow heads to change magnitude and direction
- **Real-Time Calculations**: Live display of:
  - Mass (adjustable via slider)
  - Net Force (vector sum of all applied forces)
  - Resulting Acceleration (calculated from F = ma)
- **Visual Feedback**:
  - Individual force vectors (customizable colors)
  - Net force vector (green dashed line)
  - Acceleration vector (yellow dotted line)
  - Grid overlay for spatial reference

### 🎮 Interactive Controls
- **Mass Slider**: Adjust object mass from 1-20 kg
- **Add/Remove Forces**: Support up to 5 simultaneous force vectors
- **Force Properties**: 
  - Magnitude: 0-100 N
  - Angle: -180° to 180°
- **Presets**: Quick-start scenarios
  - Balanced Forces
  - Unbalanced Forces
  - Gravity Only
  - With Friction

### 📊 Educational Features
- **Real-Time Metrics Display**:
  - Mass in kg
  - Net Force in Newtons (with x, y components)
  - Acceleration in m/s² (with x, y components)
  - Live F = ma equation with actual values
- **Visual Options**:
  - Toggle grid display
  - Toggle labels
  - Toggle acceleration vector
- **Data Export**: Download JSON data for analysis

## Physics Concepts Demonstrated

### Newton's Second Law
The simulation directly demonstrates F = ma by showing:
1. How multiple forces combine to create a net force
2. The relationship between net force and acceleration
3. The inverse relationship between mass and acceleration

### Vector Addition
Students can visualize:
- How forces in different directions combine
- The concept of balanced vs unbalanced forces
- Vector components (x and y)

### Key Learning Objectives
- Understand the relationship between force, mass, and acceleration
- Practice vector addition and decomposition
- Visualize how multiple forces affect an object
- Explore equilibrium conditions (balanced forces)
- See the proportional relationship in Newton's Second Law

## Technical Implementation

### Location
`src/app/simulations/free-body-diagram/page.tsx`

### Technologies Used
- React with TypeScript
- HTML5 Canvas for visualization
- Touch/mouse event handling for interaction
- Real-time physics calculations
- Responsive design with Tailwind CSS
- shadcn/ui components for controls

### Access URL
`/simulations/free-body-diagram`

## Database Configuration
The simulation has been added to the database with:
- **Slug**: `free-body-diagram`
- **Unit**: Unit 2: Forces
- **Difficulty**: Intermediate
- **Estimated Time**: 25 minutes
- **Featured**: Yes

## Student Workflow

1. **Initial Setup**
   - Start with a single force vector
   - Adjust mass using slider
   - Observe initial acceleration

2. **Exploration**
   - Add additional force vectors
   - Drag arrow heads to change magnitude/direction
   - Watch real-time updates to calculations

3. **Experimentation**
   - Try preset scenarios
   - Create balanced force situations (net force = 0)
   - Explore how mass affects acceleration

4. **Analysis**
   - Compare force magnitudes to acceleration
   - Export data for further analysis
   - Document observations

## Teacher Features

- **AI Integration**: Through SimulationWrapper for tracking progress
- **Success Criteria**:
  - Minimum 5 interactions
  - Required actions: force_added, mass_changed, force_modified
  - Minimum duration: 2 minutes
- **Data Export**: Students can export their work for grading
- **Progress Tracking**: Automatic tracking of student interactions

## Visual Design

### Color Coding
- **Applied Forces**: Red, teal, purple, amber, green (rotating palette)
- **Net Force**: Green (dashed line)
- **Acceleration**: Yellow/amber (dotted line)
- **Object**: Gradient gray box

### User Interface
- Clean, modern design with card-based layout
- Real-time calculation display in prominent position
- Intuitive controls with immediate visual feedback
- Mobile-responsive with touch support

## Pedagogical Value

This simulation provides:
1. **Hands-on Learning**: Direct manipulation of physics concepts
2. **Immediate Feedback**: See results of changes instantly
3. **Multiple Representations**: Visual, numerical, and equation forms
4. **Scaffolded Learning**: Start simple, add complexity
5. **Experimental Approach**: Test hypotheses about force relationships

## Future Enhancements

Potential additions:
- Friction coefficient settings
- Inclined plane scenarios
- Spring forces
- Circular motion paths
- Time-based animation of motion
- Force tables and data recording
- Student challenges/problems to solve
