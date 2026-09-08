/* Tether's point-mass pendulum: SI units, y up, theta measured from downward
 * vertical toward the right. Fixed rope, massless arm, frictionless pivot.
 * The motor applies a perpendicular force at an adjustable lever arm.
 * No integration or game-state code depends on the display frame rate. */
(function (root) {
  'use strict';
  const G = 9.81, DT = 1 / 120;
  function position(s) { return { x: s.ax + s.r * Math.sin(s.theta), y: s.ay - s.r * Math.cos(s.theta) }; }
  function velocity(s) { return { x: s.r * s.omega * Math.cos(s.theta), y: s.r * s.omega * Math.sin(s.theta) }; }
  function inertia(s) { return s.mass * s.r * s.r; }
  function energy(s) { return .5 * inertia(s) * s.omega ** 2 + s.mass * G * position(s).y; }
  function torque(s) { return -s.mass * G * s.r * Math.sin(s.theta); }
  function tension(s) { return s.mass * (G * Math.cos(s.theta) + s.r * s.omega ** 2); }
  function advance(s, dt, motorTorque = 0) {
    const I = inertia(s), acceleration = theta => -G / s.r * Math.sin(theta) + motorTorque / I;
    const a = { t: s.omega, w: acceleration(s.theta) };
    const b = { t: s.omega + a.w * dt / 2, w: acceleration(s.theta + a.t * dt / 2) };
    const c = { t: s.omega + b.w * dt / 2, w: acceleration(s.theta + b.t * dt / 2) };
    const d = { t: s.omega + c.w * dt, w: acceleration(s.theta + c.t * dt) };
    const theta = s.theta + dt / 6 * (a.t + 2 * b.t + 2 * c.t + d.t);
    // Exact constant-torque work along this numerical angular displacement.
    s.work += motorTorque * (theta - s.theta);
    s.theta = theta;
    s.omega += dt / 6 * (a.w + 2 * b.w + 2 * c.w + d.w);
    return s;
  }
  function release(s) { const p = position(s), v = velocity(s); return { x: p.x, y: p.y, vx: v.x, vy: v.y }; }
  function fly(p, dt) { p.x += p.vx * dt; p.y += p.vy * dt - .5 * G * dt * dt; p.vy -= G * dt; return p; }
  function landing(p, y) {
    const disc = p.vy ** 2 + 2 * G * (p.y - y);
    if (disc < 0) return null;
    const time = (p.vy + Math.sqrt(disc)) / G;
    return time >= 0 ? { time, x: p.x + p.vx * time, vy: p.vy - G * time } : null;
  }
  const api = { G, DT, position, velocity, inertia, energy, torque, tension, advance, release, fly, landing };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TetherPhysics = api;
})(globalThis);
