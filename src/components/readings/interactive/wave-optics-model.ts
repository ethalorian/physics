const tau=2*Math.PI
export const radians=(degrees:number)=>degrees*Math.PI/180
export const degrees=(radians:number)=>radians*180/Math.PI
export function sinc(x:number){return Math.abs(x)<1e-8?1-x*x/6:Math.sin(x)/x}
export function twoBeam(amplitude2:number,phase:number){return Math.max(0,1+amplitude2**2+2*amplitude2*Math.cos(phase))}
export function slit(widthInWavelengths:number,angle:number){return sinc(Math.PI*widthInWavelengths*Math.sin(angle))**2}
export function firstSlitMinimum(widthInWavelengths:number){return widthInWavelengths<1?null:Math.asin(1/widthInWavelengths)}
export function doubleSlit(wavelength:number,separation:number,width:number,screenDistance:number,y:number){const angle=Math.atan2(y,screenDistance),phase=Math.PI*separation*Math.sin(angle)/wavelength;return slit(width/wavelength,angle)*Math.cos(phase)**2}
export function arrayFactor(count:number,spacingInWavelengths:number,angle:number){const beta=Math.PI*spacingInWavelengths*Math.sin(angle),denominator=Math.sin(beta);return Math.abs(denominator)<1e-10?1:(Math.sin(count*beta)/(count*denominator))**2}
export function gratingAngle(order:number,spacing:number,wavelength:number){const s=order*wavelength/spacing;return Math.abs(s)>1?null:Math.asin(s)}
/** Power series is used only for |x| <= 21 in the plotted Airy profiles. */
export function besselJ1(x:number){let term=x/2,sum=term;for(let k=1;k<70;k++){term*=-x*x/(4*k*(k+1));sum+=term;if(Math.abs(term)<1e-15)break;}return sum}
export function airy(rayleighUnits:number){const x=3.8317059702075125*Math.abs(rayleighUnits);return x<1e-8?1:(2*besselJ1(x)/x)**2}
export function rayleigh(wavelength:number,diameter:number){return 1.22*wavelength/diameter}
export function filmReflectance(wavelength:number,thickness:number,n0=1,n1=1.33,n2=1){const r01=(n0-n1)/(n0+n1),r12=(n1-n2)/(n1+n2),phase=2*tau*n1*thickness/wavelength,cross=2*r01*r12*Math.cos(phase);return Math.max(0,(r01*r01+r12*r12+cross)/(1+(r01*r12)**2+cross))}
export function gaussianBeam(wavelength:number,waist:number,z:number){const range=Math.PI*waist*waist/wavelength;return {range,divergence:wavelength/(Math.PI*waist),radius:waist*Math.sqrt(1+(z/range)**2)}}
export function hologramIntensity(x:number,depth:number,referenceAngle:number){const phase=tau*(Math.sqrt(depth*depth+x*x)-depth-x*Math.sin(referenceAngle));return (1+Math.cos(phase))/2}
export function phaseContrast(samplePhase:number,referenceBias:number){return {sample:(1+Math.cos(samplePhase+referenceBias))/2,background:(1+Math.cos(referenceBias))/2}}
export function brewster(n1:number,n2:number){const incident=Math.atan2(n2,n1);return {incident,transmitted:Math.PI/2-incident}}
export function crossedRotator(angle:number){return .5*Math.sin(angle)**2}
