import book from '@/data/openstax-physics-sections.json'

export const OPENSTAX_PHYSICS = book
export const OPENSTAX_PDF = '/textbooks/college-physics-ap-courses-2e.pdf'
export interface HonorsReading { sections: string[]; from: number; to: number; focus: string }
export function honorsPdfPage(printedPage: number) { return printedPage + book.offset }
export function honorsReadingUrl(reading: HonorsReading) { return `/textbook/honors?page=${reading.from}` }
export function validateHonorsReading(value: unknown): HonorsReading | null {
  if (value == null) return null
  if (typeof value !== 'object' || Array.isArray(value)) throw Error('Check the Honors reading.')
  const v = value as Record<string, unknown>
  if (!Array.isArray(v.sections) || !v.sections.length || v.sections.length > 4 || v.sections.some(id => !book.sections.some(s => s.id === id)) || !Number.isInteger(v.from) || !Number.isInteger(v.to) || Number(v.from) < 1 || Number(v.to) < Number(v.from) || Number(v.to) > book.pages - book.offset || typeof v.focus !== 'string' || !v.focus.trim() || v.focus.length > 1000) throw Error('Choose valid OpenStax sections and printed pages.')
  return { sections: [...new Set(v.sections)] as string[], from: Number(v.from), to: Number(v.to), focus: v.focus.trim() }
}
const r = (sections: string, from: number, to: number, focus: string): HonorsReading => ({ sections: sections.split(','), from, to, focus })
/** Printed pages verified against the supplied 1,773-page College Physics for AP Courses 2e.
 * Narrow excerpts split long sections across concepts; focus notes identify shared-page boundaries.
 * The original course readings remain available to scaffold notation, graphs, and explanations.
 */
export const HONORS_READING_MAP: Record<string, HonorsReading> = {
  quantities: r('1.2',20,21,'Physical quantities, measurements, and SI base and derived units. Focus on the role of units; the historical definitions are enrichment.'),
  'metric-prefixes': r('1.2',22,23,'Begin at Metric Prefixes. Use Table 1.2 to compare the sizes of units; stop before Known Ranges of Length, Mass, and Time.'),
  'scientific-notation': r('1.2',23,25,'Use the shared course reading to learn scientific notation, then interpret powers of ten in Tables 1.2 and 1.3. Leave the unit-conversion discussion for the next step.'),
  'unit-conversions': r('1.2',24,27,'Begin at Unit Conversion and Dimensional Analysis; follow the unit cancellations and Example 1.1. Stop before section 1.3.'),
  'measurement-precision': r('1.3',27,32,'Accuracy, precision, uncertainty, and meaningful digits; connect each to the instrument and measured inputs.'),
  rates: r('2.3',47,50,'Time, elapsed time, average velocity, and average speed. Interpret division by elapsed time before using the equations.'),
  'graph-scales': r('2.8',84,85,'Read Slopes and General Relationships and Figure 2.44 only. Use the shared course reading to practice axes, units, and scales; save the motion graphs for later.'),
  position: r('2.1',42,43,'Position and reference frames. Identify the origin and positive direction before calculating a change in position.'),
  'distance-displacement': r('2.1',42,44,'Displacement versus distance traveled; track starting and ending positions and signs.'),
  'speed-velocity': r('2.3',47,50,'Compare average speed and average velocity, including changes in direction.'),
  vectors: r('3.2',109,113,'Graphical vector addition; follow the head-to-tail method and identify the resultant.'),
  'vector-components': r('3.3',117,123,'Components, right triangles, and reconstructing the resultant; begin with perpendicular displacements.'),
  acceleration: r('2.4',51,56,'Acceleration as a change in velocity; interpret signs, direction, and units before the worked problems.'),
  'position-graphs': r('2.8',85,88,'Position–time graphs: height is position and slope is velocity. Use Example 2.17 and the position graph in Figure 2.46.'),
  'motion-graphs': r('2.8',87,91,'Connect velocity–time slope to acceleration. Use the shared course reading for signed area and displacement, then compare the linked motion graphs.'),
  forces: r('4.1',159,160,'Force as an interaction and vector; identify the selected object. Stop before section 4.2.'),
  inertia: r('4.2',160,161,'Inertia and Newton’s first law; connect zero net force to constant velocity. Stop before section 4.3.'),
  equilibrium: r('9.1',386,387,'The first condition for equilibrium: zero net force. Apply it to a selected object and its force diagram.'),
  'second-law': r('4.3',161,166,'Net force and acceleration; interpret and apply Newton’s second law.'),
  friction: r('5.1',212,218,'Normal force and static versus kinetic friction. Incline calculations are an extension after components.'),
  'third-law': r('4.4',167,170,'Identify paired forces on different objects and distinguish them from balanced forces.'),
  'free-fall': r('2.7',75,80,'Falling objects and gravitational acceleration; set a positive direction and state the no-air-resistance assumption.'),
  'mass-weight': r('4.3',161,166,'Revisit Mass and Weight. Distinguish mass from gravitational force and keep kilograms and newtons separate.'),
  gravitation: r('6.5',261,266,'Newton’s universal gravitation and inverse-square dependence. Compare changes in mass and center-to-center distance.'),
  fields: r('6.5',264,268,'Revisit gravitational force per unit mass and the dependence on distance. Use the shared course reading for apparent weight and scale readings.'),
  projectiles: r('3.4',124,131,'Horizontal and vertical components; shared time and launch assumptions. Follow the worked trajectory one component at a time.'),
  'circular-orbits': r('6.2,6.3',249,257,'Inward acceleration and centripetal force. Identify which physical interaction supplies the inward force in an orbit.'),
  momentum: r('8.1',344,346,'Momentum as a vector and its connection to mass and velocity.'),
  impulse: r('8.2',347,349,'Impulse, force, time, and changes in momentum.'),
  'momentum-conservation': r('8.3',350,353,'Choose a system and identify the external-force condition for conserving momentum.'),
  collisions: r('8.4,8.5',354,360,'Elastic versus inelastic collisions in one dimension; distinguish momentum conservation from kinetic-energy conservation.'),
  work: r('7.1',287,289,'Work and the force component along displacement.'),
  'kinetic-energy': r('7.2',290,294,'Kinetic energy and the work–energy theorem; compare speed-squared effects.'),
  'potential-energy': r('7.3',295,300,'Gravitational potential energy and the choice of reference level.'),
  'energy-conservation': r('7.5,7.6',305,311,'Nonconservative forces and conservation of energy; account for friction and distinguish mechanical energy from total energy.'),
  power: r('7.7',314,318,'Begin at section 7.7. Power is the rate of energy transfer; connect watts to joules per second.'),
  efficiency: r('7.6',313,314,'Read Efficiency and Table 7.2. Compare useful output energy or work with total input; stop before section 7.7.'),
  'temperature-heat': r('14.1',618,620,'Begin at section 14.1. Distinguish temperature from heat as energy transfer; use the shared foundation for particle averages versus total internal energy. Stop before section 14.2.'),
  'specific-heat': r('14.2',620,625,'Heat capacity and specific heat; connect energy, mass, and temperature change.'),
  'heat-transfer': r('14.4',632,633,'Read Heat Transfer Methods through the three mechanisms: conduction, convection, and radiation. Stop before the detailed conduction section.'),
  'phase-change': r('14.3',626,632,'Latent heat and phase changes; interpret temperature during melting and boiling. Stop before section 14.4.'),
  'first-law': r('15.1',665,669,'The first law, internal energy, and the signs of heat and work.'),
  'thermal-second-law': r('15.3',679,680,'One-way processes and spontaneous heat transfer from hot to cold; distinguish the system from its surroundings.'),
  thermodynamics: r('15.3',680,684,'Heat-engine energy-flow diagrams and efficiency; apply the first and second laws together.'),
  waves: r('16.9',750,753,'Amplitude, wavelength, frequency, period, and transverse versus longitudinal waves. Stop before section 16.10.'),
  'wave-speed': r('16.9',750,753,'Revisit wave quantities to use speed = frequency × wavelength; distinguish wave speed from the motion of the medium.'),
  interference: r('16.10',753,758,'Begin at Superposition and Interference. Add disturbances and interpret standing-wave patterns.'),
  sound: r('17.1,17.2',776,782,'Sound as a disturbance in a medium; connect frequency, wavelength, and speed.'),
  light: r('24.3',1147,1150,'Electromagnetic-wave speed and the spectrum overview. Use the wavelength/frequency table and diagram; individual technologies are enrichment.'),
  reflection: r('25.2',1177,1179,'The law of reflection and image formation; always measure angles from the normal.'),
  refraction: r('25.3',1180,1185,'Speed changes, refraction, and Snell’s law. Start with qualitative direction before calculations.'),
  charge: r('18.1',833,837,'Charge, attraction and repulsion, and charge conservation.'),
  'coulombs-law': r('18.4',846,848,'Coulomb’s law and inverse-square reasoning. Compare forces before calculating them; stop before section 18.5.'),
  'electric-field': r('18.5,18.6',848,853,'Electric fields, force direction, and field diagrams.'),
  voltage: r('19.1',881,886,'Electric potential energy and potential difference as energy per charge.'),
  current: r('20.1',925,930,'Current and charge flow; distinguish current from voltage.'),
  resistance: r('20.2',931,933,'Resistance and Ohm’s law; identify the model’s conditions.'),
  series: r('21.1',974,977,'Resistors in Series: one current path, equivalent resistance, and voltage division. Stop at Resistors in Parallel.'),
  parallel: r('21.1',977,980,'Begin at Resistors in Parallel. Compare branch voltage, current splitting, and equivalent resistance.'),
  'electrical-power': r('20.4',939,942,'Electric power and energy transfer; track units and distinguish energy from power.'),
  magnetism: r('22.1,22.2,22.3',1029,1036,'Magnetic poles, fields from currents, and field-line diagrams. Stop before magnetic-force calculations in section 22.4.'),
  induction: r('23.1,23.2',1081,1086,'Changing magnetic flux and induced voltage; connect Lenz’s law to energy conservation. Stop before section 23.3.'),
  'car-energy': r('22.8',1048,1051,'Begin at section 22.8. Focus on how a motor converts electrical energy to mechanical work; torque derivations are enrichment. Trace the car’s other energy transfers using the shared foundation.'),
  'car-motion': r('2.3',47,50,'Revisit measured average speed to evaluate the car’s performance.'),
}
