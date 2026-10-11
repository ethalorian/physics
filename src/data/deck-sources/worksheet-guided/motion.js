/* A finite, replayable construction. Slide index owns progress so Teach and
   the projected window pause at the same reasoning step. */
(()=>{
 let frame=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function play(root){
  cancelAnimationFrame(frame);
  const parts=[...root.querySelectorAll('[data-motion]')].map(el=>{
   const kind=el.dataset.motion,base=el.dataset.base;
   let length=0;if(kind==='draw'){try{length=el.getTotalLength()}catch{}}
   return {el,kind,length,at:Number(el.dataset.at||0),transform:el.dataset.originalTransform??(el.dataset.originalTransform=el.getAttribute('transform')||''),height:Number(el.dataset.originalHeight??(el.dataset.originalHeight=el.getAttribute('height')||0)),y:Number(el.dataset.originalY??(el.dataset.originalY=el.getAttribute('y')||0)),base:Number(base)};
  });
  if(!parts.length)return;
  const board=root.querySelector('[data-scene]'),continuous=board&&!['calculation','reasoning','worksheet-model'].includes(board.dataset.scene);
  const from=continuous?Number(board.dataset.buildFrom||0):0,to=continuous?Number(board.dataset.buildTo??1):1;
  const draw=f=>parts.forEach(({el,kind,length,at,transform,height,y,base})=>{
   const t=Math.max(0,Math.min(1,(f-at)/Math.max(.01,Math.min(.23,1-at)))),p=1-(1-t)**3;
   if(kind==='draw'&&length){el.style.strokeDasharray=t===1?'':String(length);el.style.strokeDashoffset=t===1?'':String(length*(1-p));el.style.opacity=t>0?'1':'0'}
   else if(kind==='translate'){el.setAttribute('transform',`${transform} translate(${Number(el.dataset.dx||0)*(1-p)} ${Number(el.dataset.dy||0)*(1-p)})`);el.style.opacity=String(Math.min(1,t*5))}
   else if(kind==='bar'){el.setAttribute('height',String(height*p));el.setAttribute('y',String(y<base?base-height*p:y));el.style.opacity='1'}
   else el.style.opacity=String(p);
  });
  if(reduced.matches){draw(to);return}
  draw(from);const start=performance.now();const tick=now=>{const f=Math.min(1,(now-start)/3200);draw(from+(to-from)*f);if(f<1)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);
 }
 window.WorksheetMotion={play,stop:()=>cancelAnimationFrame(frame)};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else{const active=document.querySelector('.slide.active');if(active)play(active)}});
 reduced.addEventListener('change',()=>{const active=document.querySelector('.slide.active');if(active)play(active)});
})();
