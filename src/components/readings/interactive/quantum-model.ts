/** SI unless a function name or parameter explicitly states eV, nm, pm, or keV. */
export const H=6.62607015e-34, C=299792458, EV=1.602176634e-19, ME=9.1093837139e-31, HBAR=H/(2*Math.PI)
export const HC_EV_NM=H*C/EV*1e9, ELECTRON_REST_EV=ME*C*C/EV, COMPTON_PM=H/(ME*C)*1e12, MU_B_EV=5.7883817982e-5
function positive(x:number){if(!Number.isFinite(x)||x<=0)throw new RangeError('Expected a positive finite quantity');return x}
function nonnegative(x:number){if(!Number.isFinite(x)||x<0)throw new RangeError('Expected a nonnegative finite quantity');return x}
function integer(x:number,min=0){if(!Number.isInteger(x)||x<min)throw new RangeError('Invalid quantum integer');return x}
export const photonEV=(nm:number)=>HC_EV_NM/positive(nm)
export const photonRate=(watts:number,nm:number)=>nonnegative(watts)/(photonEV(nm)*EV)
export const excitationStep=(frequencyTHz:number,n:number)=>H*positive(frequencyTHz)*1e12*integer(n)/EV
export function photoelectric(nm:number,workEV:number,rate:number){const energy=photonEV(nm),work=positive(workEV),excess=energy-work;nonnegative(rate);return{energy,thresholdNm:HC_EV_NM/work,emits:excess>0,kineticEV:Math.max(0,excess),stoppingV:Math.max(0,excess),idealRate:excess>0?rate:0}}
export function compton(pm:number,angleDeg:number){positive(pm);if(angleDeg<0||angleDeg>180||!Number.isFinite(angleDeg))throw new RangeError('Angle outside 0–180 degrees');const a=angleDeg*Math.PI/180,shift=COMPTON_PM*(1-Math.cos(a)),outPM=pm+shift,incidentEV=photonEV(pm/1000),scatteredEV=photonEV(outPM/1000),px=incidentEV-scatteredEV*Math.cos(a),py=-scatteredEV*Math.sin(a),electronKE=incidentEV-scatteredEV;return{shift,outPM,incidentEV,scatteredEV,px,py,electronKE,recoilTotalEV:Math.hypot(ELECTRON_REST_EV,px,py)}}
export const lightForce=(watts:number,reflecting:boolean)=>nonnegative(watts)*(reflecting?2:1)/C
export function electronFromEV(k:number){positive(k);const pc=Math.sqrt(k*(k+2*ELECTRON_REST_EV)),classicalPC=Math.sqrt(2*ELECTRON_REST_EV*k);return{nm:HC_EV_NM/pc,classicalNm:HC_EV_NM/classicalPC,beta:pc/(k+ELECTRON_REST_EV),momentum:pc*EV/C}}
export function braggAngle(nm:number,spacingNM:number,order=1){positive(nm);positive(spacingNM);integer(order,1);const sine=order*nm/(2*spacingNM);return sine>1?null:Math.asin(sine)*180/Math.PI}
export function sameWavelength(nm:number){const photon=photonEV(nm),total=Math.hypot(ELECTRON_REST_EV,photon),kinetic=photon*photon/(total+ELECTRON_REST_EV);return{photonEV:photon,momentum:photon*EV/C,electronKE:kinetic,classicalKE:photon*photon/(2*ELECTRON_REST_EV),beta:photon/total}}
export function interference(visibility:number,bins=101){if(visibility<0||visibility>1)throw new RangeError('Visibility outside 0–1');integer(bins,3);const raw=Array.from({length:bins},(_,i)=>{const x=-4+8*i/(bins-1);return Math.exp(-x*x/4)*(1+visibility*Math.cos(2*Math.PI*x))});const sum=raw.reduce((a,b)=>a+b,0);return raw.map(x=>x/sum)}
export function detections(probabilities:number[],count:number){integer(count);const sum=probabilities.reduce((a,b)=>a+b,0);if(Math.abs(sum-1)>1e-10||probabilities.some(p=>!Number.isFinite(p)||p<0))throw new RangeError('Probabilities must normalize');let seed=173;const cdf:number[]=[];probabilities.reduce((a,p,i)=>(cdf[i]=a+p),0);return Array.from({length:count},()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;const u=seed/4294967296;return Math.max(0,cdf.findIndex(p=>u<p))})}
export function minimumPacket(sigmaNM:number){const sx=positive(sigmaNM)*1e-9,sp=HBAR/(2*sx);return{sx,sp,velocitySpread:sp/ME,product:sx*sp}}
export const gaussianDensity=(x:number,sigma:number)=>Math.exp(-.5*(x/positive(sigma))**2)/(sigma*Math.sqrt(2*Math.PI))
export const lifetimeWidth=(nanoseconds:number)=>HBAR/(positive(nanoseconds)*1e-9)/EV
export const diffusionRMS=(D:number,time:number)=>Math.sqrt(2*positive(D)*nonnegative(time))
export function walk(steps:number){integer(steps);let seed=137,x=0;return[0,...Array.from({length:steps},()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;x+=seed/4294967296<.5?-1:1;return x})]}
export function rutherfordAngle(impactFM:number,energyMeV=5,Z=79){nonnegative(impactFM);positive(energyMeV);integer(Z,1);return 2*Math.atan2(1.43996455*2*Z,2*energyMeV*impactFM)*180/Math.PI}
export const oilDropCharge=(effectiveWeight:number,field:number)=>positive(effectiveWeight)/positive(field)
export const chargeMassRatio=(speed:number,field:number,radius:number)=>positive(speed)/(positive(field)*positive(radius))
export function hydrogenLevel(n:number,Z=1){integer(n,1);integer(Z,1);return-13.6*Z*Z/(n*n)}
export function transition(upper:number,lower:number,Z=1){if(upper<=lower)throw new RangeError('Upper n must exceed lower n');const energy=hydrogenLevel(upper,Z)-hydrogenLevel(lower,Z);return{energy,nm:HC_EV_NM/energy,series:lower===1?'Lyman':lower===2?'Balmer':lower===3?'Paschen':'Higher series'}}
export const xrayEndpoint=(kv:number)=>({keV:positive(kv),nm:HC_EV_NM/(kv*1000),lines:kv>20?[17,19]:[]})
/** Schematic target model; not a measured spectrum or emission probability. */
export function xrayShape(kev:number,kv:number){positive(kv);return kev>0&&kev<kv?4*(kev/kv)*(1-kev/kv):0}
export function twoLevelGain(upperFraction:number){if(!Number.isFinite(upperFraction)||upperFraction<0||upperFraction>1)throw new RangeError('Population outside 0–1');return 2*upperFraction-1}
export function boxEnergy(n:number,widthNM:number){integer(n,1);const L=positive(widthNM)*1e-9;return n*n*H*H/(8*ME*L*L)/EV}
export function boxDensity(fraction:number,n:number,widthNM:number){integer(n,1);positive(widthNM);return fraction<0||fraction>1?0:2/widthNM*Math.sin(n*Math.PI*fraction)**2}
export const zeemanShifts=(field:number)=>{nonnegative(field);return[-1,0,1].map(m=>MU_B_EV*field*m)}
export function orbitalState(n:number,l:number,m:number){integer(n,1);integer(l);if(l>=n||!Number.isInteger(m)||Math.abs(m)>l)throw new RangeError('Invalid atomic labels');const L=Math.sqrt(l*(l+1));return{L,Lz:m,angle:L?Math.acos(m/L)*180/Math.PI:null,projections:Array.from({length:2*l+1},(_,i)=>i-l),subshellCapacity:2*(2*l+1),shellCapacity:2*n*n}}
export function firstTwenty(Z:number){integer(Z,1);if(Z>20)throw new RangeError('Limited to the first twenty neutral elements');let left=Z;return([['1s',2],['2s',2],['2p',6],['3s',2],['3p',6],['4s',2]] as const).map(([name,capacity])=>{const count=Math.min(left,capacity);left-=count;return{name,count,capacity}}).filter(s=>s.count>0)}
