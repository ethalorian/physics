(function (root) {
  'use strict';
  const M = root.CutFitMath;
  const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const inches = value => `${M.format(value)}″`;
  const label = (x, y, value, className = 'bp-label', anchor = 'middle') => `<text x="${x}" y="${y}" class="${className}" text-anchor="${anchor}">${esc(value)}</text>`;
  const line = (x1,y1,x2,y2,className='bp-object') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${className}"/>`;
  function definitions(id) {
    return `<defs><pattern id="${id}-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#97b2c3" stroke-width="1"/></pattern><marker id="${id}-arrow" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0 0L8 3.5L0 7Z" fill="#173f5a"/></marker></defs>`;
  }
  function dimension(id,x1,x2,y,featureY,text,caption='') {
    const a=Math.min(x1,x2), b=Math.max(x1,x2), features=Array.isArray(featureY)?featureY:[featureY,featureY];
    const aY=x1<=x2?features[0]:features[1], bY=x1<=x2?features[1]:features[0], direction=y<aY ? -1 : 1;
    return `<g class="bp-dimension" data-from="${a}" data-to="${b}">${line(a,aY+direction*6,a,y+direction*10,'bp-extension')}${line(b,bY+direction*6,b,y+direction*10,'bp-extension')}<path d="M${a} ${y}H${b}" class="bp-dim-line" marker-start="url(#${id}-arrow)" marker-end="url(#${id}-arrow)"/>${label((a+b)/2,y-12,text,'bp-number')}${caption ? label((a+b)/2,y+(direction<0?-38:28),caption,'bp-caption') : ''}</g>`;
  }
  function leader(id,x,y,bendX,bendY,endX,endY,text,anchor='start') {
    return `${label(x,y,text,'bp-label',anchor)}<path d="M${x} ${y+7}H${bendX}L${endX} ${endY}" class="bp-dim-line" marker-end="url(#${id}-arrow)"/>`;
  }
  function sectionRect(id,x,y,w,h) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="bp-object" fill="url(#${id}-hatch)"/>`; }
  function tube(a,b,y=190,height=34) {
    return `<rect x="${a}" y="${y}" width="${b-a}" height="${height}" class="bp-part"/>${line(a,y+6,b,y+6,'bp-fine')}${line(a,y+height-6,b,y+height-6,'bp-fine')}`;
  }
  // Longitudinal section through the left socket; the right end is mirrored.
  function socket(id,seat,mouth,y=174) {
    const back=seat-44;
    return sectionRect(id,back,y,mouth-back,16)+sectionRect(id,back,y+50,mouth-back,16)+sectionRect(id,back,y+16,44,12)+sectionRect(id,back,y+38,44,12)+line(seat,y+16,seat,y+50);
  }
  function mirror(svg,width) { return `<g transform="translate(${width} 0) scale(-1 1)">${svg}</g>`; }
  function detailBubble(x,y,letter,endX,endY) {
    return `<circle cx="${endX}" cy="${endY}" r="31" class="bp-detail-ring"/><path d="M${x+15} ${y-8}L${endX-20} ${endY+24}" class="bp-extension"/><circle cx="${x}" cy="${y}" r="17" class="bp-bubble"/>${label(x,y+6,letter,'bp-bubble-text')}`;
  }
  function electricalBox(id,center,seat,mouth) {
    const wall=center+60, left=center-60, shank=Math.max(0,seat-44-wall);
    return sectionRect(id,left,141,wall-left,9)+sectionRect(id,left,264,wall-left,9)+sectionRect(id,left,150,9,114)+sectionRect(id,wall-9,150,9,27)+sectionRect(id,wall-9,239,9,25)+sectionRect(id,wall,180,shank,10)+sectionRect(id,wall,224,shank,10)+socket(id,seat,mouth)+`<path d="M${wall-7} 166h18l8 8v66l-8 8h-18Z" class="bp-fine"/>`;
  }
  function elbow(id,center,seat,mouth) {
    // Sectioned elbow body with a visible bore, shoulder and socket mouth.
    const left=center-35, right=center+35;
    return `<path d="M${left} 127H${right}V157Q${right} 172 ${right+15} 172H${mouth}V190H${center+40}Q${center+17} 190 ${center+17} 163V127H${center-17}V184Q${center-17} 224 ${center+25} 224H${mouth}V242H${center+17}Q${left} 242 ${left} 185Z" class="bp-object" fill="url(#${id}-hatch)"/>${line(seat,190,seat,224)}${line(seat,190,seat-10,190)}${line(seat,224,seat-10,224)}`;
  }
  function overview(j,id) {
    let refs, ends, shape, view, caption, bodyLabel, referenceY=174;
    const wall = j.trade==='carpentry', insertion=j.kind==='insertion';
    if(wall) {
      view='FRONT SECTION'; bodyLabel=j.kind==='clearance'?'SHELF TO CUT':'RAIL TO CUT';
      refs=[180,820]; ends=j.kind==='clearance'?[200,800]:[230,770];
      const start=j.kind==='clearance'?128:180, width=j.kind==='clearance'?52:50;
      shape=sectionRect(id,start,153,width,113)+sectionRect(id,1000-start-width,153,width,113);
      shape+=`<rect x="${ends[0]}" y="190" width="${ends[1]-ends[0]}" height="34" class="bp-part"/>`;
      shape+=leader(id,80,120,125,0,start+width/2,153,'SIDE PANEL');
      shape+=leader(id,920,120,875,0,1000-start-width/2,153,'SIDE PANEL','end');
      referenceY=153;
    } else if(j.trade==='plumbing') {
      view='LONGITUDINAL SECTION'; bodyLabel='COPPER TUBE TO CUT';
      if(insertion) {
        refs=[260,740];ends=[210,790];
        shape=socket(id,210,260)+mirror(socket(id,210,260),1000)+tube(...ends);
        shape+=leader(id,70,126,140,0,166,174,'COUPLING')+leader(id,930,126,860,0,834,174,'COUPLING','end');
      } else {
        refs=[180,820];ends=[300,700];
        shape=elbow(id,180,300,340)+mirror(elbow(id,180,300,340),1000)+tube(...ends);
        shape+=line(180,99,180,260,'bp-center')+line(820,99,820,260,'bp-center');
        shape+=label(180,112,'CL','bp-cl')+label(820,112,'CL','bp-cl');
        shape+=leader(id,65,116,90,0,145,150,'90° ELBOW')+leader(id,935,116,910,0,855,150,'90° ELBOW','end');
        referenceY=127;
      }
      shape+=line(105,207,895,207,'bp-center');
    } else {
      view='SECTION THROUGH BOXES & CONNECTORS';bodyLabel='CONDUIT TO CUT';
      refs=insertion?[330,670]:[180,820];ends=[290,710];
      shape=electricalBox(id,180,290,330)+mirror(electricalBox(id,180,290,330),1000)+tube(...ends);
      shape+=line(180,116,180,283,'bp-center')+line(820,116,820,283,'bp-center')+line(110,207,890,207,'bp-center');
      shape+=label(180,126,'CL','bp-cl')+label(820,126,'CL','bp-cl');
      shape+=leader(id,68,115,98,0,132,158,'BOX')+leader(id,932,115,902,0,868,158,'BOX','end');
      referenceY=insertion?174:141;
    }
    caption=j.reference.toUpperCase();
    const notes=wall ? 'Section hatching shows the side panels.' : insertion ? 'Section view exposes the socket seats inside the fittings.' : 'CL locates the centers. The cut piece ends at the internal seats.';
    const svg=`${definitions(id)}${dimension(id,...refs,76,referenceY,inches(j.span),caption)}${shape}${label(500,174,bodyLabel,'bp-label')}${detailBubble(102,294,'A',ends[0],208)}${detailBubble(898,294,'B',ends[1],208)}${dimension(id,...ends,300,226,'L = ?','FINISHED CUT LENGTH')}`;
    return `<div class="bp-overview"><div class="bp-view-heading"><span>01 / ${view}</span><span>ASSEMBLY</span></div><div class="bp-main-scroll" tabindex="0" role="region" aria-label="Assembly drawing; scroll horizontally on small screens"><svg class="bp-main-svg" viewBox="0 0 1000 354" role="img" aria-label="${esc(j.reference)} ${esc(inches(j.span))}. Finished cut length L is unknown. Details A and B show the end allowances.">${svg}</svg></div><p class="bp-view-note">${notes}</p></div>`;
  }
  function detail(j,side,id) {
    const right=side==='right', value=j[side], transform=x=>right?480-x:x;
    let geometry,ref,end,featureY=145,refName,endName,explanation;
    const isWood=j.trade==='carpentry';
    if(isWood && j.kind==='clearance') {
      ref=190;end=255;
      geometry=sectionRect(id,115,131,75,100)+`<rect x="255" y="163" width="150" height="36" class="bp-part"/>`;
      refName='INSIDE FACE';endName='SHELF EDGE';
      explanation='Leave this clear space between the cabinet wall and the shelf edge.';
      featureY=[131,163];
    } else if(isWood) {
      ref=150;end=250;
      geometry=sectionRect(id,150,131,100,100)+`<rect x="250" y="163" width="155" height="36" class="bp-part"/>`;
      refName='OUTSIDE FACE';endName='INSIDE FACE';
      explanation='The overall width includes this panel. The rail ends against its inside face.';
      featureY=131;
    } else if(j.kind==='insertion') {
      ref=305;end=210;
      geometry=socket(id,210,305,146)+tube(210,421,162,34)+line(97,179,430,179,'bp-center');
      refName='FITTING MOUTH';endName='INTERNAL SEAT';
      explanation='The cut end reaches the internal seat. This much length is hidden inside the fitting.';
      featureY=[146,162];
      if(j.trade==='electrical') geometry+=`<path d="M138 140h20l9 9v60l-9 9h-20" class="bp-object"/>`;
    } else if(j.trade==='plumbing') {
      ref=140;end=290;
      geometry=elbow(id,140,290,335)+tube(290,425)+line(140,110,140,248,'bp-center')+line(91,207,432,207,'bp-center');
      refName='ELBOW CENTERLINE';endName='INTERNAL SEAT';
      explanation='Measure from the elbow centerline to the internal seat. Socket insertion is already included.';
      featureY=[127,190];
    } else {
      ref=150;end=295;
      geometry=electricalBox(id,150,295,335)+tube(295,426)+line(150,108,150,283,'bp-center')+line(87,207,433,207,'bp-center');
      refName='BOX CENTERLINE';endName='INTERNAL SEAT';
      explanation='The plan starts at the box centerline. The conduit starts at the internal connector seat.';
      featureY=[141,190];
    }
    // Geometry mirrors; labels remain upright and leaders end on the actual reference features.
    if(right) geometry=mirror(geometry,480);
    const isTall=!isWood && j.kind==='deduction';
    if(isTall) geometry+=label(transform(ref),120,'CL','bp-cl');
    const baseY=isTall?316:280, labelA=transform(ref)<transform(end)?67:413, labelB=480-labelA;
    const leaderY=isTall?222:199;
    const drawing=`${definitions(id)}${dimension(id,transform(ref),transform(end),76,featureY,inches(value),j.allowance.toUpperCase())}${geometry}${leader(id,labelA,baseY,labelA===67?20:460,0,transform(ref),leaderY,refName,labelA===67?'start':'end')}${leader(id,labelB,baseY+31,labelB===67?20:460,0,transform(end),leaderY,endName,labelB===67?'start':'end')}`;
    return `<section class="bp-detail"><h3><span>${right?'B':'A'}</span> ${right?'RIGHT':'LEFT'} END <small>ENLARGED</small></h3><svg viewBox="0 0 480 ${baseY+53}" role="img" aria-label="${right?'Right':'Left'} end: ${esc(j.allowance.toLowerCase())} ${esc(inches(value))}, measured between ${refName.toLowerCase()} and ${endName.toLowerCase()}.">${drawing}</svg><p>${explanation}</p></section>`;
  }
  function sheet(j,id='bp') {
    return `<div class="blueprint-sheet"><div class="bp-sheet-heading"><div><span>WORKSHOP / FABRICATION DRAWING</span><h3>${esc(j.title)}</h3></div><strong>${j.id.toUpperCase()}<small>REV A</small></strong></div>${overview(j,id+'-main')}<div class="bp-details">${detail(j,'left',id+'-a')}${detail(j,'right',id+'-b')}</div><div class="bp-legend"><span><i class="solid"></i> Visible edge</span><span><i class="center"></i> CL · centerline</span><span><i class="hatched"></i> Material in section</span><span>L · length to calculate</span></div><div class="bp-title-block"><div><span>MATERIAL</span><strong>${esc(M.trades[j.trade].material)}</strong></div><div><span>MAKE</span><strong>${j.quantity} ${j.quantity===1?'piece':'identical pieces'}</strong></div><div><span>UNITS</span><strong>Inches (″)</strong></div><div><span>SCALE</span><strong>NTS · do not scale</strong></div></div><p class="bp-sheet-note">Use written dimensions. Enlarged details clarify the end conditions.${j.trade==='carpentry'?'':' Fitting dimensions apply to this training job only.'}</p></div>`;
  }
  function inspection(j,piece) {
    const result=M.inspect(j,piece),target=M.target(j),scale=630/Math.max(target,piece),expectedWidth=target*scale,actualWidth=piece*scale;
    const text=result.fit==='fit'?`Fits the drawing · ${M.format(piece)} in`:`${result.fit==='long'?'Too long':'Too short'} by ${M.format(Math.abs(result.difference))} in`;
    return `<div class="fit-inspection ${result.fit==='fit'?'fits':''}"><strong>${text}</strong><svg viewBox="0 0 880 140" role="img" aria-label="${esc(text)}. Compare required length and your cut from the same left endpoint.">${label(20,45,'REQUIRED','fit-label','start')}<rect x="170" y="24" width="${expectedWidth}" height="28" fill="none" stroke="#b3d4cf" stroke-width="2" stroke-dasharray="6 5"/>${label(20,95,'YOUR CUT','fit-label','start')}<rect x="170" y="74" width="${actualWidth}" height="28" fill="${result.fit==='fit'?'#a9dec6':'#efad87'}"/><path d="M170 13V118M${170+expectedWidth} 13V118" stroke="#d5e8e1" stroke-dasharray="3 4"/></svg><p>Both lengths start at the same left reference. The drawing above remains the job specification.</p></div>`;
  }
  root.CutFitBlueprint={sheet,inspection};
})(window);
