/* Shared learning feedback and access helpers. No framework, images, network or telemetry. */
const MathStudio=(()=>{
  const $=id=>document.getElementById(id), wrap=$('wrap');
  const coach=document.createElement('section');coach.className='studioCoach';coach.setAttribute('aria-label','Strategy desk');
  coach.innerHTML='<strong>Strategy desk</strong><p>Take a breath. Look for the relationship before choosing.</p>';
  wrap.append(coach);
  const live=document.createElement('div');live.className='studioSR';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');document.body.append(live);
  const history=[];
  function say(text){live.textContent=text;}
  function tell(text,correct){coach.querySelector('.studioModel')?.remove();coach.querySelector('p').textContent=text;if(correct!==undefined)coach.dataset.correct=String(correct);say(text);}
  function isMuted(){try{return localStorage.getItem('math-muted')==='true';}catch{return false;}}
  function setMuted(value){try{localStorage.setItem('math-muted',String(value));}catch{}const b=$('muteBtn');if(b){b.textContent=value?'🔇':'🔊';b.setAttribute('aria-label',value?'Turn sound on':'Mute sound');b.setAttribute('aria-pressed',String(value));}}
  setMuted(isMuted());
  if($('pauseBtn'))$('pauseBtn').setAttribute('aria-label','Pause game');
  if($('toast')){$('toast').setAttribute('role','status');$('toast').setAttribute('aria-atomic','true');}
  // Restrict keyboard focus to the visible modal; preserve normal Tab/Shift+Tab order.
  function activeModal(){const save=$('mathConnection');if(save&&!save.hidden&&save.querySelector('button'))return save;return [...document.querySelectorAll('.overlay')].find(el=>!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none')||($('auditOv')?.classList.contains('show')?$('auditOv'):null);}
  const syncModal=()=>{
    const modal=activeModal();
    for(const other of document.querySelectorAll('.overlay,#auditOv')){other.inert=!!modal&&other!==modal;if(other!==modal)other.removeAttribute('aria-modal');}
    const save=$('mathConnection');if(save&&save!==modal){save.setAttribute('role','status');save.removeAttribute('aria-modal');}
    if(modal){modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',modal.id==='mathConnection'?'Save score and XP':modal.querySelector('h1,h2')?.textContent||'Equivalence check');wrap.inert=true;if(!modal.contains(document.activeElement))modal.querySelector('button:not(:disabled),input')?.focus({preventScroll:true});}
    else wrap.inert=false;
  };
  const observer=new MutationObserver(syncModal);document.addEventListener('DOMContentLoaded',syncModal,{once:true});
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  document.addEventListener('keydown',e=>{const m=activeModal();if(!m||e.key!=='Tab')return;const items=[...m.querySelectorAll('button:not(:disabled),input,summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);if(!items.length)return;const first=items[0],last=items.at(-1);if(e.shiftKey&&(document.activeElement===first||!m.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!m.contains(document.activeElement))){e.preventDefault();first.focus();}});
  return {
    model(g,i=0){
      coach.querySelector('.studioModel')?.remove();
      const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.classList.add('studioModel');svg.setAttribute('viewBox','0 0 360 104');svg.setAttribute('role','img');
      function node(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;svg.append(e);return e;}
      function label(x,y,text,fill='#d8e9f2',size=12){node('text',{x,y,fill,'font-size':size,'font-family':'system-ui'},text);}
      const slug=document.body.dataset.game;
      if(slug==='magnitude'&&g._items){
        svg.setAttribute('aria-label','Comparison of the four values on a common scale');
        const max=Math.max(...g._items.map(v=>v.v));g._items.forEach((v,k)=>{label(0,18+k*24,v.l);node('rect',{x:100,y:6+k*24,width:Math.max(1,210*v.v/max),height:12,rx:4,fill:v.v===max?'#aee891':'#72bbd2'});label(320,18+k*24,v.v===max?'max':'');});
      }else if(slug==='scale-storm'&&g._k){
        const result=g._k**g._pow,max=Math.max(g._k,result,1);svg.setAttribute('aria-label','Compare input and output scale factors: '+g._k+' becomes '+result);
        label(0,14,'INPUT FACTOR');label(0,58,'OUTPUT FACTOR');
        for(const [v,y] of [[g._k,22],[result,66]]){node('rect',{x:0,y,width:280*v/max,height:14,rx:4,fill:y===22?'#72bbd2':'#ffd183'});label(292,y+12,'× '+(Number(v.toPrecision(4))===v?'':'≈ ')+Number(v.toPrecision(4)));}
      }else if(slug==='inverse-blitz'){
        svg.setAttribute('aria-label','The operation '+g.steps[i].c+' is applied to both sides to preserve equality');
        node('path',{d:'M 50 30 H 310 M 180 30 L 160 90 H 200 Z M 75 30 V 65 M 285 30 V 65 M 35 65 Q 75 97 115 65 M 245 65 Q 285 97 325 65',fill:'none',stroke:'#85b4c9','stroke-width':2});
        label(32,18,'LEFT SIDE');label(244,18,'RIGHT SIDE');label(42,57,g.steps[i].c,'#cdbaf6',18);label(252,57,g.steps[i].c,'#cdbaf6',18);
      }else if(slug==='powers-of-ten'&&g._val!==undefined){
        const answer=g.steps[0].c;svg.setAttribute('aria-label',answer+' represents '+g._val);label(4,25,answer,'#a7d2fa',23);node('path',{d:'M 8 48 H 336 M 328 42 L 336 48 L 328 54',fill:'none',stroke:'#85b4c9','stroke-width':2});label(4,80,g._val.toLocaleString('en-US',{maximumFractionDigits:8}),'#eaf4fa',23);
      }else return;
      coach.append(svg);
    },
    reducedMotion:()=>matchMedia('(prefers-reduced-motion: reduce)').matches,isMuted,setMuted,say,tell,
    reset(){history.length=0;document.querySelector('.studioReview')?.remove();$('practiceReview')?.remove();tell('Look for the relationship. Feedback stays here while you play.');},
    question(g){const prompt=[g.banner,g.name,g.states?.[g.i||0]].filter(Boolean).join('. ');if($('card')){$('card').setAttribute('role','group');$('card').setAttribute('aria-label',prompt);}say(prompt);},
    record(prompt,answer,explanation,correct){history.push({prompt,answer,explanation,correct});if(history.length>30)history.shift();tell((correct?'✓ ':'Try this: ')+explanation,correct);},
    review(message,label,done){$('practiceReview')?.remove();tell(message);const b=document.createElement('button');b.id='practiceReview';b.textContent=label;b.onclick=()=>{b.remove();done();};coach.append(b);b.focus({preventScroll:true});},
    summary(){document.querySelector('.studioReview')?.remove();const panel=$('overOv')?.querySelector('.panel');if(!panel)return;const review=document.createElement('details');review.className='studioReview';const title=document.createElement('summary');title.textContent='Your strategy recap';review.append(title);const list=document.createElement('ol');const mistakes=history.filter(h=>!h.correct);const rows=(mistakes.length?mistakes:history).slice(-4);if(!rows.length){const p=document.createElement('p');p.textContent='Try a practice round to build a strategy before your next ranked run.';review.append(p);}for(const h of rows){const li=document.createElement('li'),b=document.createElement('b'),small=document.createElement('small'),p=document.createElement('p');b.textContent=h.prompt;small.textContent='Your choice: '+h.answer;p.textContent=h.explanation;li.append(b,small,p);list.append(li);}review.append(list);panel.querySelector('.statgrid')?.after(review);}
  };
})();
