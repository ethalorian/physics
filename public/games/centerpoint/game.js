(function () {
  'use strict';
  const M=window.CenterMath, $=id=>document.getElementById(id);
  let bench='all',variation=0,jobs=M.makeSet(),index=0,mark=null,checked=null,attempts=0,hints=0,done=false,results=[];
  const job=()=>jobs[index];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inch=n=>M.format(n)+' in';
  const text=(x,y,s,cls='',anchor='middle')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;
  function geometry(j) {
    const face=j.bench==='face',scale=face?Math.min(580/j.w,250/j.h):580/j.w;
    const w=scale*j.w,h=face?scale*j.h:88;
    return {x:110+(580-w)/2,y:face?150:210,w,h,height:face?530:440};
  }
  function sheet(j,prefix,interactive) {
    const g=geometry(j),x=n=>g.x+n/j.w*g.w,y=n=>g.y+n/j.h*g.h;
    const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" ${extra}/>`;
    const dim=(a,b,yy,label)=>line(a,yy,b,yy,`marker-start="url(#${prefix}-arrow)" marker-end="url(#${prefix}-arrow)"`)+line(a,yy-8,a,g.y-5,'opacity=".6"')+line(b,yy-8,b,g.y-5,'opacity=".6"')+text((a+b)/2,yy-12,label,'dim-text');
    const pipe=/tube|conduit/i.test(j.material);
    let s=`<svg ${interactive?'id="markingArea" tabindex="0"':''} viewBox="0 0 800 ${g.height}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc">
      <title id="${prefix}-title">${esc(j.material)} layout drawing</title><desc id="${prefix}-desc">${esc(j.bench==='face'?`Rectangular face, ${inch(j.w)} wide by ${inch(j.h)} high. X is from the left edge; Y is down from the top edge.`:j.bench==='marks'?`Material length ${inch(j.w)}. Mark A is ${inch(j.a)} and mark B is ${inch(j.b)} from the left end. Find the midpoint between A and B.`:`Material length ${inch(j.w)}. Find the halfway line along its length.`)}${interactive?' Click material to mark, or use the exact distance fields and arrow keys.':''}</desc>
      <defs><marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10" fill="#174768"/></marker><pattern id="${prefix}-grain" width="60" height="24" patternUnits="userSpaceOnUse"><path d="M 0 8 Q 30 2 60 8 M 0 21 Q 30 15 60 21" fill="none" stroke="#b1a887" stroke-width=".7" opacity=".35"/></pattern><pattern id="${prefix}-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 H 0 V 25" fill="none" stroke="#dbe5ea" stroke-width=".6"/></pattern></defs>
      <rect width="800" height="${g.height}" fill="#f4f8fa"/><rect x="20" y="56" width="760" height="${g.height-120}" fill="url(#${prefix}-grid)"/>`;
    s+=text(26,30,j.bench==='face'?'PLAN / RECTANGULAR FACE':'ELEVATION / LENGTH LAYOUT','tiny','start')+text(774,30,j.id.toUpperCase()+' · REV A','tiny','end')+line(20,44,780,44);
    s+=dim(g.x,g.x+g.w,j.bench==='marks'?100:g.y-42,M.format(j.w)+'″ OVERALL');
    if(j.bench==='marks')s+=dim(x(j.a),x(j.b),168,'A–B: '+M.format(j.b-j.a)+'″');
    s+=`<rect x="${g.x+4}" y="${g.y+5}" width="${g.w}" height="${g.h}" fill="#d9e3e5"/><rect data-material="true" x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="${j.trade==='Carpentry'?'#f1e6cb':pipe?'#e5e4db':'#e0e9ed'}" stroke="#174768" stroke-width="2"/>`;
    if(j.trade==='Carpentry')s+=`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="url(#${prefix}-grain)" pointer-events="none"/>`;
    if(pipe)s+=line(g.x+7,g.y+14,g.x+g.w-7,g.y+14,'opacity=".3"')+line(g.x+7,g.y+g.h-14,g.x+g.w-7,g.y+g.h-14,'opacity=".3"')+`<ellipse cx="${g.x}" cy="${g.y+g.h/2}" rx="5" ry="${g.h/2}" fill="#d0d5cc" stroke="#174768"/><ellipse cx="${g.x+g.w}" cy="${g.y+g.h/2}" rx="5" ry="${g.h/2}" fill="#e7e8e0" stroke="#174768"/>`;
    if(j.bench==='face') {
      const xx=g.x-38;
      s+=line(xx,g.y,xx,g.y+g.h,`marker-start="url(#${prefix}-arrow)" marker-end="url(#${prefix}-arrow)"`)+line(xx-8,g.y,g.x-5,g.y)+line(xx-8,g.y+g.h,g.x-5,g.y+g.h);
      s+=`<text x="${xx-12}" y="${g.y+g.h/2}" text-anchor="middle" class="dim-text" transform="rotate(-90 ${xx-12} ${g.y+g.h/2})">${esc(M.format(j.h))}″</text>`;
      if(done)s+=line(g.x,g.y,g.x+g.w,g.y+g.h,'stroke-dasharray="9 4 2 4" opacity=".5"')+line(g.x+g.w,g.y,g.x,g.y+g.h,'stroke-dasharray="9 4 2 4" opacity=".5"');
    }
    if(j.bench==='marks') {
      for(const [name,n]of[['A',j.a],['B',j.b]])s+=line(x(n),g.y-14,x(n),g.y+g.h+14,'stroke-width="1.5" stroke-dasharray="10 4 2 4"')+text(x(n),g.y+g.h+34,name+' · '+M.format(n)+'″','ref-text');
    }
    s+=`<path d="M ${g.x-14} ${g.y} l -10 -5 v 10 z" fill="#174768"/>`+text(g.x-17,g.y-15,'0','ref-text');
    if(j.bench==='face')s+=text(g.x,g.y+g.h+28,'LEFT EDGE → X','tiny','start')+text(g.x+g.w,g.y+g.h+28,'Y ↓ FROM TOP','tiny','end');
    else s+=text(26,g.height-83,'REFERENCE: ALL POSITIONS MEASURED FROM THE LEFT END','tiny','start');
    if(mark) {
      const mx=x(mark.x),my=j.bench==='face'?y(mark.y):g.y+g.h/2,col=done?'#19614e':'#ad3f22';
      s+=`<g stroke="${col}" fill="none" stroke-width="2"><line x1="${mx}" y1="${g.y-10}" x2="${mx}" y2="${g.y+g.h+10}" stroke-dasharray="7 4"/>`;
      if(j.bench==='face')s+=`<line x1="${g.x-10}" y1="${my}" x2="${g.x+g.w+10}" y2="${my}" stroke-dasharray="7 4"/>`;
      s+=`<circle cx="${mx}" cy="${my}" r="12" fill="#fffefa"/><line x1="${mx-18}" y1="${my}" x2="${mx+18}" y2="${my}"/><line x1="${mx}" y1="${my-18}" x2="${mx}" y2="${my+18}"/><circle cx="${mx}" cy="${my}" r="2" fill="${col}"/></g>`;
    }
    s+=line(20,g.height-65,780,g.height-65)+text(26,g.height-42,j.material.toUpperCase(),'tiny','start')+text(774,g.height-42,'UNITS: INCHES  /  SCALE: NTS','tiny','end')+text(26,g.height-19,'SOLID = MATERIAL EDGE   ·   DASHED = LAYOUT MARK','tiny','start')+text(774,g.height-19,done?'VERIFIED CENTER':'MEASURE FROM THE NAMED REFERENCE','tiny','end')+'</svg>';
    return s;
  }
  function draw() {
    const focused=document.activeElement?.id==='markingArea';
    $('drawing').innerHTML=sheet(job(),'main',true);
    const svg=$('markingArea');
    svg.addEventListener('click',e=>{
      if(done)return;
      const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse()),g=geometry(job());
      if(point.x<g.x||point.x>g.x+g.w||point.y<g.y||point.y>g.y+g.h)return;
      const x=Math.round((point.x-g.x)/g.w*job().w),y=job().bench==='face'?Math.round((point.y-g.y)/g.h*job().h):null;
      if(x<job().a||x>job().b){feedback('Use the work area.','Place your mark between A and B.');return;}
      setMark({x,y});
    });
    svg.addEventListener('keydown',e=>{
      const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
      if(d&&!done){e.preventDefault();nudge(d[0]*(e.shiftKey?8:1),d[1]*(e.shiftKey?8:1));}
    });
    if(focused)$('markingArea').focus({preventScroll:true});
  }
  function feedback(title,body,success=false) {
    $('feedback').hidden=false;$('feedback').className='feedback'+(success?' success':'');
    $('feedback').innerHTML='<strong>'+esc(title)+'</strong>'+esc(body);
  }
  function updateControls() {
    $('checkButton').disabled=!mark||done;
    $('nudges').disabled=!mark||done;
    $('placeButton').disabled=done;$('xInput').disabled=done;$('yInput').disabled=done;
    $('hintButton').disabled=done||hints>=2;
    $('nextButton').hidden=!done;
    $('markValue').textContent=mark?'X '+inch(mark.x)+(job().bench==='face'?' · Y '+inch(mark.y):''):'Not placed';
    document.querySelectorAll('[data-dy]').forEach(b=>b.hidden=job().bench!=='face');
  }
  function setMark(value) {
    mark=value;checked=null;
    $('xInput').value=M.format(mark.x);$('yInput').value=mark.y===null?'':M.format(mark.y);
    $('feedback').hidden=true;$('inspection').hidden=true;
    draw();updateControls();
  }
  function nudge(dx,dy) {
    if(done)return;
    const j=job(),current=mark||{x:j.a,y:j.bench==='face'?0:null};
    setMark({x:Math.max(j.a,Math.min(j.b,current.x+dx)),y:j.bench==='face'?Math.max(0,Math.min(j.h,current.y+dy)):null});
  }
  function place(e) {
    e.preventDefault();if(done)return;
    const x=M.parse($('xInput').value),y=job().bench==='face'?M.parse($('yInput').value):{ticks:null};
    if(x.error||y.error){feedback('Check your distance.',(x.error?'X: '+x.error:'Y: '+y.error));return;}
    const next={x:x.ticks,y:y.ticks},check=M.inspect(job(),next);
    if(check.error){feedback('Check the reference.',job().bench==='marks'?`X must be between ${inch(job().a)} and ${inch(job().b)}, measured from the left end.`:check.error);return;}
    setMark(next);
  }
  function balance() {
    const j=job(),r=checked;
    const row=(a,b,left,right)=>`<div class="balance-row"><div class="distance">${left}<strong>${inch(a)}</strong></div><span class="equal" aria-label="${a===b?'equals':'does not equal'}">${a===b?'=':'≠'}</span><div class="distance">${right}<strong>${inch(b)}</strong></div></div><div class="distance-bar" aria-hidden="true"><i style="width:${a/(a+b)*100}%"></i><i style="width:${b/(a+b)*100}%"></i></div>`;
    $('inspection').hidden=false;$('inspection').className='inspection'+(r.centered?' balanced':'');
    $('inspection').innerHTML='<h3>Prove it: compare both sides.</h3>'+row(r.left,r.right,j.bench==='marks'?'From mark A':'From left end',j.bench==='marks'?'To mark B':'To right end')+(j.bench==='face'?row(r.top,r.bottom,'From top edge','To bottom edge'):'');
  }
  function check() {
    if(!mark||done)return;
    checked=M.inspect(job(),mark);if(checked.error)return;
    attempts++;balance();
    if(checked.centered){
      done=true;
      const points=attempts===1&&hints===0?10:5;
      results.push({job:{...job()},attempts,hints,points});
      feedback('Right on center.',M.equation(job())+' Equal distances confirm your mark. +'+points+' practice points.',true);
      $('score').textContent=results.reduce((sum,r)=>sum+r.points,0)+' points';$('progress').value=results.length;
      $('nextButton').textContent=index===jobs.length-1?'See workshop report →':'Next job →';
      draw();updateControls();
    } else {
      const corrections=[];
      if(checked.dx)corrections.push(`Move ${checked.dx>0?'left':'right'} by ${inch(Math.abs(checked.dx))}.`);
      if(checked.dy)corrections.push(`Move ${checked.dy>0?'up':'down'} by ${inch(Math.abs(checked.dy))}.`);
      feedback('Not centered yet.',corrections.join(' ')+' Compare the distances, adjust your mark, and check again.');
    }
  }
  function loadJob(focus=false) {
    mark=null;checked=null;attempts=0;hints=0;done=false;
    const j=job();
    $('bench').hidden=false;$('report').hidden=true;
    $('orderCount').textContent=`JOB ${index+1} / ${jobs.length}`;
    $('jobMeta').textContent=j.trade+' / '+M.benches[j.bench];$('jobTitle').textContent=j.title;$('jobCode').textContent=j.id.toUpperCase();
    $('brief').textContent=j.bench==='face'?'Locate the center point of this rectangular face. Both the left/right and top/bottom distances must match.':j.bench==='marks'?'Find the halfway line between A and B. Give its position measured from the left end of the stock.':'Mark a line across the material at exactly half its length. The distances to the two ends must match.';
    const dims=j.bench==='face'?[['Width',j.w],['Height',j.h]]:j.bench==='marks'?[['Overall',j.w],['A from left',j.a],['B from left',j.b]]:[['Overall length',j.w]];
    $('dimensions').innerHTML=dims.map(([label,v])=>`<span>${label}<b>${inch(v)}</b></span>`).join('');
    $('referenceNote').textContent=j.bench==='face'?'Use the top-left corner as your reference. X goes right; Y goes down.':j.bench==='marks'?'Keep zero at the left end. Find the gap, halve it, then add the position of A.':'Keep zero at the left end. Divide the overall length by two.';
    $('yField').hidden=j.bench!=='face';$('xInput').value='';$('yInput').value='';
    $('feedback').hidden=true;$('inspection').hidden=true;$('hintText').hidden=true;$('hintText').textContent='';$('hintButton').textContent='Need a hint?';
    draw();updateControls();if(focus)$('jobTitle').focus({preventScroll:true});
  }
  function start(newBench=bench,newVariation=variation,selected=null) {
    bench=newBench;variation=newVariation;jobs=selected||M.makeSet(bench,variation);index=0;results=[];
    $('progress').max=jobs.length;$('progress').value=0;$('score').textContent='0 points';
    document.querySelectorAll('[data-bench]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bench===bench)));
    loadJob();
  }
  function report() {
    $('bench').hidden=true;$('report').hidden=false;
    const independent=results.filter(r=>r.points===10).length,points=results.reduce((n,r)=>n+r.points,0);
    $('reportSummary').textContent=`${points} / ${jobs.length*10} practice points · ${independent} centered on the first check · ${jobs.length-independent} completed with help or another check.`;
    $('reportJobs').innerHTML=results.map(r=>`<article><span class="result-tag ${r.points===10?'':'helped'}">${r.points===10?'FIRST CHECK':'WITH PRACTICE'} · ${r.points} POINTS</span><h3>${esc(r.job.title)}</h3><p>${esc(M.equation(r.job))}</p><p>${r.attempts} check${r.attempts===1?'':'s'} · ${r.hints} hint${r.hints===1?'':'s'}</p></article>`).join('');
    $('retry').hidden=independent===jobs.length;$('reportTitle').focus();
  }
  $('markForm').addEventListener('submit',place);$('checkButton').addEventListener('click',check);
  for(const id of ['xInput','yInput'])$(id).addEventListener('input',()=>{if(done)return;mark=null;checked=null;$('feedback').hidden=true;$('inspection').hidden=true;draw();updateControls();});
  document.querySelectorAll('[data-dx],[data-dy]').forEach(b=>b.addEventListener('click',()=>nudge(Number(b.dataset.dx||0),Number(b.dataset.dy||0))));
  document.querySelectorAll('[data-bench]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.bench,0)));
  $('nextButton').addEventListener('click',()=>{if(!done)return;if(index===jobs.length-1)report();else{index++;loadJob(true);}});
  $('hintButton').addEventListener('click',()=>{
    if(done||hints>=2)return;hints++;$('hintText').hidden=false;
    $('hintText').textContent=hints===2?M.equation(job()):job().bench==='marks'?'First subtract A from B. Half of that gap is the distance from A to the center. Add A to give your mark from the left end.':job().bench==='face'?'Halve the width for X, then halve the height for Y. Both measurements are needed. Half of a sixteenth is a thirty-second.':'Divide the whole length by 2. Halve the whole number and fraction, then combine them. Half of 3/4 is 3/8.';
    $('hintButton').textContent=hints===1?'Show the worked calculation':'Worked calculation shown';updateControls();
  });
  for(const id of ['newSet','again'])$(id).addEventListener('click',()=>start(bench,variation+1));
  $('retry').addEventListener('click',()=>start(bench,variation,results.filter(r=>r.points!==10).map(r=>({...r.job}))));
  $('howButton').addEventListener('click',()=>$('howDialog').showModal());$('closeHow').addEventListener('click',()=>$('howDialog').close());
  $('expandDrawing').addEventListener('click',()=>{$('expandedTitle').textContent=job().title;$('expandedDrawing').innerHTML=sheet(job(),'expanded',false);$('drawingDialog').showModal();});
  $('closeDrawing').addEventListener('click',()=>$('drawingDialog').close());
  start();
})();
