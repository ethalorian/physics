/* Planar rotor, two equal cargo masses on opposing radial rails. SI units.
 * Controlled radial motion is quasi-static: radial kinetic energy is neglected.
 * Internal rail work changes rotational energy without changing angular momentum.
 * External torque changes L. Symmetric splitting preserves exact work accounting. */
(function(root){'use strict';
 const DT=1/120;
 const inertia=s=>s.baseI+2*s.mass*s.r*s.r;
 const omega=s=>s.L/inertia(s);
 const energy=s=>s.L*s.L/(2*inertia(s));
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 function create(config){const s={baseI:config.baseI,mass:config.mass,r:config.r,theta:config.theta||0,L:0,railWork:0,thrusterWork:0,time:0,alpha:0,torque:0};s.L=inertia(s)*config.omega;s.initialEnergy=energy(s);s.initialL=s.L;return s;}
 function advance(s,dt,radial=0,torque=0){
  const before=omega(s);let e=energy(s);
  s.L+=torque*dt/2;s.thrusterWork+=energy(s)-e;e=energy(s);
  s.r=Math.max(1.2,Math.min(4.5,s.r+radial*.8*dt));s.railWork+=energy(s)-e;e=energy(s);
  s.L+=torque*dt/2;s.thrusterWork+=energy(s)-e;
  const after=omega(s);s.theta+=(before+after)*dt/2;s.time+=dt;s.alpha=(after-before)/dt;s.torque=torque;return s;
 }
 function dock(s,mission){const angle=wrap(s.theta-(mission.targetAngle+mission.targetOmega*s.time));const speed=omega(s)-mission.targetOmega;return {angle,speed,ready:Math.abs(angle)<=mission.angleTolerance&&Math.abs(speed)<=mission.speedTolerance};}
 const api={DT,inertia,omega,energy,wrap,create,advance,dock};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FlywheelPhysics=api;
})(globalThis);
