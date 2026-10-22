import assert from 'node:assert/strict'
import test from 'node:test'
import * as m from './thermal-model'
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`)
test('absolute scales retain offsets while temperature intervals agree',()=>{close(m.scales(-273.15).kelvin,0);close(m.scales(100).fahrenheit,212);close(m.scales(30).kelvin-m.scales(20).kelvin,10)})
test('thermal contact conserves sensible energy for unequal heat capacities',()=>{const t=m.equilibrium(80,4,20,1);close(4*(t-80)+(t-20),0);assert(t>20&&t<80)})
test('first law includes heat loss and compression signs',()=>{close(m.firstLaw(-30,-80),50);close(m.firstLaw(0,100),-100)})
test('heat capacity and expansion use mass and original length',()=>{close(m.sensible(4184,.5,4184),2);close(m.expansion(10,12e-6,50),.006);close(m.sensible(4184,1,4184),1)})
test('liquid water has a density maximum near four degrees',()=>{assert(m.waterDensity(4)>m.waterDensity(0));assert(m.waterDensity(4)>m.waterDensity(20));close(m.waterDensity(3.9863),1000)})
test('conduction and radiative exchange vanish at equal temperatures and reverse with gradient',()=>{close(m.conduction(.5,2,20,.1),200);close(m.radiation(300,300,.8),0);close(m.radiation(400,300,.8),-m.radiation(300,400,.8));close(m.peakMicrometers(600),m.peakMicrometers(300)/2)})
test('cooling approaches ambient from either side without overshooting',()=>{for(const start of [0,80])for(const t of [0,1,10,100]){const v=m.cooling(start,20,t,5);assert(v>=Math.min(start,20)&&v<=Math.max(start,20))}close(m.cooling(80,20,5,5)-20,60/Math.E)})
test('gray atmospheric model closes top-of-atmosphere balance',()=>{for(const e of [0,.5,1]){const t=m.greenhouse(240,e);close(m.SIGMA*t**4*(1-e/2),240)}assert(m.greenhouse(240,1)>m.greenhouse(240,0))})
test('saturation and boiling approximations cover the displayed range',()=>{assert(m.saturation(30)>m.saturation(20));assert(Math.abs(m.boiling(101.325)-100)<.05);assert(m.boiling(50)<m.boiling(100))})
test('phase plateaus use energy to change phase fraction',()=>{close(m.heatingCurve(167).fraction,.5);close(m.heatingCurve(543.2).temperature,50);close(m.heatingCurve(1880.4).fraction,.5);close(m.heatingCurve(3008.4).fraction,1)})
test('gas pressure and kinetic speed respect proportional limits',()=>{close(m.gasPressure(1,600,.01),2*m.gasPressure(1,300,.01));close(m.rmsSpeed(600,.028)/m.rmsSpeed(300,.028),Math.SQRT2);close(m.rmsSpeed(300,.112)/m.rmsSpeed(300,.028),.5)})
test('isothermal and reversible adiabatic paths conserve energy and satisfy state relations',()=>{for(const r of [.5,1,2])for(const ad of [false,true]){const p=m.gasProcess(r,ad);close(p.deltaU,p.heat-p.work);close(p.p*.01*r,m.R*p.t);if(ad)close(p.t*r**.4,300);else close(p.deltaU,0)}})
test('reservoir entropy increases and reversible engine cancels it',()=>{assert(m.entropyTransfer(100,500,250).total>0);close(m.entropyTransfer(100,300,300).total,0);const e=m.engine(600,300,1);close(e.work+e.rejected,1000);close(e.rejected/300-1000/600,0);assert(m.engine(600,300,.6).efficiency<.5)})
test('heat pump COP above one preserves energy and second-law bound',()=>{for(const f of [.3,.6,1]){const p=m.heatPump(300,270,f);close(p.hot,p.cold+p.work);close(p.copH,p.copR+1);assert(p.hot/300-p.cold/270>=-1e-10)}})
test('microstate counts normalize and favor balanced populations',()=>{for(let n=2;n<=16;n++){close(Array.from({length:n+1},(_,k)=>m.multiplicity(n,k)).reduce((a,b)=>a+b,0),2**n);assert(m.multiplicity(n,Math.floor(n/2))>m.multiplicity(n,0))}})
