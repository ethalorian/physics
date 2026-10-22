import assert from 'node:assert/strict'
import test from 'node:test'
import { frictionState, quadraticFall, towing, collision1D, energyDescent, circularMotion, keplerPosition } from './mechanics-model'
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≈ ${b}`)
test('static friction adjusts below its limit; sliding uses kinetic friction',()=>{
 for(let pull=0;pull<=49;pull++) {const s=frictionState(pull,10,.5,.3);near(s.friction,-pull);near(s.acceleration,0);assert.equal(s.moves,false)}
 const slipped=frictionState(50,10,.5,.3);assert.equal(slipped.moves,true);near(slipped.friction,-29.4)
 near(frictionState(0,10,.5,.3,true).acceleration,-2.94)
})
test('quadratic fall starts at g, approaches force balance, and obeys area scaling',()=>{
 const initial=quadraticFall(10,1,0);near(initial.v,0);near(initial.acceleration,9.8)
 const terminal=quadraticFall(10,1,100);near(terminal.drag,terminal.weight);near(terminal.v,terminal.terminal)
 near(quadraticFall(10,2,0).terminal,initial.terminal/Math.sqrt(2))
 for(let area=.5;area<=4;area+=.5)for(let t=0;t<=12;t+=.5){const s=quadraticFall(10,area,t);assert.ok(s.v>=0&&s.v<=s.terminal);assert.ok(s.acceleration>=-1e-10);near(s.drag, .5*1.2*area*s.v*s.v)}
})
test('cart, trailer, and combined force diagrams give the same acceleration',()=>{
 for(let drive=6;drive<=24;drive++){const s=towing(drive,6);near((drive-s.tension)/4,s.acceleration);near((s.tension-6)/2,s.acceleration)}
})
test('all collision controls conserve momentum; only elastic endpoints conserve kinetic energy',()=>{
 for(let mass=1;mass<=8;mass++)for(let step=0;step<=10;step++){const e=step/10,s=collision1D(2,mass,3,0,e);near(2*s.v1+mass*s.v2,6);near(s.v2-s.v1,e*3);assert.ok(s.after<=s.before+1e-9);if(e===1)near(s.after,s.before);if(e===0)near(s.v1,s.v2)}
 const reversed=collision1D(1,1,2,-2,0);near(reversed.v1,0);near(reversed.after,0)
})
test('energy bars sum to the initial energy at every control setting',()=>{
 for(let p=0;p<=10;p++)for(let l=0;l<=8;l++){const s=energyDescent(2,5,p/10,l/10);near(s.total,98);near(s.potential+s.kinetic+s.thermal,s.total);near(.5*2*s.speed*s.speed,s.kinetic);assert.ok(s.kinetic>=0)}
})
test('circular motion and elliptical orbit limits preserve the stated relationships',()=>{
 for(let r=1;r<=4;r+=.5)for(let v=1;v<=5;v++){const s=circularMotion(r,v);near(s.omega*r,v);near(s.period*v,2*Math.PI*r);near(s.acceleration,v*v/r)}
 for(let e=0;e<=.7;e+=.1)for(let i=0;i<=24;i++){const p=keplerPosition(e,i/24);near(p.eccentric-e*Math.sin(p.eccentric),p.mean);near(p.x*p.x/(1)+2*e*p.x+e*e+p.y*p.y/(1-e*e),1);near(.5*p.speed*p.speed-1/p.radius,-.5)}
 near(keplerPosition(0,0).speed,1);near(keplerPosition(.5,0).radius,.5);near(keplerPosition(.5,.5).radius,1.5)
})
