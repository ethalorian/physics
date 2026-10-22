import {demand} from '@/lib/assessment-demand'
import type { ExitTicketBlock } from './content-blocks'

interface TransferQuestion {
  title: string
  scenario: string
  question: string
  steps: [string, string, string]
  words: string[]
  teacher: string
}

/** New contexts ask for an explanation, not just a repeated calculation. */
export const VIDEO_TRANSFERS: Record<string, TransferQuestion> = {
  Z1qFlfqlS_E: {
    title: 'Will the shelf fit?',
    scenario: 'A student measures a shelf opening with a ruler marked in centimeters and estimates its width as 82.4 cm. A shopping listing gives the shelf width as 0.824 m. A friend rewrites the opening as 82.4000 cm and says the extra zeros make the fit certain.',
    question: 'Explain what the two measurements tell you about the fit, and whether the extra zeros justify the friend’s confidence. What should you check before deciding?',
    steps: ['Put the two lengths in the same unit. Which physical quantity is being compared?', 'Compare the recorded precision with what the ruler can support. What information did the extra zeros add?', 'Explain why equal reported widths alone do or do not guarantee a fit. Identify one useful additional measurement or clearance check.'],
    words: ['quantity', 'unit', 'precision', 'measurement', 'uncertainty'],
    teacher: '0.824 m = 82.4 cm. Added zeros do not improve the original measurement; they imply unsupported precision. Equal reported widths provide no clearance and do not establish an exact fit. Look for a more precise measurement, manufacturing tolerance, or an allowance for clearance, linked explicitly to uncertainty.',
  },
  vf7X7mmJfsE: {
    title: 'The bend in the bike path',
    scenario: 'A cyclist rides at a steady speed of 4 m/s along a straight path, then follows a curved section while the speedometer still reads 4 m/s. A friend says, “The speed never changes, so the motion never changes.”',
    question: 'Use position, velocity, and acceleration to explain which parts of the friend’s claim need correcting. What would an overhead video show?',
    steps: ['Describe how the cyclist’s position changes during both parts of the trip.', 'Draw or describe velocity arrows at two points on the bend. Compare their lengths and directions.', 'Connect any change in velocity to acceleration. Use the steady speed reading and the changing path as separate pieces of evidence.'],
    words: ['position', 'speed', 'velocity', 'direction', 'acceleration'],
    teacher: 'Position changes throughout. On the straight section constant speed and direction mean constant velocity; on the bend the direction changes despite constant speed, so velocity changes and acceleration is nonzero. No force calculation is needed.',
  },
  u0V8uJ5KTvo: {
    title: 'The delivery robot’s report',
    scenario: 'A delivery robot travels along a straight hallway from the charging station at x = 0 m to x = +12 m, then returns directly to x = +4 m. Its report lists “distance: 20 m” and “displacement: +4 m.” A supervisor thinks one reading must be wrong.',
    question: 'Can both readings be right? Explain what each number tells the supervisor and which one locates the robot relative to its start.',
    steps: ['Choose right as positive and mark the start, turn, and finish on a number line.', 'Find each leg’s length, then compare their total with final position minus initial position.', 'Use the robot’s route to explain why returning partway changes distance and displacement differently.'],
    words: ['origin', 'distance', 'displacement', 'initial', 'final'],
    teacher: 'Distance is 12 + 8 = 20 m; displacement is 4 − 0 = +4 m. Both correct. The displacement places the robot 4 m right of its start; distance counts all travel and cannot locate it alone.',
  },
  djR8sAAi740: {
    title: 'Finding a library book cart',
    scenario: 'In a library, x measures meters east, y meters north, and z meters up from a ground-floor origin. A book cart moves from (2, 5, 0) m to (8, 1, 3) m. A tracking app shows the same positive change for every coordinate.',
    question: 'Explain what the app should report for the displacement and why its “all positive” description is misleading.',
    steps: ['Label the three axes and list the initial and final coordinate along each one.', 'Subtract initial from final on matching axes. Interpret each sign in words.', 'Explain why the final coordinates describe a location but your three changes describe the trip’s displacement.'],
    words: ['coordinate', 'axis', 'component', 'displacement', 'direction'],
    teacher: 'Displacement is (+6, −4, +3) m: east, south, up. Final coordinates are not displacement. Matching-axis subtraction is essential; negative y is a direction, not a negative length.',
  },
  FshpPgPAeWM: {
    title: 'A lost phone at the festival',
    scenario: 'A phone locator says a lost phone is 50 m from the information tent. One friend is 30 m east and 40 m north of the tent; another is 30 m west and 40 m south. Both claim the distance reading points to their location.',
    question: 'Explain why the distance reading cannot choose between them. Give information that would locate the phone unambiguously.',
    steps: ['Sketch both locations using the tent as the origin and label east and north as positive.', 'Use the two coordinate pairs to compare their magnitudes.', 'Explain what direction or signed components add to the scalar distance. Write one complete position description for each candidate.'],
    words: ['scalar', 'vector', 'magnitude', 'components', 'origin'],
    teacher: 'Both distances are √(30²+40²)=50 m. Positions are (30,40) and (−30,−40) m. A scalar distance gives a circle of possible positions; signed components or distance plus a precise direction locate one.',
  },
  'maoz-9mGWyk': {
    title: 'The basement elevator',
    scenario: 'An elevator display defines ground level as y = 0 m and up as positive. At one instant it reads y = −6 m. One passenger says the elevator must be moving down. One second later the display reads −4 m.',
    question: 'Explain what the first reading alone tells you, what the second reading adds, and whether the passenger’s claim is justified.',
    steps: ['Mark both readings on a vertical number line. What is the magnitude of the first position?', 'Compare the later position with the earlier position. Which way did the elevator change position?', 'Separate evidence about location from evidence about motion. Explain why one negative coordinate is not enough to determine direction of motion.'],
    words: ['origin', 'negative', 'position', 'magnitude', 'change'],
    teacher: '−6 m means 6 m below ground, not downward motion. Change is −4−(−6)=+2 m, so net motion over the interval is upward. The two readings do not establish every instantaneous movement between them.',
  },
  YViTBR_aygk: {
    title: 'Which conveyor moves faster?',
    scenario: 'A package on conveyor A moves from x = 2 m to x = 14 m in 6 s. A package on conveyor B moves from x = 1 m to x = 16 m in 10 s. Both move in the positive direction. A worker says B must be faster because it moves farther.',
    question: 'Use rates of change to evaluate the worker’s claim. Explain what “meters per second” adds to a comparison of the distances.',
    steps: ['Find the change in position for each package, keeping each time interval with its own change.', 'Compare position change per second. Include units in your calculation.', 'Explain which average rate is larger and why these observations alone do not prove that the speed was constant throughout either interval.'],
    words: ['change', 'elapsed time', 'per second', 'average rate', 'units'],
    teacher: 'A:12/6=2 m/s; B:15/10=1.5 m/s. A has larger average rate even though B travels farther. The time normalization enables comparison; endpoint data alone do not establish constant instantaneous speed.',
  },
  hj8usnvYrRo: {
    title: 'The runner’s two app readings',
    scenario: 'A runner completes one 400 m lap of a track in 100 s and finishes at the exact starting point. One app reports an average speed of 4 m/s; another reports an average velocity of 0 m/s. The runner says a zero average velocity means they must have been standing still.',
    question: 'Explain whether the app readings can both be correct and whether they tell you the runner’s instantaneous speed halfway around the track.',
    steps: ['Compare the total path length with the start-to-finish displacement.', 'Use the same elapsed time for both averages and identify what goes in each numerator.', 'Use this trip to explain why an average over the whole lap does not describe the motion at one instant.'],
    words: ['distance', 'displacement', 'average', 'instantaneous', 'velocity'],
    teacher: '400/100=4 m/s speed; displacement0/100=0 m/s velocity. Zero average velocity does not mean stationary. Neither average gives halfway instantaneous speed; more local measurements are needed.',
  },
  fmjVsKsU9Sw: {
    title: 'A readable robot test graph',
    scenario: 'A robotics club records a cart’s position from 0 to 2.8 m over 0 to 7.0 s. Its graph paper has 20 squares across and 15 squares up. A student proposes 0.3 s per square horizontally and 0.1 m per square vertically.',
    question: 'Explain why the proposed graph will not fit the data, then recommend readable uniform scales and show where (4.0 s, 2.0 m) belongs.',
    steps: ['Multiply each proposed step by the available squares. Compare the result with the data range.', 'Divide each range by its available squares and round up to a convenient step such as 1, 2, or 5 times a power of ten.', 'Check both new scales, label quantities and units, and explain why changing a scale does not change the measured motion.'],
    words: ['scale', 'uniform', 'range', 'axis', 'unit'],
    teacher: 'Original spans6s and1.5m fail. Min steps .35s and .1867m; good choices .5s and .2m cover10s and3m. Point8 squares across10 up. Other readable uniform scales that fit are acceptable; measured values unchanged.',
  },
  lZIZ8jByakc: {
    title: 'Comparing camera exposures',
    scenario: 'Camera A uses an exposure time of 0.0008 s. Camera B uses 0.004 s. A student writes these as 8 × 10⁻⁴ s and 4 × 10⁻³ s, then says A’s exposure is longer because 8 is larger than 4.',
    question: 'Which exposure is longer, by what factor, and why is comparing only the coefficients misleading?',
    steps: ['Check that each scientific-notation expression represents its original measurement.', 'Compare the whole values by division or by rewriting them with the same power of ten.', 'Explain what the negative exponents mean and why they do not mean negative time.'],
    words: ['coefficient', 'exponent', 'power of ten', 'ratio', 'unit'],
    teacher: 'B is5 times longer: (.004)/(.0008)=5. Negative exponents describe positive fractions of seconds. Coefficients alone are comparable only when exponents match.',
  },
  VQlq7_OtDF8: {
    title: 'Two sensor labels',
    scenario: 'Two sensors measure the same pulse. One display says 2.5 ms and the other says 2 500 µs. A student reports that the second pulse lasted a thousand times longer. A typed report also changes ms to Ms.',
    question: 'Explain whether the sensors disagree and why the capital letter in the report matters.',
    steps: ['Write milli, micro, and mega as powers of ten.', 'Express both sensor readings in seconds and compare the physical durations.', 'Explain the difference between changing a unit correctly and changing its prefix symbol without changing the number.'],
    words: ['milli', 'micro', 'mega', 'prefix', 'equivalent'],
    teacher: 'Both2.5×10⁻³s. M=mega10⁶, m=milli10⁻³;2.5Ms would be2.5million seconds,10⁹ times2.5ms. Different numeric labels can describe the same duration when units differ.',
  },
  SE8M273AKXw: {
    title: 'The scooter speed display',
    scenario: 'A scooter display reads 18 km/h. A demonstration rule caps speed at 6.0 m/s. A rider compares 18 with 6 and concludes the scooter exceeds the cap.',
    question: 'Evaluate the rider’s conclusion using unit cancellation, and explain why converting the reading does not change the scooter’s motion.',
    steps: ['State the quantity both numbers measure and the unit you will use to compare them.', 'Use 1 km = 1 000 m and 1 h = 3 600 s. Arrange factors so kilometers and hours cancel.', 'Compare equivalent readings, then explain why the original bare-number comparison was invalid.'],
    words: ['conversion factor', 'equivalent', 'cancel', 'rate', 'unit'],
    teacher: '18km/h×1000m/km×h/3600s=5m/s, below6m/s. Ratios equal1 preserve the physical speed. Comparison requires compatible units.',
  },
  E0CpXzmViwQ: {
    title: 'A shortcut through the park',
    scenario: 'A park visitor walks 60 m east and then 80 m north. A friend says a straight shortcut to the same destination must be 140 m long because 60 + 80 = 140.',
    question: 'Use a scaled tip-to-tail model to explain the difference between the route and the shortcut. Would walking north first change the final displacement?',
    steps: ['Choose and state a scale; draw the two route arrows without changing their lengths or directions.', 'Connect the first tail to the last tip. Compare this resultant with the total route length.', 'Give the resultant magnitude and direction, and explain with your drawing what changes and what stays the same if the order is reversed.'],
    words: ['tip to tail', 'resultant', 'magnitude', 'direction', 'distance'],
    teacher: 'Route140m; resultant100m about53° north of east. A scale such as1square=20m works. Reversing order changes route but same resultant; do not add perpendicular magnitudes as scalar lengths for displacement.',
  },
  'uH-NE-LlybM': {
    title: 'A warehouse robot’s commands',
    scenario: 'A robot is commanded to move 10 m at 30° north of east, then 4 m west. An operator says the net displacement must be 6 m because 10 − 4 = 6. Use cos 30° ≈ 0.866 and sin 30° = 0.5.',
    question: 'Use vector components to evaluate the operator’s claim and describe the robot’s actual start-to-finish displacement.',
    steps: ['Choose east as +x and north as +y. Resolve the first command and write the signed components of the second.', 'Add matching components, then use them to find the resultant magnitude.', 'Use the signs and a labeled sketch to identify the direction. Explain why subtracting the two magnitudes fails here.'],
    words: ['component', 'projection', 'resultant', 'quadrant', 'magnitude'],
    teacher: 'First(8.66,5)m, second(−4,0)m; total(4.66,5)m, magnitude≈6.84m, direction≈47° north of east. Inputs not collinear; subtracting magnitudes ignores the unchanged north component.',
  },
  pwbD3H8R0BU: {
    title: 'Why the door handle works',
    scenario: 'A door handle is 0.80 m from its hinge. Consider an instant when the position vector from hinge to handle points right (+x). Two possible 10 N pushes lie in the door’s rotation plane: A points right along the position vector; B points up (+y), perpendicular to it. The handle’s tiny displacement at this instant is upward.',
    question: 'Which push produces more torque about the hinge, and which does more work during the same tiny upward displacement? Explain why each question uses a different vector product.',
    steps: ['Sketch the position, force, and displacement vectors and identify the angle for each product.', 'Use torque magnitude rF sin θ and work FΔs cos φ, where φ is the angle between force and displacement.', 'Compare A with B, include torque direction using +z out of the page, and explain why torque and work must not be treated as the same quantity even though their units can be written N·m.'],
    words: ['dot product', 'cross product', 'torque', 'work', 'perpendicular'],
    teacher: 'A:torque0 and work0 for upward displacement. B:torque8N·m,+z out of page; work10Δs joules if Δs in meters. Torque r×F is vector, work F·Δs scalar. Distinct reference vectors determine angles. Assess reasoning, not equation naming alone.',
  },
  B51oRJa9MSM: {
    title: 'The stage camera’s travel log',
    scenario: 'A camera on a straight stage rail moves through positions −3 m → +5 m → +1 m. Positive is right. The equipment log needs total rail travel for maintenance, while the stage manager needs the final change from the starting position.',
    question: 'What should each person be told? Explain why using the same number for both reports would misrepresent the camera’s motion.',
    steps: ['Model the ordered stops on a number line and identify every leg.', 'Plan one calculation for accumulated travel and another for start-to-finish change. Show the work with units.', 'Interpret both answers and explain which report would change if the camera made an extra out-and-back trip before finishing at +1 m.'],
    words: ['leg', 'distance', 'displacement', 'endpoints', 'direction'],
    teacher: 'Distance8+4=12m; displacement1−(−3)=+4m. Extra out-and-back adds distance but does not change displacement if endpoints fixed. Look for explicit model, plan, work, and interpretation.',
  },
}

export function videoTransferBlock(youtubeId: string, targetId?: string): ExitTicketBlock | null {
  const item = VIDEO_TRANSFERS[youtubeId]
  if (!item) return null
  return {
    demand:demand('Analyze',3,'Choose the relevant model for a new context, connect scenario evidence to it, and justify the conclusion and its limits.'), id: `transfer-video-${youtubeId}`, type: 'exit_ticket', capture: true, targetId, evidenceRole: 'exit',
    workshop: { stage: `Transfer · ${item.title}`, pageBreakBefore: true },
    prompt: `### ${item.title}\n\n${item.scenario}\n\n**Your challenge:** ${item.question}\n\n**Build your explanation**\n\n${item.steps.map((step,index)=>`${index+1}. ${step}`).join('\n')}\n\nWrite a connected explanation using the video’s idea and specific evidence from this situation. You may add a labeled sketch or calculation to support your words.`,
    sei: { modes: ['text', 'sketch'], wordBank: item.words, frames: [{ level: 1, text: 'The idea from the video is ___. In this situation, ___ is evidence. This means ___ because ___.' }, { level: 3, text: 'My claim is ___. The relevant evidence is ___. The physics connects them because ___.' }] },
    note: `Teacher review guide: ${item.teacher} Review the claim, the scenario evidence, and the connection to the video concept. Saving this response is completion evidence, not an automatic mastery judgment.`,
  }
}
