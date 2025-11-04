import { SimulationCompletionConfig } from '@/hooks/useSimulationCompletion'

/**
 * Standardized completion criteria for all physics simulations
 * These are carefully designed to ensure meaningful engagement with each simulation
 */

export const simulationCompletionCriteria: Record<string, SimulationCompletionConfig> = {
  // Free Body Diagram - Forces and Newton's Laws
  'free-body-diagram': {
    requiredActions: ['force_added', 'mass_changed', 'force_modified'],
    minInteractions: 5,
    minTimeSeconds: 120,
    autoComplete: true
  },
  
  // Projectile Motion - 2D Kinematics
  'projectile-motion': {
    requiredActions: ['launch', 'angle_changed', 'velocity_changed'],
    minInteractions: 3,
    minTimeSeconds: 60,
    autoComplete: true
  },
  
  // Constant Velocity - Basic Motion
  'constant-velocity': {
    requiredActions: ['start', 'speed_changed'],
    minInteractions: 3,
    minTimeSeconds: 60,
    autoComplete: true
  },
  
  // Uniformly Accelerated Motion - Kinematics with Acceleration
  'uniformly-accelerated-motion': {
    requiredActions: ['start', 'acceleration_changed', 'initial_velocity_changed'],
    minInteractions: 3,
    minTimeSeconds: 90,
    autoComplete: true
  },
  
  // Car Race - Relative Motion
  'car-race': {
    requiredActions: ['start', 'speed_changed_a', 'speed_changed_b'],
    minInteractions: 4,
    minTimeSeconds: 60,
    autoComplete: true
  },
  
  // Race Track - Circular Motion
  'race-track': {
    requiredActions: ['start', 'speed_changed'],
    minInteractions: 3,
    minTimeSeconds: 60,
    customCheck: (state) => {
      // Complete after at least 1 full lap
      return state.interactionCount >= 3
    },
    autoComplete: true
  },
  
  // Atwood Machine - Pulley Systems
  'atwood-machine': {
    requiredActions: ['start', 'mass_changed', 'reset'],
    minInteractions: 5,
    minTimeSeconds: 90,
    autoComplete: true
  },
  
  // Riverboat Crossing - Vector Addition
  'riverboat-crossing': {
    requiredActions: ['start', 'boat_speed_changed', 'river_speed_changed', 'angle_changed'],
    minInteractions: 4,
    minTimeSeconds: 90,
    autoComplete: true
  },
  
  // Monkey Hunter - Projectile Motion Advanced
  'monkey-hunter': {
    requiredActions: ['fire', 'angle_changed', 'height_changed'],
    minInteractions: 3,
    minTimeSeconds: 60,
    autoComplete: true
  },
  
  // Astronaut Thrust - Newton's Third Law
  'astronaut-thrust': {
    requiredActions: ['thrust_applied', 'mass_changed', 'thrust_force_changed'],
    minInteractions: 4,
    minTimeSeconds: 60,
    autoComplete: true
  },
  
  // Carts Third Law - Action-Reaction
  'carts-third-law': {
    requiredActions: ['collision', 'mass_changed', 'force_changed'],
    minInteractions: 3,
    minTimeSeconds: 60,
    autoComplete: true
  },
  
  // Vacuum Chamber - Free Fall
  'vacuum-chamber': {
    requiredActions: ['drop', 'vacuum_toggled'],
    minInteractions: 2,
    minTimeSeconds: 45,
    autoComplete: true
  },
  
  // Sumo Forces - Force Balance
  'sumo-forces': {
    requiredActions: ['force_applied', 'force_changed', 'reset'],
    minInteractions: 5,
    minTimeSeconds: 90,
    autoComplete: true
  },
  
  // Freefall Cliff - Gravity and Free Fall
  'freefall-cliff': {
    requiredActions: ['drop', 'height_changed'],
    minInteractions: 2,
    minTimeSeconds: 45,
    autoComplete: true
  },
  
  // Slope Calculator - Velocity and Slope
  'slope-calculator': {
    requiredActions: ['calculate', 'points_added'],
    minInteractions: 2,
    minTimeSeconds: 60,
    autoComplete: true
  },
  
  // Measurement Precision - Lab Skills
  'measurement-precision': {
    requiredActions: ['measurement_taken', 'tool_changed'],
    minInteractions: 3,
    minTimeSeconds: 90,
    autoComplete: true
  }
}

/**
 * Action label mappings for better UI display
 */
export const actionLabels: Record<string, Record<string, string>> = {
  'free-body-diagram': {
    'force_added': 'Add force',
    'mass_changed': 'Change mass',
    'force_modified': 'Modify force'
  },
  'projectile-motion': {
    'launch': 'Launch projectile',
    'angle_changed': 'Adjust angle',
    'velocity_changed': 'Change velocity'
  },
  'constant-velocity': {
    'start': 'Start motion',
    'speed_changed': 'Change speed'
  },
  'uniformly-accelerated-motion': {
    'start': 'Start simulation',
    'acceleration_changed': 'Change acceleration',
    'initial_velocity_changed': 'Change initial velocity'
  },
  'car-race': {
    'start': 'Start race',
    'speed_changed_a': 'Adjust Car A speed',
    'speed_changed_b': 'Adjust Car B speed'
  },
  'atwood-machine': {
    'start': 'Start simulation',
    'mass_changed': 'Change masses',
    'reset': 'Reset simulation'
  },
  'riverboat-crossing': {
    'start': 'Start crossing',
    'boat_speed_changed': 'Change boat speed',
    'river_speed_changed': 'Change river speed',
    'angle_changed': 'Adjust angle'
  },
  'monkey-hunter': {
    'fire': 'Fire dart',
    'angle_changed': 'Adjust angle',
    'height_changed': 'Change height'
  },
  'astronaut-thrust': {
    'thrust_applied': 'Apply thrust',
    'mass_changed': 'Change mass',
    'thrust_force_changed': 'Adjust thrust force'
  },
  'carts-third-law': {
    'collision': 'Collide carts',
    'mass_changed': 'Change mass',
    'force_changed': 'Adjust force'
  },
  'vacuum-chamber': {
    'drop': 'Drop objects',
    'vacuum_toggled': 'Toggle vacuum'
  },
  'sumo-forces': {
    'force_applied': 'Apply force',
    'force_changed': 'Change force',
    'reset': 'Reset match'
  },
  'freefall-cliff': {
    'drop': 'Drop stone',
    'height_changed': 'Change height'
  },
  'slope-calculator': {
    'calculate': 'Calculate slope',
    'points_added': 'Add data points'
  },
  'measurement-precision': {
    'measurement_taken': 'Take measurement',
    'tool_changed': 'Change tool'
  }
}

/**
 * Helper function to get completion criteria for a simulation
 */
export function getSimulationCriteria(slug: string): SimulationCompletionConfig {
  return simulationCompletionCriteria[slug] || {
    // Default fallback criteria
    minInteractions: 3,
    minTimeSeconds: 60,
    autoComplete: true
  }
}

/**
 * Helper function to get action labels for a simulation
 */
export function getActionLabels(slug: string): Record<string, string> {
  return actionLabels[slug] || {}
}
