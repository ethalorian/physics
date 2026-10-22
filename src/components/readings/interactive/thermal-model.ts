/** SI internally unless an argument name explicitly identifies another unit. */
export const R = 8.31446261815324
export const SIGMA = 5.670374419e-8
export function scales(celsius:number){return {kelvin:celsius+273.15,fahrenheit:celsius*1.8+32}}
export function equilibrium(t1:number,c1:number,t2:number,c2:number){return (t1*c1+t2*c2)/(c1+c2)}
export function firstLaw(heatIn:number,workOut:number){return heatIn-workOut}
export function sensible(energy:number,mass:number,specificHeat:number){return energy/(mass*specificHeat)}
export function expansion(length:number,alpha:number,deltaT:number){return length*alpha*deltaT}
/** Fresh liquid water, approximate density kg/m³, 0–40°C at ordinary pressure. */
export function waterDensity(t:number){return 1000*(1-((t+288.9414)/(508929.2*(t+68.12963)))*(t-3.9863)**2)}
export function conduction(k:number,area:number,deltaT:number,length:number){return k*area*deltaT/length}
export function radiation(t:number,surroundings:number,emissivity:number,area=1){return emissivity*SIGMA*area*(t**4-surroundings**4)}
export function peakMicrometers(t:number){return 2897.771955/t}
export function cooling(initial:number,ambient:number,time:number,tau:number){return ambient+(initial-ambient)*Math.exp(-time/tau)}
/** One infrared-gray atmospheric layer, transparent to sunlight. */
export function greenhouse(absorbed:number,absorptivity:number){return (absorbed/(SIGMA*(1-absorptivity/2)))**.25}
/** Magnus approximation, saturation pressure in kPa over liquid water, 0–50°C. */
export function saturation(tC:number){return .61094*Math.exp(17.625*tC/(tC+243.04))}
/** Antoine approximation, water boiling temperature 1–100°C, pressure in kPa. */
export function boiling(pressureKPa:number){return 1730.63/(8.07131-Math.log10(pressureKPa*7.50061683))-233.426}
/** Energy kJ/kg relative to ice at 0°C; atmospheric-pressure ideal heating path. */
export function heatingCurve(q:number){if(q<334)return {temperature:0,phase:'Melting',fraction:q/334};if(q<752.4)return {temperature:(q-334)/4.184,phase:'Liquid warming',fraction:1};return {temperature:100,phase:'Vaporizing',fraction:Math.min(1,(q-752.4)/2256)}}
export function gasPressure(moles:number,t:number,volume:number){return moles*R*t/volume}
export function rmsSpeed(t:number,molarMass:number){return Math.sqrt(3*R*t/molarMass)}
export function gasProcess(ratio:number,adiabatic:boolean,t0=300,v0=.01,n=1,gamma=1.4){const t=adiabatic?t0*ratio**(1-gamma):t0;const work=adiabatic?n*R*(t0-t)/(gamma-1):n*R*t0*Math.log(ratio);return {t,p:gasPressure(n,t,v0*ratio),work,heat:adiabatic?0:work,deltaU:adiabatic?-work:0}}
export function entropyTransfer(q:number,hot:number,cold:number){return {hot:-q/hot,cold:q/cold,total:q/cold-q/hot}}
export function engine(hot:number,cold:number,fraction:number,heatIn=1000){const limit=1-cold/hot,efficiency=limit*fraction;return {limit,efficiency,work:heatIn*efficiency,rejected:heatIn*(1-efficiency)}}
export function heatPump(hot:number,cold:number,fraction:number,work=100){const copR=fraction*cold/(hot-cold);return {copR,copH:copR+1,cold:work*copR,hot:work*(copR+1),work}}
export function multiplicity(n:number,k:number){let count=1;for(let i=1;i<=k;i++)count=count*(n-i+1)/i;return Math.round(count)}
