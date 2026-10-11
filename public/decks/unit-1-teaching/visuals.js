(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stage = document.querySelector('deck-stage');
  if (!stage) return;
  const records = new Map();
  let current = null;
  const findAll = (s,r=document) => [...r.querySelectorAll(s)];
  // Each entry is one finite teaching animation. There are no perpetual loops,
  // timers in background slides, or hidden answer reveals.
  for (const slide of findAll('.slide')) {
    const figures = findAll('.lesson-visual',slide).filter(f=>f.querySelector('.v-trace'));
    const legacy = findAll('.chart[data-chart],.vectorplot,.forceplot',slide).filter(f=>!f.closest('.simulation'));
    if (legacy.length) slide.classList.add('has-legacy-visual');
    const entries = figures.map(figure=>{
      const traces=findAll('.v-trace',figure).map(node=>({node,length:node.getTotalLength(),dash:node.getAttribute('stroke-dasharray')}));
      const cursors=findAll('.v-cursor',figure).map(node=>({node,points:JSON.parse(node.dataset.points),xrange:node.dataset.xRange?.split(',').map(Number)}));
      const controls=document.createElement('div');controls.className='visual-controls';
      controls.innerHTML='<button type="button" data-visual-play aria-label="Play visual animation">Replay</button><button type="button" data-visual-reset aria-label="Reset visual animation">Reset</button><input type="range" min="0" max="100" step="1" value="100" aria-label="Visual animation progress"><span class="visual-state">100%</span>';
      figure.append(controls);
      const play=controls.querySelector('[data-visual-play]'),reset=controls.querySelector('[data-visual-reset]'),scrub=controls.querySelector('input'),status=controls.querySelector('.visual-state');
      const entry={figure,traces,cursors,play,scrub,status,progress:1,frame:0,start:0,playing:false};
      function paint(p){
        entry.progress=Math.max(0,Math.min(1,p));scrub.value=Math.round(entry.progress*100);status.textContent=`${scrub.value}%`;
        traces.forEach(({node,length,dash})=>{
          if(entry.progress>=1){node.style.strokeDasharray=dash||'';node.style.strokeDashoffset='';}
          else{node.style.strokeDasharray=`${length} ${length}`;node.style.strokeDashoffset=String(length*(1-entry.progress));}
        });
        cursors.forEach(({node,points,xrange})=>{
          if(!points.length)return;
          let v=entry.progress*(points.length-1),idx=Math.min(points.length-1,Math.floor(v)),f=v-idx;
          if(xrange){const x=xrange[0]+entry.progress*(xrange[1]-xrange[0]);idx=Math.max(0,points.findLastIndex(p=>p[0]<=x));const a=points[idx],b=points[Math.min(points.length-1,idx+1)];f=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0]||1)));}
          const a=points[idx],b=points[Math.min(points.length-1,idx+1)],x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;
          if(node.classList.contains('v-cart')){node.setAttribute('x',x-45);node.setAttribute('y',y-19);}else{node.setAttribute('cx',x);node.setAttribute('cy',y);}
        });
      }
      function stop(){cancelAnimationFrame(entry.frame);entry.frame=0;entry.playing=false;play.textContent=entry.progress>=1?'Replay':'Play';play.setAttribute('aria-label','Play visual animation');}
      function start(){
        if(reduced.matches){paint(1);stop();return;}
        if(entry.progress>=1)paint(0);
        entry.playing=true;play.textContent='Pause';play.setAttribute('aria-label','Pause visual animation');entry.start=performance.now()-entry.progress*3600;
        const tick=now=>{if(!slide.classList.contains('active')||document.hidden){stop();return;}paint((now-entry.start)/3600);if(entry.progress>=1)stop();else entry.frame=requestAnimationFrame(tick);};
        entry.frame=requestAnimationFrame(tick);
      }
      entry.paint=paint;entry.stop=stop;entry.startPlayback=start;
      play.addEventListener('click',()=>entry.playing?stop():start());
      reset.addEventListener('click',()=>{stop();paint(0);play.textContent='Play';});
      scrub.addEventListener('input',()=>{stop();paint(Number(scrub.value)/100);play.textContent=entry.progress>=1?'Replay':'Play';});
      return entry;
    });
    // Existing force/vector/graph renderers retain their exact coordinates.
    // Animate their strokes once on entry and retain all labels throughout.
    records.set(slide,{entries,legacy,animations:[]});
  }
  function stopSlide(slide){const r=records.get(slide);if(!r)return;r.entries.forEach(e=>e.stop());r.animations.forEach(a=>a.cancel());r.animations=[];}
  function activate(){
    const next=document.querySelector('.slide.active');if(next===current)return;
    stopSlide(current);current=next;const r=records.get(next);if(!r)return;
    r.entries.forEach(e=>{e.paint(reduced.matches?1:0);e.startPlayback();});
    if(!reduced.matches)for(const container of r.legacy)for(const node of findAll('polyline,path[stroke-width="4"]',container)){
      if(!node.getTotalLength)continue;const length=node.getTotalLength();
      const a=node.animate([{strokeDasharray:`${length} ${length}`,strokeDashoffset:length},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0}],{duration:1800,easing:'ease-out'});r.animations.push(a);
    }
  }
  document.addEventListener('slidechange',activate);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSlide(current);});
  reduced.addEventListener('change',()=>{stopSlide(current);records.get(current)?.entries.forEach(e=>e.paint(1));});
  window.addEventListener('beforeprint',()=>{for(const r of records.values()){r.animations.forEach(a=>a.cancel());r.animations=[];r.entries.forEach(e=>{e.stop();e.paint(1);});}});
  window.addEventListener('pagehide',()=>stopSlide(current));
  activate();
})();
