/**
 * Physics Education Standards
 * 
 * Comprehensive collection of physics standards including:
 * - NGSS (Next Generation Science Standards)
 * - AP Physics (AP Physics 1, AP Physics 2, AP Physics C)
 * - Massachusetts State Standards for Physics
 * 
 * Use these to align content generation with specific educational standards.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Standard {
  id: string
  code: string
  title: string
  description: string
  topics: string[]  // Related physics topics from reading-lesson-config
  gradeLevel?: string
  practices?: string[]  // Science and engineering practices
}

export interface StandardSet {
  id: string
  name: string
  shortName: string
  description: string
  icon: string
  color: string
  standards: Standard[]
}

// ============================================================================
// NGSS PHYSICS STANDARDS (High School Physical Science)
// ============================================================================

export const ngssStandards: StandardSet = {
  id: 'ngss',
  name: 'Next Generation Science Standards',
  shortName: 'NGSS',
  description: 'National standards emphasizing scientific practices, crosscutting concepts, and disciplinary core ideas',
  icon: '🔬',
  color: 'emerald',
  standards: [
    // Motion and Stability: Forces and Interactions
    {
      id: 'ngss-ps2-1',
      code: 'HS-PS2-1',
      title: 'Newton\'s Second Law',
      description: 'Analyze data to support the claim that Newton\'s second law of motion describes the mathematical relationship among the net force on a macroscopic object, its mass, and its acceleration.',
      topics: ['forces', 'kinematics'],
      gradeLevel: '9-12',
      practices: ['Analyzing and Interpreting Data', 'Mathematical Thinking']
    },
    {
      id: 'ngss-ps2-2',
      code: 'HS-PS2-2',
      title: 'Momentum Conservation',
      description: 'Use mathematical representations to support the claim that the total momentum of a system of objects is conserved when there is no net force on the system.',
      topics: ['momentum', 'forces'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Constructing Explanations']
    },
    {
      id: 'ngss-ps2-3',
      code: 'HS-PS2-3',
      title: 'Collisions and Force',
      description: 'Apply scientific and engineering ideas to design, evaluate, and refine a device that minimizes the force on a macroscopic object during a collision.',
      topics: ['momentum', 'forces'],
      gradeLevel: '9-12',
      practices: ['Engineering Design', 'Developing Solutions']
    },
    {
      id: 'ngss-ps2-4',
      code: 'HS-PS2-4',
      title: 'Gravitational and Electrostatic Forces',
      description: 'Use mathematical representations of Newton\'s Law of Gravitation and Coulomb\'s Law to describe and predict the gravitational and electrostatic forces between objects.',
      topics: ['forces', 'electricity'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Developing Models']
    },
    {
      id: 'ngss-ps2-5',
      code: 'HS-PS2-5',
      title: 'Electric and Magnetic Fields',
      description: 'Plan and conduct an investigation to provide evidence that an electric current can produce a magnetic field and that a changing magnetic field can produce an electric current.',
      topics: ['magnetism', 'electricity'],
      gradeLevel: '9-12',
      practices: ['Planning Investigations', 'Analyzing Data']
    },
    // Energy
    {
      id: 'ngss-ps3-1',
      code: 'HS-PS3-1',
      title: 'Energy in a System',
      description: 'Create a computational model to calculate the change in the energy of one component in a system when the change in energy of the other component(s) and energy flows in and out of the system are known.',
      topics: ['energy'],
      gradeLevel: '9-12',
      practices: ['Computational Thinking', 'Developing Models']
    },
    {
      id: 'ngss-ps3-2',
      code: 'HS-PS3-2',
      title: 'Energy and Forces',
      description: 'Develop and use models to illustrate that energy at the macroscopic scale can be accounted for as a combination of energy associated with the motion of particles (objects) and energy associated with the relative positions of particles (objects).',
      topics: ['energy', 'forces'],
      gradeLevel: '9-12',
      practices: ['Developing Models', 'Constructing Explanations']
    },
    {
      id: 'ngss-ps3-3',
      code: 'HS-PS3-3',
      title: 'Energy Efficiency',
      description: 'Design, build, and refine a device that works within given constraints to convert one form of energy into another form of energy.',
      topics: ['energy', 'thermodynamics'],
      gradeLevel: '9-12',
      practices: ['Engineering Design', 'Developing Solutions']
    },
    // Waves and Their Applications
    {
      id: 'ngss-ps4-1',
      code: 'HS-PS4-1',
      title: 'Wave Properties',
      description: 'Use mathematical representations to support a claim regarding relationships among the frequency, wavelength, and speed of waves traveling in various media.',
      topics: ['waves'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Constructing Arguments']
    },
    {
      id: 'ngss-ps4-2',
      code: 'HS-PS4-2',
      title: 'Wave Interactions',
      description: 'Evaluate questions about the advantages of using digital transmission and storage of information.',
      topics: ['waves', 'electricity'],
      gradeLevel: '9-12',
      practices: ['Asking Questions', 'Evaluating Information']
    },
    {
      id: 'ngss-ps4-3',
      code: 'HS-PS4-3',
      title: 'Electromagnetic Radiation',
      description: 'Evaluate the claims, evidence, and reasoning behind the idea that electromagnetic radiation can be described either by a wave model or a particle model, and that for some situations one model is more useful than the other.',
      topics: ['waves', 'optics', 'modern-physics'],
      gradeLevel: '9-12',
      practices: ['Evaluating Information', 'Engaging in Argument']
    },
    {
      id: 'ngss-ps4-4',
      code: 'HS-PS4-4',
      title: 'Communication Technologies',
      description: 'Evaluate the validity and reliability of claims in published materials of the effects that different frequencies of electromagnetic radiation have when absorbed by matter.',
      topics: ['waves', 'optics'],
      gradeLevel: '9-12',
      practices: ['Evaluating Information', 'Obtaining Information']
    },
    {
      id: 'ngss-ps4-5',
      code: 'HS-PS4-5',
      title: 'Information Technologies',
      description: 'Communicate technical information about how some technological devices use the principles of wave behavior and wave interactions with matter to transmit and capture information and energy.',
      topics: ['waves', 'optics', 'electricity'],
      gradeLevel: '9-12',
      practices: ['Communicating Information', 'Obtaining Information']
    }
  ]
}

// ============================================================================
// AP PHYSICS STANDARDS
// ============================================================================

export const apPhysics1Standards: StandardSet = {
  id: 'ap-physics-1',
  name: 'AP Physics 1: Algebra-Based',
  shortName: 'AP Physics 1',
  description: 'College-level algebra-based physics covering mechanics, waves, and introductory circuits',
  icon: '📐',
  color: 'blue',
  standards: [
    // Unit 1: Kinematics
    {
      id: 'ap1-1-1',
      code: 'AP1.1',
      title: 'Position, Velocity, and Acceleration',
      description: 'Describe the motion of an object using position, velocity, and acceleration as functions of time, including graphical and mathematical representations.',
      topics: ['kinematics'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Mathematical Routines', 'Data Analysis']
    },
    {
      id: 'ap1-1-2',
      code: 'AP1.2',
      title: 'Motion in One Dimension',
      description: 'Analyze motion in one dimension using kinematic equations and graphs to predict future positions and velocities.',
      topics: ['kinematics'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    {
      id: 'ap1-1-3',
      code: 'AP1.3',
      title: 'Motion in Two Dimensions',
      description: 'Analyze projectile motion by resolving the motion into horizontal and vertical components.',
      topics: ['kinematics'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Mathematical Routines']
    },
    // Unit 2: Dynamics
    {
      id: 'ap1-2-1',
      code: 'AP1.4',
      title: 'Newton\'s Laws of Motion',
      description: 'Apply Newton\'s first, second, and third laws to analyze the motion of objects and systems of objects.',
      topics: ['forces'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Mathematical Routines', 'Experimental Design']
    },
    {
      id: 'ap1-2-2',
      code: 'AP1.5',
      title: 'Force Analysis',
      description: 'Identify and analyze forces acting on objects including gravitational, normal, friction, tension, and spring forces.',
      topics: ['forces'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Scientific Questioning']
    },
    {
      id: 'ap1-2-3',
      code: 'AP1.6',
      title: 'Circular Motion and Gravitation',
      description: 'Analyze circular motion and gravitational interactions using centripetal force and Newton\'s law of universal gravitation.',
      topics: ['forces', 'rotational'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    // Unit 3: Work, Energy, and Power
    {
      id: 'ap1-3-1',
      code: 'AP1.7',
      title: 'Work-Energy Theorem',
      description: 'Apply the work-energy theorem to analyze the motion of objects and systems.',
      topics: ['energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Data Analysis']
    },
    {
      id: 'ap1-3-2',
      code: 'AP1.8',
      title: 'Conservation of Energy',
      description: 'Apply conservation of energy to analyze mechanical systems, including those with non-conservative forces.',
      topics: ['energy'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Mathematical Routines']
    },
    {
      id: 'ap1-3-3',
      code: 'AP1.9',
      title: 'Power',
      description: 'Calculate and analyze power as the rate of energy transfer.',
      topics: ['energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines']
    },
    // Unit 4: Systems of Particles and Linear Momentum
    {
      id: 'ap1-4-1',
      code: 'AP1.10',
      title: 'Center of Mass',
      description: 'Analyze the motion of systems of particles, including the motion of the center of mass.',
      topics: ['momentum'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Mathematical Routines']
    },
    {
      id: 'ap1-4-2',
      code: 'AP1.11',
      title: 'Impulse and Momentum',
      description: 'Apply the impulse-momentum theorem and conservation of momentum to analyze collisions and explosions.',
      topics: ['momentum'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Experimental Design']
    },
    // Unit 5: Rotation
    {
      id: 'ap1-5-1',
      code: 'AP1.12',
      title: 'Rotational Kinematics',
      description: 'Analyze rotational motion using angular position, velocity, acceleration, and kinematic equations.',
      topics: ['rotational'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'ap1-5-2',
      code: 'AP1.13',
      title: 'Torque and Rotational Dynamics',
      description: 'Apply Newton\'s second law for rotation to analyze torque and angular acceleration.',
      topics: ['rotational'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    {
      id: 'ap1-5-3',
      code: 'AP1.14',
      title: 'Angular Momentum',
      description: 'Apply conservation of angular momentum to analyze rotational systems.',
      topics: ['rotational', 'momentum'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    // Unit 6: Oscillations
    {
      id: 'ap1-6-1',
      code: 'AP1.15',
      title: 'Simple Harmonic Motion',
      description: 'Analyze simple harmonic motion for springs and pendulums, including relationships between period, frequency, and physical parameters.',
      topics: ['waves', 'energy'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Mathematical Routines']
    },
    // Unit 7: Waves
    {
      id: 'ap1-7-1',
      code: 'AP1.16',
      title: 'Wave Properties',
      description: 'Describe and analyze the properties of mechanical waves, including wavelength, frequency, speed, and amplitude.',
      topics: ['waves'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Data Analysis']
    },
    {
      id: 'ap1-7-2',
      code: 'AP1.17',
      title: 'Wave Behavior',
      description: 'Analyze wave phenomena including reflection, transmission, superposition, and standing waves.',
      topics: ['waves'],
      gradeLevel: '11-12',
      practices: ['Argumentation', 'Experimental Design']
    }
  ]
}

export const apPhysics2Standards: StandardSet = {
  id: 'ap-physics-2',
  name: 'AP Physics 2: Algebra-Based',
  shortName: 'AP Physics 2',
  description: 'College-level algebra-based physics covering thermodynamics, fluids, electricity, magnetism, optics, and modern physics',
  icon: '⚡',
  color: 'violet',
  standards: [
    // Unit 1: Fluids
    {
      id: 'ap2-1-1',
      code: 'AP2.1',
      title: 'Fluid Statics',
      description: 'Apply concepts of pressure, buoyancy, and Pascal\'s principle to analyze fluid systems at rest.',
      topics: ['fluids'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'ap2-1-2',
      code: 'AP2.2',
      title: 'Fluid Dynamics',
      description: 'Apply the continuity equation and Bernoulli\'s equation to analyze fluid flow.',
      topics: ['fluids'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    // Unit 2: Thermodynamics
    {
      id: 'ap2-2-1',
      code: 'AP2.3',
      title: 'Temperature and Heat Transfer',
      description: 'Analyze heat transfer and temperature changes using specific heat capacity and thermal equilibrium.',
      topics: ['thermodynamics'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Data Analysis']
    },
    {
      id: 'ap2-2-2',
      code: 'AP2.4',
      title: 'Ideal Gas Law',
      description: 'Apply the ideal gas law and kinetic theory to analyze gas behavior.',
      topics: ['thermodynamics'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'ap2-2-3',
      code: 'AP2.5',
      title: 'Laws of Thermodynamics',
      description: 'Apply the first and second laws of thermodynamics to analyze energy transfers and entropy.',
      topics: ['thermodynamics', 'energy'],
      gradeLevel: '11-12',
      practices: ['Argumentation', 'Mathematical Routines']
    },
    // Unit 3: Electric Force, Field, and Potential
    {
      id: 'ap2-3-1',
      code: 'AP2.6',
      title: 'Electric Charge and Coulomb\'s Law',
      description: 'Apply Coulomb\'s law to analyze forces between charged objects.',
      topics: ['electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'ap2-3-2',
      code: 'AP2.7',
      title: 'Electric Fields',
      description: 'Describe and calculate electric fields due to various charge distributions.',
      topics: ['electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'ap2-3-3',
      code: 'AP2.8',
      title: 'Electric Potential',
      description: 'Calculate electric potential and potential energy for charge systems.',
      topics: ['electricity', 'energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    // Unit 4: Electric Circuits
    {
      id: 'ap2-4-1',
      code: 'AP2.9',
      title: 'Current, Resistance, and Power',
      description: 'Apply Ohm\'s law and power equations to analyze circuit elements.',
      topics: ['electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Experimental Design']
    },
    {
      id: 'ap2-4-2',
      code: 'AP2.10',
      title: 'DC Circuits',
      description: 'Analyze series and parallel circuits using Kirchhoff\'s rules.',
      topics: ['electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'ap2-4-3',
      code: 'AP2.11',
      title: 'Capacitors',
      description: 'Analyze capacitors in circuits including energy storage and RC circuits.',
      topics: ['electricity', 'energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Data Analysis']
    },
    // Unit 5: Magnetism and Electromagnetic Induction
    {
      id: 'ap2-5-1',
      code: 'AP2.12',
      title: 'Magnetic Fields',
      description: 'Describe magnetic fields and forces on moving charges and current-carrying wires.',
      topics: ['magnetism'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Mathematical Routines']
    },
    {
      id: 'ap2-5-2',
      code: 'AP2.13',
      title: 'Electromagnetic Induction',
      description: 'Apply Faraday\'s law and Lenz\'s law to analyze electromagnetic induction.',
      topics: ['magnetism', 'electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Experimental Design']
    },
    // Unit 6: Geometric and Physical Optics
    {
      id: 'ap2-6-1',
      code: 'AP2.14',
      title: 'Reflection and Refraction',
      description: 'Apply laws of reflection and refraction to analyze light behavior at boundaries.',
      topics: ['optics'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'ap2-6-2',
      code: 'AP2.15',
      title: 'Lenses and Mirrors',
      description: 'Apply lens and mirror equations to analyze image formation.',
      topics: ['optics'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    {
      id: 'ap2-6-3',
      code: 'AP2.16',
      title: 'Interference and Diffraction',
      description: 'Analyze wave interference and diffraction patterns.',
      topics: ['optics', 'waves'],
      gradeLevel: '11-12',
      practices: ['Data Analysis', 'Mathematical Routines']
    },
    // Unit 7: Quantum, Atomic, and Nuclear Physics
    {
      id: 'ap2-7-1',
      code: 'AP2.17',
      title: 'Quantum Physics',
      description: 'Describe the photoelectric effect, photons, and wave-particle duality.',
      topics: ['modern-physics'],
      gradeLevel: '11-12',
      practices: ['Argumentation', 'Data Analysis']
    },
    {
      id: 'ap2-7-2',
      code: 'AP2.18',
      title: 'Atomic Physics',
      description: 'Analyze atomic energy levels and spectral lines using the Bohr model.',
      topics: ['modern-physics'],
      gradeLevel: '11-12',
      practices: ['Modeling', 'Mathematical Routines']
    },
    {
      id: 'ap2-7-3',
      code: 'AP2.19',
      title: 'Nuclear Physics',
      description: 'Analyze nuclear structure, radioactive decay, and nuclear reactions.',
      topics: ['modern-physics'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    }
  ]
}

export const apPhysicsCMechanicsStandards: StandardSet = {
  id: 'ap-physics-c-mechanics',
  name: 'AP Physics C: Mechanics',
  shortName: 'AP Physics C: Mech',
  description: 'Calculus-based mechanics covering kinematics, dynamics, energy, momentum, and rotation',
  icon: '∫',
  color: 'orange',
  standards: [
    // Kinematics
    {
      id: 'apc-m-1',
      code: 'APC-M.1',
      title: 'Kinematics with Calculus',
      description: 'Use calculus to analyze motion, including relating position, velocity, and acceleration through derivatives and integrals.',
      topics: ['kinematics'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'apc-m-2',
      code: 'APC-M.2',
      title: 'Projectile and Circular Motion',
      description: 'Analyze two-dimensional motion including projectiles and uniform circular motion using vector calculus.',
      topics: ['kinematics', 'rotational'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    // Newton's Laws
    {
      id: 'apc-m-3',
      code: 'APC-M.3',
      title: 'Newton\'s Laws with Calculus',
      description: 'Apply Newton\'s laws to systems with varying forces, including problems requiring differential equations.',
      topics: ['forces'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'apc-m-4',
      code: 'APC-M.4',
      title: 'Friction and Drag Forces',
      description: 'Analyze systems with friction and velocity-dependent drag forces.',
      topics: ['forces'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Experimental Design']
    },
    // Work, Energy, Power
    {
      id: 'apc-m-5',
      code: 'APC-M.5',
      title: 'Work with Variable Forces',
      description: 'Calculate work done by variable forces using integration.',
      topics: ['energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines']
    },
    {
      id: 'apc-m-6',
      code: 'APC-M.6',
      title: 'Energy Conservation',
      description: 'Apply conservation of energy to systems using calculus-based analysis.',
      topics: ['energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    // Momentum
    {
      id: 'apc-m-7',
      code: 'APC-M.7',
      title: 'Momentum and Impulse',
      description: 'Apply impulse-momentum theorem using integration for time-varying forces.',
      topics: ['momentum'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'apc-m-8',
      code: 'APC-M.8',
      title: 'Conservation of Momentum',
      description: 'Analyze collisions and systems using momentum conservation principles.',
      topics: ['momentum'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    // Rotation
    {
      id: 'apc-m-9',
      code: 'APC-M.9',
      title: 'Rotational Kinematics and Dynamics',
      description: 'Analyze rotational motion using calculus, including torque and angular acceleration.',
      topics: ['rotational'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'apc-m-10',
      code: 'APC-M.10',
      title: 'Moment of Inertia',
      description: 'Calculate moments of inertia using integration for various mass distributions.',
      topics: ['rotational'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines']
    },
    {
      id: 'apc-m-11',
      code: 'APC-M.11',
      title: 'Rolling Motion',
      description: 'Analyze rolling motion combining translational and rotational dynamics.',
      topics: ['rotational', 'energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    {
      id: 'apc-m-12',
      code: 'APC-M.12',
      title: 'Angular Momentum',
      description: 'Apply conservation of angular momentum to rotating systems.',
      topics: ['rotational', 'momentum'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    // Oscillations and Gravitation
    {
      id: 'apc-m-13',
      code: 'APC-M.13',
      title: 'Simple Harmonic Motion',
      description: 'Analyze SHM using differential equations, including damped and driven oscillations.',
      topics: ['waves', 'energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'apc-m-14',
      code: 'APC-M.14',
      title: 'Gravitation',
      description: 'Apply Newton\'s law of gravitation to orbital motion and energy.',
      topics: ['forces', 'energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    }
  ]
}

export const apPhysicsCEMStandards: StandardSet = {
  id: 'ap-physics-c-em',
  name: 'AP Physics C: Electricity and Magnetism',
  shortName: 'AP Physics C: E&M',
  description: 'Calculus-based electricity and magnetism covering electrostatics, circuits, magnetic fields, and electromagnetic induction',
  icon: '⚡',
  color: 'yellow',
  standards: [
    // Electrostatics
    {
      id: 'apc-em-1',
      code: 'APC-EM.1',
      title: 'Electric Fields and Gauss\'s Law',
      description: 'Calculate electric fields using Coulomb\'s law and Gauss\'s law with integration.',
      topics: ['electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'apc-em-2',
      code: 'APC-EM.2',
      title: 'Electric Potential',
      description: 'Calculate electric potential and potential energy using integration.',
      topics: ['electricity', 'energy'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    {
      id: 'apc-em-3',
      code: 'APC-EM.3',
      title: 'Conductors and Capacitors',
      description: 'Analyze conductors in electrostatic equilibrium and capacitor systems.',
      topics: ['electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    // Circuits
    {
      id: 'apc-em-4',
      code: 'APC-EM.4',
      title: 'DC Circuits',
      description: 'Analyze complex DC circuits using Kirchhoff\'s rules.',
      topics: ['electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Experimental Design']
    },
    {
      id: 'apc-em-5',
      code: 'APC-EM.5',
      title: 'RC Circuits',
      description: 'Analyze RC circuits using differential equations for charging and discharging.',
      topics: ['electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    // Magnetism
    {
      id: 'apc-em-6',
      code: 'APC-EM.6',
      title: 'Magnetic Fields and Forces',
      description: 'Calculate magnetic forces on charges and current-carrying conductors.',
      topics: ['magnetism'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    },
    {
      id: 'apc-em-7',
      code: 'APC-EM.7',
      title: 'Biot-Savart Law and Ampère\'s Law',
      description: 'Calculate magnetic fields using Biot-Savart law and Ampère\'s law.',
      topics: ['magnetism'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    // Electromagnetic Induction
    {
      id: 'apc-em-8',
      code: 'APC-EM.8',
      title: 'Faraday\'s Law',
      description: 'Apply Faraday\'s law with calculus to analyze electromagnetic induction.',
      topics: ['magnetism', 'electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Experimental Design']
    },
    {
      id: 'apc-em-9',
      code: 'APC-EM.9',
      title: 'Inductance',
      description: 'Analyze self-inductance, mutual inductance, and RL circuits.',
      topics: ['magnetism', 'electricity'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Modeling']
    },
    {
      id: 'apc-em-10',
      code: 'APC-EM.10',
      title: 'Maxwell\'s Equations',
      description: 'Understand the relationships between electric and magnetic fields described by Maxwell\'s equations.',
      topics: ['magnetism', 'electricity', 'waves'],
      gradeLevel: '11-12',
      practices: ['Mathematical Routines', 'Argumentation']
    }
  ]
}

// ============================================================================
// MASSACHUSETTS STATE STANDARDS
// ============================================================================

export const massachusettsStandards: StandardSet = {
  id: 'ma-physics',
  name: 'Massachusetts Curriculum Frameworks for Physics',
  shortName: 'MA Physics',
  description: 'Massachusetts state standards for high school physics aligned with the 2016 Science and Technology/Engineering Framework',
  icon: '🏛️',
  color: 'red',
  standards: [
    // Motion and Forces (Mechanics)
    {
      id: 'ma-ps-1-1',
      code: 'HS-PS2-1',
      title: 'Analyzing Motion',
      description: 'Analyze data to support the claim that Newton\'s second law of motion describes the mathematical relationship among the net force on a macroscopic object, its mass, and its acceleration.',
      topics: ['forces', 'kinematics'],
      gradeLevel: '9-12',
      practices: ['Analyzing and Interpreting Data', 'Mathematics and Computational Thinking']
    },
    {
      id: 'ma-ps-1-2',
      code: 'HS-PS2-2',
      title: 'Conservation of Momentum',
      description: 'Use mathematical representations to show that the total momentum of a system of interacting objects is conserved when there is no net force on the system.',
      topics: ['momentum'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Constructing Explanations']
    },
    {
      id: 'ma-ps-1-3',
      code: 'HS-PS2-3',
      title: 'Collision Analysis and Design',
      description: 'Apply scientific and engineering ideas to design, evaluate, and refine a device that minimizes the force on a macroscopic object during a collision.',
      topics: ['momentum', 'forces'],
      gradeLevel: '9-12',
      practices: ['Engineering Design', 'Asking Questions']
    },
    {
      id: 'ma-ps-1-4',
      code: 'HS-PS2-4',
      title: 'Gravitational and Electrical Forces',
      description: 'Use mathematical representations of Newton\'s law of universal gravitation and Coulomb\'s law to describe and predict gravitational and electrostatic forces between objects.',
      topics: ['forces', 'electricity'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Developing Models']
    },
    {
      id: 'ma-ps-1-5',
      code: 'HS-PS2-5',
      title: 'Electromagnetism',
      description: 'Plan and conduct an investigation to provide evidence that an electric current can produce a magnetic field and that a changing magnetic field can produce an electric current.',
      topics: ['magnetism', 'electricity'],
      gradeLevel: '9-12',
      practices: ['Planning Investigations', 'Constructing Explanations']
    },
    // Energy
    {
      id: 'ma-ps-2-1',
      code: 'HS-PS3-1',
      title: 'Energy in Systems',
      description: 'Use algebraic expressions and computational models to calculate the change in the energy of one component in a system.',
      topics: ['energy'],
      gradeLevel: '9-12',
      practices: ['Mathematics and Computational Thinking', 'Developing Models']
    },
    {
      id: 'ma-ps-2-2',
      code: 'HS-PS3-2',
      title: 'Energy Transfer',
      description: 'Develop and use models to illustrate that energy at the macroscopic scale can be accounted for as a combination of kinetic energy and potential energy.',
      topics: ['energy'],
      gradeLevel: '9-12',
      practices: ['Developing Models', 'Constructing Explanations']
    },
    {
      id: 'ma-ps-2-3',
      code: 'HS-PS3-3',
      title: 'Energy Conversion Devices',
      description: 'Design, build, and refine a device that works within given constraints to convert one form of energy into another form of energy.',
      topics: ['energy', 'thermodynamics'],
      gradeLevel: '9-12',
      practices: ['Engineering Design', 'Developing Solutions']
    },
    {
      id: 'ma-ps-2-4',
      code: 'HS-PS3-4',
      title: 'Thermal Energy Transfer',
      description: 'Plan and conduct an investigation to provide evidence that thermal energy transfer occurs by conduction, convection, and radiation.',
      topics: ['thermodynamics'],
      gradeLevel: '9-12',
      practices: ['Planning Investigations', 'Analyzing Data']
    },
    // Waves
    {
      id: 'ma-ps-3-1',
      code: 'HS-PS4-1',
      title: 'Wave Mathematics',
      description: 'Use mathematical representations to support a claim regarding relationships among the frequency, wavelength, and speed of waves traveling in various media.',
      topics: ['waves'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Constructing Arguments']
    },
    {
      id: 'ma-ps-3-2',
      code: 'HS-PS4-2',
      title: 'Wave Behavior',
      description: 'Evaluate questions about the advantages of using digital transmission and storage of information.',
      topics: ['waves', 'electricity'],
      gradeLevel: '9-12',
      practices: ['Asking Questions', 'Evaluating Information']
    },
    {
      id: 'ma-ps-3-3',
      code: 'HS-PS4-3',
      title: 'Wave-Particle Duality',
      description: 'Evaluate the claims, evidence, and reasoning behind the idea that electromagnetic radiation can be described either by a wave model or a particle model.',
      topics: ['waves', 'modern-physics', 'optics'],
      gradeLevel: '9-12',
      practices: ['Engaging in Argument', 'Evaluating Information']
    },
    {
      id: 'ma-ps-3-4',
      code: 'HS-PS4-4',
      title: 'Electromagnetic Radiation Effects',
      description: 'Evaluate the validity and reliability of claims about the effects of electromagnetic radiation on matter.',
      topics: ['waves', 'optics'],
      gradeLevel: '9-12',
      practices: ['Evaluating Information', 'Obtaining Information']
    },
    {
      id: 'ma-ps-3-5',
      code: 'HS-PS4-5',
      title: 'Information Technology',
      description: 'Communicate technical information about how devices use the principles of wave behavior and wave interactions to transmit and capture information.',
      topics: ['waves', 'optics', 'electricity'],
      gradeLevel: '9-12',
      practices: ['Obtaining and Communicating Information']
    },
    // Massachusetts-specific additions
    {
      id: 'ma-ps-4-1',
      code: 'MA-HS-PS-1',
      title: 'Kinematics Analysis',
      description: 'Interpret and construct graphs of position, velocity, and acceleration versus time for one-dimensional motion.',
      topics: ['kinematics'],
      gradeLevel: '9-12',
      practices: ['Mathematics and Computational Thinking', 'Data Analysis']
    },
    {
      id: 'ma-ps-4-2',
      code: 'MA-HS-PS-2',
      title: 'Projectile Motion',
      description: 'Analyze projectile motion by separately considering horizontal and vertical components.',
      topics: ['kinematics'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Developing Models']
    },
    {
      id: 'ma-ps-4-3',
      code: 'MA-HS-PS-3',
      title: 'Circular Motion',
      description: 'Analyze uniform circular motion and the centripetal forces required to maintain it.',
      topics: ['rotational', 'forces'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Constructing Explanations']
    },
    {
      id: 'ma-ps-4-4',
      code: 'MA-HS-PS-4',
      title: 'Simple Harmonic Motion',
      description: 'Describe and analyze simple harmonic motion for springs and pendulums.',
      topics: ['waves', 'energy'],
      gradeLevel: '9-12',
      practices: ['Developing Models', 'Using Mathematics']
    },
    {
      id: 'ma-ps-4-5',
      code: 'MA-HS-PS-5',
      title: 'Electric Circuits',
      description: 'Apply Ohm\'s law to analyze series and parallel circuits.',
      topics: ['electricity'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Experimental Design']
    },
    {
      id: 'ma-ps-4-6',
      code: 'MA-HS-PS-6',
      title: 'Reflection and Refraction',
      description: 'Apply the laws of reflection and Snell\'s law to analyze light behavior at boundaries.',
      topics: ['optics'],
      gradeLevel: '9-12',
      practices: ['Using Mathematics', 'Constructing Explanations']
    }
  ]
}

// ============================================================================
// COMBINED EXPORTS
// ============================================================================

export const allStandardSets: StandardSet[] = [
  ngssStandards,
  apPhysics1Standards,
  apPhysics2Standards,
  apPhysicsCMechanicsStandards,
  apPhysicsCEMStandards,
  massachusettsStandards
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all standards from a specific standard set
 */
export function getStandardsBySet(setId: string): Standard[] {
  const set = allStandardSets.find(s => s.id === setId)
  return set?.standards || []
}

/**
 * Get a specific standard by its ID
 */
export function getStandardById(standardId: string): Standard | undefined {
  for (const set of allStandardSets) {
    const found = set.standards.find(s => s.id === standardId)
    if (found) return found
  }
  return undefined
}

/**
 * Get all standards related to a physics topic
 */
export function getStandardsByTopic(topicId: string): Standard[] {
  const results: Standard[] = []
  for (const set of allStandardSets) {
    for (const standard of set.standards) {
      if (standard.topics.includes(topicId)) {
        results.push(standard)
      }
    }
  }
  return results
}

/**
 * Get the standard set that contains a given standard
 */
export function getStandardSetForStandard(standardId: string): StandardSet | undefined {
  for (const set of allStandardSets) {
    if (set.standards.some(s => s.id === standardId)) {
      return set
    }
  }
  return undefined
}

/**
 * Get standards by grade level
 */
export function getStandardsByGradeLevel(gradeLevel: string): Standard[] {
  const results: Standard[] = []
  for (const set of allStandardSets) {
    for (const standard of set.standards) {
      if (standard.gradeLevel === gradeLevel) {
        results.push(standard)
      }
    }
  }
  return results
}

/**
 * Format standards for AI prompts
 */
export function formatStandardsForPrompt(standards: Standard[]): string {
  if (standards.length === 0) return ''
  
  return standards.map(s => {
    const set = getStandardSetForStandard(s.id)
    return `[${set?.shortName || 'Standard'} ${s.code}] ${s.title}: ${s.description}`
  }).join('\n')
}

/**
 * Get quick selection options for UI
 */
export function getStandardSetOptions(): { id: string; name: string; shortName: string; icon: string; color: string; count: number }[] {
  return allStandardSets.map(set => ({
    id: set.id,
    name: set.name,
    shortName: set.shortName,
    icon: set.icon,
    color: set.color,
    count: set.standards.length
  }))
}

