import assert from 'node:assert/strict'
import test from 'node:test'
import * as m from './modern-model'
const near=(a:number,b:number,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} ≈ ${b}`)
for(const cycles of[0,1,2,3,4,5])test(`integer ring mode ${cycles} matches the complete amplitude`,()=>{const r=m.ringMatch(cycles);assert.equal(r.matches,true);near(r.real,1);near(r.imaginary,0)})
for(const cycles of[.25,.5,1.75,3.5])test(`noninteger ring mode ${cycles} fails phase matching`,()=>assert.equal(m.ringMatch(cycles).matches,false))
test('one-electron radius distinguishes n-squared and inverse-Z scaling',()=>{near(m.hydrogenRadius(2,1)/m.hydrogenRadius(1,1),4);near(m.hydrogenRadius(2,2)/m.hydrogenRadius(2,1),.5)})
test('logistic fixed-point regime converges for nearby starts',()=>{near(m.logistic(2.8,.4,200).at(-1)!,1-1/2.8);near(m.logistic(2.8,.4001,200).at(-1)!,1-1/2.8)})
test('sensitive logistic records diverge without leaving invariant interval',()=>{const a=m.logistic(3.9,.4,60),b=m.logistic(3.9,.4001,60);assert.ok(a.some((x,i)=>Math.abs(x-b[i])>.1));assert.ok([...a,...b].every(x=>x>=0&&x<=1));assert.deepEqual(a,m.logistic(3.9,.4,60))})
test('attenuation composes multiplicatively and remains positive',()=>{near(m.transmission(2)*m.transmission(3),m.transmission(5));near(m.transmission(0),1);assert.ok(m.transmission(5)>0)})
test('radiocarbon inversion recovers three known half-lives',()=>{near(m.radiocarbonAge(1),0);near(m.radiocarbonAge(.125),17190)})
for(const h of[0,.25,1,2,4])test(`parent-daughter ledger closes and inverts at ${h} half-lives`,()=>{const p=m.parentDaughter(h);near(p.parent+p.daughter,1);near(m.datingAge(p.ratio,5730),h*5730)})
test('tracer redistribution preserves the common decay envelope',()=>{for(const t of[0,1,4,8])for(const rate of[0,.1,1]){const p=m.tracer(t,rate,4);near(p.a+p.b,2**(-t/4));near(p.a+p.b+p.decayed,1);assert.ok(p.a>=0&&p.b>=0)}near(m.tracer(4,0,4).b,0)})
test('tracer transfer and decay have distinct limiting behaviors',()=>{near(m.tracer(0,1,4).a,1);assert.ok(m.tracer(4,1,4).b>m.tracer(4,.1,4).b);near(m.tracer(4,1,4).total,.5)})
test('isotope and ion changes affect different ledgers',()=>{assert.deepEqual(m.isotopeLedger(2,1,1),{neutrons:1,charge:0});assert.deepEqual(m.isotopeLedger(2,1,0),{neutrons:1,charge:1});assert.deepEqual(m.isotopeLedger(3,1,1),{neutrons:2,charge:0})})
for(const [name,reaction]of[['nitrogen',m.nitrogenReaction],['fission',m.fissionReaction]] as const)test(`${name} reaction conserves nucleon count and charge`,()=>assert.deepEqual(m.ledger(reaction.incoming),m.ledger(reaction.outgoing)))
