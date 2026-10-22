/** SI unless a parameter names another unit. Models intentionally separate radiometry from display RGB. */
export const LIGHT_SPEED = 299792458
export const PLANCK = 6.62607015e-34
export const ELECTRON_VOLT = 1.602176634e-19
export const EPSILON_0 = 8.8541878128e-12
export function lightTravel(distanceKm:number){return {oneWay:distanceKm*1000/LIGHT_SPEED,roundTrip:2*distanceKm*1000/LIGHT_SPEED}}
export function lightBand(wavelengthNm:number){const wavelength=wavelengthNm*1e-9,frequency=LIGHT_SPEED/wavelength;return {frequency,energyEv:PLANCK*frequency/ELECTRON_VOLT}}
export function opticalBalance(reflected:number,absorbedOfRemainder:number){const absorbed=(1-reflected)*absorbedOfRemainder;return {reflected,absorbed,transmitted:1-reflected-absorbed}}
export function shadowWidths(sourceRadius:number,objectRadius:number,sourceToObject:number,objectToScreen:number){const magnification=1+objectToScreen/sourceToObject,spread=sourceRadius*objectToScreen/sourceToObject;return {outer:objectRadius*magnification+spread,umbra:Math.max(0,objectRadius*magnification-spread)}}
export function polarizer(angleDegrees:number,unpolarized=false){const transmitted=Math.cos(angleDegrees*Math.PI/180)**2*(unpolarized?.5:1);return Math.abs(transmitted)<1e-15?0:transmitted}
export function middlePolarizer(angleDegrees:number){return .5*polarizer(angleDegrees)*polarizer(90-angleDegrees)}
export function rayleighRatio(wavelengthNm:number,referenceNm=650){return (referenceNm/wavelengthNm)**4}
export function beamTransmission(opticalDepth:number){return Math.exp(-opticalDepth)}
export function planckShape(wavelengthNm:number,temperature:number){const lambda=wavelengthNm*1e-9;return 1/(lambda**5*Math.expm1(.01438776877/(lambda*temperature)))}
export function thermalPeak(temperature:number){return 2.897771955e6/temperature}
export function transitionPhoton(upperEv:number,lowerEv:number){const energyEv=upperEv-lowerEv;if(energyEv<=0)return null;return {energyEv,wavelengthNm:PLANCK*LIGHT_SPEED/(energyEv*ELECTRON_VOLT)*1e9}}
export function emBeam(power:number,area:number){const intensity=power/area,electricPeak=Math.sqrt(2*intensity/(EPSILON_0*LIGHT_SPEED));return {intensity,electricPeak,magneticPeak:electricPeak/LIGHT_SPEED}}
export const RGB_SELECTORS:readonly (readonly [number,number,number])[]=[[1,1,1],[1,0,0],[0,1,0],[0,0,1],[0,1,1],[1,0,1],[1,1,0]]
export const RGB_NAMES=['White','Red','Green','Blue','Cyan','Magenta','Yellow'] as const
export function filteredChannels(source:readonly number[],first:readonly number[],second:readonly number[]=[1,1,1]){return source.map((v,i)=>v*first[i]*second[i])}
