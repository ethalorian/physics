/** Reviewed against the public channel and video descriptions on 2026-10-05.
 * These are resource-to-target links, not evidence of student mastery. */
export interface VideoTargetLink {
  slug: string
  relationship: 'teaches' | 'supports'
  scope: string
}
export interface PhysicsVideo {
  youtubeId: string
  title: string
  sequence: number
  collection: 'Foundations' | 'Position & vectors' | 'Rates & motion' | 'Graphs & data'
  durationSeconds?: number
  summary: string
  targets: VideoTargetLink[]
  focus: string
}
const position = 'u1.vocab-position-distance-displacement'
const language = 'u1.kinematics-language'
export const PHYSICS_VIDEOS: PhysicsVideo[] = [
  {
    youtubeId: 'Z1qFlfqlS_E', sequence: 1, title: 'Units, physical quantities & significant figures', collection: 'Foundations',
    summary: 'A physical quantity needs a number and a unit. Choose units appropriate to the quantity and report precision supported by the measurement. Significant figures communicate that precision; they do not make an uncertain measurement exact.',
    focus: 'How do units and precision make a measurement meaningful?',
    targets: [
      { slug: 'foundations.units-quantities', relationship: 'teaches', scope: 'Physical quantities, numbers, and units.' },
      { slug: 'foundations.measurement-precision', relationship: 'teaches', scope: 'Reporting measurement precision and significant figures; calculation practice still matters.' },
    ],
  },
  {
    youtubeId: 'vf7X7mmJfsE', sequence: 2, title: 'What is kinematics? The language of motion', collection: 'Foundations',
    summary: 'Kinematics describes motion with position, velocity, and acceleration. Position tells where; velocity describes how position changes; acceleration describes how velocity changes. Changing direction can mean acceleration even when speed stays constant.',
    focus: 'What can position, velocity, and acceleration tell us about motion?',
    targets: [{ slug: language, relationship: 'teaches', scope: 'An introduction to position, velocity, acceleration, and direction changes.' }, { slug: 'u1.acceleration-rate-of-change', relationship: 'supports', scope: 'Conceptual preparation; calculating acceleration from data needs separate instruction and practice.' }],
  },
  {
    youtubeId: 'u0V8uJ5KTvo', sequence: 3, title: '1D position & displacement on a number line', collection: 'Position & vectors',
    summary: 'Choose an origin and a positive direction before reporting position. Displacement is final position minus initial position. Its sign describes direction. Distance adds path lengths, so an out-and-back trip can have zero displacement and nonzero distance.',
    focus: 'How can a journey have distance but no displacement?',
    targets: [{ slug: position, relationship: 'teaches', scope: 'Reference points, signed position, displacement, and the distinction from distance.' }],
  },
  {
    youtubeId: 'djR8sAAi740', sequence: 4, title: 'Position & displacement in 2D and 3D', collection: 'Position & vectors',
    summary: 'A position has one coordinate per axis: (x, y) in a plane or (x, y, z) in space. Calculate displacement one component at a time, always final minus initial. Do not subtract an x-coordinate from a y-coordinate.',
    focus: 'How does final minus initial work when position has more than one coordinate?',
    targets: [{ slug: position, relationship: 'teaches', scope: 'Extends position and displacement to two and three dimensions.' }, { slug: 'u1.vectors-tip-to-tail', relationship: 'supports', scope: 'Component notation and subtraction; tip-to-tail addition and trigonometric decomposition still need instruction.' }],
  },
  {
    youtubeId: 'FshpPgPAeWM', sequence: 5, title: 'How far vs. exactly where: scalars, vectors & position', collection: 'Position & vectors',
    summary: 'A distance from an origin leaves many possible locations. A position vector adds direction: its tail is at the reference point and its head is at the object. Components describe the same arrow. Its magnitude is a scalar, found in 2D using the Pythagorean theorem.',
    focus: 'Why does a distance alone fail to identify a location?',
    targets: [{ slug: position, relationship: 'teaches', scope: 'Scalar versus vector, position-vector anatomy, components, and magnitude.' }, { slug: 'u1.vectors-tip-to-tail', relationship: 'supports', scope: 'Components and magnitude; vector addition and angle-based decomposition remain separate skills.' }],
  },
  {
    youtubeId: 'maoz-9mGWyk', sequence: 6, title: 'The sign is the direction: position vectors in 1D', collection: 'Position & vectors',
    summary: 'In one dimension, a sign supplies direction along the chosen axis. A position x = −3 m has magnitude |x| = 3 m. A vertical coordinate can use y with up positive. A negative position is a location, not proof that an object is moving in the negative direction.',
    focus: 'What does the sign tell you—and what does it not tell you?',
    targets: [{ slug: position, relationship: 'teaches', scope: 'Signed horizontal and vertical coordinates; magnitude versus position.' }],
  },
  {
    youtubeId: 'YViTBR_aygk', sequence: 7, title: 'Length, time & rates of change: why we divide by time', collection: 'Rates & motion',
    summary: 'A rate compares a change with the time interval over which it occurs. Change in position is final minus initial; divide by elapsed time to find the average rate of change of position. Its units are length per time, such as m/s. A negative rate describes change toward the negative direction.',
    focus: 'What does “per second” mean in a motion measurement?',
    targets: [{ slug: language, relationship: 'teaches', scope: 'The position-change-over-time idea that defines average velocity.' }, { slug: 'foundations.units-quantities', relationship: 'teaches', scope: 'Length, time, physical quantities, and combined units.' }, { slug: 'u1.predict-position-uncertainty', relationship: 'supports', scope: 'Rate calculation is a prerequisite; future prediction and uncertainty are not fully taught here.' }],
  },
  {
    youtubeId: 'hj8usnvYrRo', sequence: 8, title: 'Velocity vs. speed: average and instantaneous', collection: 'Rates & motion',
    summary: 'Average velocity uses displacement divided by elapsed time; average speed uses total distance divided by elapsed time. Instantaneous velocity is the slope of the tangent to a position–time graph, and instantaneous speed is its magnitude. For an out-and-back trip, average speed is not generally the magnitude of average velocity.',
    focus: 'Why can average velocity be zero while average speed is not?',
    targets: [{ slug: language, relationship: 'teaches', scope: 'Velocity, speed, average and instantaneous values; this does not replace the full acceleration target.' }, { slug: position, relationship: 'teaches', scope: 'Uses distance/displacement and scalar/vector distinctions in rates.' }, { slug: 'u1.capture-pt-graph', relationship: 'supports', scope: 'Secant and tangent slopes on a position–time graph; collecting Vernier data is still a lab skill.' }, { slug: 'u1.read-vt-graph-components', relationship: 'supports', scope: 'Velocity vocabulary only; velocity–time graphs and 2D decomposition need further instruction.' }],
  },
  {
    youtubeId: 'fmjVsKsU9Sw', sequence: 9, title: 'Setting a graph scale', collection: 'Graphs & data', durationSeconds: 242,
    summary: 'Put time on the horizontal axis and position on the vertical axis. Divide each data range by its available squares, then round up to a convenient step such as 1, 2, or 5 times a power of ten. Multiply back to check that the data fits. Keep equal intervals on each axis, label quantities and units, and plot the data.',
    focus: 'How do you choose a readable scale that fits all your data?',
    targets: [{ slug: 'foundations.graph-scales', relationship: 'teaches', scope: 'Choose, check, and label uniform graph scales and locate a point using them.' }, { slug: 'u1.capture-pt-graph', relationship: 'supports', scope: 'Graph construction prepares for slope interpretation; collecting motion-detector data remains a separate lab skill.' }, { slug: 'u1.read-vt-graph-components', relationship: 'supports', scope: 'Scale construction only; velocity–time interpretation and vector components need further instruction.' }],
  },
  {
    youtubeId: 'lZIZ8jByakc', sequence: 10, title: 'Powers of ten & scientific notation', collection: 'Foundations', durationSeconds: 248,
    summary: 'Each increase of one in a power of ten multiplies the value by ten. Zero as an exponent gives one; a negative exponent represents a reciprocal, not a negative quantity. Write a positive measurement as a coefficient from 1 up to, but not including, 10 times a power of ten, retaining its unit. Compare values using both coefficients and exponents.',
    focus: 'How can you write and compare huge and tiny measurements without counting long strings of zeros?',
    targets: [{ slug: 'foundations.scientific-notation', relationship: 'teaches', scope: 'Write positive measured quantities in normalized scientific notation and compare their sizes.' }, { slug: 'foundations.measurement-precision', relationship: 'supports', scope: 'Keep the reported significant digits when rewriting a value; uncertainty and rounding calculations need separate practice.' }],
  },
  {
    youtubeId: 'VQlq7_OtDF8', sequence: 11, title: 'The SI system & metric prefixes', collection: 'Foundations', durationSeconds: 238,
    summary: 'SI gives scientists a shared measurement system. Mechanics commonly uses meters, kilograms, and seconds. A prefix multiplies a unit by a power of ten: kilo means 10³, milli means 10⁻³, micro means 10⁻⁶, and nano means 10⁻⁹. Symbols are case-sensitive: M means mega, while m as a prefix means milli. Convert between prefixes without changing the physical quantity.',
    focus: 'What does a prefix change about a measurement, and why does a capital letter matter?',
    targets: [{ slug: 'foundations.metric-prefixes', relationship: 'teaches', scope: 'Read SI unit symbols and metric prefixes, including case, and express equivalent measurements.' }, { slug: 'foundations.units-quantities', relationship: 'supports', scope: 'Extends the distinction between a measured quantity and the unit used to report it.' }],
  },
  {
    youtubeId: 'SE8M273AKXw', sequence: 12, title: 'Unit conversions: one step, two steps & rates', collection: 'Foundations', durationSeconds: 264,
    summary: 'A conversion factor is a ratio of equal quantities, so its value is one. Orient each factor so the unwanted unit cancels. Chain factors when a conversion needs more than one step. For rates, convert the numerator and denominator units, then check both the remaining unit and whether the size of the result makes sense.',
    focus: 'How can unit cancellation tell you which conversion factors to use?',
    targets: [{ slug: 'foundations.unit-conversions', relationship: 'teaches', scope: 'Use conversion factors for lengths, times, and rates, showing cancellation and checking equivalent values.' }, { slug: 'foundations.units-quantities', relationship: 'supports', scope: 'Equivalent units describe the same physical quantity; conversions do not change the motion.' }],
  },
  {
    youtubeId: 'E0CpXzmViwQ', sequence: 13, title: 'Adding vectors graphically: the tip-to-tail method', collection: 'Position & vectors', durationSeconds: 234,
    summary: 'Draw each vector to a common scale and place its tail at the previous tip without changing its length or direction. The resultant runs from the first tail to the last tip. Measure its magnitude and direction. Reordering the vectors leaves the resultant unchanged; subtracting a vector means adding its opposite.',
    focus: 'How can several movements combine into one displacement?',
    targets: [{ slug: 'u1.vectors-tip-to-tail', relationship: 'teaches', scope: 'Scaled tip-to-tail addition, resultant magnitude and direction, and subtraction by reversing a vector. Trigonometric components are taught in Video 14.' }, { slug: position, relationship: 'supports', scope: 'Connects path distance to the resultant displacement.' }],
  },
  {
    youtubeId: 'uH-NE-LlybM', sequence: 14, title: 'Vector components: breaking vectors into x and y', collection: 'Position & vectors', durationSeconds: 242,
    summary: 'Resolve a vector into signed components along chosen axes. With the angle measured from positive x, Ax = A cos θ and Ay = A sin θ. Add or subtract matching components, then recover magnitude with the Pythagorean theorem. Use the component signs to choose the correct quadrant when finding direction.',
    focus: 'How do components turn vector addition into arithmetic?',
    targets: [{ slug: 'u1.vectors-tip-to-tail', relationship: 'teaches', scope: 'Trigonometric decomposition, signed components, component addition and subtraction, and reconstructing magnitude and direction.' }, { slug: 'u1.read-vt-graph-components', relationship: 'supports', scope: 'Vector decomposition supports the velocity-component diagram; velocity–time graph interpretation still needs instruction.' }, { slug: 'u1.d17-incline-components', relationship: 'supports', scope: 'Provides trigonometric tools; choosing incline axes and identifying forces remain separate modeling decisions.' }],
  },
  {
    youtubeId: 'pwbD3H8R0BU', sequence: 15, title: 'Dot product vs. cross product: what they mean', collection: 'Position & vectors', durationSeconds: 264,
    summary: 'The dot product A · B = AB cos θ is a scalar measuring alignment. The cross product has magnitude AB sin θ and a perpendicular direction given by the right-hand rule. In the xy plane, the dot product is AxBx + AyBy and the z-component of the cross product is AxBy − AyBx. Work uses a dot product; torque uses a cross product.',
    focus: 'Why do two ways of multiplying vectors produce different kinds of results?',
    targets: [{ slug: 'u1.vector-products', relationship: 'teaches', scope: 'Interpret and calculate dot and cross products for planar vectors, including angle, sign, right-hand-rule direction, work, and torque examples.' }, { slug: 'u4.k1-work', relationship: 'supports', scope: 'Introduces work as force dotted with displacement; energy accounting is developed in Unit 4.' }, { slug: 'u4.r1-work-angle', relationship: 'supports', scope: 'Shows the cosine factor and angle dependence; practice positive, negative, and zero work in the energy unit.' }],
  },
]

export const UPCOMING_PHYSICS_VIDEOS: {title:string;sequence:number;status:string;source:string;scope:string;targets:VideoTargetLink[]}[] = []
