import test from 'node:test'
import assert from 'node:assert/strict'
import {torque,centerOfMass,beamReactions,spinState,rollingState,tiltState,angularMotion,impactState,interiorField,tideState,orbitEnergy} from './rotation-model'
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≈ ${b}`)
test('torque uses the perpendicular moment arm and preserves equilibrium about either support',()=>{
 close(torque(20,.3,30),3);close(torque(20,.3,0),0);close(torque(20,.3,180),0)
 for(let x=0;x<=4;x+=.25){const s=beamReactions(4,100,200,x);close(s.left+s.right,300);close(4*s.right,100*2+200*x);close(4*s.left,100*2+200*(4-x));assert.ok(s.left>=0&&s.right>=0)}
})
test('mass-weighted center stays between masses and transforms with a shifted origin',()=>{
 for(let m=1;m<=10;m++)for(let x=.5;x<=3;x+=.1){const c=centerOfMass(2,0,m,x);assert.ok(c>0&&c<x);close(centerOfMass(2,7,m,x+7),c+7)}
 close(centerOfMass(2,0,6,2),1.5)
})
test('inward rearrangement conserves angular momentum while internal work raises energy',()=>{
 let lastEnergy=Infinity;for(let r=.25;r<=1.001;r+=.05){const s=spinState(r);close(s.inertia*s.omega,4);close(s.energy,16/(2*s.inertia));assert.ok(s.energy<lastEnergy);lastEnergy=s.energy}
})
test('rolling partitions all gravitational energy and gives the expected shape ranking',()=>{
 for(let h=.5;h<=3;h+=.25){const states=[.4,.5,1].map(k=>rollingState(k,h));for(const s of states)close(s.translation+s.rotation,9.8*h);assert.ok(states[0].speed>states[1].speed&&states[1].speed>states[2].speed)}
})
test('critical tilt places the center over the edge and then reverses gravitational torque',()=>{
 for(let h=.4;h<=1.201;h+=.1){const critical=tiltState(.4,h,0).critical;close(tiltState(.4,h,critical).x,0);assert.ok(tiltState(.4,h,critical-1).x<0);assert.ok(tiltState(.4,h,critical+1).x>0)}
})
test('angular kinematics matches the graph area and constant-acceleration identity',()=>{
 for(let a=.5;a<=4;a+=.5)for(let t=0;t<=5;t+=.5){const s=angularMotion(a,t);close(s.angle,.5*s.omega*t);close(s.omega*s.omega,2*a*s.angle)}
})
test('pivoted impact conserves angular momentum, loses kinetic energy, and has a percussion point',()=>{
 for(let r=.1;r<=1.001;r+=.01){const s=impactState(r);close(s.inertia*s.omega,s.L);assert.ok(s.finalEnergy<s.initialEnergy)}
 close(impactState(2/3).pivotImpulse,0);assert.ok(impactState(.1).pivotImpulse<0);assert.ok(impactState(1).pivotImpulse>0)
})
test('uniform interior joins the exterior continuously and tides have opposite relative signs',()=>{
 close(interiorField(0),0);close(interiorField(.5),.5);close(interiorField(1),1);close(interiorField(2),.25)
 for(let d=4;d<=12;d++){const s=tideState(d);assert.ok(s.near>0&&s.far<0);assert.ok(s.center+s.far>0);if(d<12)assert.ok(tideState(d+1).near<s.near)}
})
test('elliptical energy stays negative and constant while kinetic and potential trade',()=>{
 for(let r=.5;r<=1.501;r+=.05){const s=orbitEnergy(r);close(s.kinetic+s.potential,s.total);close(s.total,-.5);assert.ok(s.kinetic>0)}
 close(.5*Math.SQRT2**2-1,0)
})
