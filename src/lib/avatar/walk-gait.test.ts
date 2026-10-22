import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {readFileSync} from 'node:fs'
import {WALK,LEGACY_WALK,walkFrame,buildWalkKeyframes} from './walk-gait'

test('the support foot stays planted while the hip moves over it',()=>{
  for(let i=0;i<=60;i++){
    const frame=walkFrame(i/100)
    assert.equal(frame.y,WALK.ankleY)
    assert.ok(Math.abs(frame.x-(WALK.stride-2*WALK.stride*i/60))<1e-9)
    assert.ok(Math.abs(frame.thigh+frame.knee+frame.foot)<1e-9,'sole stays level')
  }
})
test('joint angles reach the intended foot position without stretching limbs',()=>{
  const rad=(angle:number)=>angle*Math.PI/180
  for(const rig of [WALK,LEGACY_WALK]) for(let i=0;i<1000;i++){
    const f=walkFrame(i/1000,rig),a=rad(f.thigh),b=rad(f.thigh+f.knee)
    const x=-rig.thigh*Math.sin(a)-rig.shin*Math.sin(b)
    const y=rig.hipY+f.bob+rig.thigh*Math.cos(a)+rig.shin*Math.cos(b)
    assert.ok(Math.abs(x-f.x)<1e-8)
    assert.ok(Math.abs(y-f.y)<1e-8)
    assert.ok(y<=rig.ankleY+1e-8,'feet never penetrate the floor')
    assert.ok(f.knee>=0&&f.knee<100,'knees bend in the anatomical direction')
  }
  assert.ok(walkFrame(.8).y<WALK.ankleY-24,'swing clears the floor')
})

test('toe-off and heel strike preserve foot velocity without a knee snap',()=>{
  const delta=1e-6
  for(const phase of [WALK.stance,1]) for(const key of ['x','y','thigh','knee','foot'] as const){
    const before=walkFrame(phase-delta)[key],at=walkFrame(phase)[key],after=walkFrame(phase+delta)[key]
    assert.ok(Math.abs((at-before)/delta-(after-at)/delta)<.1,`${phase}: ${key}`)
  }
})

test('the figure CSS uses the current gait samples for both leg rigs',()=>{
  const css=readFileSync('src/components/avatar/avatar-figure.module.css','utf8')
  assert.ok(css.includes(buildWalkKeyframes()),'Regenerate keyframes after changing gait geometry')
  assert.match(css,/data-avatar-rig=legacy/)
})
test('the loop is continuous and the opposite arm balances the leading leg',()=>{
  assert.deepEqual(walkFrame(0),walkFrame(1))
  const before=walkFrame(1-1e-7),after=walkFrame(1e-7)
  for(const key of ['x','y','thigh','knee','foot','bob'] as const) assert.ok(Math.abs(before[key]-after[key])<.001,key)
  assert.ok(walkFrame(0).arm>0&&walkFrame(0).x>0)
  assert.ok(walkFrame(.5).arm<0&&walkFrame(.5).x<0)
})
