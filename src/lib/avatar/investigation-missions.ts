import type { ChapterVisual } from '@/components/readings/interactive/lesson-contract'
import type { ExplorerKind, LessonAssignment } from '@/lib/interactive-assignments/catalog'
import readerFamilies from './reader-mission-families.json'

export type InvestigationMission = {
  role: string
  predict: string
  test: string
  explain: string
}
const mission = (role: string, predict: string, test: string, explain: string): InvestigationMission => ({role,predict,test,explain})

/** Roles describe what a student does with evidence, not additional forces in the model. */
export const READER_MISSIONS = {
  measurement: mission('Measurement investigator', 'Which measurement would distinguish the explanations in this reading? Predict the result before adjusting the model.', 'Capture a reference reading. Change a measurement setting or assumption, then capture a comparison. Keep the units and uncertainty with the values.', 'Which change is physical, and which comes from the instrument, units, or assumptions? Use the two observations to support your answer.'),
  motion: mission('Motion investigator', 'Predict the direction of motion and how the position or velocity will change. Name the reference frame.', 'Inspect two instants or two motion settings. Capture both observations and compare position, elapsed time, and direction.', 'Use the observations to distinguish position, distance, velocity, and acceleration. Explain any reversal or change of frame.'),
  forces: mission('Force investigator', 'Choose the object or system. Predict which interactions balance and whether its velocity changes.', 'Change one force, mass, or support setting. Capture the force model before and after; keep the system boundary the same.', 'Name the agent of each force. Use the net force and mass to explain the difference between your observations.'),
  energy: mission('Energy investigator', 'Predict where energy goes as the process proceeds. Decide which transfers cross the system boundary.', 'Capture two stages or settings. Track the displayed work, energy, or momentum and what enters or leaves the system.', 'Account for the change using the observations. State what is conserved and what the model omits.'),
  rotation: mission('Rotation investigator', 'Predict how changing the distribution, lever arm, or rotation setting affects the motion or balance.', 'Capture a reference configuration and a changed one. Compare the displayed torque, support, angular motion, or gravity values.', 'Use the geometry and measurements together. Explain why the same force or mass can produce a different result.'),
  relativity: mission('Observer comparing frames', 'Name the observer and the events being compared. Predict which measurement changes when the frame changes.', 'Capture both observer settings or two speeds. Compare the clocks, lengths, energies, or event coordinates shown.', 'Explain the measurements from each frame. Keep signal travel, coordinate measurements, and invariant quantities distinct.'),
  matter: mission('Materials investigator', 'Predict how changing the structure, scale, or state affects the property shown in the reading.', 'Capture two configurations. Compare the particle model with the displayed bulk property or count.', 'Connect structure to the observed property. State where the picture is schematic rather than drawn to scale.'),
  fluids: mission('Fluid investigator', 'Predict what changes in the pressure, flow, or support when you adjust the fluid or geometry.', 'Keep a reference setting, then change one fluid condition. Capture both readings with their units.', 'Explain the comparison using pressure differences, displaced fluid, continuity, or the relevant model relationship.'),
  thermal: mission('Thermal investigator', 'Predict the direction of energy transfer and the response of temperature, phase, or pressure.', 'Capture two states. Change one thermal condition and trace the displayed energy transfer or particle response.', 'Use the observations to separate temperature from energy. Explain the role of material, phase, or process constraints.'),
  waves: mission('Wave investigator', 'Predict how the wave pattern or detector reading changes. Distinguish motion of the pattern from motion of the medium.', 'Capture a reference and a changed setting. Compare wavelength, timing, amplitude, or interference where the model displays them.', 'Use the measurements to explain the pattern. State what travels and what oscillates in this model.'),
  light: mission('Light investigator', 'Predict what the observer or detector will see when you change the source, material, or geometry.', 'Capture two configurations. Follow the displayed light path, spectrum, image, or intensity to the observer.', 'Use the observations to explain how light reaches the detector. Distinguish the path of light from an apparent image or a color label.'),
  electricity: mission('Electrical investigator', 'Predict how a charge, voltage, or circuit change affects the displayed field, current, or energy.', 'Capture a reference configuration. Change one electrical setting and compare the displayed quantities and directions.', 'Explain the result using the circuit or field model. Distinguish charge, current, voltage, force, and energy.'),
  magnetism: mission('Magnetic investigator', 'Predict how changing current, field, orientation, or motion affects the magnetic response.', 'Capture two configurations. Compare the field, force, flux, or induced response displayed by this model.', 'Use the direction and magnitude evidence to explain the change. Distinguish a steady field from a changing flux.'),
  quantum: mission('Quantum evidence investigator', 'Predict the detector pattern, allowed state, or energy change for the selected conditions.', 'Capture a reference and a comparison. Read the model outputs as evidence; the avatar operates the experiment and does not represent a particle.', 'Explain what the evidence supports and where a classical picture fails. Separate a probability prediction from a single outcome.'),
  nuclear: mission('Nuclear evidence investigator', 'Predict how the sample, time, or process setting changes the counts, composition, or energy shown.', 'Capture two model states. Compare the displayed activity, remaining sample, products, or energy with the same units.', 'Use the comparison to explain the process. Distinguish a statistical sample prediction from the behavior of one nucleus.'),
  frontier: mission('Research investigator', 'Make a prediction that could distinguish the proposed models. Identify the observation needed to test it.', 'Capture the evidence from two settings or viewpoints. Separate the displayed model prediction from a measured fact.', 'Which claim is supported, and what remains uncertain? Use the observations and the limitations described in the reading.'),
} satisfies Record<string, InvestigationMission>
export type ReaderMissionFamily = keyof typeof READER_MISSIONS
export function readerMission(visual: ChapterVisual): InvestigationMission {
  return READER_MISSIONS[readerFamilies[visual] as ReaderMissionFamily]
}

export const EXPLORER_MISSIONS: Record<ExplorerKind, InvestigationMission> = {
  walk: mission('Route explorer', 'Can your avatar return home after traveling a nonzero distance? Predict the two readouts.', 'Walk a route, capture it, then return to the starting point and capture again. Compare distance with displacement.', 'Use your route and endpoints to explain why distance and displacement differ.'),
  vectors: mission('Navigation planner', 'Predict the signs of your velocity components before turning the direction arrow.', 'Capture a heading, then change only its angle. Compare both signed components at the same speed.', 'Explain how your avatar could keep the same speed while changing velocity.'),
  prediction: mission('Asteroid mission analyst', 'Predict which grows faster with time: the estimated position or its uncertainty bound.', 'Compare the same uncertainty setting at two elapsed times, then change the velocity uncertainty.', 'Use both forecasts to explain why a distant prediction needs a bound as well as a position.'),
  acceleration: mission('Motion coach', 'Will your avatar slow down, speed up, or reverse? Compare the signs of initial velocity and acceleration.', 'Keep the initial velocity fixed while changing acceleration. Compare the final velocity and signed displacement.', 'Use the graph slope and signed area to explain the motion, including any reversal.'),
  forces: READER_MISSIONS.forces,
  mass: mission('Cart test engineer', 'If you double the cart system’s mass but keep the net force fixed, what happens to acceleration?', 'Capture two masses at the same net force. Compare the measured model accelerations.', 'Use the ratio of the accelerations to defend or revise your prediction.'),
  force: mission('Cart test engineer', 'If you double the net force on the same system, what happens to acceleration?', 'Capture two force settings with the mass fixed. Include units in your comparison.', 'Explain the acceleration ratio using the controlled mass and changed net force.'),
  friction: mission('Grip and slip investigator', 'Predict whether your avatar’s fresh push will move the box. Does friction always equal its maximum?', 'Capture a push below the threshold and one above it. Compare friction, net force, and acceleration.', 'Explain why static friction matches the push before sliding, while kinetic friction has a different value.'),
  equilibrium: mission('Rigging engineer', 'Predict whether flatter support ropes need more or less tension to hold the same sign.', 'Capture 30° and 60° support angles. Compare tension while keeping the weight fixed.', 'Use the vertical components of both tensions to explain how the sign stays in equilibrium.'),
  sort: mission('Mission decision team', 'Which part of deciding whether to launch can physics answer? Which part requires a human judgment?', 'Choose a category, read the feedback, and identify a measurement that would inform the decision.', 'Explain how evidence informs a decision without deciding its costs, priorities, or responsibilities for us.'),
}

export const SIMULATION_ROLES: Record<string, string> = {
  'measurement-precision':'Calibration investigator', 'distance-displacement':'Route explorer', 'constant-velocity':'Motion detector subject',
  'race-track':'Track driver', 'slope-calculator':'Motion detector subject', 'area-under-curve':'Motion detector subject',
  'asteroid-trajectory':'Mission navigator', 'car-race':'Test driver', 'closing-speed':'Mission navigator', 'maze-vectors':'Route surveyor',
  'uniformly-accelerated-motion':'Motion detector subject', 'freefall-cliff':'Drop experiment operator', 'vacuum-chamber':'Vacuum chamber operator',
  'astronaut-thrust':'Astronaut testing thrust and coast', 'force-mass':'Cart test engineer', 'carts-third-law':'Spring cart engineer',
  'free-body-diagram':'Force inspector', 'sumo-forces':'Force investigator', 'incline-lab':'Ramp engineer', 'friction-lab':'Grip and slip investigator',
  'atwood-machine':'Pulley experiment operator', 'predicting-2026-xj':'Mission uncertainty analyst', 'riverboat-crossing':'River navigator',
  'monkey-hunter':'Drop intercept operator', 'projectile-motion':'Launch range operator',
  'cart-collisions':'Collision investigator', 'impulse-momentum':'Impact investigator', 'dart-deflection':'Deflection mission engineer',
  'riverboat-crossing-3d':'River navigator', 'picket-fence-g':'Photogate investigator', 'measure-of-all-things':'Measurement expedition scientist',
}
/** The canonical assignment supplies the actual prediction, trial, and reasoning tasks. */
export function assignmentMission(lesson: LessonAssignment): InvestigationMission {
  const sections=lesson.sections
  return mission(SIMULATION_ROLES[lesson.simulation??''] ?? DAY_ROLES[lesson.day] ?? 'Physics investigator',
    sections[0]?.questions[0]?.prompt ?? lesson.targets[0] ?? lesson.title,
    sections.find(s=>s.explorer)?.learn ?? sections[1]?.learn ?? sections[0]?.learn ?? lesson.title,
    sections.at(-1)?.questions.find(q=>!q.independent)?.prompt ?? sections.at(-1)?.learn ?? lesson.title)
}
const DAY_ROLES: Record<number,string>={1:'Mission decision team',2:'Route explorer',3:'Motion investigator',4:'Motion coach',5:'Mission uncertainty analyst',6:'Navigation planner',7:'Motion coach',8:'Kinematics investigator',9:'Inertia investigator',10:'Force inspector',11:'Cart test engineer',12:'Cart test engineer',13:'Dynamics investigator',14:'Interaction investigator',15:'Force inspector',16:'Force investigator',17:'Grip and slip investigator',18:'Rigging engineer',19:'Model revision investigator',20:'Mission physics team'}

const SIMULATION_TESTS:Record<string,string>={
 'measurement-precision':'Compare coarse and fine ruler divisions with the same bias. Then keep the divisions fixed and change the calibration bias. Read the mean and spread separately.',
 'distance-displacement':'Run an out-and-back journey. Capture the outward endpoint and the return. Compare path length and the signed endpoint change.',
 'constant-velocity':'Keep velocity fixed and change the starting position. Compare equal-time spacing and graph slope; then reverse velocity.',
 'race-track':'Compare a half lap with a full lap at the same radius and speed. Read distance, displacement, and the velocity direction.',
 'slope-calculator':'Capture two motion settings. Use two position–time points to compare slopes, keeping position separate from speed.',
 'area-under-curve':'Compare positive and negative velocity segments. Track how signed areas combine even while distance keeps growing.',
 'asteroid-trajectory':'Inspect two elapsed times. Compare the x coordinate with the distance from Earth, keeping both velocity components fixed.',
 'car-race':'Run with a head start, then change only the start delay. Compare the cars at the same physical time and identify the catch-up position.',
 'closing-speed':'Keep speed fixed and change the direction. Compare the total speed with its inward radial component.',
 'maze-vectors':'Capture the route and resultant. Reverse the order of the legs; compare the traveled route with the common endpoint.',
 'uniformly-accelerated-motion':'Start with positive velocity and negative acceleration. Inspect before and after reversal; compare equal-time spacing.',
 'freefall-cliff':'Compare two release heights or initial vertical velocities under the same gravity. Read the physical time and vertical velocity.',
 'vacuum-chamber':'Drop both objects in air and then in vacuum. Compare heights at the same time while keeping the masses and release height fixed.',
 'astronaut-thrust':'Inspect your avatar during the burn and after cutoff. Compare thrust, acceleration, and velocity while coasting.',
 'force-mass':'Compare two masses with the same net force. Then hold mass fixed and compare two forces. Use acceleration as the measured response.',
 'carts-third-law':'Release the spring with unequal cart masses. Compare force pairs during contact and both velocities after release.',
 'free-body-diagram':'Change the applied pull and inspect the normal force. Use the Forces view to identify the agent of each interaction.',
 'sumo-forces':'Balance the opposing forces, then change one push. Compare the net force and acceleration; check the initial velocity before claiming the object stops.',
 'incline-lab':'Compare two ramp angles, then compare held and released states. Track weight, normal force, and tension separately.',
 'friction-lab':'Increase the push from a fresh start until the crate slips. Capture one state below the threshold and one above it.',
 'atwood-machine':'Compare equal and unequal hanging masses. Read both motions and distinguish tension from each mass’s weight.',
 'predicting-2026-xj':'Compare early and late forecasts with the same velocity bounds. Then reduce the bounds and compare the position envelopes.',
 'riverboat-crossing':'Navigate straight across, then aim upstream with the same boat speed and current. Compare crossing time and drift.',
 'monkey-hunter':'Release the projectile and target together. Inspect the equal downward offsets from their no-gravity paths.',
 'projectile-motion':'Launch at two angles with the same speed. Compare the horizontal velocity and the changing vertical velocity.',
 'cart-collisions':'Compare two collisions with the same initial conditions and different elasticity. Record momentum and kinetic energy before and after impact.',
 'impulse-momentum':'Compare two impact durations for the same momentum change. Use the force–time graph to compare impulse and force.',
 'dart-deflection':'Compare two deflection impulses or encounter times. Record the resulting velocity change and miss distance.',
 'riverboat-crossing-3d':'Compare a straight heading with an upstream heading. Keep speed and current fixed and record the path, drift, and crossing time.',
 'picket-fence-g':'Compare velocity readings at successive gate times. Use the velocity–time slope to estimate acceleration, with units.',
 'measure-of-all-things':'Make a measurement in the expedition, change one measuring choice, and compare the evidence before taking the next step.',
}
export function simulationMission(id:string,question:string):InvestigationMission {
 return mission(SIMULATION_ROLES[id]??'Experiment investigator',question,SIMULATION_TESTS[id]??'Compare the reference trial with one changed condition. Read the model’s measurements.', 'Use the two observations to answer the investigation question. Name the changed condition, what you kept fixed, and the physics relationship supported by the results.')
}
