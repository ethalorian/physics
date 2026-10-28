export type TransferBriefScene = 'shuttle-acceleration' | 'robot-stopping' | 'river-crossing' | 'cargo-braking'
type Fact = { label: string; value: string; note: string }
type Condition = { label: string; image: string; description: string; facts: Fact[] }
type Scene = { context: string; role: string; title: string; model: string; conditions: [Condition, ...Condition[]] }

/** Given evidence only; the visual never reveals the student's calculations or decision. */
export const TRANSFER_BRIEF_SCENES: Record<TransferBriefScene, Scene> = {
  'shuttle-acceleration': {
    context: 'A campus team is planning an acceleration lane for its electric shuttle.', role: 'Use a motion model to check the lane proposal and defend your recommendation.', title: 'From the stop to the campus loop',
    model: 'Start from rest. Straight, level lane. Constant forward acceleration of 0.80 m/s² from the moment the shuttle starts. Target speed at the merge point: 6.0 m/s.',
    conditions: [
      { label: 'Proposed 18 m lane', image: '/transfer-briefs/shuttle-acceleration.svg', description: 'Overhead model of an electric shuttle at the start of a proposed 18 m acceleration lane. The shuttle starts at 0 m/s and accelerates toward the merge point at a constant 0.80 m/s². The target speed there is 6.0 m/s. The time and distance needed to reach that speed are for you to determine.', facts: [
        { label: 'Starting speed', value: '0 m/s', note: 'Starts from rest' }, { label: 'Target speed', value: '6.0 m/s', note: 'At the merge point' },
        { label: 'Acceleration', value: '0.80 m/s²', note: 'Constant, forward' }, { label: 'Proposed lane', value: '18 m', note: 'Start to merge point' },
      ] },
    ],
  },
  'robot-stopping': {
    context: 'A campus delivery robot is approaching a pedestrian crossing.', role: 'Advise the delivery team on its approach speed.', title: 'Same crossing. Two conditions.',
    model: 'Level, unobstructed path. Constant speed during the response delay and constant deceleration once braking begins. Dry deceleration: 2.0 m/s²; wet: 1.0 m/s².',
    conditions: [
      { label: 'Dry path', image: '/transfer-briefs/robot-a.svg', description: 'At detection, the front of the robot is 5.0 m from the near edge of the crossing, moving toward it at 3.0 m/s. This is the starting position, not the stopping result.', facts: [
        { label: 'Approach speed', value: '3.0 m/s', note: 'Toward the crossing' }, { label: 'Response delay', value: '0.50 s', note: 'Still moving at 3.0 m/s' }, { label: 'Dry deceleration', value: '2.0 m/s²', note: 'Once braking begins' },
      ] },
      { label: 'Wet path', image: '/transfer-briefs/robot-b.svg', description: 'The same robot starts 5.0 m from the crossing at 3.0 m/s on a wet path. The response delay is unchanged; braking deceleration is 1.0 m/s².', facts: [
        { label: 'Approach speed', value: '3.0 m/s', note: 'Toward the crossing' }, { label: 'Response delay', value: '0.50 s', note: 'Still moving at 3.0 m/s' }, { label: 'Wet deceleration', value: '1.0 m/s²', note: 'Once braking begins' },
      ] },
    ],
  },
  'river-crossing': {
    context: 'A rescue team is practicing a crossing to a landing directly opposite its start.', role: 'Recommend a steering plan that reaches the landing.', title: 'One landing. Two steering plans.',
    model: 'River width: 120 m. Constant current: 1.5 m/s downstream; ignore wind. Boat velocities are relative to the water. Plan A: 4.0 m/s across, 0 downstream. Plan B: 3.7 m/s across, −1.5 m/s downstream. Both plans hold their stated components.',
    conditions: [
      { label: 'Plan A', image: '/transfer-briefs/river-a.svg', description: 'The start and opposite landing are separated by a 120 m river. Current flows downstream to the right at 1.5 m/s. Plan A aims straight across. The arrow shows heading, not the ground-relative trajectory.', facts: [
        { label: 'Across component', value: '4.0 m/s', note: 'Boat relative to water' }, { label: 'Downstream component', value: '0 m/s', note: 'Boat relative to water' }, { label: 'River current', value: '1.5 m/s', note: 'Downstream, relative to bank' },
      ] },
      { label: 'Plan B', image: '/transfer-briefs/river-b.svg', description: 'The same crossing and current. Plan B aims upstream with water-relative components 3.7 m/s across and −1.5 m/s downstream. The arrow shows heading, not the resulting path.', facts: [
        { label: 'Across component', value: '3.7 m/s', note: 'Boat relative to water' }, { label: 'Downstream component', value: '−1.5 m/s', note: 'Boat relative to water' }, { label: 'River current', value: '1.5 m/s', note: 'Downstream, relative to bank' },
      ] },
    ],
  },
  'cargo-braking': {
    context: 'A delivery team wants to keep a crate from sliding when its van brakes.', role: 'Evaluate whether the mat supports the team’s claim.', title: 'One crate. Two tested mats.',
    model: '20 kg crate; horizontal floor; no tipping; constant van deceleration of 4.0 m/s². Static-friction limits: 65 N for Mat A and 100 N for Mat B. A limit is not necessarily the force actually acting.',
    conditions: [
      { label: 'Mat A', image: '/transfer-briefs/cargo-a.svg', description: 'A 20 kg crate rests on Mat A inside a van moving right. Braking acceleration is 4.0 m/s² left. Mat A supplies at most 65 N of static friction. The calculated force and sliding result are not shown.', facts: [
        { label: 'Crate mass', value: '20 kg', note: 'Same crate in both tests' }, { label: 'Van deceleration', value: '4.0 m/s²', note: 'Opposite forward motion' }, { label: 'Static-friction limit', value: '65 N', note: 'Maximum for Mat A' },
      ] },
      { label: 'Mat B', image: '/transfer-briefs/cargo-b.svg', description: 'The same crate and braking maneuver, using Mat B with a 100 N maximum static-friction force. The needed force is for the student to calculate.', facts: [
        { label: 'Crate mass', value: '20 kg', note: 'Same crate in both tests' }, { label: 'Van deceleration', value: '4.0 m/s²', note: 'Opposite forward motion' }, { label: 'Static-friction limit', value: '100 N', note: 'Maximum for Mat B' },
      ] },
    ],
  },
}
