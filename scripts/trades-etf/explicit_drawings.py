"""Labeled finished objects, part plans and test setups. Written dimensions govern."""
from html import escape as esc

def generate(public, art):
 def text(x,y,s,size=20): return f'<text x="{x}" y="{y}" font-size="{size}">{esc(s)}</text>'
 def ln(x,y,a,b,dash=False): return f'<line x1="{x}" y1="{y}" x2="{a}" y2="{b}"'+(' stroke-dasharray="8 6"' if dash else '')+'/>'
 def rect(x,y,w,h,fill='#e5f1ef'): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>'
 def path(points,fill='#e5f1ef'): return f'<polygon points="{points}" fill="{fill}"/>'
 def dot(x,y):return f'<circle cx="{x}" cy="{y}" r="4" fill="#185e65"/>'
 def circle(x,y,r):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="white"/>'
 def save(key,title,body,height=700):
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="{height}" viewBox="0 0 1000 {height}" role="img"><title>{esc(title)}</title><desc>Original classroom construction plan with labeled parts and finished views. Not to scale. Use written dimensions and numbered lesson steps.</desc><rect width="1000" height="{height}" fill="white"/><style>text{{font-family:Arial,sans-serif;fill:#183c44;stroke:none}}line,path,polygon,rect,circle{{stroke:#28636a;stroke-width:2.2}} </style>{text(28,38,title,27)}{body}{text(28,height-24,"NTS • Use written dimensions, not pixels or printed scale. Follow the numbered lesson.",18)}</svg>'
  (public/(key+'.svg')).write_text(svg);art[key]=title

 s=text(40,85,'FINISHED OBJECT · side view',21)
 s+=path('100,285 400,285 250,120')+ln(100,285,250,120)+ln(110,279,127,260)
 s+=text(87,210,'F',25)+text(360,202,'R',25)+text(230,311,'B · 4 in',20)+text(140,166,'3 in',19)+text(306,166,'3 in',19)
 s+=ln(86,294,150,294)+ln(150,294,138,282)+text(42,340,'L: shelf projects forward',18)+text(42,364,'T overlaps inside F at bottom',18)
 s+=path('90,284 240,119 234,114 84,279','#f8e7ba')+text(420,193,'3 × 5-in card',20)+ln(410,202,194,216)+text(420,224,'leans on F;',18)+text(420,248,'bottom edge rests on L',18)
 s+=text(640,88,'WHAT YOU TURN IN',21)+text(640,128,'1 triangular stand',20)+text(640,160,'1 test card',20)+text(640,192,'2 tested lip depths',20)+text(640,224,'6 pass/fail trials',20)
 s+=text(40,412,'FLAT CUT/FOLD PLAN · body 10 1/2 × 4 in',21)+rect(80,445,630,140)
 for x,label in [(260,'3'),(440,'6'),(680,'10')]:s+=ln(x,445,x,585,True)+text(x-8,611,label,18)
 for x,label in [(80,'A / 0'),(720,'10 1/2 in')]:s+=text(x,610,label,18)
 for x,label in [(125,'F · 3'),(315,'R · 3'),(510,'B · 4'),(687,'T')]:s+=text(x,515,label,18)
 s+=text(737,510,'width 4 in',20)+text(737,543,'T = 1/2-in tab',18)
 s+=text(40,647,'Separate L: 4 × 1 in; fold lengthwise at 1/2 in. Revision B lip: 4 × 1 1/2 in.',18)
 save('stand','A · Instruction-card stand: finished form and flat pattern',s,715)

 # One consistent elevated projection, with opaque faces painted back to front.
 # The front wall must cover divider ends; otherwise they look like separate boxes.
 def tray_point(x,y,z): return (90+55*x+12*y,315-26*y-25*z)
 def tray_face(points,fill):
  return path(' '.join(f'{a:.2f},{b:.2f}' for a,b in [tray_point(*p) for p in points]),fill)
 def tray_part(x0,y0,z0,x1,y1,z1,front,side,top):
  return (tray_face([(x0,y0,z0),(x1,y0,z0),(x1,y0,z1),(x0,y0,z1)],front)
   +tray_face([(x1,y0,z0),(x1,y1,z0),(x1,y1,z1),(x1,y0,z1)],side)
   +tray_face([(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)],top))
 def tray_label(x,y,z,label,size=18):
  a,b=tray_point(x,y,z)
  return f'<text x="{a:.2f}" y="{b:.2f}" font-size="{size}" text-anchor="middle" font-weight="bold">{esc(label)}</text>'
 s=text(35,83,'ASSEMBLED TRAY · three open bays',21)
 s+='<g id="assembled-tray" stroke-linejoin="round">'
 s+='<g id="tray-base">'+tray_part(0,0,-.125,8,6,0,'#bad8d5','#abcac7','#f5f9f8')+'</g>'
 s+='<g id="tray-rear">'+tray_part(0,5.875,0,8,6,2,'#d8ece7','#aacdca','#eef7f5')+'</g>'
 for key,x in [('E1',0),('D1',2.625),('D2',5.25),('E2',7.875)]:
  divider=key.startswith('D')
  s+=f'<g id="tray-{key}">'+tray_part(x,.125,0,x+.125,5.875,2,
   '#c38f3c' if divider else '#aacdca', '#f2d496' if divider else '#c4dfda', '#fff0ce' if divider else '#eef7f5')+'</g>'
  s+=tray_label(x+.125,3,1,key)
 for x,label in [(1.375,'Bay 1'),(4,'Bay 2'),(6.625,'Bay 3')]:s+=tray_label(x,2.8,0,label,16)
 s+=tray_label(4,5.875,1,'R · rear wall')
 s+='<g id="tray-front">'+tray_part(0,0,0,8,.125,2,'#b7d9d3','#9bbfba','#e8f4f1')+'</g>'
 s+=tray_label(4,0,.85,'F · one continuous front wall',17)
 s+='</g>'
 s+=ln(450,319,476,340)+text(482,346,'B · base',17)
 s+=text(655,125,'PARTS ON THE TRAY',20)
 for i,t in enumerate(['F / R = front / rear walls','E1 / E2 = left / right ends','D1 / D2 = two dividers','B = one base under all bays']):s+=text(655,160+i*32,t,18)
 s+=text(655,303,'All walls: 2 in high above B.',18)
 s+=text(35,365,'TOP VIEW · positions from the left outside edge A',21)+rect(80,400,440,200,'white')
 s+=rect(80,400,440,7)+rect(80,593,440,7)+rect(80,407,7,186)+rect(513,407,7,186)
 for x in [224,369]:s+=rect(x,407,7,186)+text(x-13,627,'D'+('1' if x==224 else '2'),18)
 s+=text(83,627,'A / 0',18)+text(535,512,'6 in',20)+text(228,387,'8 in overall',20)+text(600,390,'CUT LIST · 7 parts',21)
 for i,t in enumerate(['B: 1 × (8 × 6 in)','F/R: 2 × (8 × 2 in)','E/D: 4 × (6 × 2-in blanks)','Fit E/D between F and R.','At 1/8-in stock: fitted length 5 3/4 in.','Use actual gap for your stock.']):s+=text(600,428+i*32,t,18)
 s+=text(40,671,'D1 left face x = 2 5/8 in; D2 left face x = 5 1/4 in. All walls sit on top of B.',18)
 s+=text(40,701,'At 1/8-in stock, each clear bay is 2 1/2 in. Measure actual clearance for thinner stock.',18)
 save('organizer','B · Three-bay supply tray: assembly and part locations',s,760)

 s=text(35,86,'TWO TRIANGULAR COLUMNS',21)+rect(50,125,325,275)
 for x in [150,250,350]:s+=ln(x,125,x,400,True)
 s+=text(70,222,'2 in',18)+text(167,222,'2 in',18)+text(267,222,'2 in',18)+text(398,260,'11 in',21)+text(55,438,'Blank: 6 1/2 × 11 in; tab = 1/2 in',19)
 s+=path('580,400 630,380 680,400 680,155 630,135 580,155')+path('790,400 840,380 890,400 890,155 840,135 790,155')
 s+=path('550,155 865,155 925,113 610,113','#c6e2dd')+rect(700,73,60,47,'#f8e7ba')+text(675,62,'cup + clips',19)
 s+=text(570,445,'6 × 6-in platform',21)+text(50,507,'1. Fold/tape two columns; level both ends.',22)+text(50,546,'2. Place cup centrally. Add 1 clip every 5 s; stop at 10 or instability.',20)
 s+=text(50,585,'3. Add two 6 × 1-in ties between column bases (front and rear).',20)+text(50,624,'4. Retest with the same load. Do not tape the tower to the table.',20)
 save('tower','D · Paper tower: 11-in columns, capped load, base ties',s)

 s=text(35,87,'SIDE VIEW · all three samples use this setup',21)+rect(90,242,120,160,'#e2e7ec')+rect(710,242,120,160,'#e2e7ec')+ln(130,238,790,238)+ln(210,265,710,265)+text(330,300,'8-in clear gap',21)
 s+=rect(430,195,90,40,'#f8e7ba')+text(397,173,'cup + 5 clips',19)+text(58,441,'1-in bearing',20)+text(701,441,'1-in bearing',20)+text(325,340,'10-in total strip length',21)
 s+=text(35,503,'END VIEWS · each blank is 10 × 3 in',21)+ln(100,570,290,570)+ln(410,540,455,590)+ln(455,590,500,540)+ln(670,530,670,585)+ln(670,585,745,585)+ln(745,585,745,530)
 s+=text(125,624,'A · flat',20)+text(402,624,'B · V fold',20)+text(640,624,'C · U channel',20)
 save('beam','D2 · Equal-material beam test and cross-sections',s)

 s=text(35,85,'PLAN · model 8 × 6 in',22)+rect(75,123,400,270,'white')+text(95,158,'N ↑',20)+rect(123,371,75,25,'white')+ln(123,393,123,320)+text(46,429,'SW datum',18)+text(119,462,'1-in offset; opening 1 1/2 in',18)
 s+=text(35,514,'SOUTH ELEVATION · 8 × 4 in',22)+rect(75,535,400,160)+rect(125,555,75,140,'#f8e7ba')+ln(125,555,125,695,True)+text(225,627,'Door 1 1/2 × 3 1/2 in',18)+text(223,658,'Fold left; cut top/right',17)
 s+=text(540,85,'FINISHED MODEL · roof lifts off',22)+path('610,160 900,160 950,110 660,110','#c6e2dd')+path('610,295 900,295 950,245 660,245','#edf6f3')+path('610,295 900,295 900,415 610,415','#d3e8e3')+path('900,295 950,245 950,365 900,415','#c6e2dd')+rect(647,310,53,105,'white')+path('647,415 607,391 607,286 647,310','#f8e7ba')
 s+=text(540,469,'CUT LIST',22)
 for i,t in enumerate(['Base: 8 × 6 in','N/S: two 8 × 4-in walls','E/W: two 6 × 4-in blanks; trim to fit','Roof: 8 × 6 in, made on day 6','Scale: 1/2 in = 1 ft','Represents 16 × 12 ft; 8-ft walls']):s+=text(540,508+i*31,t,19)
 save('building','E · Community room: coordinated plan, elevation and assembly',s,760)

 s=text(40,86,'JOINT-CENTER PLAN · strip ends extend 1/2 in beyond each dot',20)+rect(155,153,450,22)+rect(155,488,450,22)+rect(168,140,22,385)+rect(568,140,22,385)
 s+=ln(180,499,580,164,True)
 for x in [180,580]:
  for y in [164,499]:s+=dot(x,y)
 s+=text(310,130,'8 in',23)+text(85,330,'6 in',23)+text(375,354,'10-in diagonal',22)+text(655,207,'Fix left upright',21)+text(655,239,'between stable books.',19)
 s+=ln(580,164,660,245)+rect(635,245,50,60,'#f8e7ba')+text(685,293,'Cup + 10 clips',20)+text(655,358,'Measure downward',19)+text(655,388,'movement of the',19)+text(655,418,'top-right joint.',19)
 s+=text(40,565,'Parts: two 9 × 1-in strips; two 7 × 1-in strips; one 11 × 1-in brace.',21)+text(40,610,'Test once unbraced, then add diagonal and repeat with the identical load.',20)
 save('frame','E2 · Racking frame: dimensions, restraint and load point',s)

 s=text(65,91,'CONTROL',24)+text(535,91,'INSULATED TEST',24)+rect(85,160,230,280,'white')+rect(75,147,250,15,'#c6e2dd')+rect(535,140,270,320,'#f8e7ba')+rect(555,160,230,280,'white')+rect(545,147,250,15,'#c6e2dd')
 for x in [150,620]:s+=text(x,270,'60 g ice',22)
 s+=text(60,498,'Matching cups and lids',21)+text(520,498,'Two paper wraps + 1/2-in pad',21)+text(60,545,'20 min together → drain each through sieve for 30 s → weigh melt.',21)+text(60,588,'Keep paper outside and dry. Day 8 adds only a fitted top-edge collar.',20)+text(60,625,'Measured melt is the result. Sample numbers are not your observations.',20)
 save('thermal','F · Insulated enclosure: layers and controlled test',s)

 s=text(35,89,'BENCH COMPARISON · matching 20-mL syringes',22)
 s+=rect(90,210,260,65)+ln(35,242,90,242)+ln(35,215,35,270)+ln(350,242,580,242)+rect(580,210,260,65)+ln(840,242,905,242)+ln(905,215,905,270)
 s+=text(115,184,'INPUT · start 15 mL',20)+text(592,184,'OUTPUT · start 5 mL',20)+text(398,225,'60-cm tube',18)+text(80,325,'Hand moves this plunger →',20)+text(580,325,'Read this plunger’s travel →',20)
 s+=text(55,393,'Hold barrels still. Do not assist the output plunger.',23)+text(55,440,'Air trial first; teacher then fills syringe/tube system with water.',21)+text(55,487,'Use ruler start/end positions: input stroke = 20 mm.',21)+text(55,534,'Three trials per fluid. Reset to the same pointer marks each time.',21)+text(55,581,'Stop if resistance rises. Never force a blocked system.',21)
 save('fluid','G · Motion through a tube: fixed barrels and measured stroke',s)

 s=text(35,85,'ASSEMBLY · TOP VIEW',22)+rect(65,125,840,360,'white')+ln(65,305,905,305,True)+text(77,112,'Base 12 × 6 in; datum A at front-left',20)+text(71,510,'A (0,0)',18)
 s+=ln(275,305,140,305)+ln(140,305,140,190)+ln(140,190,50,190)+text(90,172,'tube to hand input',18)+rect(275,274,220,62)+rect(315,265,25,80,'#c6e2dd')+rect(440,265,25,80,'#c6e2dd')+ln(495,305,570,305)+ln(570,275,570,335)
 s+=rect(575,240,140,130,'#f8e7ba')+text(586,285,'SLED',21)+text(585,314,'2 × 2 in',18)+text(295,247,'fixed barrel',19)+text(554,401,'upright tab taped to thumb pad',18)
 s+=ln(715,218,715,392,True)+ln(770,218,770,392,True)+text(682,205,'START',18)+text(771,205,'DELIVERY',18)+text(707,428,'20 mm',20)
 s+=text(282,363,'Nozzle x = 3 in',18)+text(73,545,'Axis y = 3 in. Saddles hold BARREL only; plunger and sled remain free.',21)
 s+=text(73,586,'Sled blank: 3 × 2 in. Fold at 1 in → upright 1-in tab + 2 × 2-in deck.',20)
 s+=text(73,626,'Day 4: three 1/2-in cargo fences. Day 7: two base-fixed rails, 1/8-in side gaps.',19)
 save('sled','G2 · Syringe-powered delivery sled: fixed and moving parts',s)

 s=text(50,90,'GRAVITY STATION · same 60-cm tube for A and B',22)+rect(125,135,75,210,'white')
 s+=ln(125,180,200,180)+ln(125,295,200,295)+text(225,187,'20 mL: START timer',21)+text(225,302,'5 mL: STOP timer',21)+ln(162,345,162,410)+ln(162,410,710,410)+ln(710,410,710,445)+rect(665,450,110,75,'#ddecf4')
 s+=text(430,367,'Outlet fixed 10 cm below 5-mL line',20)+text(800,491,'catch cup',18)+text(60,570,'15 mL ÷ elapsed seconds = average mL/s for that trial.',22)+text(60,613,'A: broad U route. B: broad S route. Keep endpoints, length and bore unchanged.',19)
 save('flow','H · Timed gravity flow: exact start, stop and outlet level',s)

 s=text(40,87,'BENCH MODEL · TOP VIEW (door shut)',21)+rect(50,125,470,320,'white')+ln(50,325,238,325)+ln(238,325,379,325)+dot(238,325)+text(75,313,'fixed wall',19)+text(255,313,'door',19)+text(66,476,'Base 10 × 8 in; front = bottom edge',18)
 s+=path('355,323 378,323 378,246 355,246','#f8e7ba')+rect(350,151,33,115,'#d6bf9c')+text(396,181,'handle',17)+text(395,255,'foil jaws',17)+ln(388,256,371,260)+text(90,180,'BACK / increasing y',18)+text(85,403,'Door swings toward FRONT ↓',19)+text(543,90,'TONGUE SIDE DETAIL',21)
 s+=ln(590,160,590,330)+ln(590,330,750,330)+text(615,190,'1-in leg taped',19)+text(615,220,'to BACK of door',19)+text(608,361,'2-in leg projects behind door',18)
 s+=text(545,423,'Door opens toward front:',20)+text(545,453,'tongue withdraws → foil touches',19)+text(545,483,'→ lamp ON. Reset by hand.',19)
 s+=text(40,541,'CONNECTIONS · holder OFF while wiring',22)+text(40,582,'Supply + → foil jaw A     |     foil jaw B → lamp A     |     lamp B → supply −',20)+text(40,624,'Shut door + inserted card: OFF. Open door + foil contact: ON.',21)
 save('detector','J1 · Door-open detector: actual mechanism and three connections',s)

 s=text(40,85,'TWO INDEPENDENT BRANCHES',21)+ln(90,240,90,135)+ln(90,135,205,135)+ln(205,135,205,400)+ln(90,285,90,490)+ln(90,490,635,490)+ln(635,190,635,490)
 s+=ln(65,240,115,240)+ln(75,285,105,285)+text(45,240,'+',20)+text(45,289,'−',20)+text(52,333,'3 V',20)
 for y,n in [(190,1),(400,2)]:
  s+=ln(205,y,275,y)+ln(275,y,330,y-30)+ln(350,y,467,y)+circle(490,y,23)+ln(475,y-15,505,y+15)+ln(475,y+15,505,y-15)+ln(513,y,635,y)+dot(205,y)+dot(635,y)+text(286,y-50,'S'+str(n),21)+text(471,y-40,'L'+str(n),21)+text(440,y+33,'A',17)+text(523,y+33,'B',17)
 s+=text(704,139,'STATE TEST',21)+text(704,186,'S1  S2   L1  L2',20)
 for i,t in enumerate(['OFF OFF  off off','ON  OFF  on  off','OFF ON   off on','ON  ON   on  on']):s+=text(704,231+i*41,t,18)
 s+=text(40,550,'Six leads: +→S1 input; S1 output→L1 A; L1 B→−. Repeat independently for S2/L2.',19)
 s+=text(40,590,'Room model: 8 × 6-in base; 3-in walls; divider x=4. Lamp centers (2,3), (6,3).',19)
 s+=text(40,630,'Day 6 onward: replace S2 with foil-jaw door switch. L2 ON when door OPEN.',20)
 save('circuit','J · Two-room circuit: complete paths and all control states',s)
 # Boat illustration remains at its historical URL but is not in the required drawing set.
 art.pop('boat',None)
