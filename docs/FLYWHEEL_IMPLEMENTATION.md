# Flywheel — angular momentum arcade

Flywheel adds a six-mission rotation campaign. Students move two equal cargo masses on opposing radial rails, match a moving shuttle's angular velocity and angle, and press Dock. Later missions add external torque and a reversal of spin. Live instruments distinguish inertia, angular velocity, angular momentum, rotational kinetic energy, rail work, and thruster work.

## Play and rollout

- `npm run preview:flywheel` starts a localhost practice preview with no credentials or student data.
- Practice URL after deployment: `/games/rotation-flywheel.html`.
- Ranked cabinet after enablement: `/arcade/flywheel`.
- Deploy the HTML plus the three scripts in `public/games/flywheel/`.
- Apply `supabase/migrations/20260908005530_flywheel_rotation_cabinet.sql`, verify the assets, then enable Flywheel in `/admin/arcade`.
- Registration is free, labeled “Rotational Motion,” and initially disabled. Rerunning the registration preserves enablement and pricing.

This implementation has not been deployed to production. Authenticated production play, wallet changes, and live registration have not been verified. Local browser integration uses the real cabinet React page and game, with simulated API responses. Registration SQL was checked with temporary PostgreSQL tables, then rolled back.

## Campaign

| Mission | Main lesson |
|---|---|
| Pull together | Moving cargo inward reduces I and increases omega at fixed L. |
| Make room | Moving cargo outward slows the station and removes rotational energy through rail work. |
| Ring station | Equal hull mass and outer radius do not imply equal inertia: ring versus disk. |
| Change the momentum | Internal cargo motion alone cannot reach this target speed; external torque must change L. |
| Reverse the approach | Cargo movement cannot reverse the sign of L; external torque can. |
| Night shift | Combine controls while accounting for energy supplied or removed. |

Each successful docking has one conceptual check with explanation. The first response counts for XP. Incorrect docking attempts explain whether angle or angular velocity is mismatched; they do not destroy the station. Reset restarts only the current mission. A new campaign resets all score and learning totals.

Controls: Up/Down move cargo inward/outward; Left/Right apply negative/positive torque when unlocked; Space docks; P pauses; R resets the current mission. Pointer users hold the labeled buttons. Focus loss automatically pauses. Sound is optional and defaults off.

## Model and limits

The station has a frictionless fixed axis, a disk or thin-ring hull of mass 12 kg and radius 2 m, massless rails, and two point-mass cargo pods. Hull inertia is 24 kg m² for the disk and 48 kg m² for the ring. Cargo radius is bounded between 1.2 and 4.5 m.

The state stores angular momentum, not an arbitrarily adjusted spin speed:

- I = I_hull + 2mr²
- omega = L/I
- K_rot = L²/(2I)
- External torque produces ΔL = τΔt.

Moving cargo preserves L. Rail work equals the associated change in rotational energy; it is positive when pulling inward at nonzero L and negative when moving outward. Thruster work accounts separately for energy changes from external torque. Symmetric split steps apply half the angular impulse, then the radius change, then the remaining impulse. The rotation angle uses a trapezoidal step. Simulation steps are fixed at 1/120 s.

Radial motion is a quasi-static idealization: radial kinetic energy is neglected. The meters therefore account for **rotational** kinetic energy, not the full energetic cost of a detailed motor and moving-rail mechanism. There is no gravity torque, drag, gyroscopic precession, or fuel economy simulation. Opposing cargo pods preserve the center of mass. The shuttle is a prescribed moving target until docking.

Docking requires angle error within 0.24 rad and angular-velocity error within 0.07 rad/s. Missions are untimed; players can correct the phase gap by temporarily changing spin before matching the target again.

Reference: [OpenStax: conservation of angular momentum](https://openstax.org/books/university-physics-volume-1/pages/11-3-conservation-of-angular-momentum).

## Economy and integration

Per docking: 1,000 points, up to 400 for angular precision, and up to 200 reduced by unsuccessful docking requests. Correct checks add 250. Six perfect dockings yield at most 11,100 points; the registered sanity cap is 17,000.

Flywheel uses the existing physics-cabinet payout: solved × 2 × accuracy², rounded down, subject to the existing per-run and shared daily caps and 50% minimum accuracy. A perfect six-mission shift earns 12 XP before the daily cap. Practice submits nothing; staff retain the existing unranked/no-XP behavior.

The protocol-2 controller introduced for Tether now explicitly allows both `tether` and `flywheel`, checking the corresponding source string. Parent iframe and origin checks remain. Checkpoints and finals serialize; an uncertain final remains retryable in the open tab. Finished-score and prior-payout receipt replay apply to these two cabinets only. Ownership checks remain before replay. Other arcade games keep their existing behavior.

Unfinished game state lives in memory. Pending final saves trigger a leave-page warning. Account-based resume after reload is not implemented. The inherited arcade still uses client-reported evidence; this is practice evidence, not teacher-rated mastery.

## Verification commands

- `npm run test:flywheel`: physics and reachability; shared bridge behavior; real route handlers with isolated transport.
- `npm run test:flywheel-browser`: all six missions through actual keyboard input, conceptual checks, delayed approval, failed save and retry, new-shift reset, mobile fit, pointer controls, and practice isolation.
- Focused ESLint, TypeScript checking, JavaScript syntax checks, and diff whitespace checks.
- SQL insertion, free/disabled defaults, cap, and preserved enablement tested in temporary local PostgreSQL tables.

Numerical verification checks conserved L during cargo motion, positive/negative rail work, energy accounting during simultaneous controls, external angular impulse, disk/ring inertia, and all default mission targets. Screenshots are saved under `docs/flywheel-verification/` by the browser test.

Student playtesting, a full accessibility audit, real Chromebook performance, and production deployment remain outside these local checks.
