import { makeChapter, sourceFigure as figure, check, type SectionLesson } from './lesson-contract'
export type { ChapterVisual, SectionLesson } from './lesson-contract'
import { forceLessons, forceFigures } from './force-lessons'

export const inertiaLessons: SectionLesson[] = [
  {
    id: 'everyday-evidence', number: '3.1', title: 'Question everyday motion', heading: 'An observation is not yet an explanation.', subtitle: 'A rolling object stops. What actually caused the change?', page: 29, pages: '29',
    target: 'Distinguish an observation from a model that explains it.', visual: 'evidence',
    paragraphs: [
      'Push a toy car and release it. It eventually stops. That observation is reliable, but the explanation takes more thought. Does motion disappear on its own, or does something in the environment change the car’s motion? Those models make different predictions when we change the surface.',
      'Aristotle organized motion into natural motion, such as a rock falling, and forced or “violent” motion, such as pulling a cart. His account treated ordinary horizontal motion as something that needed a continuing mover. On a rough road, where a cart stops soon after the pulling stops, that idea can seem convincing.',
      'The hidden variable is resistance. A rolling car interacts with its axles, the surface, and the air. Stopping the push does not remove those interactions. To test a model, keep the starting motion similar while reducing resistance. If the car coasts farther, the environment matters to the explanation.',
      'This is a useful habit throughout physics: describe what you saw, identify what else might have acted, and design a comparison that separates the competing explanations. We can learn from a historical model without adopting it as our present explanation.'
    ],
    terms: [['Model', 'An explanation that makes predictions we can compare with evidence.'], ['Friction', 'A contact force that opposes relative sliding or the tendency to slide between surfaces.']],
    worked: { title: 'Same observation, two explanations', prompt: 'A puck stops sooner on carpet than on smooth ice. What does this comparison support?', reasoning: 'Both trials begin with motion, but the surface changes. The longer glide on ice supports the idea that resistance causes the slowing. Neither trial alone proves that an ideal frictionless puck would move forever; the comparison helps us infer the limiting behavior.' },
    check: check('What would make the test stronger?', 'You want to test whether resistance causes a cart to slow. Which comparison is most useful?', ['Use similar starting speeds on surfaces with different resistance.', 'Push one cart much harder and use a different surface too.', 'Observe one cart stopping once.'], 0, 'Change one relevant factor while keeping the others similar.', ['Yes. This comparison helps isolate the effect of resistance.', 'Changing both factors makes it difficult to identify the cause.', 'One observation does not distinguish the two explanations.'], 'Ask students to name both the changed variable and the controlled variable.')
  },
  {
    id: 'moving-earth', number: '3.2', title: 'Imagine a moving Earth', heading: 'Your point of view is part of the description.', subtitle: 'Not feeling motion does not establish that Earth is motionless.', page: 30, pages: '30', target: 'Describe motion relative to a chosen reference.', visual: 'orbit',
    paragraphs: [
      'Copernicus proposed a Sun-centered arrangement in which Earth moves around the Sun, as other planets do. This offered a different way to organize observations of the sky. It also raised a physical question: if Earth moves, why do ordinary objects around us seem to stay with it?',
      'An astronomical model and an explanation of motion are related, but they are not the same thing. Knowing that a planet orbits does not yet tell us which interaction bends its path. Newton’s ideas will connect those two questions.',
      'Always finish the sentence “moving relative to…” A student sitting in a train is at rest relative to the seat but moving relative to the platform. These descriptions can both be true. A reference frame is the viewpoint and coordinate system used to describe position and motion.',
      'Earth’s motion is not perfectly straight and constant: it rotates and follows a curved orbit. For many short classroom experiments, however, a room fixed to Earth is a useful approximate inertial frame. We will return to why objects keep up with their surroundings in Section 3.6.'
    ],
    terms: [['Reference frame', 'The viewpoint and coordinate system relative to which motion is measured.'], ['Orbit', 'A curved path around another body, requiring a change in velocity direction.']],
    worked: { title: 'One student, two descriptions', prompt: 'A train travels east at 15 m/s. A student sits still in a seat. What is the student’s velocity?', reasoning: 'Relative to the train, it is zero. Relative to the platform, it is 15 m/s east. A velocity statement needs a reference frame; neither observer is required to see the same velocity.' },
    check: check('Rest relative to what?', 'A student is sitting still in class. Which statement is complete?', ['The student is motionless relative to everything.', 'The student is at rest relative to the classroom.', 'Earth must be motionless because the student feels no motion.'], 1, 'Name the object or frame used for comparison.', ['Rest in one frame does not imply rest in every frame.', 'Yes. The classroom is the stated reference.', 'Shared motion can be present without being obvious to someone moving with the surroundings.'], 'Invite students to supply a second valid reference frame.')
  },
  {
    id: 'galileo-ramps', number: '3.3', title: 'Follow Galileo’s evidence', heading: 'Lower the ramp. Follow the implication.', subtitle: 'A controlled comparison can lead beyond what an experiment can perfectly achieve.', page: 30, pages: '30–32', target: 'Use a low-resistance experiment to explain inertia.', visual: 'ramps',
    paragraphs: [
      'Galileo studied balls rolling down, up, and along nearly level surfaces. A ball speeds up downhill and slows as it rolls uphill. On a smoother, level surface, its speed changes less. These patterns suggest that the slope and resistance—not motion itself—determine how the speed changes.',
      'Imagine a ball released on one ramp and allowed to climb a second. With small losses, it reaches nearly its original height. Make the second ramp less steep: reaching the same height now requires a longer trip. The distance grows as the returning ramp gets shallower.',
      'Take the thought experiment to its limit. A perfectly level continuation cannot bring the ball back to the starting height. In the idealized case with no energy lost to rolling resistance or air drag, its motion continues. A continuing forward push is not required once it reaches the level track.',
      'Idealizations are deliberate simplifications, not claims that classroom equipment has no friction. A real rolling ball loses mechanical energy through deformation and other effects. Compare the observed trend with the ideal prediction, and explain the gap rather than treating the experiment as a failure.'
    ],
    terms: [['Inertia', 'An object’s tendency to maintain its velocity unless a net force changes it.'], ['Idealization', 'A simplified model that leaves out specified effects to reveal a relationship.']],
    worked: { title: 'From height to distance', prompt: 'The returning ramp is lowered, but the release height stays the same. What should happen?', reasoning: 'With losses small, the ball must travel farther to regain the same height. Lowering the return ramp does not give the ball more energy; it changes the distance needed to rise through that height. A level continuation is the limiting case.' },
    check: check('Predict the shallower ramp.', 'In an ideal low-loss comparison, lowering the second ramp makes the ball…', ['stop after the same distance.', 'travel farther to regain the starting height.', 'gain extra energy from the shallower ramp.'], 1, 'Distinguish the height reached from the distance traveled.', ['The distance depends on how steeply the ramp rises.', 'Yes. The target height is the same, but the path to it is longer.', 'Changing the angle does not supply extra energy.'], 'Ask students to draw two ramps with the same final height.')
  },
  {
    id: 'law-of-inertia', number: '3.4', title: 'Keep velocity unchanged', heading: 'Motion does not need a fuel supply of force.', subtitle: 'A net force changes velocity. It is not required to sustain it.', page: 33, pages: '33–35', target: 'Apply Newton’s first law to rest and constant velocity.', visual: 'glide',
    paragraphs: [
      'Newton’s first law connects rest and uniform motion: in an inertial frame, zero net external force means constant velocity. Constant velocity includes staying at rest. It also includes moving at a steady speed along a straight line.',
      'Net means the vector sum of all the forces on the chosen object. A puck on a horizontal air table can have both gravity downward and support upward. Those forces balance, while the horizontal resistance is very small. Force-free is a stronger statement than zero net force.',
      'A change in speed or a change in direction is a change in velocity. A planet moving at steady speed around a circular path is therefore not an example of zero net force: gravity continually changes its direction. If that attraction vanished, its instantaneous straight-line motion would continue tangent to the orbit.',
      'The familiar tablecloth demonstration also needs a careful explanation. Friction acts briefly on the dishes, so their motion can change a little. A short interaction produces less change than a long one under a similar force. Inertia is the property that describes resistance to that change; it is not an extra forward or backward force.'
    ],
    terms: [['Net force', 'The vector sum of the external forces on an object or system.'], ['Constant velocity', 'Motion with unchanged speed and direction, including zero velocity.']],
    worked: { title: 'The engine is off. What happens next?', prompt: 'A spacecraft far from significant external forces is moving to the right. Its engine shuts off.', reasoning: 'Its rightward velocity persists because the net force is approximately zero. Shutting off the engine stops the acceleration, not the existing velocity. A force would be needed to slow it, speed it up, or turn it.' },
    check: check('Moving and balanced?', 'A cart travels straight at a constant 2 m/s. What must be true in an inertial frame?', ['No forces act on the cart.', 'The forward force must exceed the backward force.', 'The vector sum of all forces on the cart is zero.'], 2, 'Unchanging velocity tells you about the net force.', ['Forces may be present and balance.', 'That would produce acceleration rather than constant velocity.', 'Yes. Balanced forces can accompany motion or rest.'], 'Look for the misconception that motion requires a larger forward force.')
  },
  {
    id: 'mass-and-weight', number: '3.5', title: 'Separate mass and weight', heading: 'Same object. Different gravity. Same inertia.', subtitle: 'Mass, volume, and weight answer different questions.', page: 36, pages: '36–38', target: 'Distinguish inertia, mass, volume, and gravitational weight.', visual: 'mass',
    paragraphs: [
      'An empty cart is easier to speed up than the same cart loaded with books. For the same net force, the larger mass has a smaller acceleration. Mass measures inertia and is measured in kilograms (kg). It does not depend on whether the object is currently moving.',
      'Volume measures the space an object occupies. A large foam block can have less mass than a compact metal block. Compare resistance to a change in velocity, rather than appearance, when deciding which has more inertia.',
      'Weight is a gravitational force. Near the surface of a planet or moon, its magnitude is W = mg, where g is the local gravitational acceleration. Weight is measured in newtons (N). At Earth’s surface g is about 9.8 m/s²; 10 N/kg is a useful rounded estimate when stated explicitly.',
      'Move a 5 kg object to the Moon. It still has 5 kg of mass and resists horizontal acceleration just as much under the same net force. Its weight changes because lunar gravity is weaker. Mass and weight are proportional when compared at the same location, but they are not the same physical quantity.',
      'A balance comparison and a spring scale can also serve different purposes. A spring scale responds to a force. In free fall, its support reading can approach zero even while Earth continues to pull on the object. A small scale reading is not evidence that the object has lost its mass.'
    ],
    terms: [['Mass', 'A measure of inertia, in kilograms.'], ['Weight', 'The gravitational force on an object, in newtons.'], ['Volume', 'The amount of space occupied by an object.']],
    worked: { title: 'A 5 kg instrument travels to the Moon', prompt: 'Estimate its weight on Earth and on the Moon, using g = 9.8 and 1.6 N/kg.', reasoning: 'Earth: W = 5 × 9.8 = 49 N. Moon: W = 5 × 1.6 = 8 N. Its mass is 5 kg in both places. To compare inertia, compare the acceleration under the same net force; changing gravity alone does not change that relation.' },
    check: check('Which property changes?', 'A sealed instrument travels from Earth to the Moon without losing material. Which statement is correct?', ['Its mass and inertia decrease.', 'Its weight decreases, while its mass stays the same.', 'Its volume must increase because gravity is weaker.'], 1, 'Weight depends on the local gravitational field.', ['Its resistance to acceleration does not disappear in weaker gravity.', 'Yes. The local value of g changes the weight, not the mass.', 'A change in weight does not by itself require a change in volume.'], 'Require units: kg for mass, N for weight.')
  },
  {
    id: 'shared-motion', number: '3.6', title: 'Keep up with your world', heading: 'Letting go does not erase sideways motion.', subtitle: 'A coin, a passenger, and their surroundings share an initial velocity.', page: 38, pages: '38–39', target: 'Explain motion in a steadily moving vehicle using inertia.', visual: 'frames',
    paragraphs: [
      'On a smooth train moving at constant velocity, toss a coin straight upward relative to your hand. It usually returns to your hand. Before release, the coin already shares the train’s horizontal velocity. Letting go removes the contact with your hand; it does not reset that horizontal velocity to zero.',
      'While airborne, gravity changes the coin’s vertical velocity. With horizontal air forces negligible, there is no net horizontal force, so its horizontal velocity stays unchanged. The train and your hand keep moving horizontally at that same rate.',
      'The train passenger describes a vertical trip. A stationary observer by the tracks describes a curved path with continuing horizontal motion. Both describe the same event from different frames. Keep the horizontal and vertical parts of the reasoning separate.',
      'This addresses a historical objection to a moving Earth. A bird, its tree, the ground, and nearby air share Earth’s large-scale motion. A bird leaving a branch does not suddenly lose that shared motion. Over a short flight, the shared initial velocity helps explain why the ground does not simply sweep away underneath it.',
      'The conditions matter. If the train brakes while the coin is airborne, the hand slows but the coin initially keeps its earlier horizontal velocity. Relative to the train, the coin moves ahead of the hand. Do not invent a new forward force to account for a change in the observer’s motion.'
    ],
    terms: [['Shared velocity', 'The initial motion that an object has in common with its surroundings.'], ['Inertial frame', 'A frame in which an object with zero net force maintains constant velocity.']],
    worked: { title: 'Explain the catch before doing arithmetic', prompt: 'A train moves at 12 m/s. A tossed coin is airborne for 1 second. How far do the coin and hand move horizontally?', reasoning: 'In the ground frame, each moves 12 m, assuming the train maintains its velocity and horizontal forces on the coin are negligible. In the train frame, their horizontal separation stays zero, so the coin can return to the hand.' },
    check: check('Now the train brakes.', 'Just after a coin is tossed, the train begins slowing. With negligible horizontal force on the coin, where does it land relative to the hand?', ['Ahead of the hand.', 'Behind the hand because its forward motion disappears.', 'Exactly in the hand regardless of the braking.'], 0, 'The hand slows with the train; what slows the coin horizontally?', ['Yes. The coin keeps its earlier horizontal velocity while the hand slows.', 'Releasing the coin does not erase its initial velocity.', 'The catch depended on the hand maintaining the same horizontal velocity.'], 'Have students describe the event in the ground frame before using the train frame.')
  },
]

export const newtonLessons: SectionLesson[] = [
  ...forceLessons,
  {
    id: 'force-vectors', number: '4.1', title: 'Represent an interaction', heading: 'Choose the object. Then draw its interactions.', subtitle: 'A free-body diagram makes a physical claim about a particular system.', page: 159, pages: '159–160', target: 'Represent external forces as vectors and find their resultant.', visual: 'vectors',
    paragraphs: [
      'Dynamics connects changes in motion to interactions. Begin with a push or pull on a chosen object. A force has a magnitude and a direction, so it is a vector. “Four newtons” is incomplete if the direction matters to the motion.',
      'To create a free-body diagram, isolate your object or system and represent each external force with an arrow. Name the agent exerting the force: Earth on the skater, ice on the skater, or a partner on the skater. A velocity arrow can be useful in a separate motion picture, but velocity is not an additional force.',
      'Add force vectors head to tail, or add their components along chosen axes. For example, 3 N east and 4 N north have a resultant of 5 N toward the northeast, at about 53° north of east. The resultant represents the combined effect of the two forces; drawing it does not add a third interaction.',
      'Force measurement requires a reproducible comparison. Within its elastic working range, a calibrated spring stretches by an amount related to the applied force. A spring scale turns that relationship into a reading. The calibration and direction still matter: the instrument reports a force, not an amount of motion.'
    ],
    terms: [['Dynamics', 'The study of forces and their relationship to motion.'], ['Free-body diagram', 'A diagram of the external forces acting on a specified object or system.'], ['Resultant', 'The single vector equal to the sum of the vectors being combined.']],
    worked: { title: 'Add directions, not just magnitudes', prompt: 'A puck experiences a 3 N eastward force and a 4 N northward force. Find the net force.', reasoning: 'Choose east as +x and north as +y. The components are (3, 4) N. The magnitude is √(3² + 4²) = 5 N. Its direction is arctan(4/3) ≈ 53° north of east. Adding 3 + 4 would be appropriate only for forces along the same direction.' },
    check: check('What belongs on this diagram?', 'For a free-body diagram of a cart, which arrow represents a force on the cart?', ['The cart’s velocity.', 'The force of the cart on the person pushing it.', 'The force of the person on the cart.'], 2, 'The chosen system receives every force shown on its free-body diagram.', ['Velocity describes motion; it is not an interaction.', 'That force belongs on the person’s diagram.', 'Yes. The person is an external agent exerting a force on the cart.'], 'Ask students to say “agent on object” for each arrow.')
  },
  {
    id: 'first-law', number: '4.2', title: 'Recognize unchanged velocity', heading: 'Zero net force is a statement about change.', subtitle: 'Inertia connects steady motion and rest.', page: 160, pages: '160–161', target: 'Use Newton’s first law and distinguish mass from force.', visual: 'glide',
    paragraphs: [
      'In an inertial frame, an object with zero net external force maintains its velocity. That includes rest, but it also includes steady motion along a straight line. The first law does not say that every moving object needs a force in the direction of its motion.',
      'Everyday objects often slow because the environment acts on them. Compare a puck on a rough surface with one on an air table. Reducing resistance reduces the slowing. Extrapolating to no horizontal resistance gives unchanged horizontal velocity, not an eventual unexplained stop.',
      'Inertia is the tendency to resist a change in velocity. Mass measures that inertia. A loaded cart requires more net force than an empty cart to produce the same acceleration. In this classical model, mass is a property of the system, independent of its current speed or the local gravitational field.',
      'The word velocity is crucial. Traveling around a curve at constant speed changes the velocity’s direction and therefore requires a nonzero net force. Before deciding that forces balance, check both the speed and the direction over time. If either changes, the first-law condition has not been met.',
      'An accelerating train is not an inertial reference frame. Objects may appear to accelerate relative to its passengers even without a corresponding horizontal interaction. For introductory force reasoning, use a suitable inertial frame or state clearly which additional frame-dependent effects you are introducing.'
    ],
    terms: [['Inertia', 'The tendency to maintain velocity unless a net force changes it.'], ['Mass', 'The measure of an object’s inertia, expressed in kilograms.'], ['Equilibrium', 'A condition of zero net force, compatible with rest or constant velocity.']],
    worked: { title: 'A turn at steady speed', prompt: 'A cyclist rounds a curve at a constant 5 m/s. Is the net force zero?', reasoning: 'No. The speed is fixed, but the velocity changes because its direction changes. A net force toward the inside of the turn is required. Constant speed is not sufficient evidence of equilibrium.' },
    check: check('Which motion fits zero net force?', 'Choose the motion consistent with zero net external force in an inertial frame.', ['A straight glide at constant speed.', 'A constant-speed circle.', 'A straight glide that gradually slows.'], 0, 'Check both magnitude and direction of velocity.', ['Yes. Neither speed nor direction changes.', 'The direction changes continuously, so a net force is required.', 'Slowing is a change in velocity.'], 'Have students explain why a constant-speed curve fails the test.')
  },
  {
    id: 'second-law', number: '4.3', title: 'Connect force and acceleration', heading: 'The system boundary comes before the equation.', subtitle: 'Net external force changes the motion of the mass inside your boundary.', page: 161, pages: '161–167', target: 'Apply ΣF = ma to a clearly defined system.', visual: 'acceleration',
    paragraphs: [
      'A system is the object or group of objects you choose to study. Forces exerted by things outside its boundary are external. Forces between parts inside that boundary are internal. For a constant-mass system in an inertial frame, its center-of-mass acceleration is determined by its net external force.',
      'Newton’s second law is ΣF = ma. Equivalently, a = ΣF/m. Acceleration points in the direction of the net force, which need not be the direction of velocity. An object moving right while experiencing a leftward net force initially slows down.',
      'Holding mass fixed, doubling the net force doubles the acceleration. Holding net force fixed, doubling the mass halves the acceleration. The comparison must use net force: a larger applied push can be partly offset by resistance.',
      'A newton is the force that gives a 1 kg mass an acceleration of 1 m/s²: 1 N = 1 kg·m/s². Write the units as part of your reasoning. A force divided by mass gives acceleration, not speed.',
      'Near Earth, gravitational weight has magnitude W = mg. If gravity is the only significant external force, ΣF = mg and a = g. A more massive falling object has a larger gravitational force and proportionally more inertia, so these factors cancel in its acceleration. Air resistance can change that conclusion.',
      'Your result should answer the physical question. A positive acceleration means acceleration along your positive axis; it does not automatically mean that speed is increasing. Check the initial velocity, the direction of the net force, and the system you selected.'
    ],
    terms: [['System', 'The object or collection of objects chosen for analysis.'], ['External force', 'A force exerted on the system by something outside its boundary.'], ['Acceleration', 'The rate at which velocity changes.']],
    worked: { title: 'Account for the opposing force', prompt: 'A 6 kg cart is pushed right with 18 N while resistance acts left with 6 N. Find its acceleration.', reasoning: 'Let right be positive. ΣFₓ = 18 − 6 = 12 N. Thus aₓ = 12/6 = 2 m/s² to the right. The support force and weight balance vertically. Using 18/6 would ignore the opposing force. If the cart initially moves left, this rightward acceleration initially slows it.' },
    check: check('Change one variable.', 'The net force on a cart stays at 12 N while its mass increases from 3 kg to 6 kg. Its acceleration…', ['doubles from 4 to 8 m/s².', 'halves from 4 to 2 m/s².', 'stays at 4 m/s².'], 1, 'Divide the same net force by each mass.', ['Increasing inertia reduces the response to the same net force.', 'Yes. 12/3 = 4, while 12/6 = 2 m/s².', 'Mass is in the denominator of a = ΣF/m.'], 'Check that students say net force rather than simply push.')
  },
  {
    id: 'third-law', number: '4.4', title: 'Locate both sides of an interaction', heading: 'Equal forces. Different recipients.', subtitle: 'An interaction pair does not cancel on a single object’s diagram.', page: 167, pages: '167–171', target: 'Identify Newton’s third-law pairs and distinguish internal from external forces.', visual: 'pairs',
    paragraphs: [
      'When object A exerts a force on object B, B simultaneously exerts an equal-magnitude force in the opposite direction on A. Newton’s third law describes the two sides of one interaction. “Action” and “reaction” do not imply a delay.',
      'A swimmer pushes on the wall; the wall pushes on the swimmer. On the swimmer’s free-body diagram, include the wall’s force on the swimmer. The swimmer’s force on the wall acts on another recipient and does not cancel the force that accelerates the swimmer.',
      'Equal interaction forces do not imply equal accelerations. Acceleration also depends on mass and on all the other forces acting on each object. When two carts of unequal mass push apart, their mutual forces have equal magnitude, but the lighter cart has a larger acceleration if those are the only horizontal forces.',
      'Now place both carts inside one system boundary. Their mutual forces become internal to that combined system and cancel in the sum over the system. With no net horizontal external force, the combined center of mass maintains its velocity even while the individual carts move apart.',
      'Changing a boundary changes which forces enter your calculation, not the physical event. To find the push between a person and a cart, study the cart alone. To find the acceleration of the person and cart together, an appropriately chosen combined system can eliminate that internal push from the equation.',
      'Walking, swimming, and rocket propulsion all use interactions with another body. A rocket pushes exhaust gases backward, and the gases push the rocket forward. It does not need air behind it to push against. Always identify the pair of interacting bodies before applying the third law.'
    ],
    terms: [['Interaction pair', 'Equal and opposite forces from one interaction, acting on different objects.'], ['Internal force', 'A force between parts within the chosen system.'], ['Center of mass', 'The mass-weighted position used to describe a system’s overall motion.']],
    worked: { title: 'Two carts, one interaction', prompt: 'A 2 kg cart and a 4 kg cart push apart with a 12 N mutual force on a level, nearly frictionless track.', reasoning: 'The 2 kg cart accelerates at 6 m/s²; the 4 kg cart at 3 m/s² in the opposite direction. Each cart receives 12 N. For the combined 6 kg system, the two horizontal forces are internal, so its net external horizontal force is zero and its center of mass has no horizontal acceleration.' },
    check: check('Find the partner force.', 'Earth pulls downward on a book. What is the third-law partner to this force?', ['The table pushes upward on the book.', 'The book pulls upward on Earth.', 'The book’s inertia pushes upward.'], 1, 'Reverse the two bodies in “Earth on book.”', ['Support and weight can balance, but they come from different interactions.', 'Yes. These are the two gravitational forces between Earth and the book.', 'Inertia is a property, not an additional force.'], 'Distinguish a balanced pair on one object from an interaction pair on two objects.')
  },
]

export const inertiaFigures = [
  figure('3.1', 29, '3.1', 'figure-evidence', 'Compare everyday stopping with a controlled resistance experiment; boulder photo remains in the source.'),
  figure('3.2', 30, '3.2', null, 'Copernicus portrait remains in the original PDF; a new orbital schematic explains reference frames.'),
  figure('3.3', 31, '3.3', 'figure-ramps', 'Downhill, uphill, and level motion explained with a ramp comparison.'),
  figure('3.4', 31, '3.3', 'figure-ramps', 'Vary the return angle while preserving the ideal return height; include the level limit.'),
  figure('3.5', 33, '3.4', null, 'Tablecloth illustration remains in the PDF; the brief friction interaction is explained in the reading.'),
  figure('3.6', 34, '3.4', 'figure-glide', 'Compare equal-time positions with and without horizontal resistance.'),
  figure('3.7', 36, '3.5', 'figure-mass', 'Mass comparison uses safe loaded carts instead of kicking cans.'),
  figure('3.8', 36, '3.5', null, 'Battery/pillow photograph remains in the PDF; mass-versus-volume comparison appears in the prose.'),
  figure('3.9', 37, '3.5', 'figure-mass', 'Compare inertia and gravitational weight while changing environment.'),
  figure('3.10', 38, '3.5', 'figure-mass', 'Weight and mass displayed with units and explicit g rather than a bag of nails.'),
  figure('3.11', 38, '3.6', 'figure-frames', 'Shared initial motion is shown with a vehicle/coin and connected to the bird example in prose.'),
  figure('3.12', 39, '3.6', 'figure-frames', 'Switch between passenger and ground descriptions of one toss.'),
]
export const newtonFigures = [
  ...forceFigures,
  figure('4.3', 159, '4.1', 'figure-vectors', 'Perpendicular forces and their resultant share one scale; resultant is not an extra force.'),
  figure('4.4', 159, '4.1', 'figure-vectors', 'Calibrated spring deformation provides a repeatable force comparison.'),
  figure('4.5', 162, '4.3', 'figure-acceleration', 'Vary push and opposing resistance and compare net force and acceleration.'),
  figure('4.6', 163, '4.3', 'figure-acceleration', 'Vary mass while holding net force fixed.'),
  figure('4.7', 165, '4.3', null, 'Source lawn-mower scene and full original worked example remain in the PDF; cart calculation applies the same force balance.'),
  figure('4.8', 166, '4.3', null, 'Four-engine rocket-sled illustration remains in the PDF; adding thrust and resistance is explained with the cart model.'),
  figure('4.9', 168, '4.4', 'figure-pairs', 'Separate recipients and their force diagrams illustrated with two carts; swimmer discussed in prose.'),
  figure('4.10', 169, '4.4', 'figure-pairs', 'Switch the system boundary to show which interaction forces are internal.'),
]

const common = {
  // Existing section IDs and check choices are unchanged; retain students’ local notes.
  contentVersion: '2026-10-12.1',
  focus: 'Explain a change in motion by identifying the system and its external forces.',
  guidingQuestion: 'What keeps an object moving—and what changes its motion?',
  teaching: { before: 'Collect a prediction: if a moving cart’s push stops, must the cart stop? Ask students to name possible interactions.', during: 'Ask students to predict before changing a control, then explain the result using a system and a net force.', after: 'Use assigned explanations and quizzes as evidence. Review each target and return a specific next step before updating mastery.' },
  synthesisIntro: 'A coast, a toss, a turn: use one consistent explanation.', reasoningRoutine: 'Choose a system and frame → identify interactions → combine forces → connect to changes in velocity.',
  transfer: { prompt: 'A bus moves straight at constant speed. A passenger tosses a coin upward. Explain the catch, then predict what changes if the driver brakes while the coin is airborne.', starter: 'Before release, the coin’s horizontal velocity is… The horizontal forces while airborne are… During braking, the hand…', model: 'With negligible horizontal forces, the coin retains the bus’s initial horizontal velocity. At constant bus velocity it can return to the hand. If the bus brakes, the hand slows while the coin keeps its earlier horizontal motion, so it moves ahead of the hand. Gravity changes the vertical motion throughout.' },
}
newtonLessons.sort((a,b) => Number(a.number.split('.')[1]) - Number(b.number.split('.')[1]))
export const inertiaDefinition = makeChapter({ ...common, book: 'hewitt', chapter: 3, title: 'Inertia & the moving world', offset: 27, lessons: inertiaLessons, figures: inertiaFigures, conceptRanges: [[1,2,'3.1'],[3,3,'3.2'],[4,8,'3.3'],[9,11,'3.4'],[12,18,'3.5'],[19,20,'3.6']] })
export const newtonDefinition = makeChapter({ ...common, book: 'openstax', chapter: 4, title: 'Newton’s laws & their applications', lessons: newtonLessons, figures: newtonFigures,
  transfer: { prompt: 'An elevator is moving upward but slowing down. Compare a passenger’s scale reading with their gravitational weight. Explain using a force diagram.', starter: 'I choose the passenger as my system. The two vertical forces are… Because upward velocity is decreasing, acceleration points…', model: 'The passenger experiences weight mg downward and the scale’s normal force N upward. Slowing while moving upward means downward acceleration. With upward positive, N − mg = ma < 0, so N < mg. The passenger has not lost mass, and gravity has not switched off.' }
})
