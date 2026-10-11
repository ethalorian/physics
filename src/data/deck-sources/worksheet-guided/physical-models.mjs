import {esc} from './diagrams.mjs';
const P=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const text=(x,y,s,c='wb-label',a='start')=>`<text x="${x}" y="${y}" class="${c}" text-anchor="${a}">${esc(s)}</text>`;
const line=(x,y,X,Y,c='wb-line',animate=false)=>`<path d="M${x} ${y}L${X} ${Y}" class="${c}"${animate?' data-motion="draw"':''}/>`;
const arrow=(x,y,X,Y,c='wb-a',animate=false)=>{const a=Math.atan2(Y-y,X-x),l=12;return `<path d="M${x} ${y}L${X} ${Y}M${X-l*Math.cos(a-.4)} ${Y-l*Math.sin(a-.4)}L${X} ${Y}L${X-l*Math.cos(a+.4)} ${Y-l*Math.sin(a+.4)}" class="${c}"${animate?' data-motion="draw"':''}/>`};
const box=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" class="wb-object"/>`;
const dot=(x,y,r=12)=>`<circle cx="${x}" cy="${y}" r="${r}" class="wb-object"/>`;
const svg=(s,title)=>`<svg class="walk-graphic" viewBox="0 0 690 400" role="img" aria-label="${esc(title)}">${s}</svg>`;
const step=(cue,lines,graphic,kind)=>({cue,lines,graphic,kind});
function scaffold(kind,drawing,first,second,relationship){return [step(first,[],svg(drawing(0),kind+' model: identify the parts'),kind),step(second,relationship,svg(drawing(1),kind+' model: connect the quantities'),kind)];}
// Every model is a scientific scaffold, not a simulated measurement. Symbols
// intentionally stay symbolic when the question supplies no corresponding value.
export function physicalModel(day,track,q){
 const p=P(q.prompt),a=P(q.answer),both=(p+' '+a).toLowerCase();
 const family=q.reviewVariant?.family;const unit=family?.[0]??day.unit;
 const reference='';
 const withGiven=draw=>phase=>draw(phase)+reference;
 if(/gravitational force|universal gravitation|inverse.square|coulomb|separation doubles|center distance|surface field|gravitational field|source gm/.test(both)){
  const electric=/coulomb|charge/.test(both),symbol=electric?'F = k |q₁q₂| / r²':/field|n\/kg/.test(both)?'g = GM / r²':'F = G m₁m₂ / r²';
  return scaffold('inverse-square',withGiven(phase=>dot(160,185,38)+dot(530,185,24)+text(160,254,electric?'q₁':'Source mass','wb-label','middle')+text(530,254,electric?'q₂':'Test mass','wb-label','middle')+line(160,295,530,295,'wb-component')+text(345,330,'r: center to center','wb-legend','middle')+(phase?text(345,62,'Scale by 1 / r²','wb-result-label','middle')+text(345,101,'2r → one-quarter the magnitude','wb-legend','middle'):'')), 'Where does the distance begin and end? Identify the source and the affected object.', 'Square the distance factor before changing force or field strength.', [symbol,'Keep the unchanged quantities fixed.']);
 }
 if(/circular|circle|centripetal|inward acceleration/i.test(p)&&!/table|periodic table/.test(p)){
  const draw=phase=>`<circle cx="310" cy="202" r="118" class="wb-orbit"/>`+dot(310,202,16)+dot(428,202,10)+line(310,202,428,202,'wb-component')+text(363,225,'r','wb-label')+(phase?arrow(428,202,428,83,'wb-a',true)+text(448,95,'v tangent','wb-legend')+arrow(428,202,341,202,'wb-result',true)+text(455,264,'a inward','wb-legend'):'')+text(310,30,'Circular-path model','wb-axis-label','middle');
  const equation=/period|orbits|circumference/.test(both)?['One orbit: distance = 2πr','v = 2πr / T']:['aᶜ = v² / r','ΣFinward = m v² / r'];
  return scaffold('circular-motion',withGiven(draw),'At this point, which way is the object moving? Point before drawing the arrow.','Add the inward acceleration separately. A changing direction is a changing velocity.',equation);
 }
 if(/projectile|horizontal launch|launches horizontally|cliff|flight time|time to (?:the )?top|angled launch/.test(both)){
  const angled=/angled|angle|above horizontal|time to (?:the )?top/.test(both),pts=Array.from({length:61},(_,i)=>{const t=i/60;return[105+t*470,angled?295-185*4*t*(1-t):90+205*t*t]});
  const draw=phase=>line(60,315,635,315)+(!angled?box(65,90,40,225):'')+`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" class="wb-orbit"/>`+dot(pts[30][0],pts[30][1],9)+(phase?arrow(340,pts[30][1],450,pts[30][1],'wb-a',true)+text(450,pts[30][1]-15,'vₓ','wb-label')+arrow(340,pts[30][1],340,pts[30][1]+85,'wb-result',true)+text(359,pts[30][1]+75,'a = g down','wb-legend'):'')+text(340,35,'Same elapsed time in both directions','wb-axis-label','middle');
  return scaffold('projectile-scaffold',withGiven(draw),'Separate horizontal and vertical information. Which direction determines time in the air?','The horizontal velocity is constant; gravity changes the vertical velocity.',['Δx = vₓ t','Δy = vᵧ₀ t − ½gt²','vᵧ = vᵧ₀ − gt  (up is positive)']);
 }
 if(/momentum|impulse|collision|recoil/.test(both)){
  const impulse=/impulse|stopp|force.*time|time.*force/.test(both);
  if(impulse){const drawing=phase=>arrow(100,302,615,302,'wb-axis')+arrow(100,302,100,60,'wb-axis')+text(80,35,'Average force','wb-axis-label')+text(560,341,'Time','wb-axis-label')+(phase?`<path d="M150 302V115H540V302Z" class="wb-area" data-motion="reveal"/>`+line(150,115,540,115,'wb-a',true)+text(340,220,'Area = impulse','wb-label','middle'):line(150,115,540,115,'wb-placeholder'))+text(340,355,'Equivalent rectangle: the same impulse','wb-tick','middle');
   return scaffold('impulse-scaffold',withGiven(drawing),'Which momentum change is required? Which time interval goes with it?','Connect impulse to signed area. A longer stopping time can reduce average force.',/triangle|triangular/i.test(p)?['J = ½ Fpeak Δt','Favg = ½ Fpeak']:['J = Δp = m(vf − vi)','Favg = Δp / Δt']);}
  const drawing=phase=>line(60,135,640,135)+line(60,302,640,302)+box(105,72,110,48)+box(452,72,110,48)+text(160,58,'Object 1','wb-legend','middle')+text(507,58,'Object 2','wb-legend','middle')+text(45,184,'Before','wb-axis-label')+text(45,347,'After','wb-axis-label')+(phase?box(252,239,110,48)+box(367,239,110,48)+text(345,225,'Account for both objects after contact','wb-legend','middle'):box(250,239,225,48));
  return scaffold('momentum-system',withGiven(drawing),'Choose the two-object system. Which outside impulses can we neglect?','Keep signed momentum for each object. Add before and after separately.',['p = mv','m₁v₁ᵢ + m₂v₂ᵢ = m₁v₁f + m₂v₂f','For sticking: v₁f = v₂f']);
 }
 if(/spring|hooke|compression|equilibrium.*displacement/.test(both)){
  const draw=phase=>line(80,90,80,295)+`<polyline points="${[[80,192],...Array.from({length:21},(_,i)=>[100+i*15,192+(-1)**i*22]),[435,192]].map(p=>p.join(',')).join(' ')}" class="wb-a"/>`+box(435,152,75,80)+line(340,95,340,298,'wb-component')+text(330,330,'x = 0','wb-legend','middle')+arrow(340,282,472,282,'wb-b',phase===1)+text(410,310,'x','wb-label')+(phase?arrow(435,120,335,120,'wb-result',true)+text(387,93,'Restoring force','wb-legend','middle'):'');
  return scaffold('spring-scaffold',withGiven(draw),'Mark the unstretched position. Is x a coordinate or a change in length?','The restoring force opposes displacement. Stored energy depends on its square.', /energy|potential|stored/.test(both)?['Us = ½kx²','Energy is nonnegative.']:['Fs = −kx','Use displacement from equilibrium.']);
 }
 if(/heat engine|refrigerator|efficien|energy budget|input energy|useful|other forms|other transfers|thermal.*work|first law/.test(both)){
  const fridge=/refrigerator/.test(both),draw=phase=>box(255,125,180,112)+text(345,187,fridge?'Refrigerator':'System','wb-label','middle')+arrow(70,178,245,178,'wb-a')+text(150,145,fridge?'Qc':'Input','wb-legend','middle')+(phase?arrow(445,149,605,90,'wb-b',true)+text(580,64,fridge?'Qh':'Useful output','wb-legend','middle')+arrow(fridge?345:445,fridge?327:215,fridge?345:605,fridge?247:292,'wb-result',true)+text(fridge?360:570,fridge?310:327,fridge?'Work in':'Other transfers','wb-legend',fridge?'start':'middle'):'');
  return scaffold('energy-transfers',withGiven(draw),'Draw a boundary around the system. Which energy enters and which leaves?','Account for every transfer across the same boundary.',fridge?['Qh = Qc + Win','COP = Qc / Win']:/first law|internal energy|δu|Δu/.test(both)?['ΔU = Q − Wby','Work done on the system: Wby < 0']:['Input = useful output + other transfers','Efficiency = useful output / input']);
 }
 if(/specific heat|heat capacity|temperature change|warms by|warming|melts|latent heat|phase change/.test(both)){
  const phase=/latent heat|melts|phase change/.test(both);const draw=reveal=>box(245,110,200,200)+[0,1,2,3,4,5,6,7,8].map(i=>dot(280+i%3*65,155+Math.floor(i/3)*56,7)).join('')+arrow(70,215,230,215,'wb-a',reveal===1)+text(155,184,'Energy in','wb-legend','middle')+(reveal?text(345,73,phase?'Change phase at a fixed temperature':'Raise the temperature','wb-label','middle'):'');
  return scaffold('thermal-sample',withGiven(draw),'Identify the sample and the kind of change. Is its temperature changing, its phase changing, or both?','Use a separate energy calculation for each part of the process.',phase?['Phase change: Q = mL','Warming or cooling: Q = mcΔT']:['Q = mcΔT','ΔT = Tf − Ti']);
 }
 if(/weight|gravitational force on|mass.*field|field.*mass/.test(both)&&!/normal|rope|third.law|book|tension|incline|coulomb/.test(both)){
  return scaffold('weight-model',withGiven(phase=>dot(345,130,32)+text(345,84,'Mass m','wb-label','middle')+line(115,318,575,318)+(phase?arrow(345,167,345,283,'wb-result',true)+text(375,235,'Fg = mg','wb-label'):'')+text(345,352,'Local gravitational field g','wb-legend','middle')),'Which value belongs to the object and which belongs to its location?','The field gives force per kilogram. Changing location can change weight without changing mass.',['Fg = m × g','kg × N/kg = N']);
 }
 if(/kinetic energy|gravitational potential|mechanical energy|work.energy|work done|net work|stopping distance/.test(both)){
  const work=/work|stopping/.test(both),draw=phase=>line(65,292,635,292)+box(125,210,100,65)+text(175,328,'Initial state','wb-legend','middle')+box(470,210,100,65)+text(520,328,'Final state','wb-legend','middle')+arrow(240,265,450,265,'wb-axis')+text(345,301,'Δx','wb-legend','middle')+(phase?arrow(/stopping|brak|friction|negative work/i.test(p)?293:175,166,/stopping|brak|friction|negative work/i.test(p)?175:293,166,'wb-a',true)+text(231,133,'F component','wb-legend','middle')+text(345,70,work?'Net work changes kinetic energy':'Keep an energy account','wb-axis-label','middle'):'');
  return scaffold('energy-model',withGiven(draw),'Identify the initial and final states. Which energy forms change?',work?'Only the force component along displacement contributes to work.':'Compare the same system at both moments. Include energy transferred out.',work?['W = F Δx cos θ','Wnet = ΔK','K = ½mv²']:['K = ½mv²; Ug = mgh','Einitial + transfers in = Efinal + transfers out']);
 }
 if(/electric field|test charge/.test(both)){
  const negative=/negative|-[\d.]|−[\d.]/.test(p);return scaffold('electric-field',withGiven(phase=>[95,185,275].map(y=>arrow(80,y,600,y,'wb-a')).join('')+dot(330,185,23)+text(330,193,negative?'−':'+','wb-label','middle')+text(600,326,'E','wb-label')+(phase?arrow(330,235,negative?210:450,235,'wb-result',true)+text(330,279,'Force on this charge','wb-legend','middle'):'')),'Use the field direction as the direction of force on a positive test charge. What is this charge’s sign?','A negative charge has force opposite the field.',['F = qE','Magnitude: |F| = |q|E']);
 }
 if(/current|voltage|resistor|ohm|charge.*flow|charge transferred|circuit|battery/.test(both)&&!/magnet|induc|field|safety|solder|approval|wire route/.test(both)){
  const charge=/charge|coulomb/.test(both),draw=phase=>`<path d="M120 155V80H570V310H120V205" class="wb-line"/>`+line(94,155,146,155)+line(105,205,135,205)+text(80,188,'V','wb-label','end')+box(544,145,52,90)+text(620,197,'R','wb-label')+(phase?arrow(250,80,370,80,'wb-a',true)+text(310,53,'I','wb-label','middle')+[220,360,470].map(x=>dot(x,310,6)).join(''):'');
  const relation=charge&&/current|flow|passes|time/.test(both)?['I = Δq / Δt','A = C/s']: /energy|joule/.test(both)?['ΔE = q ΔV','V = J/C']: /power|watt/.test(both)?['P = VI','E = Pt']:['V = IR','Name the voltage across the component.'];
  return scaffold('circuit-scaffold',withGiven(draw),'Trace the conducting path. Which values belong to the source, the component, and the flow?','Keep charge flow separate from energy transferred. Connect the stated quantities.',relation);
 }
 if(/power|watt|energy.*time|joules.*seconds/.test(both)){
  return scaffold('power-model',withGiven(phase=>line(100,272,590,272,'wb-axis')+text(90,315,'Start','wb-legend')+text(540,315,'Finish','wb-legend')+text(340,340,'Time interval Δt','wb-legend','middle')+[0,1,2,3,4].map(i=>box(140+i*84,190,40,55)).join('')+(phase?text(345,110,'Energy transferred during the interval','wb-label','middle')+arrow(120,152,580,152,'wb-a',true):'')), 'What is the total energy transferred, and over how much time?', 'Power describes a rate, not a store of energy.', ['P = E / Δt','1 W = 1 J/s']);
 }
 if(/acceleration|velocity|displacement|constant speed|average speed/.test(both)&&!/gear|charge|particle|sound|wave|mass.*measured/.test(both)){
  const accel=/acceleration|accelerat|slows|speeding|brak/.test(both);
  const draw=phase=>line(70,290,630,290)+box(112,188,105,62)+dot(135,259,9)+dot(195,259,9)+box(456,188,105,62)+dot(478,259,9)+dot(540,259,9)+text(163,327,'Initial','wb-legend','middle')+text(508,327,'Final','wb-legend','middle')+(phase?arrow(222,277,444,277,'wb-component',true)+text(340,309,'Δx','wb-legend','middle')+text(340,79,accel?'Compare signed velocities':'Track start, finish, and elapsed time','wb-axis-label','middle'):'');
  return scaffold('motion-scaffold',withGiven(draw),'Choose the positive direction. Which quantities describe the start and the finish?',accel?'A change in velocity is final minus initial. Its sign depends on your chosen direction.':'Displacement compares endpoints; distance follows every leg of the route.',accel?['aavg = (vf − vi) / Δt','For constant a: vf = vi + aΔt']:['vavg = Δx / Δt','Average speed = distance / Δt']);
 }

 if(/gear|teeth|wheel rpm|wheel.*circumference|rev\/s/.test(both)){
  const wheel=(x,y,r,N)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" class="wb-object"/>'+Array.from({length:N},(_,i)=>{const a=i*2*Math.PI/N;return line(x+(r-5)*Math.cos(a),y+(r-5)*Math.sin(a),x+(r+7)*Math.cos(a),y+(r+7)*Math.sin(a),'wb-a')}).join('')+dot(x,y,6);
  return scaffold('gears',withGiven(phase=>wheel(220,210,60,12)+wheel(400,210,120,24)+text(205,95,'Driver','wb-label','middle')+text(432,55,'Driven','wb-label','middle')+(phase?arrow(195,126,265,143,'wb-result',true)+arrow(472,98,405,76,'wb-b',true)+text(345,363,'Illustrative gears; use the stated tooth counts.','wb-tick','middle'):'')), 'Which gear drives, and which is driven? Label their tooth counts.', 'Count revolutions using the gear ratio before converting wheel motion into travel.', ['rpmout = rpmin × Ndriver / Ndriven','Wheel speed = rpmout / 60','Travel speed = πd × revolutions/s']);
 }
 if(/echo|radar.*range|round.trip|out.and.back/.test(both)){
  return scaffold('echo-path',withGiven(phase=>box(75,140,65,90)+line(575,70,575,320)+text(110,274,'Source','wb-legend','middle')+text(575,357,'Target','wb-legend','middle')+arrow(155,150,553,150,'wb-a')+(phase?arrow(553,233,155,233,'wb-b',true)+text(345,95,'One range, two travel legs','wb-label','middle'):'')), 'Trace the path covered during the measured delay. Where does the clock stop?', 'The signal returns to its starting point. Divide the total path by two.', ['Total path = speed × echo delay','Range = speed × echo delay / 2']);
 }
 if(/magnetic|magnet|flux|induced|emf|induction/.test(both)){
  const induction=/flux|emf|induc|coil/.test(both);
  return scaffold(induction?'changing-flux':'magnetic-field',withGiven(phase=>box(75,160,155,65)+text(108,202,'N','wb-label')+text(193,202,'S','wb-label')+(induction?Array.from({length:5},(_,i)=>'<ellipse cx="'+(400+i*25)+'" cy="195" rx="28" ry="105" class="wb-line"/>').join('')+text(458,350,'Coil','wb-label','middle')+(phase?arrow(255,195,340,195,'wb-a',true)+text(330,65,'Does linked flux change?','wb-label','middle'):''):phase?'<path d="M90 155C30 40 280 20 240 175" class="wb-a" data-motion="draw"/>'+arrow(185,77,213,98,'wb-a')+text(350,120,'Outside: N → S','wb-label'):'')), induction?'Name what can change: field, area, orientation, or number of linked turns.':'Mark north and south. Which way would the north end of a compass point?',induction?'Induction requires changing linked flux. A steady flux alone produces no emf.':'Field direction is local. Use arrows that form continuous loops.',induction?['|εavg| = N |ΔΦ| / Δt','Φ = BA cos θ (uniform field)']:['Fields add as vectors.','Outside a bar magnet: north → south.']);
 }
 if(/wavelength|frequency|period|amplitude|wave|cycles|pitch/.test(both)&&!/cycle.*engine|coil/.test(both)){
  const drawing=phase=>line(60,215,635,215,'wb-axis')+'<polyline points="'+Array.from({length:121},(_,i)=>[65+4.6*i,215-70*Math.sin(i*Math.PI/30)].join(',')).join(' ')+'" class="wb-a"/>'+(phase?line(134,97,410,97,'wb-component',true)+text(272,75,'One wavelength λ','wb-legend','middle')+arrow(134,215,134,145,'wb-b',true)+text(148,189,'A','wb-label'):'')+text(345,343,'Snapshot in space','wb-tick','middle');
  return scaffold('wave-scaffold',withGiven(drawing),'Separate the height of the disturbance from the spacing of repetitions.','A spatial snapshot gives wavelength. Time measurements give period and frequency.', ['v = fλ','f = cycles / time; T = 1/f','Amplitude: equilibrium to a peak']);
 }
 return null;
}
