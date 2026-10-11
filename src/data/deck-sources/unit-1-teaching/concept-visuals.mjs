// Shared scientific diagrams: coordinates encode the stated example.
// Scene illustrations are generated artwork; all numbers/labels stay editable.
import {esc,shell,svg,text,line,poly} from './visuals.mjs';

export const scene=(kind,title,caption)=>shell(title,`<img class="concept-scene" src="./art/${kind==='ramp'?'block-ramp':'crate-pull'}.png" alt="${kind==='ramp'?'A block in contact with a ramp that rises to the right.':'A crate on a level table with a horizontal rope attached on its right.'}">`,caption);

export function dots(title,positions,caption,{times=true}={}){
  const lo=Math.min(0,...positions),hi=Math.max(1,...positions),X=x=>65+(x-lo)/(hi-lo)*490;
  let body=line(55,224,565,224,'class="v-axis"');
  positions.forEach((x,i)=>{
    body+=`<circle cx="${X(x)}" cy="190" r="12" fill="#4b4ba8"/>`+text(X(x),155,times?`${i} s`:`${i+1}`,'text-anchor="middle"')+text(X(x),260,`${x} m`,'text-anchor="middle"');
  });
  const pts=positions.map(x=>[X(x),190]);
  body+=poly(pts,'class="v-trace" fill="none" stroke="#4b4ba8" stroke-width="3"')+`<circle class="v-cursor" cx="${pts.at(-1)[0]}" cy="190" r="18" fill="none" stroke="#b94730" stroke-width="3" data-points="${esc(JSON.stringify(pts))}"/>`;
  body+=text(310,330,'One dot at each equal time interval','text-anchor="middle" class="axis-name"');
  return shell(title,svg(body,title+'. '+caption),caption);
}

export function bars(title,items,caption,unit=''){
  const max=Math.max(...items.map(x=>x[1]),1),start=170;
  let body='';
  items.forEach(([label,value],i)=>{
    const y=75+i*85;
    body+=text(152,y+7,label,'text-anchor="end"')+line(start,y,start+310*value/max,y,`class="v-trace" stroke="${i%2?'#28755a':'#4b4ba8'}" stroke-width="24"`)+text(start+310*value/max+16,y+7,`${value} ${unit}`);
  });
  return shell(title,svg(body,title+'. '+items.map(x=>x.join(': ')).join('; ')+'. '+caption),caption);
}

export function pair(title,caption){
  const body=`<circle cx="160" cy="182" r="40" fill="#e1e1f5"/><circle cx="465" cy="182" r="40" fill="#d6e9e0"/>`+
    text(160,190,'A','text-anchor="middle"')+text(465,190,'B','text-anchor="middle"')+
    line(160,182,55,182,'class="v-trace" stroke="#4b4ba8" stroke-width="5"')+poly([[70,173],[55,182],[70,191]],'stroke="#4b4ba8" stroke-width="4" fill="none"')+
    line(465,182,570,182,'class="v-trace" stroke="#28755a" stroke-width="5"')+poly([[555,173],[570,182],[555,191]],'stroke="#28755a" stroke-width="4" fill="none"')+
    text(160,105,'B pushes A left','text-anchor="middle"')+text(465,105,'A pushes B right','text-anchor="middle"')+
    text(310,285,'Equal force sizes • opposite directions','text-anchor="middle"')+text(310,325,'One force on each object','text-anchor="middle" class="axis-name"');
  return shell(title,svg(body,title+'. '+caption),caption);
}

export function rampForces(title,caption){
  // Qualitative FBD of a block at rest on a slope rising 25 degrees to the right.
  // N and static friction together balance the vertical weight.
  const cx=310,cy=183,w=145,a=25*Math.PI/180;
  const arrows=[[-w*Math.cos(a)*Math.sin(a),-w*Math.cos(a)**2,'Normal',-35,-14],
    [w*Math.sin(a)*Math.cos(a),-w*Math.sin(a)**2,'Friction',56,-7],[0,w,'Weight',65,0]];
  let body=line(75,270,545,51,'class="v-grid"')+`<circle cx="${cx}" cy="${cy}" r="12" fill="#22233a"/>`;
  arrows.forEach(([dx,dy,label,lx,ly],i)=>{const x=cx+dx,y=cy+dy,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,color=['#4b4ba8','#b94730','#28755a'][i];body+=line(cx,cy,x,y,`class="v-trace" stroke="${color}" stroke-width="5"`)+poly([[x-ux*14-uy*7,y-uy*14+ux*7],[x,y],[x-ux*14+uy*7,y-uy*14-ux*7]],`fill="none" stroke="${color}" stroke-width="4"`)+text(x+lx,y+ly,label,'text-anchor="middle"');});
  return shell(title,svg(body,title+'. '+caption),caption);
}

export function range(title,low,high,caption,{label='Position (m)',center=(low+high)/2,domain=[low-2,high+2]}={}){
  const X=x=>65+(x-domain[0])/(domain[1]-domain[0])*490;
  let body=line(65,230,555,230,'class="v-axis"')+line(X(low),210,X(high),210,'class="v-trace" stroke="#4b4ba8" stroke-width="18"');
  for(const [v,t]of [[low,'Lower'],[center,'Central'],[high,'Upper']])body+=line(X(v),200,X(v),240,'class="v-axis"')+text(X(v),165,t,'text-anchor="middle"')+text(X(v),278,v,'text-anchor="middle"');
  body+=text(310,343,label,'text-anchor="middle" class="axis-name"');
  return shell(title,svg(body,title+'. '+caption),caption);
}
