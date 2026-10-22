import assert from 'node:assert/strict'
import test from 'node:test'
import { GRAVITY, motionAt, projectileFlight, linearDrag, cableTension } from './motion-model'
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`)
test('linked graph model preserves displacement, velocity, and turning points',()=>{
  for(let v=-4;v<=4;v++)for(let a=-2;a<=2;a++)for(const t of [0,1,2,4]){
    const state=motionAt(v,a,t);near(state.position,.5*(v+state.velocity)*t)
    near((motionAt(v,a,t+.0001).position-motionAt(v,a,t-.0001).position)/.0002,state.velocity)
  }
  near(motionAt(4,-2,2).velocity,0);near(motionAt(4,-2,2).position,4);assert.ok(motionAt(4,-2,3).position<4)
})
test('every projectile control combination lands on the ground and respects its initial conditions',()=>{
  for(const v of [4,16,20])for(const angle of [0,15,30,45,60,75])for(const height of [0,1,5,10]){
    const f=projectileFlight(v,angle,height);near(f.at(0).y,height);near(f.at(f.duration).y,0);near(f.at(f.duration).x,f.range)
    near(f.vx*f.vx+f.vy*f.vy,v*v)
    if(height>0||angle>0) assert.ok(f.duration>0)
    assert.ok(f.range<=60 && f.peak<=30,'trajectory fits the calibrated visible axes')
  }
  near(projectileFlight(16,30,0).range,projectileFlight(16,60,0).range)
  near(projectileFlight(4,0,5).duration,projectileFlight(20,0,5).duration)
  near(projectileFlight(16,45,0).at(projectileFlight(16,45,0).duration/2).vy,0)
})
test('linear drag begins in free fall and approaches terminal speed without exceeding it',()=>{
  for(const terminal of [5,15,30]){
    near(linearDrag(0,terminal).speed,0);near(linearDrag(0,terminal).acceleration,GRAVITY)
    for(const t of [1,3,6,20]){const state=linearDrag(t,terminal);assert.ok(state.speed>=0&&state.speed<=terminal);near(state.acceleration,GRAVITY*(1-state.speed/terminal));assert.ok(state.distance<.5*GRAVITY*t*t)}
  }
})
test('symmetric cables support the load at every available angle',()=>{
  let previous=Infinity
  for(let angle=10;angle<=60;angle+=5){const tension=cableTension(98,angle);near(2*tension*Math.sin(angle*Math.PI/180),98);assert.ok(tension<previous);previous=tension}
})
