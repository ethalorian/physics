const assert=require('node:assert/strict'),P=require('../public/games/flywheel/physics.js'),levels=require('../public/games/flywheel/levels.js'),pilot=require('./flywheel-test-controller.cjs');
const near=(a,b,e=1e-8)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
let s=P.create(levels[0]),L=s.L,w=P.omega(s),E=P.energy(s);for(let n=0;n<300;n++)P.advance(s,P.DT,-1,0);near(s.L,L);assert(P.omega(s)>w);assert(P.energy(s)>E);near(P.energy(s)-E,s.railWork);console.log('PASS inward cargo conserves L and positive rail work increases K');
for(let n=0;n<300;n++)P.advance(s,P.DT,1,0);near(s.L,L);near(P.omega(s),w,1e-8);near(s.railWork,0,1e-8);console.log('PASS outward return restores omega and removes prior added energy');
s=P.create(levels[0]);for(let n=0;n<4000;n++)P.advance(s,P.DT,Math.sin(n*.07)>0?1:-1,n%100<40?16:-8);near(P.energy(s)-s.initialEnergy,s.railWork+s.thrusterWork,1e-7);console.log('PASS simultaneous radius/torque work accounting');
s=P.create(levels[0]);L=s.L;for(let n=0;n<120;n++)P.advance(s,P.DT,0,16);near(s.L,L+16);console.log('PASS angular impulse changes L by torque × time');
const disk=P.create({...levels[0],omega:1}),ring=P.create({...levels[0],baseI:48,omega:1});assert(P.inertia(ring)>P.inertia(disk));near(P.inertia(ring)-P.inertia(disk),24);console.log('PASS ring hull has twice the disk hull inertia with equal mass/radius');
for(const m of levels){s=P.create(m);let ready=false;for(let n=0;n<120*90;n++){const c=pilot(s,m);P.advance(s,P.DT,c.radial,c.torque*m.torque);if(P.dock(s,m).ready){ready=true;break;}}assert(ready,'Unreachable '+m.name);console.log('PASS docking reachable',m.name,s.time.toFixed(1)+'s');}
console.log('All Flywheel physics checks passed');
