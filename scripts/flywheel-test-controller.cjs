const P=require('../public/games/flywheel/physics.js');
// Test pilot uses only measured state and the same bounded controls as a player.
module.exports=(s,m)=>{const d=P.dock(s,m),desired=m.targetOmega-Math.max(-.4,Math.min(.4,d.angle*.6));
 if(m.torque){const error=desired-P.omega(s);return{radial:0,torque:Math.abs(error)<.012?0:Math.sign(error)}}
 const min=s.L/(m.baseI+2*m.mass*4.5**2),max=s.L/(m.baseI+2*m.mass*1.2**2),w=Math.max(min,Math.min(max,desired));const r=Math.sqrt(Math.max(1.2**2,(s.L/w-m.baseI)/(2*m.mass)));return{radial:Math.abs(r-s.r)<.015?0:Math.sign(r-s.r),torque:0};
};
