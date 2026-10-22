export const rad=(degrees:number)=>degrees*Math.PI/180
export const deg=(radians:number)=>radians*180/Math.PI
export function refract(n1:number,n2:number,incidence:number){const s=n1/n2*Math.sin(rad(incidence));return {angle:s>1+1e-12?null:deg(Math.asin(Math.min(1,s))),critical:n1>n2?deg(Math.asin(n2/n1)):null}}
export function normalReflectance(n1:number,n2:number){return ((n1-n2)/(n1+n2))**2}
/** Positive object distance = real object; positive image distance = real image. Lens: opposite side; mirror: same side. */
export function thinImage(focal:number,object:number){const denominator=1/focal-1/object;if(Math.abs(denominator)<1e-12)return {image:null,magnification:null,real:null};const image=1/denominator;return {image,magnification:-image/object,real:image>0}}
export function lensPower(focalMeters:number){return 1/focalMeters}
export function prismDeviation(index:number,apexDegrees=60){const s=index*Math.sin(rad(apexDegrees/2));return s>1?null:2*deg(Math.asin(s))-apexDegrees}
export function primaryRainbow(index:number){if(index<1||index>2)return null;const incidence=Math.asin(Math.sqrt((4-index**2)/3)),refraction=Math.asin(Math.sin(incidence)/index),deviation=Math.PI+2*incidence-4*refraction;return {incidence:deg(incidence),refraction:deg(refraction),deviation:deg(deviation),radius:180-deg(deviation)}}
export function rainbowPath(index:number){const r=primaryRainbow(index)!;const i=rad(r.incidence),a=rad(r.refraction)-i,p1=[-Math.cos(i),Math.sin(i)],d=[Math.cos(a),Math.sin(a)],dot=p1[0]*d[0]+p1[1]*d[1],p2=[p1[0]-2*dot*d[0],p1[1]-2*dot*d[1]],projection=d[0]*p2[0]+d[1]*p2[1],back=[d[0]-2*projection*p2[0],d[1]-2*projection*p2[1]],length=-2*(p2[0]*back[0]+p2[1]*back[1]),p3=[p2[0]+length*back[0],p2[1]+length*back[1]];return {p1,p2,p3,out:[Math.cos(-rad(r.deviation)),Math.sin(-rad(r.deviation))],...r}}
export function microscope(separation:number){const objective=thinImage(1,1.1),object2=separation-objective.image!,eyepiece=thinImage(4,object2);return {objective,object2,eyepiece,total:eyepiece.magnification===null?null:objective.magnification!*eyepiece.magnification}}
export function telescope(objectiveF:number,eyepieceF:number,diameterMeters:number,wavelength=550e-9){return {magnification:-objectiveF/eyepieceF,separation:objectiveF+eyepieceF,area:Math.PI*(diameterMeters/2)**2,resolution:1.22*wavelength/diameterMeters}}
export function eyePower(objectMeters:number|null,retinaMeters=.02){return 1/retinaMeters+(objectMeters===null?0:1/objectMeters)}
