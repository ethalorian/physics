const assert = require('node:assert/strict');
const P = require('../public/games/tether/physics.js');
const levels = require('../public/games/tether/levels.js');
const state = (r = 5, mass = 2, theta = -.9, omega = 0) => ({ ax: 8, ay: 12, r, mass, theta, omega, work: 0 });
const near = (a, b, epsilon = 1e-6) => assert(Math.abs(a-b) < epsilon, `${a} != ${b}`);
let s = state(); const E = P.energy(s); for(let i=0;i<120*60;i++) P.advance(s,P.DT); near(P.energy(s),E,1e-4); console.log('PASS energy conserved over 60 seconds');
s=state(5,2,.4,1.7);const p=P.position(s),v=P.velocity(s);near((p.x-s.ax)*v.x+(p.y-s.ay)*v.y,0);near(Math.hypot(v.x,v.y),s.r*Math.abs(s.omega));const f=P.release(s);near(f.vx,v.x);near(f.vy,v.y);console.log('PASS release is tangent and preserves v = omega r');
const a=state(),b=state(5,4);for(let i=0;i<500;i++){P.advance(a,P.DT);P.advance(b,P.DT)}near(a.theta,b.theta);near(a.omega,b.omega);near(P.inertia(state(10)),4*P.inertia(state(5)));console.log('PASS mass-independent gravity swing and radius-squared inertia');
s=state();const initial=P.energy(s);for(let i=0;i<240;i++)P.advance(s,P.DT,20);near(P.energy(s)-initial,s.work,1e-4);console.log('PASS applied torque work equals mechanical energy change');
const shot={x:1,y:8,vx:7,vy:3};const expected=P.landing(shot,2);const flight={...shot};P.fly(flight,expected.time);near(flight.x,expected.x);near(flight.y,2);near(flight.vx,7);console.log('PASS ballistic flight and exact landing crossing');
// Search actual trajectories for each authored target. No state teleporting:
// fixed-step pendulum and optional right thrust, then ballistic intercept.
for(const L of levels){let best=Infinity,solution;for(const motorTime of L.motor?[0,.25,.5,.75,1,1.25,1.5,2]:[0]){s=state(L.r,L.mass,L.angle*Math.PI/180);for(let i=0;i<120*8;i++){const t=(i+1)*P.DT;P.advance(s,P.DT,L.motor&&t<motorTime?L.force*L.r:0);if(P.tension(s)<0)break;const hit=P.landing(P.release(s),L.padY);if(!hit)continue;const target=L.target+(L.moving||0)*Math.sin((t+hit.time)*.75);const error=Math.abs(hit.x-target);if(error<best){best=error;solution={releaseAt:+t.toFixed(3),motorTime,error:+best.toFixed(4)}}}}assert(best<L.width/2,`Unreachable ${L.name}: ${best}`);console.log('PASS reachable',L.name,JSON.stringify(solution));}
console.log('All Tether physics checks passed');
