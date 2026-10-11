(()=>{
'use strict';
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const slides=$$('.slide'),stage=$('deck-stage'),shell=$('.stage-shell');
if(!stage||!slides.length)return;
let current=-1,raf=0,notesWindow=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function model(kind,p){
 const line=(x,y,X,Y,cls='demo-thin')=>`<path d="M${x} ${y}L${X} ${Y}" class="${cls}"/>`;
 const poly=(pts,cls='demo-stroke')=>`<polyline points="${pts.map(a=>a.join(',')).join(' ')}" class="${cls}"/>`;
 const text=(x,y,s,cls='demo-text')=>`<text x="${x}" y="${y}" class="${cls}">${escape(s)}</text>`;
 const circle=(x,y,r,cls='demo-object')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${cls}"/>`;
 const rect=(x,y,w,h,cls='demo-object')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" class="${cls}"/>`;
 const arrow=(x,y,X,Y,cls='demo-stroke')=>{const a=Math.atan2(Y-y,X-x);return line(x,y,X,Y,cls)+poly([[X-12*Math.cos(a-.45),Y-12*Math.sin(a-.45)],[X,Y],[X-12*Math.cos(a+.45),Y-12*Math.sin(a+.45)]],cls)};
 const cart=(x,y=165)=>rect(x-25,y-30,50,28)+circle(x-16,y+3,7)+circle(x+16,y+3,7);
 const value=(n,d=1)=>Number(n).toFixed(d);
 let s='';
 if(['motion','acceleration','forces','fall'].includes(kind)){
  const fall=kind==='fall',t=(fall?2:4)*p,a=kind==='acceleration'?1:kind==='forces'?2:fall?9.8:0,v0=kind==='motion'?2:0,x0=kind==='motion'?1:0;
  const x=x0+v0*t+.5*a*t*t,v=v0+a*t,max=fall?19.6:kind==='forces'?16:kind==='acceleration'?8:9;
  s+=line(50,190,465,190)+text(50,230,fall?'Drop distance (m)':'Position (m)','demo-small');
  for(let i=0;i<=4;i++){const xx=50+i*100;s+=line(xx,184,xx,196)+text(xx-5,215,value(max*i/4),'demo-small')}
  if(fall)s+=circle(50+x/max*400,170,13,'demo-primary');else s+=cart(50+x/max*400);
  const pts=Array.from({length:61},(_,i)=>{const tt=(fall?2:4)*p*i/60,xx=x0+v0*tt+.5*a*tt*tt;return[570+tt/(fall?2:4)*350,235-xx/max*190]});
  s+=line(570,30,570,235)+line(570,235,935,235)+poly(pts)+circle(pts.at(-1)[0],pts.at(-1)[1],5,'demo-primary');
  s+=text(572,22,fall?'Drop (m)':'Position (m)','demo-small')+text(865,264,'Time (s)','demo-small');
  s+=text(52,45,`t = ${value(t)} s`)+text(52,82,p>0?`x = ${value(x)} m    v = ${value(v)} m/s`:'Predict the final position');
  if(kind==='forces')s+=arrow(135,125,235,125)+text(155,111,'6 N','demo-small')+arrow(135,140,100,140)+text(52,137,'2 N','demo-small')+text(620,302,p>0?'Net force +4 N; a = +2 m/s²':'Mass 2 kg');
  else s+=text(610,302,kind==='motion'?'Slope = velocity':'The slope changes as velocity changes','demo-small');
 } else if(kind==='vectors'){
  const X=x=>160+x*65,Y=y=>280-y*53;for(let i=0;i<=5;i++)s+=line(X(i),Y(0),X(i),Y(5));for(let j=0;j<=5;j++)s+=line(X(0),Y(j),X(5),Y(j));
  s+=circle(X(0),Y(0),5,'demo-primary')+text(40,305,'Start (0, 0)','demo-small');
  const progress=p*3;
  if(progress>0)s+=arrow(X(0),Y(0),X(3*Math.min(1,progress)),Y(0));
  if(progress>1)s+=arrow(X(3),Y(0),X(3),Y(4*Math.min(1,progress-1)));
  if(progress>2)s+=arrow(X(0),Y(0),X(3*Math.min(1,progress-2)),Y(4*Math.min(1,progress-2)),'demo-thin');
  s+=text(555,65,'First: 3 m east')+text(555,112,'Then: 4 m north');
  if(p===1)s+=text(555,181,'Distance = 7 m')+text(555,227,'Displacement magnitude = 5 m');
 } else if(kind==='interaction'){
  s+=cart(315)+cart(620)+text(275,230,'Object A')+text(580,230,'Object B');if(p>0){s+=arrow(315,115,315-100*p,115)+arrow(620,115,620+100*p,115);s+=text(290,280,'Equal magnitudes, opposite directions')}
 } else if(kind==='projectile'){
  const t=2*p,X=120+370*p,Y=50+220*p*p;
  s+=rect(45,50,74,225)+line(45,275,570,275)+poly(Array.from({length:61},(_,i)=>{const u=p*i/60;return[120+370*u,50+220*u*u]}));
  s+=circle(X,Y,8,'demo-primary')+arrow(X,Y,X+65,Y)+arrow(X,Y,X,Y+Math.min(50,50*p));
  s+=text(640,65,`t = ${value(t)} s`)+text(640,110,`x = ${value(5*t)} m`)+text(640,155,`Drop = ${value(4.9*t*t)} m`)+text(640,210,'vx = 5 m/s')+text(640,255,`vy = ${value(-9.8*t)} m/s`);
 } else if(kind==='orbit'){
  const a=-p*Math.PI*1.5,r=112,x=340+r*Math.cos(a),y=160+r*Math.sin(a);
  s+=circle(340,160,r,'demo-thin')+circle(340,160,19,'demo-primary')+circle(x,y,9,'demo-success')+arrow(x,y,x+65*Math.sin(a),y-65*Math.cos(a))+arrow(x,y,x-65*Math.cos(a),y-65*Math.sin(a),'demo-thin');
  s+=text(620,85,'Velocity: tangent')+text(620,140,'Acceleration: inward')+text(620,211,'The speed can stay constant','demo-small')+text(620,242,'while the velocity changes.','demo-small');
 } else if(kind==='momentum'){
  const a=130+230*Math.min(p*2,1),b=410+230*Math.max(0,p*2-1);s+=line(45,190,915,190)+cart(a)+cart(b)+text(a-16,235,'A')+text(b-16,235,'B');
  s+=text(90,52,p<.5?'Before contact: A +2 m/s, B 0 m/s':'After contact: A 0 m/s, B +2 m/s');
  if(p>0)s+=text(420,294,'Total momentum = +4 kg·m/s');
 } else if(kind==='energy'){
  const f=p*p,y=55+210*f,U=19.6*(1-f),K=19.6*f;s+=line(100,278,420,278)+circle(240,y,16,'demo-primary')+text(100,25,'1 kg, released from rest');
  for(const [x,E,label,cls] of [[550,U,'Gravitational','demo-primary'],[720,K,'Kinetic','demo-energy']])s+=rect(x,270-E*10,100,E*10,cls)+text(x,301,label,'demo-small')+text(x,52,`${value(E)} J`);
  s+=text(490,20,'Total = 19.6 J');
 } else if(kind==='spring'){
  const x=.5*p,end=400+280*p; s+=line(80,65,80,245)+poly([[80,155],...Array.from({length:21},(_,i)=>[110+i*(end-130)/20,155+(-1)**i*25]),[end,155]])+rect(end,120,60,70);
  s+=text(90,30,`Extension x = ${value(x,2)} m`);if(p>0)s+=text(120,292,`Force = ${value(20*x)} N`)+text(500,292,`Stored energy = ${value(10*x*x,2)} J`);
 } else if(kind==='thermal'){
  const hot=80-30*p,cold=20+30*p;s+=rect(140,80,170,175)+rect(650,80,170,175)+rect(145,250-hot*2,160,hot*2,'demo-hot')+rect(655,250-cold*2,160,cold*2,'demo-energy');
  s+=text(170,58,`${value(hot)} °C`)+text(680,58,`${value(cold)} °C`)+arrow(360,160,595,160)+text(380,120,`${value(30*p)} J transferred`,'demo-small')+text(220,298,'Equal heat capacities; total energy conserved');
 } else if(kind==='wave'){
  const phase=p*2*Math.PI;s+=line(50,165,925,165);s+=poly(Array.from({length:141},(_,i)=>[50+i*6.2,165-60*Math.sin(i/140*4*Math.PI-phase)]));const y=165-60*Math.sin(Math.PI-phase);s+=circle(267,y,10,'demo-success')+line(267,75,267,255,'demo-thin demo-dash');s+=text(80,40,'Pattern travels right; marked point moves up and down')+text(80,300,p>0?'λ = 2 m    f = 1 Hz    v = 2 m/s':'λ = 2 m    f = 1 Hz')+arrow(770,50,900,50);
 } else if(kind==='interference'){
  const a=190+570*p,b=760-570*p,tri=(x,c)=>Math.max(0,1-Math.abs(x-c)/70)*48;s+=line(45,190,940,190);s+=poly(Array.from({length:181},(_,i)=>{const x=45+i*5;return[x,190-tri(x,a)-tri(x,b)]}));s+=text(65,35,p===.5?'At overlap: displacements add':'The pulses continue through one another')+arrow(140,70,220,70)+arrow(800,70,720,70);
 } else if(kind==='echo'){
  const x=130+640*(p<=.5?p*2:2-p*2);s+=rect(55,125,65,80)+line(795,65,795,270)+circle(x,165,10,'demo-primary');s+=text(60,240,'Source')+text(770,300,'Target')+text(280,55,`Elapsed time = ${value(p,2)} s`)+text(290,270,p>0?`Total travel = ${value(340*p)} m`:'Target is 170 m away');
 } else if(['refraction','reflection','lens'].includes(kind)){
  if(kind==='lens'){s+=line(70,170,870,170)+`<ellipse cx="450" cy="170" rx="25" ry="125" class="demo-object"/>`;for(const y of[75,265]){s+=arrow(90,y,425,y);if(p>0)s+=arrow(475,y,475+(720-475)*p,y+(170-y)*p)}s+=circle(720,170,4,'demo-primary')+text(700,207,'Focal point','demo-small')}
  else{const cx=480,cy=170,theta=kind==='reflection'?40:25.4,rad=theta*Math.PI/180;s+=line(90,cy,880,cy)+line(cx,25,cx,305,'demo-thin demo-dash')+arrow(380,50,cx,cy);if(p>0)s+=arrow(cx,cy,cx+150*Math.sin(rad)*p,cy+(kind==='reflection'?-1:1)*150*Math.cos(rad)*p);s+=text(150,45,'Incident angle 40°')+text(625,kind==='reflection'?80:275,p>0?`Outgoing angle ${theta}°`:'Predict the ray')+text(490,25,'Normal','demo-small')}
 } else if(kind==='electric'){
  s+=circle(460,165,32,'demo-object')+text(451,174,'+');for(let i=0;i<8;i++){const a=i*Math.PI/4,l=45+90*p;if(p>0)s+=arrow(460+45*Math.cos(a),165+45*Math.sin(a),460+l*Math.cos(a),165+l*Math.sin(a))}s+=text(130,35,'Positive source charge')+text(190,308,'Field direction: force on a positive test charge');
 } else if(kind==='circuit'||kind==='parallel'){
  const parallel=kind==='parallel';s+=line(180,65,800,65)+line(180,270,800,270)+line(180,65,180,142)+line(180,188,180,270)+line(150,142,210,142)+line(160,188,200,188)+text(98,154,'6 V');
  const resistor=(x,label)=>line(x,65,x,130)+rect(x-18,130,36,75)+line(x,205,x,270)+text(x+30,171,label);
  s+=resistor(800,parallel?'6 Ω':'3 Ω');if(parallel)s+=resistor(550,'3 Ω');
  const perimeter=1650,at=f=>{let z=(f%1)*perimeter;return z<620?[180+z,65]:z<825?[800,65+z-620]:z<1445?[800-(z-825),270]:[180,270-(z-1445)]};
  for(let i=0;i<8;i++){const [x,y]=at(p*.35+i/8);s+=circle(x,y,5,'demo-primary')}
  if(parallel)for(let i=0;i<3;i++)s+=circle(550,65+((p*170+i*70)%205),5,'demo-success');
  s+=text(290,25,p>0?(parallel?'Branches: 2 A + 1 A = 3 A':'Current 2 A; power 12 W'):'Predict current and power');
 } else if(kind==='magnetic'){
  s+=rect(350,133,220,66)+line(460,133,460,199)+text(393,175,'N')+text(510,175,'S');
  for(const sign of[-1,1]){const pts=Array.from({length:61},(_,i)=>{const a=Math.PI*(1-p*i/60);return[460+175*Math.cos(a),166+sign*105*Math.sin(a)]});if(p>0)s+=poly(pts);if(p===1)s+=arrow(625,166+sign*30,635,166)}s+=text(225,35,'Outside the magnet: north toward south');
 } else if(kind==='induction'){
  const moving=p<.5,x=105+330*Math.min(1,p*2);s+=rect(x,125,100,70)+text(x+13,169,'S    N');for(let i=0;i<6;i++)s+=`<ellipse cx="${625+i*22}" cy="165" rx="30" ry="100" class="demo-thin"/>`;s+=text(130,45,p===0?'Predict during motion and after stopping':moving?'Magnet approaching: flux changes':'Magnet stopped: constant flux, induced emf = 0');
 } else if(kind==='gears'){
  for(const [x,r,a,n]of [[370,66,p*2*Math.PI,12],[568,132,-p*Math.PI,24]]){const pts=Array.from({length:n*4+1},(_,i)=>{const theta=a+i*2*Math.PI/(n*4),R=r+(i%4<2?5:-5);return[x+R*Math.cos(theta),165+R*Math.sin(theta)]});s+=poly(pts)+line(x,165,x+r*Math.cos(a),165+r*Math.sin(a));}s+=text(270,25,'12-tooth driver')+text(590,25,'24-tooth driven')+text(300,315,p>0?`${value(p,2)} turn → ${value(-p/2,2)} turn`:'Predict direction and number of turns');
 }
 return `<svg viewBox="0 0 1000 330" role="img" aria-label="${escape(kind+' teaching model, progress '+Math.round(p*100)+' percent')}">${s}</svg>`;
}
function animate(){
 cancelAnimationFrame(raf);const slide=slides[current];window.WorksheetMotion?.play(slide);slide.classList.remove('animate-build');void slide.offsetWidth;slide.classList.add('animate-build');
 const demo=$('.concept-demo',slide);if(!demo)return;
 const from=Number(demo.dataset.from),to=Number(demo.dataset.to);if(reduced.matches||from===to){demo.innerHTML=model(demo.dataset.demo,to);return;}
 const start=performance.now();const tick=now=>{const f=Math.min(1,(now-start)/1800);demo.innerHTML=model(demo.dataset.demo,from+(to-from)*f);if(f<1)raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);
}
function resize(){const controlled=stage.hasAttribute('data-session-controlled');document.body.classList.toggle('session-controlled',controlled);stage.style.transform=`scale(${Math.min(shell.clientWidth/1280,shell.clientHeight/720)})`;}
function notes(){if(!notesWindow||notesWindow.closed)return;const slide=slides[current];notesWindow.document.title='Worksheet teaching notes';notesWindow.document.body.innerHTML=`<main class="notes-page"><p class="meta">SLIDE ${current+1} / ${slides.length}</p><h1>${escape(slide.dataset.title)}</h1><p>${escape(slide.dataset.label)}</p><pre>${escape(slide.dataset.speakerNotes||'')}</pre><hr><p>Next: ${escape(slides[current+1]?.dataset.label||'End')}</p></main>`;}
function show(n){const target=Math.max(0,Math.min(slides.length-1,n));if(target===current)return;current=target;slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',i===current?'false':'true')});$('#count').textContent=`${current+1} / ${slides.length}`;$('#prev').disabled=current===0;$('#next').disabled=current===slides.length-1;const q=slides[current].dataset.question;const option=$$('#problem option').find(o=>q&&slides[+o.value]?.dataset.question===q);$('#problem').value=option?.value||'0';$('#replay').disabled=!$('.concept-demo,.worksheet-figure,.worksheet-table,[data-motion]' ,slides[current]);history.replaceState(null,'','#'+(current+1));animate();stage.dispatchEvent(new CustomEvent('slidechange',{bubbles:true,composed:true,detail:{index:current,total:slides.length}}));notes();}
function navigate(n){const index=Math.max(0,Math.min(slides.length-1,n));if(stage.hasAttribute('data-session-controlled'))stage.dispatchEvent(new CustomEvent('classroomnavigate',{bubbles:true,detail:{index}}));else show(index);}
Object.defineProperties(stage,{index:{get:()=>current},length:{get:()=>slides.length}});stage.goTo=n=>{if(Number.isInteger(n)&&n>=0&&n<slides.length)show(n)};stage.next=()=>navigate(current+1);stage.prev=()=>navigate(current-1);
$('#prev').onclick=()=>navigate(current-1);$('#next').onclick=()=>navigate(current+1);$('#reset').onclick=()=>navigate(0);$('#problem').onchange=e=>navigate(+e.target.value);$('#nextProblem').onclick=()=>{const next=$$('#problem option').map(o=>+o.value).find(n=>n>current);navigate(next??slides.length-1)};$('#replay').onclick=animate;
$('#notes').onclick=()=>{notesWindow=window.open('','worksheetTeacherNotes','width=900,height=720');if(notesWindow){notesWindow.document.head.innerHTML='<link rel="stylesheet" href="/decks/worksheet-guided/style.css">';notes()}};
$('#fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.()};
document.addEventListener('keydown',e=>{if(stage.hasAttribute('data-session-controlled')||['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(e.target.tagName))return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();navigate(current+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();navigate(current-1)}if(e.key==='Home')navigate(0);if(e.key==='End')navigate(slides.length-1);if(e.key.toLowerCase()==='r')animate()});
new MutationObserver(resize).observe(stage,{attributes:true,attributeFilter:['data-session-controlled']});window.addEventListener('resize',resize);window.addEventListener('hashchange',()=>{if(!stage.hasAttribute('data-session-controlled'))show((parseInt(location.hash.slice(1))||1)-1)});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else animate()});reduced.addEventListener('change',animate);
window.deckAPI={show,get current(){return current},count:slides.length};resize();show((parseInt(location.hash.slice(1))||1)-1);
})();
