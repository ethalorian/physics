import assert from 'node:assert/strict'
import test from 'node:test'
import * as m from './frontier-model'
const near=(a:number,b:number,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} ≈ ${b}`)
test('Yukawa pion range is about 1.4 fm and scales inversely with mass',()=>{near(m.yukawaScale(140),1.4094784314285715);near(m.yukawaScale(200),m.yukawaScale(100)/2);assert.equal(m.yukawaScale(0),Infinity)})
for(const mass of[50,140,500])test(`Yukawa factor at one range is 1/e for ${mass} MeV`,()=>{near(m.yukawaFactor(m.yukawaScale(mass),mass),1/Math.E);near(m.yukawaFactor(0,mass),1);assert.ok(m.yukawaFactor(6,mass)>0)})
test('both collision configurations reduce to two rest energies with stationary inputs',()=>{near(m.collisionEnergy(0,1).fixed,2);near(m.collisionEnergy(0,1).collider,2)})
test('fixed-target invariant energy includes target recoil rather than summing lab energies',()=>{const p=m.collisionEnergy(3,1);near(p.collider,8);near(p.fixed,Math.sqrt(10));assert.ok(p.fixed<p.E+1)})
test('collider advantage grows at high projectile energy with explicitly unequal machine budgets',()=>{const a=m.collisionEnergy(1,1),b=m.collisionEnergy(10,1);assert.ok(b.collider/b.fixed>a.collider/a.fixed)})
for(const channel of m.decayChannels)test(`${channel.name} decay conserves charge, baryon number, and total lepton number`,()=>{assert.deepEqual(m.particleLedger(channel.incoming),m.particleLedger(channel.outgoing))})
test('omitting the antineutrino breaks the neutron-decay lepton ledger',()=>{const d=m.decayChannels[0];assert.notEqual(m.particleLedger(d.incoming).L,m.particleLedger(d.outgoing.slice(0,-1)).L)})
for(const [i,Q,B]of[[0,1,1],[1,0,1],[2,1,0],[3,-1,1],[4,-1,-1]])test(`${m.hadrons[i].name} has the known valence charge and baryon number`,()=>{const p=m.quarkLedger(m.hadrons[i].quarks);near(p.Q,Q);near(p.B,B)})
test('cosmic wavelength and scale-factor ratios imply zero or positive cosmological redshift',()=>{near(m.redshift(1),0);near(m.redshift(2),1);near(m.redshift(1.5),.5)})
for(const beta of[.2,.8,2])test(`both point-lens images satisfy the lens equation at offset ${beta}`,()=>{const p=m.lensImages(beta);for(const theta of[p.plus,p.minus])near(theta-1/theta,beta);near(p.plus*p.minus,-1);assert.ok(p.minus<0&&p.plus>0)})
test('solar-mass Schwarzschild radius is approximately 2.95 km and linear in mass',()=>{assert.ok(m.schwarzschildKm(1)>2.95&&m.schwarzschildKm(1)<2.96);near(m.schwarzschildKm(10),10*m.schwarzschildKm(1))})
test('every displayed mechanical mode has fixed endpoints and the expected nodes',()=>{for(let n=1;n<=5;n++)for(let k=0;k<=n;k++)near(m.mechanicalMode(n,k/n),0)})
test('circular speeds close the enclosed-mass account and zero halo recovers visible matter',()=>{for(const r of[.2,1,5,8])for(const h of[0,.6,1]){const p=m.rotation(r,h);near(p.total**2*r,p.mass);assert.ok(p.total>=p.visible);if(h===0)near(p.total,p.visible)}})
test('compact luminous mass gives declining outer speed while extended halo flattens it',()=>{const a=m.rotation(100,1),b=m.rotation(1000,1);assert.ok(b.visible<a.visible);assert.ok(Math.abs(b.total-1)<.001);assert.ok(b.total/b.visible>10)})
test('ideal superconducting branch depends on reduced temperature with an explicit boundary convention',()=>{for(const r of[0,.5,.999])near(m.idealResistivity(r),0);near(m.idealResistivity(1),1);near(m.idealResistivity(2.5),2.125)})
