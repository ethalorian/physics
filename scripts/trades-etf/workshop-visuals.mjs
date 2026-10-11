// Native, dimension-aware classroom drawings. The reference sheets remain authoritative.
export const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C={ink:'#183c44',teal:'#137e83',mint:'#c9e6dd',pale:'#eef6f1',gold:'#e5ac48',orange:'#bc562d',paper:'#fffdf7',muted:'#587378',blue:'#427eac'};
const rect=(x,y,w,h,fill=C.mint,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${C.ink}" stroke-width="3" ${extra}/>`;
const line=(x1,y1,x2,y2,color=C.ink,width=3,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const poly=(points,fill=C.mint,extra='')=>`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${C.ink}" ${extra.includes('stroke-width')?'':'stroke-width="3"'} stroke-linejoin="round" ${extra}/>`;
const text=(x,y,value,size=24,color=C.ink,anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="600">${esc(value)}</text>`;
const circ=(x,y,r,fill=C.gold)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>`;
const arrow=(x1,y1,x2,y2,color=C.orange)=>line(x1,y1,x2,y2,color,5,'marker-end="url(#arrow)"');
const dash=(x1,y1,x2,y2)=>line(x1,y1,x2,y2,C.teal,2,'stroke-dasharray="8 7"');
const dim=(x1,y,x2,label)=>line(x1,y,x2,y,C.muted,2)+line(x1,y-7,x1,y+7,C.muted,2)+line(x2,y-7,x2,y+7,C.muted,2)+text((x1+x2)/2,y-12,label,23,C.ink,'middle');
const note=(a,b)=>text(30,435,a,23)+ (b?text(30,466,b,20,C.muted):'');
const card=(x,y,w,h,label,fill=C.mint)=>rect(x,y,w,h,fill)+text(x+w/2,y+h/2+8,label,25,C.ink,'middle');
const badge=(x,y,n)=>circ(x,y,20,C.ink)+text(x,y+7,n,21,'#fff','middle');
export function svg(body,label){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 490" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.orange}"/></marker></defs><rect width="840" height="490" rx="16" fill="${C.paper}"/><g font-family="Arial,Helvetica,sans-serif">${body}</g></svg>`;}

function tray(mode){
 if(mode==='parts')return card(55,95,310,225,'B · 8 × 6 in',C.pale)+card(420,60,340,64,'F · 8 × 2 in')+card(420,146,340,64,'R · 8 × 2 in')+['E1','E2','D1','D2'].map((s,i)=>card(420+i%2*178,248+Math.floor(i/2)*75,156,56,s,i<2?C.mint:C.gold)).join('')+text(55,62,'1 base',26)+text(420,30,'2 long walls',26)+text(420,238,'4 short-wall blanks',23)+note('Seven parts. Two internal dividers make three bays.','Cut short walls as 6 × 2-in blanks; fit their length to the actual gap.');
 if(mode==='layout'||mode==='fit'){
  const x=122,y=87,s=67.5,t=s/8,w=8*s,h=4*s;
  let b=rect(x,y,w,h,C.pale)+rect(x,y,w,t)+rect(x,y+h-t,w,t);
  if(mode==='layout'){
   for(const p of [0,2.625,5.25,7.875])b+=rect(x+p*s,y+t,t,h-2*t,p>0&&p<7?C.gold:C.mint);
   for(const [i,l]of ['ERASERS','BINDER CLIPS','PAPER CLIPS'].entries())b+=text(x+88+i*177,y+145,l,18,C.ink,'middle');
   b+=dim(x,47,x+w,'8 in outside')+text(105,394,'A',24)+text(277,394,'2⅝',24)+text(454,394,'5¼ in',24)+[0,2.625,5.25].map(p=>dash(x+p*s,y+h,x+p*s,368)).join('')+note('Locate each divider’s LEFT face from datum A.','Top view • depth compressed for clarity • two dividers highlighted in gold.');
  }else b+=line(480,y+t+8,480,y+h-t-8,C.orange,5)+text(160,215,'Measure the gap',28)+text(160,249,'between inside faces.',23)+text(530,207,'Fitted',24)+text(530,239,'length',24)+note('Do not force a 6-in blank between the long walls.','At ⅛-in stock: 6 − ⅛ − ⅛ = 5¾ in. Use your actual gap.');
  return b;
 }
 const P=(x,y,z)=>[92+x*63+y*24,340-y*28-z*48];
 const wall=(a,b,z,fill)=>poly([P(...a,0),P(...b,0),P(...b,z),P(...a,z)],fill);
 let b=poly([P(0,0,0),P(8,0,0),P(8,6,0),P(0,6,0)],C.pale);
 b+=wall([0,6],[8,6],2,C.mint);
 if(mode!=='base')b+=wall([8,0],[8,6],2,C.mint);
 for(const x of mode==='base'?[]:[2.625,5.25])b+=wall([x,0],[x,6],2,C.gold);
 if(mode!=='base')b+=wall([0,0],[0,6],2,C.mint);
 b+=wall([0,0],[8,0],2,C.mint);
 b+=text(220,374,'F · one continuous front wall',23)+text(390,55,'R · rear wall',23)+line(487,66,487,77);
 if(mode==='base')b+=text(206,203,'B · base',27)+note('Start with the base and the two long walls.','Stand F and R on top of B, with their outside faces flush to its edges.');
 else if(mode==='brace')b+=poly([P(0,0,0),P(.8,0,0),P(.8,0,1.1),P(0,0,1.1)],C.orange)+poly([P(0,0,0),P(0,.8,0),P(0,.8,1.1),P(0,0,1.1)],C.orange)+note('A folded bracket connects the two walls at each corner.','Four 2 × 2-in squares • fold at 1 in • check that supplies still fit.');
 else b+=text(80,55,'OPEN TOP',23,C.teal)+note(mode==='test'?'One bay for each supply. Try three retrievals per type.':'Fit the end walls, then add the two dividers.','Gold = internal dividers • teal = outside walls • schematic thickness.');
 return b;
}
function stand(mode){
 if(mode==='layout'||mode==='parts'){
  const x=55,s=68;let b='';for(const [a,w,label,col]of [[0,3,'F · 3 in',C.mint],[3,3,'R · 3 in',C.mint],[6,4,'B · 4 in',C.pale],[10,.5,'',C.gold]])b+=rect(x+a*s,112,w*s,183,col)+text(x+(a+w/2)*s,210,label,27,C.ink,'middle');
  b+=dim(x, 70,x+10.5*s,'10½ in overall');for(const n of [0,3,6,10,10.5])b+=dash(x+n*s,102,x+n*s,325)+(n===10.5?line(x+n*s,325,789,338)+text(811,350,'10½',22,C.ink,'end'):text(x+n*s,350,n,22,C.ink,'middle'));
  return b+text(55,380,'A = start here',24)+text(659,380,'½-in tab',22)+note('Measure every fold from the SAME edge A.','Solid outline = cut • dashed lines = folds • blank width = 4 in.');
 }
 let b=poly([[210,343],[410,119],[610,343]],C.pale)+line(210,343,410,119,C.teal,8)+line(410,119,610,343,C.teal,8)+line(210,343,610,343,C.ink,9)+text(275,211,'F',29)+text(524,211,'R',29)+text(412,374,'B · 4 in',25,C.ink,'middle')+text(422,70,'SIDE VIEW',23,C.teal,'middle');
 if(mode==='joint') b+=line(211,337,243,302,C.gold,15)+arrow(103,253,214,316)+text(38,221,'Tab inside F',25)+note('Close the triangle. Overlap the ½-in tab inside F.','The tab forms a joint; it does not add a fourth side.');
 else {
  b+=poly([[191,333],[377,105],[387,113],[201,342]],C.blue)+line(155,344,211,344,C.orange,9)+line(211,344,230,322,C.orange,9)+text(490,106,'3 × 5-in card',25)+line(489,119,390,153)+text(55,314,'Lip',24,C.orange)+arrow(85,324,167,342);
  b+=note(mode==='test'?'Hands off for 10 seconds. Repeat three times per lip.':'Rest the card’s BOTTOM edge on the lip.','Compare a ½-in shelf with a 1-in shelf. Keep the same stand and card.');
 }
 return b;
}
function template(mode){
 let b=rect(127,73,560,295,C.pale);const revised=mode==='compare',dx=revised?66:50,dy=42;
 for(const x of [127+dx,687-dx]){b+=dash(x,65,x,385);for(const y of [73+dy,368-dy])b+=line(x-13,y,x+13,y,C.orange,4)+line(x,y-13,x,y+13,C.orange,4);}
 for(const y of [73+dy,368-dy])b+=dash(115,y,701,y);
 b+=dim(127, 40,687,'8½ in overall')+text(711,229,'5¼ in',24)+circ(127,368,7,C.ink)+text(75,394,'(0,0)',23)+text(265,219,revised?'REVISION B':'FOUR CENTER MARKS',27)+text(265,255,revised?'x-offset = 1 in':'x- and y-offset = ¾ in',23);
 return b+note('Place every center from the lower-left datum.','Crosses show centers—not holes to cut. Keep the first attempt visible.');
}
function tower(mode){
 if(mode==='parts'||mode==='layout')return [0,1].map(i=>card(85+i*375,95,215,270,'11 in',C.pale)+[1,2,3].map(n=>dash(85+i*375+n*65,95,85+i*375+n*65,365)).join('')).join('')+text(90, 60,'COLUMN 1',25)+text(465, 60,'COLUMN 2',25)+note('Each blank: three 2-in faces + one ½-in joining tab.','Fold lengthwise at 2, 4 and 6 in; join each blank into a triangular tube.');
 const post=(x)=>poly([[x,354],[x+80,354],[x+42,325],[x+42,120],[x,144]],C.mint)+poly([[x+80,354],[x+42,325],[x+42,120],[x+80,144]],'#8db9b0');
 let b=post(190)+post(510)+poly([[155,144],[580,144],[653,86],[229,86]],C.gold)+rect(356,52,94,48,C.paper)+text(325,29,'Load at center',24);
 if(mode==='compare'||mode==='test')b+=rect(183,337,408,24,C.orange)+text(330,399,'Base ties resist spreading',24);
 return b+note('Add one clip every 5 seconds. Stop at failure or 10 clips.','Same cup, position and platform • held 10 = test cap, not maximum strength.');
}
function beam(mode){
 let b='';if(mode==='parts'||mode==='layout'||mode==='compare'){
  b+=line(65,175,240,175,C.teal,10)+line(330,118,420,213,C.teal,6)+line(420,213,510,118,C.teal,6)+line(605,115,605,212,C.teal,6)+line(605,212,775,212,C.teal,6)+line(775,212,775,115,C.teal,6);
  b+=text(150,270,'A · FLAT',26,C.ink,'middle')+text(420,270,'B · V',26,C.ink,'middle')+text(690,270,'C · U',26,C.ink,'middle')+text(420,330,'Same 10 × 3-in blank',27,C.teal,'middle');
 }else b+=rect(70,256,125,119,C.mint)+rect(640,256,125,119,C.mint)+line(140,244,695,244,C.teal,9)+rect(363,166,114,68,C.gold)+arrow(420,69,420,154)+dash(195,250,195,350)+dash(640,250,640,350)+dim(195,345,640,'8-in clear gap')+text(267,393,'1-in bearing at each end',25);
 return b+note('Predict which shape will deflect least. Then measure.','Same cup + 5 clips • same midpoint • two trials per shape.');
}
function building(mode){
 if(mode==='parts')return card(55,128,285,208,'Base · 8 × 6')+card(390,66,354,88,'N/S · 8 × 4')+card(390,193,280,88,'E/W · 6 × 4')+text(421,329,'Trim E/W to fit',25)+note('All dimensions in inches. Two of each wall.','Mark the door before assembly. Leave its left jamb attached as the hinge.');
 if(mode==='assembly'||mode==='roof'){
  let b=poly([[85,335],[570,335],[740,204],[255,204]],C.pale)+poly([[255,204],[740,204],[740,81],[255,81]],C.mint)+poly([[570,335],[740,204],[740,81],[570,212]],'#8db9b0')+poly([[85,335],[255,204],[255,81],[85,212]],C.mint);
  b+=poly([[85,335],[153,335],[153,233],[243,233],[243,335],[570,335],[570,212],[85,212]],C.mint)+poly([[153,335],[205,298],[205,196],[153,233]],C.gold)+text(252,385,'Door swings inward at least 90°',25);
  if(mode==='roof')b+=poly([[112,177],[597,177],[767,46],[282,46]],C.pale)+arrow(486,185,486,258)+text(48,39,'Removable 8 × 6-in roof',26);
  return b+note('Keep the opening free. Check furniture and door clearance.','The floor plan and wall elevation must describe the same room.');
 }
 let b=rect(110,80,520,286,C.pale)+rect(172,103,130,65,C.mint)+rect(367,103,130,65,C.mint)+text(237,144,'TABLE',20,C.ink,'middle')+text(432,144,'TABLE',20,C.ink,'middle')+line(175,366,273,366,C.paper,8)+line(175,366,175,268,C.gold,7)+`<path d="M 273 366 A 98 98 0 0 0 175 268" fill="none" stroke="${C.gold}" stroke-width="3" stroke-dasharray="7 6"/>`+circ(239,299,14,C.blue)+arrow(240,282,328,220)+text(689,208,'N',28)+arrow(700,187,700,128)+dim(110,47,630,'8 in = 16 ft')+text(654,328,'6 in',26)+text(78,397,'SW datum',23)+note('Can the person token reach both tables?','Plan view • scale ½ in = 1 ft • door: x = 1 to 2½ in on south wall.');
 return b;
}
function frame(mode){
 const skew=mode==='test';let b=rect(68,115,65,270,'#d9ded8')+text(37, 90,'FIX LEFT',22)+poly([[145,350],[145,116],[643,skew?200:116],[643,skew?395:350]],'none','stroke-width="12"');
 if(mode==='compare'||mode==='assembly'||mode==='layout')b+=line(145,350,643,116,C.orange,10)+text(360,305,'10-in diagonal',26,C.orange);
 for(const [x,y]of [[145,350],[145,116],[643,skew?200:116],[643,skew?395:350]])b+=circ(x,y,8,C.ink);
 b+=line(643,skew?200:116,705,skew?200:116,C.ink,2)+line(705,skew?200:116,705,290,C.ink,2)+rect(676,290,58,49,C.gold)+text(261, 60,'8 in between joint centers',24)+text(50,400,'6 in high',23);
 return b+note('Same load. Same restraint. Measure the top-right joint.','Return to the rectangle before attaching the diagonal between joint centers.');
}
function thermal(mode){
 let b='';for(const i of [0,1]){const x=150+i*420;b+=(i?rect(x-19,176,175,151,C.mint)+rect(x-19,327,175,24,C.mint):'')+poly([[x,141],[x+139,141],[x+120,327],[x+19,327]],C.paper)+rect(x-7,127,153,17,C.gold)+[0,1,2].map(n=>rect(x+22+n*32,186+(n%2)*28,29,27,'#b7dced')).join('')+text(x+70, 80,i?'TEST CUP':'CONTROL',27,C.ink,'middle')+text(x+70,372,'60 g ice · 20 min',24,C.ink,'middle');if(i&&mode==='compare')b+=rect(x-14,138,168,35,C.orange);}
 return b+note(mode==='compare'?'Change one feature: add the top collar, then run a new control.':'Keep ice mass, cup, lid and timing the same.','Drain for 30 seconds • weigh each result • keep every reading.');
}
function syringe(x,y,output=false){return rect(x,y,200,61,C.pale)+rect(x+(output?45:95),y+3,12,55,C.teal)+line(x-55,y+30,x+(output?45:95),y+30,C.ink,7)+line(x-55,y+8,x-55,y+52,C.ink,7)+line(x+200,y+30,x+220,y+30,C.teal,9)+[1,2,3,4].map(n=>line(x+n*35,y,x+n*35,y+14,C.ink,2)).join('');}
function fluid(mode){
 return syringe(88,137)+`<path d="M 308 167 C 388 167 349 320 436 320 S 486 242 530 242" fill="none" stroke="${C.blue}" stroke-width="12"/>`+`<g transform="translate(838,485) rotate(180)">${syringe(88,212,true)}</g>`+text(59,90,'INPUT',29)+text(554, 90,'OUTPUT',29)+arrow(33,226,145,226)+arrow(681,330,789,330)+text(52,273,'20-mm push',25)+text(563,383,'Measure actual travel',24)+note(mode==='compare'?'Air first. Water second. Same syringes and input stroke.':'The barrel stays still. The plunger moves.','Use gentle motion • matching 20-mL syringes • compare three trials of each.');
}
function sled(mode){
 let b=rect(37,124,758,239,C.pale)+`<g transform="translate(380,0) scale(-1,1)">${syringe(90,207)}</g>`+rect(468,194,137,137,C.gold)+rect(486,227,95,70,C.mint)+text(493,269,'LOAD',19)+line(310,237,468,237,C.ink,7)+text(58,85,'FIXED BARREL',25)+text(456,85,'MOVING DECK',25)+line(165,94,165,199)+line(540,94,540,181)+rect(135,189,20,93,C.orange)+rect(249,189,20,93,C.orange);
 b+=dash(605,159,605,373)+dash(659,159,659,373)+dim(605,145,659,'20 mm')+text(522,400,'START',22)+text(674,400,'DELIVERY',22)+line(591,379,605,368)+line(690,379,659,368);
 if(mode==='compare')b+=rect(468,174,206,12,C.teal)+rect(468,340,206,12,C.teal);
 if(mode==='fence')b+=rect(468,194,137,10,C.orange)+rect(468,321,137,10,C.orange)+rect(595,194,10,137,C.orange);
 return b+note(mode==='test'?'One cycle: START → DELIVERY → START.':'Mount the barrel; leave the plunger free.','Top view • mark the fixed barrel’s position • keep the same cargo for comparisons.');
}
function flow(){return rect(154,55,100,257,C.pale)+rect(157,99,94,175,'#b7dced')+line(154,99,254,99,C.orange,4)+line(154,259,254,259,C.orange,4)+text(280,110,'START · 20 mL',26)+text(280,270,'STOP · 5 mL',26)+`<path d="M 204 315 C 204 400 546 260 556 347" fill="none" stroke="${C.blue}" stroke-width="10"/>`+poly([[510,341],[610,341],[595,399],[526,399]],C.mint)+text(498,206,'Outlet 10 cm',24)+text(498,237,'below 5-mL line',24)+note('Time the same volume window in each trial.','Average flow = collected volume ÷ elapsed time • keep outlet height fixed.');}
function lamp(x,y,on=true){return circ(x,y,31,on?C.gold:C.pale)+line(x-16,y-16,x+16,y+16)+line(x+16,y-16,x-16,y+16)+(on?[0,1,2,3].map(n=>{const a=n*Math.PI/2;return line(x+Math.cos(a)*39,y+Math.sin(a)*39,x+Math.cos(a)*51,y+Math.sin(a)*51,C.gold,4)}).join(''):'');}
function detector(mode){
 let b='';for(const i of [0,1]){const x=65+i*410,on=i===1;b+=text(x+141,45,on?'DOOR OPEN → ON':'DOOR SHUT → OFF',25,C.ink,'middle')+line(x,277,x+284,277,C.ink,5)+rect(x+56,118,on?26:180,151,C.mint)+circ(x+60,270,7,C.ink)+poly(on?[[x+61,270],[x+151,341],[x+151,188],[x+61,117]]:[[x+60,270],[x+239,270],[x+239,118],[x+60,118]],C.mint)+line(x+220,182,x+292,182,C.orange,10)+line(x+220,on?184:217,x+292,on?184:217,C.orange,10)+(!on?rect(x+219,194,96,12,C.gold):arrow(x+274,222,x+185,265))+lamp(x+318, 90,on);}
 return b+note('A card tongue separates the contacts when the door is shut.','Opening the door withdraws the card. Foil touches; the lamp’s path closes.');
}
function circuit(mode){
 const meter=mode==='voltage'||mode==='current',bottom=meter?330:380;
 let b=line(87,132,87,218)+line(87,239,87,bottom)+line(62,218,112,218,C.ink,5)+line(73,239,101,239,C.ink,4)+text(32,199,'+',28)+text(32,275,'−',28)+text(26,409,'Low-voltage source',23);
 if(meter){
  b+=line(87,132,610,132)+line(610,132,610,330)+line(610,330,87,330)+lamp(430,132)+line(165,132,200,132,C.teal,5)+text(133,73,'SWITCH',22);
  if(mode==='voltage')b+=line(380,132,380,240,C.blue,4)+line(480,132,480,240,C.blue,4)+line(380,240,480,240,C.blue,4)+circ(430,240,32,C.pale)+text(430,249,'V',27,C.ink,'middle')+note('DC voltage: contact the two lamp terminals.','Teacher checks COM/V sockets and range. Measure across the lamp.');
  else b+=circ(301,132,34,C.pale)+text(301,141,'A',28,C.ink,'middle')+note('Current: the teacher inserts the meter into a break in the path.','Power off to change connections. Never place current mode across the source.');
  return b;
 }
 b+=line(87,132,190,132)+line(190,132,190,295);
 for(const [i,y]of [132,295].entries())b+=line(190,y,259,y)+line(259,y,311,y,C.teal,5)+line(311,y,718,y)+lamp(515,y,mode!=='fault'||i===0)+text(264,y-47,'S'+(i+1),25)+text(572,y-43,'L'+(i+1),25);
 b+=line(718,132,718,380)+line(718,380,87,380);
 if(mode==='fault')b+=line(639,295,681,295,C.paper,10)+text(630,348,'OPEN',23,C.orange)+arrow(656,358,656,309);
 return b+note('Two independent paths share the same source.','Trace + → switch → lamp → − in each branch. Test 00, 10, 01 and 11.');
}
function energy(){let b='';for(const [i,title,l1,l2]of [[0,'A · BOTH ALL DAY',4,4],[1,'B · ROOM 2 ONLY WHEN NEEDED',4,1]]){const y=106+i*172;b+=text(35,y-32,title,25)+text(35,y+17,'L1',23)+text(35,y+66,'L2',23)+rect(95,y-10,l1*163,37,C.mint)+rect(95,y+39,l2*163,37,C.gold)+text(765,y+17,'4 h',23,'#183c44','middle')+text(l2===4?765:300,y+66,l2+' h',23,C.ink,'middle');}return b+note('Same 0.30-W lamps. Different time on.','Supplied schedule • a one-minute classroom demonstration represents these states.');}
export function workshopGraphic(family,mode='assembly'){
 const bodies={stand:()=>stand(mode),organizer:()=>tray(mode),template:()=>template(mode),tower:()=>tower(mode),beam:()=>beam(mode),building:()=>building(mode),frame:()=>frame(mode),thermal:()=>thermal(mode),fluid:()=>fluid(mode),sled:()=>sled(mode),flow,detector:()=>detector(mode),circuit:()=>circuit(mode),energy};
 return svg(bodies[family](),`${family}: ${mode} teaching view`);
}

function segments(labels,weights=labels.map(()=>1),colors=[]){const sum=weights.reduce((a,b)=>a+b,0);let x=50,b='';labels.forEach((s,i)=>{const w=740*weights[i]/sum;b+=rect(x,181,w,112,colors[i]??(i%2?C.gold:C.mint))+text(x+w/2,246,s,Math.min(30,w/Math.max(1,s.length)*1.6),C.ink,'middle');x+=w;});return b;}
function bars(labels,values,unit){const max=Math.max(...values);return labels.map((label,i)=>{const y=140+i*112;return text(40,y,label,25)+rect(200,y-32,480*values[i]/max,48,i?C.gold:C.mint)+text(218+480*values[i]/max,y,values[i]+' '+unit,24);}).join('');}
function tolerance(center,actual){const low=center-.125,high=center+.125,x=v=>100+(v-center+.25)*1200;return line(70,242,775,242,C.ink,4)+rect(x(low),207,x(high)-x(low),70,C.mint)+[low,center,high].map(v=>line(x(v),278,x(v),302)+text(x(v),335,String(v),25,C.ink,'middle')).join('')+circ(x(actual),242,10,C.orange)+text(x(actual),169,'Actual '+actual+' in',26,C.orange,'middle')+line(x(actual),180,x(actual),225,C.orange,3)+text(420,95,'Acceptable interval includes both limits',25,C.ink,'middle');}
export function practiceGraphic(key){
 let b='';const caption='SUPPLIED PRACTICE VALUES';
 switch(key){
 case '1-01':b=segments(['3 in','3 in','4 in','½'],[3,3,4,.5],[C.mint,C.mint,C.pale,C.gold])+dim(50,133,790,'10½ in overall')+text(420,353,'Which length overlaps?',30,C.ink,'middle');break;
 case '1-02':b=segments(['E','2½ in','D1','2½ in','D2','2½ in','E'],[.45,2.5,.45,2.5,.45,2.5,.45],[C.teal,C.pale,C.gold,C.pale,C.gold,C.pale,C.teal])+text(420,133,'Three clear bays + four thicknesses',29,C.ink,'middle')+text(420,360,'Each wall and divider = ⅛ in',27,C.ink,'middle');break;
 case '1-03':b=rect(154, 60,400,320,C.pale)+[0,1,2,3].map(i=>card(167+(i%2)*151,75+Math.floor(i/2)*107,151,107,'4 × 3')).join('')+text(594,200,'Sheet',28)+text(594,241,'9 × 12 in',27);break;
 case '1-04':b=card(80,130,295,170,'½ sheet',C.mint)+card(456,130,295,170,'3 ft tape',C.gold)+text(225,355,'$2.40 / sheet',27,C.ink,'middle')+text(605,355,'$0.10 / ft',27,C.ink,'middle');break;
 case '1-05':b=tolerance(8,8.125);break;
 case '1-06':b=segments(['¾','?','¾'],[.75,7,.75])+dim(50,135,790,'8½ in horizontal')+text(420,357,'Repeat vertically with 5¼ in overall.',26,C.ink,'middle');break;
 case '2-01':b=bars(['First','Revised'],[4,7],'objects');break;
 case '2-02':b=segments(['?','8-in gap','?'],[1.5,8,1.5],[C.gold,C.pale,C.gold])+dim(50,135,790,'11-in centered member')+text(420,355,'Equal bearing on both supports',27,C.ink,'middle');break;
 case '2-03':b=segments(['12 ft × 12 in/ft','+ 6 in'],[3,1])+text(420,135,'12 ft 6 in', 42,C.ink,'middle')+text(420,365,'Convert the feet. Then add the inches.',27,C.ink,'middle');break;
 case '2-04':b=rect( 90,100,400,265,C.pale)+text(290, 80,'16 ft',28,C.ink,'middle')+text(510,232,'12 ft',28)+line(150,365,225,365,C.gold,9)+text(157,405,'3-ft door',23)+text(610,142,'SCALE',23)+text(610,193,'½ in', 32)+text(610,233,'= 1 ft',28);break;
 case '2-05':b=poly([[175,350],[175,110],[615,110],[615,350]],C.pale)+line(175,350,615,110,C.orange,6)+text(395, 80,'8 in',28,C.ink,'middle')+text(82,243,'6 in',28)+text(381,297,'d = ?',35,C.orange)+rect(175,322,28,28,C.paper);break;
 case '2-06':b=rect( 80, 80,520,287,C.mint)+rect(190,116,131,251,C.paper)+text(340, 60,'12 ft',26)+text(620,235,'8 ft',26)+text(202,222,'3 × 7',24)+text(620,332,'+ 10%',28)+text(620,369,'allowance',22);break;
 case '2-07':b=bars(['Control','Insulated'],[12,6],'g melted')+text(420, 70,'Each cup started with 60 g',27,C.ink,'middle');break;
 case '2-08':b=bars(['Before','After'],[6,4],'mm');break;
 case '2-09':b=segments(['7½ model inches'],[1])+text(420,120,'½ in = 1 ft',36,C.ink,'middle')+text(420,360,'How many half-inch scale units?',27,C.ink,'middle');break;
 case '2-10':b=bars(['Old offset','New offset'],[2,3],'ft')+text(420, 70,'Model scale: ½ in = 1 ft',28,C.ink,'middle');break;
 case '3-01':b=segments(['INPUT','SAME VOLUME','OUTPUT'],[1.2,2,1.2])+text(160,142,'A × 20 mm',27,C.ink,'middle')+text(690,142,'A × ?',27,C.ink,'middle')+text(420,355,'Equal piston areas · ideal liquid',27,C.ink,'middle');break;
 case '3-02':b=rect(90,180,280, 70,C.mint)+rect(485,145,140,140,C.gold)+dim(90,134,370,'4-cm input travel')+text(226,329,'Area = 1 cm²',27,C.ink,'middle')+text(586,329,'Area = 2 cm²',27,C.ink,'middle')+text(586, 90,'Output travel = ?',26,C.ink,'middle');break;
 case '3-03':b=card(70,142,310,156,'180 mL in 15 s')+card(459,142,310,156,'240 mL in ? s',C.gold)+text(420, 90,'Use the same average flow rate',28,C.ink,'middle');break;
 case '3-04':b=rect(115, 90,610,248,C.pale)+dash(420,75,420,365)+[318,522].map(x=>circ(x,213,11,C.orange)).join('')+dim(318,147,522,'1 in between centers')+dim(115,390,725,'3 in overall')+text(405, 50,'CENTERLINE',23);break;
 case '3-05':b=segments(['175 mL receiver','20 mL','?'],[175,30,25])+dim(50,135,790,'200 mL at start')+text(667,344,'Retained',23,C.ink,'middle');break;
 case '3-06':b=[0,1,2,3,4].map(i=>circ(140+i*140,215, 40,i%2?C.gold:C.mint)+text(140+i*140,223,i+1,27,C.ink,'middle')).join('')+text(420,130,'5 complete cycles', 32,C.ink,'middle')+text(420,330,'Total elapsed time = 25 s',30,C.ink,'middle');break;
 case '3-07':b=bars(['Before','After'],[12,15],'cm/s');break;
 case '3-08':b=bars(['Trial 1','Trial 2','Trial 3'],[22,21,19],'mm')+text(420, 60,'Required: at least 20 mm EVERY trial',26,C.ink,'middle');break;
 case '3-09':b=card( 70,137,310,170,'Measured: 2.4 cm')+card(459,137,310,170,'Target: 20 mm',C.gold)+text(420,367,'Use matching units before subtracting.',27,C.ink,'middle');break;
 case '4-01':b=segments(['14-in route','2-in allowance'],[3,1])+text(420,133,'Cut length = route + connections',29,C.ink,'middle');break;
 case '4-02':b=[0,1,2,3,4,5,6,7,8,9].map(i=>circ(135+(i%5)*141,160+Math.floor(i/5)*124,42,i<8?C.mint:C.gold)+text(135+(i%5)*141,169+Math.floor(i/5)*124,i<8?'✓':'×',35,C.ink,'middle')).join('')+text(420, 70,'8 successes in 10 trials',30,C.ink,'middle');break;
 case '4-03':b=bars(['Nominal','Measured'],[3,2.8],'V');break;
 case '4-04':b=rect(130,165,550, 90,C.pale)+rect(325,150,160,120,C.gold)+text(405,220,'30 Ω',32,C.ink,'middle')+text(420, 90,'3.0 V across an ideal resistor',30,C.ink,'middle')+text(420,340,'I = V ÷ R',38,C.teal,'middle');break;
 case '4-05':b=[['OFF','OFF'],['ON','OFF'],['OFF','ON'],['ON','ON']].map((s,i)=>card( 70+i*192,166,173,132,s.join(' / '),i%2?C.gold:C.mint)).join('')+text(420, 90,'S1 / S2 → predict L1 / L2',30,C.ink,'middle');break;
 case '4-06':b=card( 70,147,310,152,'3.0 V')+card(459,147,310,152,'0.20 A',C.gold)+text(420,366,'P = V × I',38,C.teal,'middle');break;
 case '4-07':b=lamp(200,176)+lamp(600,176)+text(200,260,'0.30 W × 4 h',30,C.ink,'middle')+text(600,260,'0.30 W × 4 h',30,C.ink,'middle')+text(420,95,'Two lamps. Same operating time.',30,C.ink,'middle')+text(420,357,'Supplied energy price: $0.25/kWh',28,C.ink,'middle');break;
 case '4-08':b=[0,1,2,3].map(i=>text( 80+i*205,103,['00','10','01','11'][i],29)+[0,1,2].map(j=>circ(100+i*205,160+j*80,27,i===3&&j===2?C.gold:C.mint)+text(100+i*205,169+j*80,i===3&&j===2?'×':'✓',26,C.ink,'middle')).join('')).join('')+text(420,395,'Four states × three checks',27,C.ink,'middle');break;
 case '4-09':b=segments(['3¼ in','?','2½ in'],[3.25,6.25,2.5])+dim(50,135,790,'12 in overall');break;
 case '4-10':b=bars(['Before','After'],[30,24],'s');break;
 case '4-11':b=tolerance(5.5,5.75);break;
 default:throw Error('Missing practice visual '+key);
 }
 return svg(b+ text(30,462,caption,18,C.muted),`Practice ${key}: supplied quantities, before calculation`);
}
