// Scientific figures use the worksheet's own values and labels. Blank scaffolds
// stay blank until the matching solution slide is reached.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function diagram(v, answer = '') {
  if (!v) return '';
  let out = [], serial = 0;
  const push = s => out.push(`<g class="build-part" style="--order:${serial++}">${s}</g>`);
  const line=(x,y,X,Y,dash=false)=>push(`<path d="M${x} ${y}L${X} ${Y}" class="figure-line${dash?' dashed':''}"/>`);
  const arrow=(x,y,X,Y)=>{const a=Math.atan2(Y-y,X-x),l=8;push(`<path d="M${x} ${y}L${X} ${Y}M${X-l*Math.cos(a-.5)} ${Y-l*Math.sin(a-.5)}L${X} ${Y}L${X-l*Math.cos(a+.5)} ${Y-l*Math.sin(a+.5)}" class="figure-line accent"/>`)};
  const text=(x,y,t,anchor='start',small=false)=>push(`<text x="${x}" y="${y}" text-anchor="${anchor}" class="figure-label${small?' small':''}">${esc(t)}</text>`);
  const circle=(x,y,r=5)=>push(`<circle cx="${x}" cy="${y}" r="${r}" class="figure-object"/>`);
  const rect=(x,y,w,h)=>push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="figure-object"/>`);
  const poly=p=>push(`<polyline points="${p.map(a=>a.join(',')).join(' ')}" class="figure-line accent"/>`);
  const labels=v.labels||[v.left||'A',v.right||'B'];
  const k=v.kind;
  if(k==='table') return `<div class="worksheet-table"><table><thead><tr>${v.headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${v.rows.map((r,i)=>`<tr class="build-part" style="--order:${i}">${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if(k==='graph'||k==='vector_grid') {
    const xmin=v.xmin??0,xmax=v.xmax,ymin=v.ymin??0,ymax=v.ymax;
    const vector=k==='vector_grid',scale=214/Math.max(xmax-xmin,ymax-ymin);
    const left=vector?255-(xmax-xmin)*scale/2:65,right=vector?255+(xmax-xmin)*scale/2:445;
    const top=vector?161-(ymax-ymin)*scale/2:54,bottom=vector?161+(ymax-ymin)*scale/2:268;
    const X=x=>left+(x-xmin)/(xmax-xmin)*(right-left),Y=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top);
    const ticks=(lo,hi)=>{if(vector){const step=Math.max(1,Math.ceil((hi-lo)/14));return Array.from({length:Math.floor((hi-lo)/step)+1},(_,i)=>lo+i*step)}const n=Math.min(8,Math.max(4,Math.ceil(hi-lo)));return Array.from({length:n+1},(_,i)=>lo+(hi-lo)*i/n)};
    out.push('<g class="grid">');
    for(const val of ticks(xmin,xmax)){const x=X(val);out.push(`<path d="M${x} ${top}V${bottom}"/><text data-axis="x" x="${x}" y="${bottom+20}" text-anchor="middle">${Number(val.toPrecision(5))}</text>`)}
    for(const val of (!vector&&v.step&&((ymax-ymin)/v.step)<=12?Array.from({length:Math.floor((ymax-ymin)/v.step)+1},(_,i)=>ymin+i*v.step):ticks(ymin,ymax))){const y=Y(val);out.push(`<path d="M${left} ${y}H${right}"/><text data-axis="y" x="${left-10}" y="${y+5}" text-anchor="end">${Number(val.toPrecision(5))}</text>`)}
    out.push('</g>');
    line(left,top,left,bottom);line(left,bottom,right,bottom);if(ymin<0&&ymax>0)line(left,Y(0),right,Y(0));if(xmin<0&&xmax>0)line(X(0),top,X(0),bottom);
    text(left,30,v.ylabel||'North (m)');text(255,321,v.xlabel||'East (m)','middle');
    if(v.points?.length){if(v.scatter)v.points.forEach(([x,y])=>circle(X(x),Y(y),3));else{poly(v.points.map(([x,y])=>[X(x),Y(y)]));v.points.forEach(([x,y],i)=>{circle(X(x),Y(y),3);if(v.pointLabels?.[i])text(X(x)+(i===v.points.length-1?-8:8),Y(y)-14,v.pointLabels[i],i===v.points.length-1?'end':'start',true)});}}
    for(const [x,y,xx,yy,label] of v.arrows||[]){arrow(X(x),Y(y),X(xx),Y(yy));text(X((x+xx)/2)+8,Y((y+yy)/2)-8,label)}
    // Only plot explicitly stated coordinate pairs from the reviewed answer.
    if(answer && !v.points && k==='graph') {
      const pairs=[...answer.matchAll(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/g)].map(m=>[+m[1],+m[2]]);
      if(pairs.length>=2&&pairs.every(([x,y])=>x>=xmin&&x<=xmax&&y>=ymin&&y<=ymax))poly(pairs.map(([x,y])=>[X(x),Y(y)]));
    }
  } else if(k==='numberline') {
    const X=z=>45+(z-v.lo)/(v.hi-v.lo)*405;line(35,235,460,235);
    const step=Math.max(1,Math.ceil((v.hi-v.lo)/10));for(let z=Math.ceil(v.lo);z<=v.hi;z+=step){line(X(z),230,X(z),240);text(X(z),264,z,'middle')}
    v.points.forEach((z,i)=>{const y=70+i*44;circle(X(z),y);text(X(z),y-12,v.labels?.[i]||['Start','Turn','End'][i]||'Position','middle');if(i<v.points.length-1)arrow(X(z),y+12,X(v.points[i+1]),y+12)});text(250,310,v.xlabel||'Position (m); right is positive','middle');
  } else if(k==='range') {
    line(65,165,435,165);for(const [x,label,value]of [[65,'Lower',v.lo],[250,'Middle',v.mid],[435,'Upper',v.hi]]){line(x,150,x,180);text(x,125,label,'middle');text(x,217,v.blank&&!answer?'?':`${value} ${v.unit}`,'middle')}
  } else if(k==='forces') {
    circle(250,160,9);const dirs={right:[1,0],left:[-1,0],up:[0,-1],down:[0,1]};const max=Math.max(1,...Object.keys(dirs).map(d=>typeof v[d]==='number'?v[d]:0));
    for(const [dir,[dx,dy]]of Object.entries(dirs))if(v[dir]!=null){const len=typeof v[dir]==='number'?100*v[dir]/max:80;if(!len)continue;arrow(250,160,250+dx*len,160+dy*len);text(250+dx*(len+18),160+dy*(len+18)+(dy===0?-15:5),typeof v[dir]==='number'?`${v[dir]} N`:v[dir],dx<0?'end':dx>0?'start':'middle')}
    if(v.blank)text(250,300,'Add and label force arrows','middle');
  } else if(['pair','interaction','thermal','particles','sizes'].includes(k)) {
    for(let i=0;i<2;i++){const x=130+240*i;if(k==='thermal')rect(x-55,98,110,90);else if(k==='particles'){rect(x-70,85,140,120);for(let j=0;j<6;j++){const xx=x-45+(j%3)*44,yy=114+Math.floor(j/3)*53;circle(xx,yy,3);arrow(xx,yy,xx+13+7*i,yy-8)}}else circle(x,145,k==='sizes'?24+18*i:35);text(x,247,labels[i],'middle',true)}
    if(k==='pair'){line(130,196,370,196,true);text(250,218,v.distance||'r','middle')}
  } else if(['carts','collision'].includes(k)) {
    for(let i=0;i<2;i++){const x=65+260*i;rect(x,118,110,60);circle(x+22,190,10);circle(x+88,190,10);text(x+55,260,labels[i],'middle',true)}line(30,202,475,202);if(k==='collision')text(250,62,'Before contact: add velocity arrows','middle');
  } else if(['ramp','heights','projectile','fall'].includes(k)) {
    if(k==='ramp'){poly([[45,240],[450,240],[450,70],[45,240]]);circle(265,140,16);if(v.angle)text(150,228,v.angle)}
    else if(k==='heights'){line(40,260,460,260);for(let i=0;i<2;i++){const x=100+240*i,h=50+110*i;rect(x,245-h,45,15);line(x+57,260,x+57,245-h,true);text(x+68,235-h/2,labels[i], 'start',true)}}
    else if(k==='fall'){for(let i=0;i<4;i++)circle(250,65+i*i*22,7);text(50,34,'Equal time intervals');arrow(330,70,330,260)}
    else {line(35,262,465,262);if(!v.angled)rect(30,82,50,180);poly(Array.from({length:41},(_,i)=>{const t=i/40;return v.angled?[50+t*400,260-175*4*t*(1-t)]:[80+t*365,82+180*t*t]}));text(250,310,'Add velocity and acceleration arrows','middle')}
  } else if(['orbit','ellipse','trajectory','field'].includes(k)) {
    if(k==='trajectory'){arrow(35,220,465,220);arrow(330,265,330,55);circle(330,220,12);circle(85,220,6);text(60,195,'Start');text(350,247,'Earth')}
    else if(k==='field'){circle(250,160,28);text(250,168,v.mode==='electric'?'+':'M','middle');for(let i=0;i<8;i++){const a=i*Math.PI/4;line(250+48*Math.cos(a),160+48*Math.sin(a),250+95*Math.cos(a),160+95*Math.sin(a),true)}text(250,310,'Add field direction arrows','middle')}
    else {const a=k==='ellipse'?160:108,b=k==='ellipse'?80:108;push(`<ellipse cx="250" cy="165" rx="${a}" ry="${b}" class="figure-line"/>`);circle(k==='ellipse'?250-Math.sqrt(a*a-b*b):250,165,12);circle(250+a,165,7);text(250+a+12,153,k==='ellipse'?'B':'Object');if(k==='ellipse'){circle(250-a,165,7);text(250-a-12,150,'A','end')}}
  } else if(['flow','bars','work','spring','vector','heating'].includes(k)) {
    if(k==='flow'){const list=v.labels;if(v.layout==='branches'){text(70,165,list[0],'middle',true);arrow(135,155,205,155);rect(210,120,80,70);text(250,160,'Engine','middle');arrow(295,140,365,85);arrow(295,172,365,245);text(405,70,list[1],'middle',true);text(405,285,list[2],'middle',true)}else {const w=430/list.length;list.forEach((label,i)=>{rect(35+i*w,118,w-22,75);text(35+i*w+(w-22)/2,220,label,'middle',true);if(i<list.length-1&&v.layout!=='categories')arrow(35+(i+1)*w-20,154,35+(i+1)*w-2,154)})}}
    else if(k==='bars'){const max=Math.max(1,...v.values),w=430/v.values.length;v.values.forEach((val,i)=>{const h=170*val/max,x=35+i*w;rect(x,238-h,w-30,h);text(x+(w-30)/2,225-h,`${val} ${v.unit||''}`,'middle');text(x+(w-30)/2,280,v.labels[i],'middle',true)})}
    else if(k==='work'){rect(75,145,95,60);arrow(170,175,430,175);text(300,100,v.force,'middle',true);text(250,270,v.distance,'middle',true)}
    else if(k==='spring'){line(45,85,45,235);poly([[45,160],...Array.from({length:13},(_,i)=>[80+i*22,160+(-1)**i*24]),[365,160]]);rect(365,125,65,70);text(250,285,'Mark equilibrium and displacement x','middle')}
    else if(k==='vector'){const s=Math.min(60,300/Math.max(1,Math.abs(v.x)),175/Math.max(1,Math.abs(v.y)));arrow(85,255,85+s*v.x,255);arrow(85,255,85+s*v.x,255-s*v.y);line(85+s*v.x,255,85+s*v.x,255-s*v.y,true);text(140,285,`x = ${v.x}`);text(85+s*v.x+15,255-s*v.y/2,`y = ${v.y}`)}
    else{arrow(65,260,460,260);arrow(65,260,65,50);poly([[65,240],[185,155],[325,155],[445,65]]);text(250,310,'Energy added','middle');text(65,30,'Temperature')}
  } else if(['wave','pulses','pulse','interference','longitudinal','refraction','diffraction','echo','doppler','spectrum','mirror','lens'].includes(k)) {
    if(k==='pulses'){for(let i=0;i<2;i++){const x=40+i*245,w=i?165:80,h=i?65:130;line(x,250,x+205,250);line(x,250,x,65);poly([[x,250],[x+20,250],[x+20+w/2,250-h],[x+20+w,250],[x+200,250]]);text(x+85,290,'Time');text(x,42,i?'B':'A')}text(250,18,'Force (same scales)','middle')}
    else if(k==='wave'){line(35,170,465,170,true);poly(Array.from({length:121},(_,i)=>[35+i*430/120,170-58*Math.sin(i/120*4*Math.PI)]));text(250,300,'Sketch and label your response','middle')}
    else if(k==='pulse'||k==='interference'){line(30,180,465,180,true);poly([[30,180],[95,180],[130,100],[165,180],[250,180]]);arrow(90,65,190,65);if(k==='pulse')line(455,75,455,260);else{poly([[275,180],[330,180],[365,100],[400,180],[465,180]]);arrow(420,65,320,65)}}
    else if(k==='longitudinal'){for(let row=0;row<3;row++)for(let j=0;j<45;j++)circle(35+j*9.6+7*Math.sin(j*.65),125+row*28,2);arrow(45,70,440,70);text(250,280,'Label dense and sparse regions','middle')}
    else if(k==='refraction'||k==='mirror'){line(35,175,465,175);line(250,45,250,290,true);arrow(170,50,250,175);text(267,65,'Normal');text(50,270,'Add the outgoing ray')}
    else if(k==='diffraction'){line(255,50,255,140);line(255,195,255,290);for(let i=0;i<4;i++)line(40+i*48,65,40+i*48,270);arrow(50,166,218,166);text(280,170,'Sketch spreading')}
    else if(k==='echo'){rect(35,118,70,90);line(440,65,440,275);arrow(120,135,425,135);if(!v.oneway)arrow(425,190,120,190);text(65,253,'Source','middle');text(433,305,'Target','middle')}
    else if(k==='doppler'){circle(235,175,13);arrow(253,175,360,175);text(250,60,'Source moves right. Add wavefronts.','middle')}
    else if(k==='spectrum'){['Radio','IR','Visible','UV','X-ray'].forEach((t,i)=>{rect(25+i*94,125,94,65);text(72+i*94,165,t,'middle')});text(250,250,'Label increasing frequency and wavelength','middle')}
    else for(let i=0;i<2;i++){const x=135+i*245;line(x-100,170,x+95,170,true);const p=i?[[x-22,65],[x+22,65],[x+8,170],[x+22,270],[x-22,270],[x-8,170],[x-22,65]]:[[x,65],[x-22,115],[x-28,170],[x-22,225],[x,270],[x+22,225],[x+28,170],[x+22,115],[x,65]];poly(p);arrow(x-95,115,x-32,115);arrow(x-95,225,x-32,225)}
  } else if(k==='circuit') {
    const a=90,b=405,top=65,bot=270,mid=167;line(a,top,b,top);line(a,bot,b,bot);line(a,top,a,145);line(a,190,a,bot);line(a-25,145,a+25,145);line(a-15,190,a+15,190);text(a-38,145,'+');text(a-38,195,'−');
    const resistor=x=>{line(x,top,x,140);rect(x-15,140,30,55);line(x,195,x,bot)};
    if(['parallel','combination'].includes(v.mode)){resistor(b);resistor(270);if(v.mode==='combination')rect(130,50,55,30)}
    else if(v.mode==='series'){line(b,top,b,bot);rect(220,50,65,30);rect(220,255,65,30)}
    else if(v.mode==='motor'){line(b,top,b,135);circle(b,mid,32);text(b,mid+8,'M','middle');line(b,199,b,bot)}else resistor(b);
  } else if(['magnet','wire','coil'].includes(k)) {
    if(k==='magnet'){rect(155,125,190,70);line(250,125,250,195);text(205,170,'N','middle');text(300,170,'S','middle')}
    else if(k==='wire'){circle(250,175,20);circle(250,175,4);text(250,55,'Current out of the page','middle');text(250,285,'Add field arrows','middle')}
    else{for(let i=0;i<7;i++)push(`<ellipse cx="${240+i*20}" cy="165" rx="24" ry="80" class="figure-line"/>`);rect(40,138,100,48);text(90,170,'N   S','middle');arrow(55,90,165,90);text(310,290,'Coil','middle')}
  } else if(k==='chassis') {
    rect(150,60,200,235);for(const y of [110,245]){line(110,y,390,y);for(const x of [90,375])rect(x,y-30,35,60)}text(250,180,'Top view','middle');arrow(50,240,50,90);
  } else if(k==='gears') {
    for(const [x,r,label]of [[150,48,'Driver'],[298,98,'Driven']]){poly(Array.from({length:49},(_,i)=>{const a=i*Math.PI/24,R=r+(i%2?6:0);return[x+R*Math.cos(a),165+R*Math.sin(a)]}));circle(x,165,7);text(x,300,label,'middle')}
  } else throw Error('Unimplemented worksheet figure '+k);
  return `<svg class="worksheet-figure" viewBox="0 0 500 340" role="img" aria-label="${esc(v.caption||`${k.replaceAll('_',' ')} from the worksheet`)}">${out.join('')}</svg>${v.caption?`<p class="figure-caption">${esc(v.caption)}</p>`:''}`;
}
