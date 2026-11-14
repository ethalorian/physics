/* Each graphic uses the quantities and situations in the existing Section E task. */
window.createFoundationTransferVisual = function (React) {
  const h=React.createElement;
  const C={ink:'#fff9ef',dim:'#c5bdd6',grid:'#48405c',purple:'#c0a0f1',orange:'#ffb568',green:'#a8ddba',red:'#ffb0b4',panel:'#302a44'};
  const descriptions=[
    'A position axis with telescope sightings at 2, 4 and 6 km at minutes 0, 1 and 2. The next sighting is revealed separately.',
    'A rover route from +2 km to +8 km and back to +5 km. The route and start-to-finish arrow are separate.',
    'A position–time graph with +12 km at zero seconds and +6 km at three seconds. Positive is away from Earth.',
    'A velocity–time graph with +3 km/s for two seconds, followed by −1 km/s for two seconds.',
    'Two location bands centered at 20 km: team A plus or minus 1 km, team B plus or minus 4 km.',
    'A right-angle displacement map: 3 km toward Earth and 4 km sideways.',
    'Two leftward velocity arrows: −2 km/s initially and −6 km/s two seconds later.',
    'A velocity–time graph rising from +2 to +6 km/s in two seconds, initially assuming constant acceleration.',
    'Timed sightings of XJ at 0, +2 and +4 km at minutes 0, 1 and 2. Camera windows A, B and C are at +4, +6 and +8 km.',
    'A proposed animation with Earth pulling on XJ and an unsupported forward force arrow. The motion arrow appears on a separate layer.',
    'Two asteroid test models: mass m and mass 2m. Initially both receive the same net force for the same time.',
    'Two tests of the same asteroid mass with net pushes F and 2F for the same time.',
    'A 4 kg tracking model moving left, with a 12 N rightward force and a 4 N leftward force.',
    'Earth and XJ have their own animation panels. Check the proposed force arrows.',
    'A boundary around XJ with selectable conceptual layers for Earth on XJ, XJ on Earth, and velocity.',
    'One gravitational force is represented by two perpendicular components. A proposed sum incorrectly counts the original and its components.',
    'A sliding block touching a rough table beside XJ in empty space.',
    'A flight status display: net force zero and last velocity +3 km/s. Students choose stopped or coasting and locate the object two seconds later.',
    'A 3 kg tracker has forces +9 N and −3 N. A proposed calculator output ignores the negative force.',
    'A forecast pipeline shows received and missing data.',
    'Stations A and B are 7 km apart. A single sighting is 5 km right of A and 2 km left of B.',
    'Two forecast intervals share an axis: an earlier 4–6 km range and a later 5–7 km range. A proposed impact headline must be checked.'
  ];
  return function TransferVisual({day,phase,choice}) {
    const id='transfer-'+React.useId().replace(/[^\w-]/g,'');
    const updated=phase>0, done=phase===2, out=[];
    const put=(...xs)=>out.push(...xs.flat().filter(Boolean));
    const text=(x,y,v,color=C.ink,size=21,anchor='middle',attrs={})=>h('text',{x,y,fill:color,fontSize:size,textAnchor:anchor,...attrs},v);
    const line=(x1,y1,x2,y2,color=C.grid,w=2,attrs={})=>h('line',{x1,y1,x2,y2,stroke:color,strokeWidth:w,strokeLinecap:'round',...attrs});
    const rect=(x,y,w,ht,fill=C.panel,attrs={})=>h('rect',{x,y,width:w,height:ht,rx:10,fill,...attrs});
    const dot=(x,y,r=7,color=C.purple,attrs={})=>h('circle',{cx:x,cy:y,r,fill:color,...attrs});
    const path=(d,color=C.dim,w=2,attrs={})=>h('path',{d,stroke:color,strokeWidth:w,fill:'none',strokeLinecap:'round',strokeLinejoin:'round',...attrs});
    const arrow=(x1,y1,x2,y2,color=C.orange,label='',labelDy=-14)=>h('g',null,line(x1,y1,x2,y2,color,4,{markerEnd:`url(#${id}-${Object.keys(C).find(k=>C[k]===color)||'orange'})`}),label&&text((x1+x2)/2,(y1+y2)/2+labelDy,label,color,20));
    const badge=(x,y,w,label,color=C.dim)=>h('g',null,rect(x-w/2,y-24,w,39,'#242038',{stroke:color,strokeWidth:1.5}),text(x,y+2,label,color,19));
    const note=(label,color=C.dim)=>put(text(400,365,label,color,20));
    const headline=(label,color=C.dim)=>put(text(400,38,label,color,19,'middle',{letterSpacing:2}));
    const rock=(x,y,r=26,label='XJ')=>h('g',null,path(`M${x-r} ${y-4}L${x-r*.65} ${y-r*.8}L${x+r*.2} ${y-r}L${x+r} ${y-r*.15}L${x+r*.75} ${y+r*.7}L${x-r*.3} ${y+r}Z`,C.purple,2,{fill:'#65547c'}),dot(x-r*.2,y-r*.2,r*.18,'#433b59'),path(`M${x+r*.35} ${y-r*.4}l${r*.3} ${r*.45}l${-r*.4} ${r*.45}`,C.dim,1.4),label&&text(x,y+r+28,label,C.dim,20));
    const earth=(x,y,r=39)=>h('g',null,dot(x,y,r,'#345f6d',{stroke:'#a8ddba',strokeWidth:2}),h('ellipse',{cx:x,cy:y,rx:r*.45,ry:r,stroke:'#92c7b4',fill:'none',opacity:.7}),path(`M${x-r*.92} ${y-r*.2}Q${x} ${y+r*.3} ${x+r*.92} ${y-r*.2}`,C.green,1.3),text(x,y+r+27,'Earth',C.dim,20));
    const axis=(min,max,y=230,step=1,label='position (km)',tick=n=>n)=>{
      const X=n=>85+(n-min)/(max-min)*630;
      put(line(65,y,745,y,C.dim,2),text(400,y+68,label,C.dim,18));
      for(let n=min;n<=max;n+=step)put(line(X(n),y-6,X(n),y+6,C.dim),text(X(n),y+31,String(tick(n)),C.dim,18));
      return X;
    };
    const graph=(maxT,minV,maxV,label)=>{
      const X=t=>120+t/maxT*540,Y=v=>290-(v-minV)/(maxV-minV)*210;
      put(text(95,57,label,C.dim,18,'start'),line(120,75,120,290,C.dim),line(120,Y(0),700,Y(0),C.dim),text(700,322,'time (s)',C.dim,18));
      for(let t=0;t<=maxT;t++)put(line(X(t),75,X(t),290,C.grid,1,{strokeDasharray:'3 6'}),text(X(t),322,t,C.dim,18));
      for(const v of [...new Set([minV,0,maxV])])put(line(120,Y(v),680,Y(v),C.grid,1),text(98,Y(v)+6,v,C.dim,18,'end'));
      return {X,Y};
    };
    const cross=(x,y)=>put(path(`M${x-16} ${y-16}l32 32M${x+16} ${y-16}l-32 32`,C.red,4));

    if(day===1||day===9) {
      headline(day===9?'TRACKING DESK / ONE EXPOSURE AT MINUTE 3':'NIGHT CREW / THE NEXT EXPOSURE');
      const offset=day===1?2:0, X=axis(0,10,215,2,'');
      put(text(690,283,'position (km)',C.dim,18,'end')); const measured=[offset,offset+2,offset+4];
      put(line(X(offset),145,X(offset+4),145,C.purple,2,{strokeDasharray:'4 7'}));
      for(let i=0;i<3;i++)put(line(X(measured[i]),151,X(measured[i]),210,C.purple,1),dot(X(measured[i]),215,9),text(X(measured[i]),125,i+' min',C.purple,21));
      if(day===9) {
        put(arrow(85,80,210,80,C.purple,'velocity'));
        for(let i=0;i<3;i++) {
          const x=X(4+i*2),color=done&&i===1?C.green:choice===i?C.orange:C.dim;
          put(rect(x-25,183,50,42,'transparent',{stroke:color,strokeWidth:choice===i||done&&i===1?3:1.5,strokeDasharray:'6 5'}),badge(x,85,104,['A · +4','B · +6','C · +8'][i],color));
        }
      }
      if(done)put(dot(X(offset+6),215,15,'none',{stroke:C.green,strokeWidth:3,strokeDasharray:'4 4'}),text(X(offset+6),175,'forecast',C.green,18));
      if(updated) {
        const x=X(day===9?5:7);
        put(line(x,221,x,285,C.orange,2),dot(x,215,10,C.orange),dot(x,215,20,'none',{stroke:C.orange,strokeWidth:2}),badge(x,311,245,'NEW · 3 min / +'+(day===9?5:7)+' km',C.orange));
        note(done?'A forecast is not a sighting. Recheck the pattern.':'The new sighting has arrived. Keep or change your call?',done?C.green:C.orange);
      } else note('Solid dots = sightings. Choose where the camera should look.');
    } else if(day===2) {
      headline('ROVER DISPATCH / MILEAGE OR LOCATION?');const X=axis(0,10,252,1);
      put(arrow(X(2),120,X(8),120,C.orange,'outbound'),arrow(X(8),180,X(5),180,C.purple,'return'));
      for(const [n,label]of [[2,'START'],[8,'TURN'],[5,'FINISH']])put(dot(X(n),252,9),text(X(n),225,label,C.dim,17));
      if(done)put(arrow(X(2),70,X(5),70,C.green,'+3 km'),note('Mileage 9 km · displacement +3 km · finish +5 km',C.green));
      else note(updated?'DISPATCH: “Put the finish 9 km right of the start.”':'Trace the route. Then draw one start-to-finish arrow.',updated?C.orange:C.dim);
    } else if(day===3) {
      const {X,Y}=graph(3,0,12,'position (km) · positive away from Earth');
      put(line(X(0),Y(12),X(3),Y(6),C.purple,4),dot(X(0),Y(12),9),dot(X(3),Y(6),9),text(X(3)+16,Y(6)-14,'+6 km',C.purple,21),text(X(0)+18,Y(12)+30,'+12 km',C.purple,21,'start'));
      if(done)put(badge(415,107,300,'Δx / Δt = −2 km/s',C.green),note('Toward Earth. Two fixes do not prove a speed decrease.',C.green));
      else note(updated?'PROPOSED CAPTION: “Negative means braking.”':'Does a downward line tell us speed is decreasing?',updated?C.orange:C.dim);
    } else if(day===4||day===8) {
      const {X,Y}=graph(day===4?4:2,day===4?-1:0,day===4?3:6,'velocity (km/s)');
      if(day===4){
        put(path(`M${X(0)} ${Y(3)}H${X(2)}M${X(2)} ${Y(-1)}H${X(4)}`,C.purple,4),line(X(2),Y(3),X(2),Y(-1),C.dim,1,{strokeDasharray:'4 5'}));
        if(done)put(rect(X(0),Y(3),X(2)-X(0),Y(0)-Y(3),'#3c6155',{rx:0,opacity:.7}),rect(X(2),Y(0),X(4)-X(2),Y(-1)-Y(0),'#6b4438',{rx:0,opacity:.7}),text(X(1),155,'+6 km',C.green,26),text(X(3),278,'−2 km',C.orange,22),note('Net movement +4 km · distance 8 km',C.green));
        else note(updated?'LOCATION CAPTION: “8 km displacement.” Approve?':'Shade each area. Does each part move the camera the same way?',updated?C.orange:C.dim);
      }else{
        put(dot(X(0),Y(2),8),dot(X(2),Y(6),8),text(X(0)+25,Y(2)-14,'+2',C.purple,21,'start'));
        if(done)put(path(`M${X(0)} ${Y(0)}L${X(0)} ${Y(2)}L${X(2)} ${Y(6)}L${X(2)} ${Y(0)}Z`,C.grid,1,{fill:C.purple,opacity:.13}));
        if(!updated||done)put(path(`M${X(0)} ${Y(2)}L${X(2)} ${Y(6)}`,C.purple,3,{strokeDasharray:updated?'6 6':undefined}));
        if(updated)put(path(`M${X(0)} ${Y(2)}Q${X(1.5)} ${Y(2)} ${X(2)} ${Y(6)}`,C.orange,3),text(435,220,'Another possible trace',C.orange,19));
        if(done)put(badge(360,105,330,'Straight trace: Δx = +8 km',C.green),note('Same endpoints. A different area is possible.',C.green));
        else note(updated?'UPDATE: Acceleration varied. Is the area still fixed?':'Initial rehearsal: constant acceleration.',updated?C.orange:C.dim);
      }
    } else if(day===5||day===22) {
      headline(done?'FORECAST DESK / BOUNDS, NOT PROBABILITY':'FORECAST DESK / SEARCH THE SKY');const X=axis(day===5?15:3,day===5?25:8,270,1);
      const bands=day===5?[[19,21,'TEAM A · 20 ± 1 km'],[16,24,'TEAM B · 20 ± 4 km']]:[[4,6,'EARLIER · 4–6 km'],[5,7,'LATER · 5–7 km']];
      bands.forEach(([a,b,label],i)=>{const y=125+i*90,color=i?C.orange:C.purple;put(rect(X(a),y-20,X(b)-X(a),40,color,{opacity:.25}),line(X(a),y,X(b),y,color,5),dot(X(a),y,6,color),dot(X(b),y,6,color),text(400,y-34,label,color,21))});
      if(done&&day===22)put(rect(X(5),102,X(6)-X(5),140,C.green,{opacity:.17}),text(X(5.5),255,'5–6 km',C.green,20));
      note(done?(day===5?'A: 19–21 km · B: 16–24 km. No impact probability given.':'Overlap: 5–6 km. The bands do not confirm impact.'):(day===5?'PROPOSED LABEL: “Wider band = higher impact chance.”':updated?'CALLER: “Overlap gives the impact probability.”':'PROPOSED HEADLINE: “Impact confirmed.”'),done?C.green:updated?C.orange:C.dim);
    } else if(day===6) {
      headline('NAVIGATION / SEND THE WHOLE DISPLACEMENT');
      put(earth(175,260,32),dot(335,290,7),arrow(335,290,335,70,C.purple),arrow(500,290,335,290,C.orange,'3 km toward Earth',28),text(300,175,'4 km',C.purple,21,'end'),text(300,201,'sideways',C.purple,18,'end'),rock(500,290,18,'start'));
      put(line(500,70,335,70,C.grid,1,{strokeDasharray:'5 7'}));
      if(done)put(arrow(500,290,335,70,C.green,'5 km'),note('Both components belong in the camera instruction.',C.green));
      else note(updated?'The Earth-line tracker cannot see the sideways component.':'Does “7 km closer to Earth” describe this movement?',updated?C.orange:C.dim);
    } else if(day===7) {
      headline('TELEMETRY / TWO SECONDS APART');
      put(rock(570,130,25,''),rock(570,255,25,''),arrow(530,130,430,130,C.purple,'−2 km/s'),arrow(530,255,230,255,C.purple,'−6 km/s'),text(650,137,'BEFORE',C.dim,18),text(650,262,'AFTER',C.dim,18));
      if(done)put(badge(270,90,280,'a = −2 km/s²',C.green),note('The leftward arrow is longer: speed rose from 2 to 6 km/s.',C.green));
      else note(updated?'PROPOSED BANNER: “Negative acceleration means slowing.”':'Use the arrow lengths to choose the speed alert.',updated?C.orange:C.dim);
    } else if(day===10) {
      headline(done?'APPROVED FORCE AND MOTION LAYERS':'PROPOSED FORCE LAYER / CHECK EACH SOURCE');
      put(earth(140,168),rock(450,168,35,''),arrow(407,168,265,168,C.orange,'Earth on XJ'),arrow(495,168,655,168,done?C.grid:C.orange,done?'': '“because it moves”'),line(95,260,705,260,C.grid),text(180,307,'MOTION LAYER',C.dim,18),arrow(407,308,570,308,C.purple,'velocity'));
      if(done)cross(580,168);
      note(done?'Gravity needs no contact. Motion is not a source of force.':updated?'UPDATE: Earth and XJ are not touching.':'Name the source and receiver of each proposed force.',done?C.green:updated?C.orange:C.dim);
    } else if(day===11||day===12) {
      headline(day===11?'TEST CARD / SAME DURATION':'TEST CARD / SAME MASS AND DURATION');
      for(let i=0;i<2;i++){
        const x=220+i*360;put(rect(x-140,75,280,235),text(x,108,i?'RUN H':'RUN L',C.dim,20),rock(x-35,195,day===11&&i?40:29,''));
        const double=i&&(day===12||updated);put(arrow(x+10,190,x+10+(double?110:55),190,C.orange,double?'2F':'F'),text(x,274,day===11&&i?'mass 2m':'mass m',C.purple,23));
      }
      if(day===12&&updated)put(badge(400,328,530,'UPDATE: readings were motor pull, with drag opposing',C.orange));
      note(done?(day===11?'First test: aH = ½aL. Updated test: aH = aL.':'Use the net force after including drag.'):(day===11?(updated?'UPDATE: H received twice the net force.':'Same net force. Which velocity changes more?'):'Which velocity change should be larger?'),done?C.green:updated?C.orange:C.dim);
    } else if(day===13||day===19) {
      const is13=day===13;headline(is13?'CONTROL ROOM / MOTION ≠ ACCELERATION':'CALCULATOR CHECK / FIND THE FIRST WRONG STEP');
      put(rect(335,150,130,65,'#65547c',{stroke:C.purple,strokeWidth:2}),text(400,192,is13?'4 kg':'3 kg',C.ink,27),arrow(325,182,is13?260:240,182,C.orange,is13?'4 N':'−3 N'),arrow(475,182,is13?670:730,182,C.orange,is13?'12 N':'+9 N'));
      if(is13){put(arrow(400,93,240,93,C.purple,'velocity'));if(done)put(arrow(370,270,540,270,C.green,'a = 2 m/s²'),note('It slows while it still moves left.',C.green));else note(updated?'DISPLAY: “Rightward force proves rightward motion.”':'Set the force and acceleration arrows.',updated?C.orange:C.dim)}
      else{put(badge(400,90,420,done?'(+9 − 3) ÷ 3 = +2 m/s²':'DISPLAY: 9 ÷ 3 = 3 m/s²',done?C.green:C.orange));note(done?'Both forces belong in the sum: +6 N.':updated?'UPDATE: The developer fixed only the unit label.':'Can this calculation go live?',done?C.green:updated?C.orange:C.dim)}
    } else if(day===14) {
      headline('ANIMATION DESK / PUT EACH ARROW ON ITS RECEIVER');
      put(rect(60,80,310,230),rect(430,80,310,230),text(215,113,'EARTH PANEL',C.dim,20),text(585,113,'XJ PANEL',C.dim,20),earth(175,205,38),rock(630,205,32,''));
      if(done)put(arrow(215,205,330,205,C.orange),text(272,160,'XJ on Earth',C.orange,18),arrow(590,205,475,205,C.orange),text(530,160,'Earth on XJ',C.orange,18),note('Equal and opposite forces. Different receivers.',C.green));
      else{put(arrow(590,205,475,205,C.orange),arrow(580,250,695,250,C.orange),text(585,286,'PROPOSAL: “They cancel.”',C.orange,18));note(updated?'AIR ONLY THE XJ PANEL. Which arrow stays?':'The proposal places both arrows on XJ. Check the receivers.',updated?C.orange:C.dim)}
    } else if(day===15) {
      headline('SYSTEMS DESK / BUILD “FORCES ON XJ”');
      put(earth(120,180,34),rock(400,180,34,''),rect(320,95,160,180,'none',{stroke:C.purple,strokeWidth:2,strokeDasharray:'7 7'}),text(400,303,'XJ boundary',C.purple,20),arrow(355,180,220,180,C.orange,'Earth on XJ'),arrow(160,245,295,245,done?C.grid:C.orange,'XJ on Earth',30),arrow(445,75,600,75,C.purple,'velocity'));
      if(updated)put(rock(670,190,24,'second body'),arrow(445,180,580,180,C.orange,'new pull'));
      if(done)cross(230,245);
      note(done?'Keep outside forces on XJ. Put velocity on a separate layer.':updated?'UPDATE: A second body pulls on XJ.':'Which arrows belong inside this force calculation?',done?C.green:updated?C.orange:C.dim);
    } else if(day===16) {
      headline(done?'NAVIGATION OVERLAY / COUNT THE PULL ONCE':'NAVIGATION DESK / AUDIT THE FORCE OVERLAY');
      put(rock(200,95,25,''),arrow(205,110,485,275,done?C.grid:C.orange,'full force'),arrow(205,110,485,110,C.purple,'horizontal component'),arrow(485,110,485,275,C.purple),text(520,187,'vertical',C.purple,20,'start'),text(520,211,'component',C.purple,20,'start'),path('M465 110v20h20',C.dim,1.5));
      if(done)put(note('Use the full force OR its components in the sum.',C.green));
      else note(updated?'CALCULATOR REQUEST: Add the full force and both components.':'The two component arrows represent the same single pull.',updated?C.orange:C.dim);
    } else if(day===17) {
      headline('EDITING DESK / TWO SCENES, DIFFERENT CONTACTS');
      put(rect(50,75,335,245),rect(415,75,335,245),text(217,110,'ROUGH TABLE',C.dim,20),text(582,110,updated?'ATMOSPHERE':'EMPTY SPACE',updated?C.orange:C.dim,20),line(75,254,360,254,C.dim,3),rect(163,200,92,52,'#65547c',{stroke:C.purple}),arrow(183,170,290,170,C.purple,'motion'),rock(582,220,31,''),arrow(580,165,680,165,C.purple,'motion'));
      for(let x=85;x<350;x+=19)put(line(x,254,x-9,266,C.dim,1));
      if(updated)for(let i=0;i<24;i++)put(dot(440+(i%6)*50,140+Math.floor(i/6)*47,2,C.orange));
      if(done)put(arrow(160,225,95,225,C.orange),text(135,297,'contact friction',C.orange,18),text(580,297,updated?'check drag + other forces':'no surface friction',C.orange,18));
      note(done?'No rubbing surface in empty space. Gravity can still act.':updated?'NEW SHOT: XJ is inside an atmosphere.':'PROPOSED CAPTION: “Both stop from surface friction.”',done?C.green:updated?C.orange:C.dim);
    } else if(day===18) {
      headline('FLIGHT STATUS / CHOOSE THE LOWER-THIRD');
      put(badge(230,98,270,updated?'UPDATE: net force ≠ 0':'net force = 0',updated?C.orange:C.green),badge(570,98,280,'last v = +3 km/s',C.purple));
      const X=axis(0,8,255,2,'position relative to the first fix (km)');put(dot(X(0),255,10),text(X(0),220,'NOW',C.purple,19),badge(270,166,190,'STOPPED',done?C.grid:C.dim),badge(540,166,250,done?'FIRST: COASTING':'COASTING',done?C.green:C.dim));
      if(done)put(dot(X(6),255,12,'none',{stroke:C.green,strokeWidth:3,strokeDasharray:'4 4'}),text(X(6),222,'old 2 s forecast',C.green,19));
      note(done?'+6 km was valid under balance. Recheck after the new pull.':updated?'Can “coasting” still describe the next interval?':'Zero net force. What happens to the existing motion?',done?C.green:updated?C.orange:C.dim);
    } else if(day===20) {
      headline('MISSION SYSTEMS / KNOWN → STILL NEEDED');
      const box=(x,y,title,state,color)=>put(rect(x,y,210,70),text(x+105,y+27,title,C.ink,19),text(x+105,y+53,state,color,18));
      box(50,90,'net force','RECEIVED',C.green);box(50,190,'mass','RECEIVED',C.green);put(arrow(275,175,330,175,C.purple));
      box(345,140,'acceleration',done?'CAN CALCULATE':'?',done?C.green:C.dim);
      box(580,70,'start position',updated?'RECEIVED':'MISSING',updated?C.green:C.orange);box(580,165,'start velocity','MISSING',C.orange);box(580,260,'elapsed time','MISSING',C.orange);
      note(done?'Also specify how force behaves during the forecast interval.':updated?'Start position arrived. Is the forecast ready?':'Can the desk release a final position?',done?C.green:updated?C.orange:C.dim);
    } else if(day===21) {
      headline('OBSERVATORY MAP / TWO ZEROS, ONE LOCATION');const X=axis(0,7,260,1,updated?'position from station B (km)':'position from station A (km)',n=>updated?n-7:n);
      put(badge(X(0)+20,92,120,'STATION A',C.purple),badge(X(7)-20,92,120,'STATION B',C.orange),line(X(0),115,X(0),252,C.purple,1,{strokeDasharray:'4 6'}),line(X(7),115,X(7),252,C.orange,1,{strokeDasharray:'4 6'}),dot(X(5),260,10,C.green),text(X(5),224,'same sighting',C.green,20),arrow(X(0),145,X(5),145,C.purple,'5 km right of A'),arrow(X(7),191,X(5),191,C.orange,'2 km left of B'));
      note(done?'A frame: +5 km. B frame: −2 km. The object has not moved.':updated?'DIRECTOR: Move zero to station B.':'Do the two reports disagree?',done?C.green:updated?C.orange:C.dim);
    }
    function labels(node) { if(!node||typeof node!=='object')return []; const children=React.Children.toArray(node.props?.children); return node.type==='text'?[children.join('')]:children.flatMap(labels); }
    return h('svg',{className:'transfer-scene',viewBox:'0 0 800 390',role:'img','aria-label':descriptions[day-1]+' Visible labels: '+out.flatMap(labels).join('. ')},
      h('defs',null,...['purple','orange','green','dim','grid'].map(k=>h('marker',{key:k,id:id+'-'+k,viewBox:'0 0 10 10',refX:8.5,refY:5,markerWidth:3,markerHeight:3,orient:'auto-start-reverse'},h('path',{d:'M0 0L10 5L0 10Z',fill:C[k]}))),h('pattern',{id:id+'-grid',width:40,height:40,patternUnits:'userSpaceOnUse'},h('path',{d:'M40 0H0V40',stroke:'#393149',strokeWidth:.7,fill:'none'}))),
      rect(0,0,800,390,'#242038',{rx:0}),rect(0,0,800,340,`url(#${id}-grid)`,{rx:0}),...out.map((node,i)=>h('g',{key:i},node)));
  };
};
