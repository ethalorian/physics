const hatch=id=>'<defs><pattern id="'+id+'" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M -1 1 L 1 -1 M 0 7 L 7 0 M 6 8 L 8 6" fill="none" stroke="#b5b5b5" stroke-width="1"/></pattern></defs>';
/** Outline diagrams for the newly authored Honors notes. Original pages are never edited. */
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text=(x,y,s,size=12,anchor='start',weight=400)=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" fill="#252525" style="font:'+weight+' '+size+'px \'IBM Plex Mono\',monospace">'+esc(s)+'</text>';
const line=(x1,y1,x2,y2,dash='',width=1.5,stroke='#252525')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+stroke+'" stroke-width="'+width+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
const rect=(x,y,w,h,dash='',fill='#ffffff')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="#252525" stroke-width="1.5"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
const number=(n,x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="11" fill="#ffffff" stroke="#252525" stroke-width="1.5"/>'+text(x,y+4,n,12,'middle',600);
function arrow(x1,y1,x2,y2,dash='',width=8){const a=Math.atan2(y2-y1,x2-x1),len=Math.min(14,Math.hypot(x2-x1,y2-y1)*.55),side=len/2;const bx=x2-len*Math.cos(a),by=y2-len*Math.sin(a);return line(x1,y1,bx,by,dash,width)+line(x1,y1,bx,by,dash,Math.max(2,width-3),'#ffffff')+'<path d="M '+x2+' '+y2+' L '+(bx+side*Math.sin(a))+' '+(by-side*Math.cos(a))+' L '+(bx-side*Math.sin(a))+' '+(by+side*Math.cos(a))+' Z" fill="#ffffff" stroke="#252525" stroke-width="1.5"/>';}
const poly=(points,dash='')=>'<polyline points="'+points.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#252525" stroke-width="10" stroke-linecap="round"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>'+'<polyline points="'+points.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
const svg=(s,label)=>'<svg viewBox="0 0 616 250" style="width:100%;display:block" role="img" aria-label="'+esc(label)+'">'+s+'</svg>';
function chart({xmin=0,xmax,ymin=0,ymax,xticks,yticks,x=65,y=38,w=485,h=163,xlabel='time (s)',ylabel='velocity (m/s)'}){
 const X=v=>x+(v-xmin)/(xmax-xmin)*w,Y=v=>y+h-(v-ymin)/(ymax-ymin)*h;
 let s='';for(const v of xticks){s+=line(X(v),y,X(v),y+h,'',1,'#e5e5e5')+text(X(v),y+h+19,v,12,'middle');}
 for(const v of yticks){s+=line(x,Y(v),x+w,Y(v),'',1,'#e5e5e5')+text(x-10,Y(v)+4,v,12,'end');}
 s+=line(x,Y(Math.max(ymin,0)),x+w+8,Y(Math.max(ymin,0)))+line(x,y-8,x,y+h);
 s+=text(x,y-16,ylabel,12,'start',500)+text(x+w/2,y+h+39,xlabel,12,'middle',500);
 return {s,X,Y};
}
const plots={
velocity_components(){
 const g=chart({xmin:0,xmax:4,ymin:-2,ymax:4,xticks:[0,1,2,3,4],yticks:[-2,0,2,4],x:46,y:40,w:245,h:157});let s=g.s;
 s+=rect(g.X(0),g.Y(3),g.X(2)-g.X(0),g.Y(0)-g.Y(3),'','#f7f7f7');
 s+=rect(g.X(2),g.Y(0),g.X(4)-g.X(2),g.Y(-1)-g.Y(0),'4 3','url(#neg-vt)');
 s+=poly([[g.X(0),g.Y(3)],[g.X(2),g.Y(3)]])+poly([[g.X(2),g.Y(-1)],[g.X(4),g.Y(-1)]]);
 s+=text(92,91,'+6 m',14)+text(195,173,'−2 m',13)+number(1,273,62)+number(2,151,116);
 s+=text(455,24,'10 m/s at 30°',14,'middle',500)+arrow(355,185,565,64)+arrow(355,185,565,185,'5 4')+arrow(565,185,565,64,'5 4');
 s+=text(450,213,'vₓ = 8.66 m/s',12,'middle')+text(587,136,'5',12,'middle')+text(587,151,'m/s',12,'middle');
 s+=text(385,177,'30°',12)+text(352,204,'+x',12)+text(452,54,'v',14)+number(3,393,152);
 return svg(hatch('neg-vt')+s,'Signed velocity areas of +6 and −2 meters; a 10 m/s vector at 30 degrees has components +8.66 and +5 m/s.');
},
prediction_range(){
 let s=text(34,24,'x₀ = 8 ± 0.5 m',14)+text(330,24,'v = −2.0 ± 0.1 m/s; t = 3 s',13);
 const X=x=>70+x*51;s+=line(45,150,577,150);for(let i=0;i<=10;i+=2)s+=line(X(i),144,X(i),156)+text(X(i),178,i,12,'middle');
 s+=rect(X(1.2),126,X(2.8)-X(1.2),48,'','#f2f2f2')+line(X(2),118,X(2),183)+line(X(8),136,X(8),164);
 s+=arrow(X(8),81,X(2),81)+text(320,62,'Δx = −6 m',15,'middle')+text(X(2),210,'center 2 m',13,'middle');
 s+=text(424,209,'position x (m)',12)+text(X(2),111,'1.2 to 2.8 m',12,'middle')+number(1,X(8),120)+number(2,315,81)+number(3,99,115);
 return svg(s,'Position number line: start 8 m, displacement −6 m, predicted center 2 m with bounds 1.2 to 2.8 m.');
},
vector_sum(){
 const g=chart({xmin:-2,xmax:8,ymin:-5,ymax:5,xticks:[-2,0,2,4,6,8],yticks:[-4,-2,0,2,4],x:170,y:33,w:171,h:171,xlabel:'x (m); east is +',ylabel:'y (m); north is +'});let s=g.s;
 s+=line(g.X(0),33,g.X(0),204)+arrow(g.X(0),g.Y(0),g.X(6),g.Y(-4))+arrow(g.X(6),g.Y(-4),g.X(2),g.Y(4))+arrow(g.X(0),g.Y(0),g.X(2),g.Y(4),'5 4');
 s+=text(458,67,'A = (6, −4) m',12)+text(458,97,'B = (−4, 8) m',12)+text(458,127,'R = (2, 4) m',12)+text(458,157,'|R| = 4.47 m',12);
 s+=number(1,256,177)+number(2,290,96)+number(3,214,68);
 return svg(s,'Tip-to-tail displacements A=(6,−4) and B=(−4,8) meters give R=(2,4) meters.');
},
velocity_reversal(){
 const g=chart({xmax:4,ymin:-2,ymax:6,xticks:[0,1,2,3,4],yticks:[-2,0,2,4,6]});let s=g.s+poly([[g.X(0),g.Y(6)],[g.X(4),g.Y(-2)]]);
 s+=line(g.X(3),31,g.X(3),202,'4 4')+text(g.X(3)-12,57,'turn at 3 s',12,'end');
 s+=text(150,180,'speed 6 → 0',14)+text(434,76,'speed 0 → 2',13)+number(1,280,103)+number(2,145,155)+number(3,508,109);
 return svg(s,'Velocity drops from +6 to −2 m/s over 4 seconds; zero velocity at 3 seconds separates slowing and speeding up.');
},
braking_graph(){
 const g=chart({xmax:5,ymax:20,xticks:[0,1,2,3,4,5],yticks:[0,5,10,15,20]});let s=g.s;
 s+='<path d="M '+g.X(0)+' '+g.Y(0)+' L '+g.X(0)+' '+g.Y(20)+' L '+g.X(5)+' '+g.Y(0)+' Z" fill="#f7f7f7" stroke="#252525"/>';
 s+=poly([[g.X(0),g.Y(20)],[g.X(5),g.Y(0)]])+text(226,155,'½ × 5 s × 20 m/s',14)+text(277,176,'= +50 m',15);
 s+=text(395,64,'speed 20 → 0',14)+number(1,273,89)+number(2,198,151)+number(3,518,92);
 return svg(s,'Velocity-time triangle from 20 m/s at zero seconds to rest at 5 seconds; area is 50 m.');
},
balanced_cart(){
 let s=rect(245,103,110,58)+line(80,164,540,164)+arrow(245,132,133,132)+arrow(355,132,467,132);
 s+=text(153,112,'8 N',14)+text(414,112,'8 N',14)+text(300,139,'cart',14,'middle');
 s+=arrow(232,58,380,58)+text(307,37,'v = +3 m/s',14,'middle')+rect(185,190,243,33)+text(307,212,'ΣF = 0; a = 0',15,'middle');
 s+=number(1,490,130)+number(2,400,57)+number(3,162,205);
 return svg(s,'Cart moving right at 3 m/s with equal 8 N opposing horizontal forces; vertical support and weight balance.');
},
supported_crate(){
 let s='';const vals=[['rope on crate','T = 10 N',1],['table on crate','N = 19.4 N',2],['Earth on crate','W = 29.4 N',3]];
 for(let i=0;i<3;i++){const x=104+i*204;s+=text(x,25,vals[i][0],12,'middle')+'<circle cx="'+x+'" cy="132" r="6" fill="#ffffff" stroke="#252525" stroke-width="1.5"/>';if(i<2)s+=arrow(x,132,x,132-(i===0?30:58.2));else s+=arrow(x,132,x,220.2);s+=text(x, i<2?189:84,vals[i][1],14,'middle')+number(i+1,x-56,132);}
 s+=text(308,239,'Three forces; one receiver. The crate stays at rest.',12,'middle');
 return svg(s,'Separate views identify upward rope tension 10 N, upward table normal 19.4 N and downward weight 29.4 N on the same resting crate.');
},
inverse_mass(){
 const g=chart({xmax:1,ymax:4,xticks:[0,0.25,0.5,0.75,1],yticks:[0,1,2,3,4],x:65,y:36,w:315,h:163,xlabel:'1/M (kg⁻¹)',ylabel:'a (m/s²)'});let s=g.s+poly([[g.X(0),g.Y(0)],[g.X(1),g.Y(4)]]);
 for(const [inv,a] of [[.25,1],[.5,2],[1,4]])s+='<circle cx="'+g.X(inv)+'" cy="'+g.Y(a)+'" r="5" fill="#ffffff" stroke="#252525" stroke-width="1.5"/>';
 s+=text(425,47,'M (kg)   a (m/s²)',12)+text(442,78,'1          4',13)+text(442,104,'2          2',13)+text(442,130,'4          1',13);
 s+=rect(433,157,143,38)+text(504,181,'Fnet = 4 N',13,'middle')+number(1,405,75)+number(2,267,104)+number(3,411,176);
 return svg(s,'Acceleration versus inverse mass is a straight line for a fixed 4 N net force; masses 1,2,4 kg have accelerations 4,2,1 m/s².');
},
force_graph(){
 const g=chart({xmax:5,ymax:2.5,xticks:[0,1,2,3,4,5],yticks:[0,.5,1,1.5,2,2.5],x:65,y:36,w:445,h:163,xlabel:'driving force (N)',ylabel:'a (m/s²)'});let s=g.s;
 s+=poly([[g.X(0),g.Y(0)],[g.X(5),g.Y(2.5)]],'5 5')+poly([[g.X(.4),g.Y(0)],[g.X(5),g.Y(2.3)]]);
 s+=text(111,52,'dashed: no friction',12)+text(297,174,'solid: f = 0.4 N',12);
 for(const [f,a] of [[2,.8],[4,1.8]])s+='<circle cx="'+g.X(f)+'" cy="'+g.Y(a)+'" r="5" fill="#ffffff" stroke="#252525" stroke-width="1.5"/>';
 s+=number(1,g.X(2)-20,g.Y(.8)+6)+number(2,402,75)+number(3,478,170);
 return svg(s,'At fixed 2 kg mass, acceleration is driving force divided by 2 without friction; 0.4 N friction shifts the line down by 0.2 m/s².');
},
opposed_motion(){
 let s=rect(245,104,105,54)+text(297,135,'4 kg',14,'middle')+arrow(245,131,193,131)+arrow(350,131,506,131);
 s+=text(164,111,'4 N',13)+text(414,111,'12 N',13)+arrow(347,50,224,50)+text(285,29,'vᵢ = −3 m/s',14,'middle');
 s+=arrow(247,204,351,204,'',12)+text(405,207,'ΣF = +8 N',14)+text(297,239,'after 1 s: v = −1 m/s; speed is smaller',12,'middle');
 s+=number(1,532,131)+number(2,203,51)+number(3,155,210);
 return svg(s,'A 4 kg cart moves left while 12 N right and 4 N left give net force 8 N right; it slows for the first second.');
},
interaction_pair(){
 let s=rect(117,84,112,79)+rect(387,84,112,79)+text(173,112,'A',18,'middle',600)+text(173,143,'1 kg',14,'middle')+text(443,112,'B',18,'middle',600)+text(443,143,'3 kg',14,'middle');
 s+=arrow(117,123,35,123)+arrow(499,123,581,123)+text(72,100,'6 N',13,'middle')+text(544,100,'6 N',13,'middle');
 s+=text(173,207,'aₐ = −6 m/s²',14,'middle')+text(443,207,'aᵦ = +2 m/s²',14,'middle')+text(308,35,'Equal force sizes on different receivers',13,'middle');
 s+=number(1,71,154)+number(2,548,154)+number(3,308,123);
 return svg(s,'Two separate carts experience equal opposite 6 N interaction forces: 1 kg A accelerates left at 6 m/s²; 3 kg B accelerates right at 2 m/s².');
},
lamp_fbd(){
 let s=rect(43,50,159,143,'5 4')+text(123,76,'chosen object',12,'middle')+line(123,84,123,115)+rect(90,115,66,34)+text(123,139,'lamp',13,'middle')+text(123,178,'a is upward',12,'middle');
 s+='<circle cx="395" cy="132" r="7" fill="#ffffff" stroke="#252525" stroke-width="1.5"/>'+arrow(395,125,395,30)+arrow(395,139,395,221);
 s+=text(422,56,'T = 22.6 N',14)+text(422,205,'W = 19.6 N',14)+text(395,246,'forces ON the lamp',12,'middle');
 s+=number(1,366,53)+number(2,366,206)+number(3,177,129);
 return svg(s,'Separate lamp context and free-body diagram: tension 22.6 N upward is longer than weight 19.6 N downward.');
},
incline(){
 let s=line(38,214,292,68)+line(38,214,292,214,'4 3')+text(103,207,'30°',12);const x=173,y=137;
 s+='<circle cx="'+x+'" cy="'+y+'" r="6" fill="#ffffff" stroke="#252525" stroke-width="1.5"/>';
 s+=arrow(x,y,x,y+98)+arrow(x,y,x-43,y-74)+arrow(x,y,x+8.66,y-5);
 s+=text(185,229,'W',13)+text(106,58,'N',13)+text(213,116,'f',13)+text(177,29,'actual forces',13,'middle',500);
 const ox=438,oy=69;s+=text(465,29,'resolve W separately',13,'middle',500)+arrow(ox,oy,ox,oy+140)+arrow(ox,oy,ox-61,oy+35,'5 4')+arrow(ox-61,oy+35,ox,oy+140,'5 4');
 s+=text(350,119,'mg sin θ',12)+text(446,155,'mg cos θ',12)+text(446,211,'mg',13)+number(1,245,174)+number(2,362,158)+number(3,76,192);
 return svg(s,'30 degree incline with actual weight downward, normal perpendicular outward and friction uphill; a separate triangle resolves weight into downhill and perpendicular components.');
},
friction(){
 const g=chart({xmax:12,ymax:9,xticks:[0,3,6,9,12],yticks:[0,3,6,9],x:65,y:38,w:470,h:159,xlabel:'horizontal pulling force (N)',ylabel:'friction magnitude (N)'});let s=g.s;
 s+=poly([[g.X(0),g.Y(0)],[g.X(7.84),g.Y(7.84)]])+poly([[g.X(7.84),g.Y(4.9)],[g.X(12),g.Y(4.9)]]);
 s+=line(g.X(7.84),g.Y(7.84),g.X(7.84),g.Y(4.9),'4 4')+text(333,48,'limit 7.84 N',12)+text(405,131,'4.90 N',12);
 s+=number(1,228,126)+number(2,462,55)+number(3,505,91);
 return svg(s,'Static friction rises with applied pull to 7.84 N; once sliding, kinetic friction is 4.90 N for this box.');
},
two_ropes(){
 const x=306,y=128;let s=rect(x-41,y,82,36)+text(x,y+24,'sign',13,'middle')+arrow(x,y,x-69.282,y-40)+arrow(x,y,x+69.282,y-40)+arrow(x,y+37,x,y+117);
 s+=line(x-69.282,y,x+69.282,y,'4 3')+line(x-69.282,y,x-69.282,y-40,'4 3')+line(x+69.282,y,x+69.282,y-40,'4 3');
 s+=text(142,54,'T = 40 N',13)+text(406,54,'T = 40 N',13)+text(341,236,'W = 40 N',13);
 s+=text(204,125,'30°',12)+text(367,125,'30°',12)+text(115,103,'20 N',12)+text(447,103,'20 N',12);
 s+=number(1,480,57)+number(2,483,127)+number(3,280,218);
 return svg(s,'Equal 40 N tensions at 30 degrees above horizontal each supply a 20 N vertical component supporting a 40 N sign.');
},
repair_graph(){
 const g=chart({xmax:2,ymin:-6,ymax:0,xticks:[0,1,2],yticks:[-6,-4,-2,0],x:65,y:38,w:290,h:158});let s=g.s+poly([[g.X(0),g.Y(-2)],[g.X(2),g.Y(-6)]]);
 s+=text(396,63,'Wrong: Δv = +4',13)+line(391,56,568,68)+text(396,105,'Δv = −6 − (−2)',13)+text(396,132,'= −4 m/s',14);
 s+=text(396,181,'speed: 2 → 6 m/s',13)+number(1,166,137)+number(2,374,178)+number(3,588,60);
 return svg(s,'Velocity graph from −2 to −6 m/s; the incorrect positive change is crossed out and replaced with −4 m/s; speed increases.');
},
full_chain(){
 const g=chart({xmax:3,ymin:-2,ymax:4,xticks:[0,1,2,3],yticks:[-2,0,2,4],x:65,y:38,w:385,h:162});let s=g.s;
 s+='<path d="M '+g.X(0)+' '+g.Y(0)+' L '+g.X(0)+' '+g.Y(-2)+' L '+g.X(1)+' '+g.Y(0)+' Z" fill="url(#neg-chain)" stroke="#252525" stroke-dasharray="4 3"/>';
 s+='<path d="M '+g.X(1)+' '+g.Y(0)+' L '+g.X(3)+' '+g.Y(4)+' L '+g.X(3)+' '+g.Y(0)+' Z" fill="#f7f7f7" stroke="#252525"/>';
 s+=poly([[g.X(0),g.Y(-2)],[g.X(3),g.Y(4)]])+text(87,166,'−1 m',13)+text(326,116,'+4 m',14);
 s+=text(475,68,'2 kg cart',12)+text(475,98,'ΣF = +4 N',12)+text(475,131,'a = +2',12)+text(475,149,'m/s²',12);
 s+=number(1,316,67)+number(2,264,156)+number(3,570,98);
 return svg(hatch('neg-chain')+s,'A 2 kg cart with net force +4 N has velocity −2 to +4 m/s over 3 seconds; signed areas −1 and +4 m give displacement +3 m.');
},
two_dimensional(){
 const X=v=>410+v*11,Y=v=>218-v*11;let s=line(73,Y(0),564,Y(0))+line(X(0),33,X(0),225)+text(568,222,'+x',12)+text(430,31,'+y',12);
 for(const v of [-20,-10,0,10])s+=line(X(v),212,X(v),224)+text(X(v),230,v,12,'middle');
 for(const v of [5,10,15])s+=line(404,Y(v),416,Y(v))+text(424,Y(v)+4,v,12);
 s+=arrow(X(-20),Y(5),X(-2.68),Y(15))+line(X(-20),Y(5),X(-2.68),Y(5),'4 4')+line(X(-2.68),Y(5),X(-2.68),Y(15),'4 4');
 s+=rect(X(-20)-4,Y(5)-4,8,8)+rect(X(-2.68)-4,Y(15)-4,8,8);
 s+=text(91,188,'(−20, 5) m',12)+text(275,48,'(−2.68, 15) m',12)+text(215,162,'30°',12);
 s+=number(1,468,220)+number(2,355,72)+number(3,243,104)+text(91,18,'steady velocity for 2 s',13);
 return svg(s,'Position plane with initial point (−20,5) m and final point (−2.68,15) m reached along a 30 degree velocity direction; origin stays fixed.');
},
revised_range(){
 const X=v=>90+v*100;let s=line(68,218,580,218);for(let i=0;i<=4;i++)s+=line(X(i),213,X(i),224)+text(X(i),242,i,12,'middle');
 const rows=[{a:1.2,b:2.8,y:52,label:'earlier: 2.0 ± 0.8 m',dash:''},{a:3.4,b:3.6,y:113,label:'observed: 3.5 ± 0.1 m',dash:''},{a:2.7,b:4.3,y:174,label:'revised: 3.5 ± 0.8 m',dash:'5 4'}];
 rows.forEach((r,i)=>{s+=text(92,r.y-17,r.label,12)+rect(X(r.a),r.y-7,X(r.b)-X(r.a),21,r.dash,'#f7f7f7')+number(i+1,63,r.y+3)});
 s+=text(574,242,'x (m)',12,'end');
 return svg(s,'Illustrative intervals: earlier forecast 1.2 to 2.8 m, observation 3.4 to 3.6 m, and revised forecast 2.7 to 4.3 m.');
}
};
module.exports=name=>{if(!plots[name])throw Error('Missing Honors diagram: '+name);return plots[name]();};

