/* Projector-sized physics evidence, authored for each opening. No binder art is changed. */
window.createFoundationOpeningVisual = function (React) {
  const h=React.createElement;
  const C={ink:'#29263d',purple:'#64518d',orange:'#b6532a',green:'#287458',muted:'#77738a',line:'#d6d2e2',pale:'#eeebf6',white:'#fffefa'};
  const descriptions={
    1:'Timed position sightings, with measured positions distinguished from an unconfirmed prediction.',
    2:'An outward and return route, distinguishing total distance from start-to-finish displacement.',
    3:'Position–time graphs. Height gives position; slope gives velocity.',
    4:'A velocity–time graph with positive and negative displacement areas.',
    5:'A position number line that includes the starting position in the forecast.',
    6:'A three-by-four right-angle route with a straight start-to-finish resultant.',
    7:'Signed velocity arrows showing that motion direction and acceleration direction can differ.',
    8:'A braking velocity–time graph. The area under the falling line is a triangle.',
    9:'A hand in contact with a cart and a cart after release. Motion and force use separate arrows.',
    10:'A supported book with weight downward and two upward supports.',
    11:'Cart trials with the same net force and different moving masses.',
    12:'A fixed-mass force experiment, or a cart-and-hanger mass-transfer comparison.',
    13:'A cart with opposing horizontal forces. Acceleration depends on their signed sum.',
    14:'Two separate receivers of an equal and opposite contact-force pair.',
    15:'Weight and support or tension on one object, with velocity shown separately.',
    16:'An inclined surface. Weight stays vertical; the normal is perpendicular to the surface.',
    17:'Static friction adjusts to the pull below its limit; sliding uses kinetic friction.',
    18:'A weighted beam with two unequal support forces that add to the load.',
    19:'A force-sum audit or a signed velocity change on a number line.',
    20:'An accelerating cart or a velocity–time area used to predict displacement.',
    21:'A change of coordinate origin, or the missing location and direction in a camera report.',
    22:'Forecast and measurement intervals compared on the same position axis.',
  };
  return function OpeningVisual({day,mode,step=0,revealed=false}) {
    const id='opening-v-'+React.useId().replace(/[^a-zA-Z0-9]/g,'');
    const claim=mode==='claim', done=claim?revealed:step===2;
    const bits=[];
    const put=(...items)=>bits.push(...items.flat().filter(Boolean));
    const text=(x,y,value,color=C.ink,size=20,anchor='middle',attrs={})=>h('text',{x,y,fill:color,fontSize:size,textAnchor:anchor,...attrs},value);
    const line=(x1,y1,x2,y2,color=C.line,width=2,attrs={})=>h('line',{x1,y1,x2,y2,stroke:color,strokeWidth:width,strokeLinecap:'round',...attrs});
    const path=(d,color=C.ink,width=3,attrs={})=>h('path',{d,fill:'none',stroke:color,strokeWidth:width,strokeLinecap:'round',strokeLinejoin:'round',...attrs});
    const rect=(x,y,w,ht,fill=C.white,attrs={})=>h('rect',{x,y,width:w,height:ht,rx:10,fill,...attrs});
    const dot=(x,y,r=7,color=C.purple,attrs={})=>h('circle',{cx:x,cy:y,r,fill:color,...attrs});
    const arrow=(x1,y1,x2,y2,color=C.orange,label='',attrs={})=>h('g',null,line(x1,y1,x2,y2,color,4,{markerEnd:'url(#'+id+'-'+(color===C.orange?'orange':color===C.green?'green':'purple')+')',...attrs}),label&&text((x1+x2)/2+(Math.abs(x2-x1)<Math.abs(y2-y1)*.4?22:0),(y1+y2)/2+(Math.abs(x2-x1)<Math.abs(y2-y1)*.4?7:-15),label,color,19,Math.abs(x2-x1)<Math.abs(y2-y1)*.4?'start':'middle'));
    const badge=(x,y,label,color=C.purple,w=190)=>h('g',null,rect(x-w/2,y-25,w,38,C.white,{stroke:C.line}),text(x,y,label,color,20));
    const cart=(x,y,label='cart',loads=0)=>h('g',{transform:`translate(${x} ${y})`},
      rect(-45,-31,90,39,C.pale,{stroke:C.purple,strokeWidth:2}),
      text(0,-7,label,C.ink,18),...[-28,28].map(cx=>dot(cx,16,10,C.ink)),
      ...Array.from({length:loads},(_,i)=>rect(-32+(i%2)*34,-53-Math.floor(i/2)*24,29,21,'#cdc5df',{stroke:C.purple})));
    const hand=(x,y,flip=false)=>h('g',{transform:`translate(${x} ${y}) scale(${flip?-1:1} 1)`},path('M-66 15h25L-23 2H12Q21 2 21 10Q21 17 12 17H-6L9 24Q17 28 12 35Q8 41-2 36L-20 29L-35 36H-66Z',C.ink,2,{fill:'#eadbc9'}));
    const numberline=(min,max,y=250,label='position (m)')=>{
      const X=n=>95+(n-min)/(max-min)*570;
      put(line(75,y,685,y,C.muted),text(380,y+64,label,C.muted,18));
      for(let n=min;n<=max;n++)put(line(X(n),y-6,X(n),y+6,C.muted),text(X(n),y+30,String(n),C.muted,17));
      return X;
    };
    const graph=(xmax,ymax,ylabel,options={})=>{
      const zero=options.signed?180:270, bottom=options.signed?280:270;
      const X=n=>110+n/xmax*510,Y=n=>zero-n/ymax*(options.signed?105:190);
      put(line(110,55,110,bottom,C.muted),line(110,zero,660,zero,C.muted),text(104,32,ylabel,C.muted,18,'start'),text(670,zero+28,'t (s)',C.muted,18));
      for(let n=0;n<=xmax;n++)put(line(X(n),zero-5,X(n),zero+5,C.muted),text(X(n),options.signed?bottom+24:zero+27,n,C.muted,17));
      for(const n of options.signed?[-ymax,0,ymax]:[0,ymax/2,ymax])put(text(91,Y(n)+6,n,C.muted,17,'end'),line(110,Y(n),640,Y(n),C.line,1,{strokeDasharray:'4 6'}));
      return {X,Y};
    };
    const forces=(x,y,left,right,mass,accel=null)=>{
      put(line(85,y+30,675,y+30,C.muted),cart(x,y,mass));
      if(left)put(arrow(x-50,y-10,x-50-left*11,y-10,C.orange,`${left} N`));
      if(right)put(arrow(x+50,y-10,x+50+right*11,y-10,C.orange,`${right} N`));
      if(accel!==null)put(accel===0?badge(x,y-95,'a = 0',C.purple):arrow(x,y-85,x+accel*65,y-85,C.purple,'a'));
    };

    if(day===1){
      const X=numberline(0,6,240);
      put(text(380,54,claim?'MEASURED … OR PREDICTED?':'ONE POSITION AT EACH BEEP',C.purple,20));
      for(let i=0;i<3;i++){
        const measured=claim?i<2:(i<=step);
        put(dot(X(i*2),240,10,measured?C.purple:C.white,{stroke:C.purple,strokeWidth:3,strokeDasharray:measured?undefined:'4 4'}),text(X(i*2),198,measured?i+' s':'next?',measured?C.ink:C.muted));
      }
      if(claim&&done)put(badge(X(4),134,'Prediction ≠ sighting',C.orange,240));
      else put(text(380,110,'Where will the next reading land?',C.muted,24));
    }else if(day===2){
      const X=numberline(0,5);const end=claim?0:2;
      put(text(380,45,claim?'OUT … AND BACK TO THE START':'A WALK WITH A TURN',C.purple,20),dot(X(0),250,9));
      if(claim||step>=1)put(arrow(X(0),130,X(4),130,C.orange,'4 steps out'));
      if(claim||step>=2)put(arrow(X(4),185,X(end),185,C.green,claim?'4 steps back':'2 steps back'));
      put(dot(X(claim||step===2?end:step===1?4:0),250,11,C.purple));
      if(done)put(badge(380,76,claim?'Distance 8 · displacement 0':'Distance 6 · displacement +2',C.purple,390));
    }else if(day===3){
      const {X,Y}=graph(3,8,'position (m)');
      if(claim){
        put(path(`M${X(0)} ${Y(8)}H${X(3)}`,C.orange,5),text(X(1.5),Y(8)-14,'A: high and flat',C.orange),path(`M${X(0)} ${Y(0)}L${X(3)} ${Y(6)}`,C.purple,5),text(X(2.2),Y(2),'B: lower, but rising',C.purple));
        if(done)put(badge(390,324,'A: v = 0    B: v = +2 m/s',C.green,390));
      }else{
        for(let i=0;i<=step;i++)put(dot(X(i),Y(6-2*i)),text(X(i)+25,Y(6-2*i)-12,`${6-2*i} m`));
        if(step>0)put(path(`M${X(0)} ${Y(6)}L${X(step)} ${Y(6-2*step)}`,C.purple,4));
        if(done)put(arrow(X(1),Y(4),X(2),Y(4),C.green,'1 s'),arrow(X(2),Y(4),X(2),Y(2),C.orange),badge(360,324,'Slope = −2 m/s',C.purple,230));
      }
    }else if(day===4){
      const {X,Y}=graph(4,2,'velocity (m/s)',{signed:true});
      put(rect(X(0),Y(2),X(2)-X(0),Y(0)-Y(2),'#dbe9df',{rx:0}),path(`M${X(0)} ${Y(2)}H${X(2)}`,C.green,4),text(X(1),Y(1),claim?'above the axis':'+4 m',C.green,24));
      if(claim||step>=1)put(rect(X(2),Y(0),X(4)-X(2),Y(-1)-Y(0),'#f2ddcc',{rx:0}),path(`M${X(2)} ${Y(-1)}H${X(4)}`,C.orange,4),text(X(3),Y(-.65),claim&&!done?'What sign?':'−2 m',C.orange,22));
      if(done)put(badge(380,351,'+4 + (−2) = +2 m',C.purple,290));
    }else if(day===5){
      const X=numberline(0,claim?12:10);const start=claim?8:2;
      put(dot(X(start),250,10),text(X(start),claim?236:219,'start',C.purple),text(380,48,claim?'THE CLOCK STARTS HERE':'TWO POSSIBLE ENDPOINTS',C.purple,20));
      if(claim){put(cart(X(8),185),text(380,88,'At t = 0, displacement = 0.',C.ink,25));if(done)put(badge(380,125,'Position is still +8 m.',C.green,320));}
      else {if(step>=1)put(arrow(X(2),130,X(6),130,C.green,'2 m/s × 2 s'),dot(X(6),250,9,C.green));if(step>=2)put(arrow(X(2),185,X(8),185,C.orange,'3 m/s × 2 s'),rect(X(6),236,X(8)-X(6),28,'#dbe9df',{opacity:.65}),dot(X(8),250,9,C.orange),badge(380,80,'Final position: 6 to 8 m',C.purple,320));}
    }else if(day===6){
      const a=[200,285],b=[365,285],c=[365,65];
      put(text(380,40,'FOLLOW THE ROUTE. THEN JOIN ITS ENDS.',C.purple,20),dot(...a),text(145,290,'start',C.muted,18));
      for(let x=200;x<=365;x+=55)put(line(x,65,x,285,C.line,1));for(let y=65;y<=285;y+=55)put(line(200,y,365,y,C.line,1));
      put(arrow(...a,...b,C.orange,'3 m east'));
      if(claim||step>=1)put(arrow(...b,...c,C.green),text(500,185,'4 m north',C.green));
      if(claim||step===2)put(arrow(...a,...c,C.purple),badge(275,170,claim&&!done?'7 m?':'5 m',C.purple,95));
      if(done)put(text(380,330,'Route: 7 m     Displacement magnitude: 5 m',C.ink,22));
    }else if(day===7){
      put(text(380,42,claim?'NEGATIVE VELOCITY, GETTING MORE NEGATIVE':'MOVING LEFT — BUT SLOWING',C.purple,20));
      const vals=claim?[-2,-4]:[-6,-4,-2];
      vals.forEach((v,i)=>{const y=105+i*75;put(text(145,y+6,`${i} s`,C.muted,20));if(claim||i<=step)put(cart(490,y,'cart'),arrow(430,y-8,430+v*36,y-8,C.purple,`${v} m/s`));else put(text(380,y,'Predict the next velocity',C.muted,20));});
      if(done)put(badge(380,333,claim?'Δv = −2 m/s → speed grows':'Δv = +2 m/s each second',C.green,400));
    }else if(day===8||(day===20&&claim)){
      const start=day===20?0:claim?8:4,finish=day===20?6:0,max=Math.max(start,finish),{X,Y}=graph(2,max,'velocity (m/s)');
      if(claim)put(rect(X(0),Y(max),X(2)-X(0),Y(0)-Y(max),'#efe3d9',{rx:0}),text(X(1),Y(max)+28,day===20?'6 × 2 = 12 m?':'8 m every second?',C.orange,21));
      const end=claim?2:step;
      if(done)put(path(`M${X(0)} ${Y(0)}L${X(0)} ${Y(start)}L${X(2)} ${Y(finish)}L${X(2)} ${Y(0)}Z`,C.green,2,{fill:'#d4e5d9'}));
      put(path(`M${X(0)} ${Y(start)}L${X(end)} ${Y(start+(finish-start)*end/2)}`,C.purple,5));
      for(let i=0;i<=end;i++)put(dot(X(i),Y(start+(finish-start)*i/2)));
      if(done)put(badge(380,324,`Area = ½ × 2 × ${max} = ${max} m`,C.green,370));
    }else if(day===9){
      if(claim){
        put(text(380,38,'WHAT ENDS? WHAT STAYS WITH THE CART?',C.purple,20));
        [[205,'IN CONTACT'],[565,'AFTER RELEASE']].forEach(([x,label])=>put(rect(x-168,64,336,236,C.white,{stroke:C.line}),text(x,98,label,C.muted,18),line(x-135,250,x+135,250,C.line),cart(x,219,'2 kg'),badge(x,281,'same mass',C.purple,150)));
        put(hand(133,203),arrow(260,212,325,212,C.orange,done?'hand force':'push'),arrow(520,154,612,154,C.purple,'v →'));
        if(done)put(text(565,178,'No hand force',C.green,20),text(205,154,'Contact produces a force.',C.orange,18),text(380,335,'Inertia belongs to the cart because it has mass.',C.green,23));
        else put(text(380,335,'Assume negligible horizontal resistance after release.',C.muted,18));
      }else{
        const x=[220,370,490][step];
        put(text(380,42,['PULLING STEADILY','THE INSTANT CONTACT ENDS','A MOMENT LATER'][step],C.purple,22),line(60,255,700,255,C.muted),cart(x,225,'cart'),arrow(x-50,215,x-140,215,C.orange,'friction'),arrow(x-35,125,x+(step===2?27:75),125,C.purple,'velocity'));
        if(step===0)put(hand(x+68,210,true),arrow(x+100,215,x+190,215,C.orange,'pull'));
        if(step===1)put(hand(x+180,192,true),text(570,276,'contact ends',C.orange,20));
        if(step===2)put(h('g',{opacity:.28},cart(370,225,'earlier')),path('M415 240H445',C.muted,2,{strokeDasharray:'5 7'}),text(370,292,'previous position',C.muted,17));
        put(text(380,325,['Equal horizontal forces; constant velocity.','Friction remains. Velocity does not vanish.','Still rightward; less speed.'][step],C.ink,23));
      }
    }else if(day===10||day===15){
      const lamp=day===15&&claim;
      if(lamp){
        put(text(380,40,'ONE OBJECT. WHICH INTERACTIONS?',C.purple,20),line(380,70,380,169,C.ink,4),path('M350 170H410L440 222H320Z',C.ink,2,{fill:'#e8dfbc'}),arrow(380,168,380,82,C.orange,'T'),arrow(380,226,380,310,C.orange,'weight'));
        put(arrow(575,225,575,135,C.purple,'v'),text(575,265,done?'motion, not a force':'another force?',done?C.green:C.muted,20));
        if(done)put(path('M510 100V280',C.line,2,{strokeDasharray:'5 6'}),text(180,206,'Earth + rope',C.green,23));
      }else{
        const extra=day===10?(claim?4:step>=1?4:0):0;
        const support=day===15?(step===0?10:14):10-extra;
        put(text(380,38,day===10?'THE WEIGHT STAYS THE SAME':'HELD STILL → ACCELERATING UPWARD',C.purple,20),rect(300,154,160,46,'#ded7eb',{stroke:C.purple,strokeWidth:2}),text(380,184,'book',C.ink,20),arrow(380,207,380,277,C.orange,'10 N'));
        put(arrow(310,150,310,150-support*7,C.orange,(claim&&!done)||(day===10&&step===1)?'?':support+' N'));
        if(extra)put(arrow(450,150,450,150-extra*7,C.green,'4 N'));
        put(hand(285,196),extra&&hand(477,196,true),text(380,343,day===15?(step===0?'a = 0':'Upward support exceeds weight.'):(done?'Upward forces add to 10 N.':'How is the support shared?'),C.purple,22));
      }
    }else if(day===11||day===12&&!claim){
      const masses=day===11?[1,2,4]:[2,2,2],forcesN=day===11?[4,4,4]:[2,4,6];
      put(text(380,36,day===11?'KEEP NET FORCE FIXED · CHANGE MASS':'KEEP MASS FIXED · CHANGE NET FORCE',C.purple,20));
      masses.forEach((mass,i)=>{const y=111+i*79,show=claim||i<=step;put(text(80,y,`Trial ${i+1}`,C.muted,18));if(show){put(cart(260,y,mass+' kg',i*(day===11?1:0)),arrow(325,y-12,325+forcesN[i]*24,y-12,C.orange,forcesN[i]+' N'),text(625,y,(!claim||done)?'a = '+forcesN[i]/mass+' m/s²':'a = ?',C.purple,22));}else put(text(395,y,'Predict the next trial',C.muted,22));});
    }else if(day===12){
      put(text(380,36,done?'TRANSFER MASS — KEEP THE TOTAL FIXED':'ADDING MASS CHANGES TWO THINGS',C.purple,20));
      [180,550].forEach((x,i)=>{const cm=i===0||!done?'1.8':'1.6',hm=i===0?'0.2':'0.4';put(text(x,77,i===0?'BEFORE':done?'TRANSFERRED':'PROPOSED CHANGE',C.muted,18),line(x-110,190,x+80,190,C.muted),cart(x-20,157,cm+' kg'),path(`M${x+25} 147H${x+95}V230`,C.ink,2),dot(x+88,155,11,C.white,{stroke:C.ink,strokeWidth:2}),rect(x+68,228,50,57,C.pale,{stroke:C.purple}),text(x+93,252,hm,C.ink,18),text(x+93,275,'kg',C.muted,16),badge(x,325,'Total '+(i===0||done?'2.0':'2.2')+' kg',i===1&&!done?C.orange:C.green,215));});
    }else if(day===13||day===19&&!claim){
      const left=day===19?3:4,right=day===19?9:claim?12:[6,4,2][step],mass=day===19?3:claim?4:2;
      put(text(380,42,'ADD THE FORCES BEFORE DIVIDING BY MASS',C.purple,20));forces(380,216,left,right,mass+' kg',claim?null:(right-left)/mass);
      const equation=day===19?(step===0?'Which arrows belong in the sum?':step===1?'9 ÷ 3 = 3 … ?':'(9 − 3) ÷ 3 = +2 m/s²'):claim?(done?'(12 − 4) ÷ 4 = +2 m/s²':'12 ÷ 4 = 3 … ?'):`ΣF = ${right-left>0?'+':''}${right-left} N`;
      put(badge(380,325,equation,done?C.green:C.orange,440));
    }else if(day===14){
      const separated=!claim&&step===2;
      put(text(380,36,'EQUAL FORCES. DIFFERENT RECEIVERS.',C.purple,20));
      [220,540].forEach((x,i)=>put(rect(x-142,75,284,216,C.white,{stroke:C.line,strokeDasharray:'7 5'}),text(x,105,i===0?'LEFT OBJECT':'RIGHT OBJECT',C.muted,18)));
      if(claim)put(cart(270,205,'cart A'),cart(490,205,'cart B'));
      else put(hand(separated?230:359,190),hand(separated?530:401,190,true));
      if(!separated)put(arrow(265,147,150,147,C.orange,'on left'),(claim||step>=1)&&arrow(495,147,610,147,C.orange,'on right'));
      put(text(380,331,separated?'No contact → neither contact force remains.':claim&&done?'One force in each cart’s sum.':'Which object receives each force?',C.purple,23));
    }else if(day===16){
      const theta=(claim?30:[0,22,35][step])*Math.PI/180,cx=380,cy=178;
      const downhill=[Math.cos(theta),Math.sin(theta)],normal=[Math.sin(theta),-Math.cos(theta)];
      put(text(380,36,claim?'ONE WEIGHT — TWO COMPONENTS':'TILT THE SURFACE. WATCH THE ARROWS.',C.purple,20),line(cx-180*downhill[0],cy-180*downhill[1]+33,cx+180*downhill[0],cy+180*downhill[1]+33,C.ink,5),h('g',{transform:`translate(${cx} ${cy}) rotate(${theta*180/Math.PI})`},rect(-42,-24,84,48,C.pale,{stroke:C.purple,strokeWidth:2})),arrow(cx,cy,cx,cy+122,C.orange,'weight'));
      if(!claim)put(arrow(cx,cy,cx+normal[0]*122*Math.cos(theta),cy+normal[1]*122*Math.cos(theta),C.green,'normal'));
      else {const a=122*Math.sin(theta),b=122*Math.cos(theta),x=cx+downhill[0]*a,y=cy+downhill[1]*a;put(arrow(cx,cy,x,y,C.purple),arrow(x,y,x-normal[0]*b,y-normal[1]*b,C.purple),line(x,y,480,192,C.purple,1),text(490,192,'parallel',C.purple,18,'start'),line((x+cx)/2,(y+cy+122)/2,480,267,C.purple,1),text(490,273,'perpendicular',C.purple,18,'start'));}
      put(text(380,336,claim?(done?'Components replace weight in the axis sums.':'Would adding all three count weight twice?'):'Weight stays vertical. Normal follows the surface.',C.ink,22));
    }else if(day===17){
      const pull=claim?1:[2,5,3][step],sliding=!claim&&step===2;
      put(text(380,38,sliding?'SLIDING STEADILY':claim?'BELOW THE STATIC-FRICTION LIMIT':'STILL AT REST',C.purple,20));forces(380,210,pull,pull,'box');
      put(text(198,271,sliding?'kinetic friction':'static friction',C.orange,18),text(540,271,'pull',C.orange,18));
      const x=170,y=299,w=420;
      put(rect(x,y,w,12,'#e4dfec'),rect(x,y,w*pull/6,12,C.green),line(x+w,y-9,x+w,y+22,C.orange,3),text(x+w,y+46,'limit: 6 N',C.muted,18),text(x,y+46,claim&&!done?'What must friction be?':pull+' N balances the pull',C.green,20,'start'));
    }else if(day===18){
      const left=claim?10:15,right=40-left,lx=185,rx=575,load=lx+(rx-lx)*right/40;
      put(text(380,40,'VERTICAL BALANCE: UPWARD TOTAL = DOWNWARD TOTAL',C.purple,19),rect(lx-30,185,rx-lx+60,16,'#b9a887'),line(load,201,load,213,C.ink),rect(load-25,213,50,25,C.pale,{stroke:C.purple}),arrow(load,240,load,360,C.orange),text(load+69,312,'40 N',C.orange,20));
      if(claim||step>=1)put(arrow(lx,183,lx,183-left*3,C.green,left+' N'));
      if(claim||step>=2)put(arrow(rx,183,rx,183-right*3,C.green,(!claim||done)?right+' N':'30 N?'));
      if(done)put(badge(380,145,left+' + '+right+' = 40 N',C.purple,255));
    }else if(day===19){
      const X=numberline(-3,4,230,'velocity (m/s)');
      put(text(380,45,'START AT THE INITIAL VELOCITY',C.purple,20),dot(X(-2),230,10),dot(X(3),230,10,C.green),text(X(-2),193,'initial: −2',C.purple),text(X(3),193,'final: +3',C.green),arrow(X(-2),133,X(3),133,C.orange,done?'five units right':'How far? Which way?'));
      if(done)put(badge(380,330,'+3 − (−2) = +5 m/s',C.green,325));
    }else if(day===20){
      const X=numberline(0,6);put(text(380,38,'FORCE → ACCELERATION → VELOCITY → POSITION',C.purple,19));
      put(dot(X(1),250,9));if(step>=1)put(dot(X(5),250,9));
      const x=step===0?1:5;put(cart(X(x),200,'2 kg'),arrow(X(x)-35,110,X(x)+60,110,C.orange,'ΣF = +4 N'));
      if(step>=1)put(text(380,162,step===1?'At 2 s: v = +4 m/s':'Δx = +4 m; final x = +5 m',C.green,24));
      put(text(380,332,'Starts from rest at +1 m.',C.muted,19));
    }else if(day===21){
      if(claim){
        put(text(380,38,'20 m OF TRAVEL … BUT WHERE?',C.purple,22),h('circle',{cx:380,cy:195,r:113,fill:'none',stroke:C.purple,strokeWidth:2,strokeDasharray:'6 6'}),dot(380,195,12),text(380,202,'?',C.white,19));
        [[493,195],[267,195],[380,82],[380,308]].forEach(([x,y])=>put(dot(x,y,8,C.white,{stroke:C.orange,strokeWidth:3})));
        put(arrow(395,195,480,195,C.purple),text(460,177,'20 m',C.purple,20),text(150,150,'Start where?',C.muted,21),text(620,240,'Which direction?',C.muted,21));
        if(done)put(badge(380,345,'Need start, direction, and a reference frame.',C.green,550));
      }else{
        put(text(380,38,'SAME TRIP. A DIFFERENT ZERO.',C.purple,21));
        [130,255].forEach(y=>put(line(100,y,660,y,C.muted)));
        const X=n=>125+n*95;
        for(let n=0;n<=5;n++){put(line(X(n),124,X(n),136,C.muted),text(X(n),159,'+'+n,C.muted,17));if(step===2)put(line(X(n),249,X(n),261,C.muted),text(X(n),284,String(n-2),C.muted,17));}
        put(text(95,100,'Desk origin',C.purple,19,'start'),dot(X(2),130,10),text(X(2),109,'start',C.purple,18));
        if(step>=1)put(arrow(X(2),80,X(5),80,C.orange,'+3 tiles'),dot(X(5),130,10,C.green));
        if(step===2)put(text(95,222,'New origin',C.purple,19,'start'),dot(X(2),255,10),dot(X(5),255,10,C.green),arrow(X(2),206,X(5),206,C.orange,'same +3 tiles'),line(X(2),170,X(2),240,C.line,2,{strokeDasharray:'5 5'}));
      }
    }else if(day===22){
      const X=numberline(4,9,270);
      const lo=claim?5.5:5,hi=claim?6.5:7;
      put(text(380,38,'COMPARE THE RANGES, NOT ONLY THE CENTERS',C.purple,20),text(95,104,'Forecast',C.purple,20,'start'));
      if(!claim||done)put(rect(X(lo),122,X(hi)-X(lo),33,'#d6cde8',{stroke:C.purple}),line(X(lo),113,X(lo),165,C.purple,3),line(X(hi),113,X(hi),165,C.purple,3));
      if(claim){put(dot(X(6),138,8),text(X(6),100,done?'6 ± 0.5 m':'6 m',C.purple,22),dot(X(6.2),213,8,C.green),text(X(6.2),249,'6.2 m observed',C.green,20));if(done)put(line(X(6.2),155,X(6.2),200,C.green,2,{strokeDasharray:'4 4'}));}
      else if(step>=1){put(rect(X(7.5),201,X(8.5)-X(7.5),33,'#d3e4d9',{stroke:C.green}),text(X(8),187,'8 ± 0.5 m',C.green,22));if(done)put(arrow(X(7),179,X(7.5),179,C.orange),text(X(7.25),161,'0.5 m gap',C.orange,18));}
      if(done)put(text(380,363,claim?'The observation lies inside this forecast range.':'The intervals do not overlap.',C.green,22));
    }
    return h('figure',{className:'opening-scene', 'data-visual-day':day,'data-visual-mode':mode},
      h('svg',{viewBox:'0 0 760 370',role:'img','aria-label':descriptions[day],preserveAspectRatio:'xMidYMid meet'},
        h('defs',null,...[['orange',C.orange],['purple',C.purple],['green',C.green]].map(([name,color])=>h('marker',{key:name,id:id+'-'+name,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:5,markerHeight:5,orient:'auto-start-reverse'},h('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:color})))),
        ...bits.map((bit,i)=>h(React.Fragment,{key:i},bit))),
      h('figcaption',null,day===9&&claim?'Horizontal motion shown; assume negligible resistance after release.':day===16&&!claim?'Gravity and normal shown. Other contact forces are omitted.':claim?(done?'Use the picture as evidence for your explanation.':'Point to the part of the picture that supports—or challenges—the claim.'):'Predict the next moment before revealing it.'));
  };
};
