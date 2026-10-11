(function() {
  'use strict';
  const $=id=>document.getElementById(id),E=window.MicCheckEngine,tracks=window.MicCheckTracks,sound=new window.MicCheckSound();
  const keys=['KeyD','KeyF','KeyJ','KeyK'],labels=['D','F','J','K'],colors=['#c5f45b','#c4adff','#ffb577','#72e5e0'];
  const pads=[...document.querySelectorAll('[data-lane]')],embedded=window.parent!==window,canvas=$('highway'),ctx=canvas.getContext('2d');
  const storage={get(k,f){try{return JSON.parse(localStorage.getItem('mic-check-v1-'+k))??f;}catch{return f;}},set(k,v){try{localStorage.setItem('mic-check-v1-'+k,JSON.stringify(v));}catch{}}};
  let track=tracks[0],state='menu',run=null,mode='practice',playId=null,staff=false,coinId=null,finalMessage=null,saved=true,timer=null;
  let unlock=1,contextReady=false,lastSection='',lastUI=0,feedbackAt=0,avatarTimer={},width=0,height=0;
  let offset=Math.max(-200,Math.min(200,Number(storage.get('offset',0))||0)),volume=Math.max(0,Math.min(100,Number(storage.get('volume',70))||0));
  let reduced=!!storage.get('reduced',matchMedia('(prefers-reduced-motion: reduce)').matches);
  const down=new Set(),pressedPointers=new Map(),uid=()=>crypto.randomUUID?.()||Date.now()+'-'+Math.random(),time=()=>sound.time()-offset/1000;
  const post=message=>window.parent.postMessage({source:'mic-check-arcade',protocol:2,...message},window.location.origin);
  function screen(next) {
    state=next;$('cabinet').dataset.screen=next;
    const menu=['menu','loading','pending'].includes(next);
    for(const id of ['introCopy','setlist','howto','stageCaption'])$(id).hidden=!menu;
    for(const id of ['playZone','sessionPanel'])$(id).hidden=menu;
    $('pause').hidden=menu||next==='result';$('pauseOverlay').hidden=next!=='paused';$('resultOverlay').hidden=next!=='result';
    if(menu)$('stageLabel').textContent='SOUND CHECK';
    if(!menu)resize();
  }
  function busy(value) {document.querySelectorAll('.track').forEach(b=>b.disabled=value);$('practice').disabled=value;$('ranked').disabled=value||!contextReady||Number(track.id.slice(-1))>unlock;}
  function settings() {
    $('volume').value=volume;$('volumeValue').textContent=volume+'%';$('offset').value=offset;$('offsetValue').textContent=offset+' ms';$('motion').checked=reduced;$('cabinet').classList.toggle('reduced',reduced);sound.volumeTo(volume/100);
  }
  function renderTracks() {
    $('tracks').replaceChildren();
    tracks.forEach((t,i)=>{
      const button=document.createElement('button');button.type='button';button.className='track'+(t===track?' selected':'');button.style.setProperty('--song-color',t.color);button.setAttribute('aria-pressed',String(t===track));button.dataset.track=t.id;
      const icon=document.createElement('span');icon.className='track-icon';icon.textContent=t.icon;icon.setAttribute('aria-hidden','true');
      const info=document.createElement('span');info.className='track-info';const title=document.createElement('strong');title.textContent=t.title;const sub=document.createElement('small');sub.textContent='UNIT '+(i+1)+' · '+t.unit;info.append(title,sub);
      const tag=document.createElement('span');tag.className='track-state';tag.textContent=contextReady&&i+1>unlock?'PREVIEW':t===track?'↗':'0'+(i+1);button.append(icon,info,tag);button.addEventListener('click',()=>select(t));$('tracks').append(button);
    });
  }
  function select(t) {
    if(state!=='menu')return;track=t;document.documentElement.style.setProperty('--accent',t.color);renderTracks();
    document.querySelector('.track-count').textContent='0'+(tracks.indexOf(t)+1)+' / 08';$('trackHook').textContent=t.hook;$('status').textContent='';
    $('rankedHint').textContent=!embedded?'Free practice. Your best stays on this device.':!contextReady?'Loading your course tracks…':Number(t.id.slice(-1))>unlock?'Free preview. Ranked unlocks when your class reaches this unit.':'One credit plays the full track. Timing scores do not award learning XP.';
    busy(false);
  }
  async function loadContext() {
    try {const r=await fetch('/api/arcade/mic-check/context',{credentials:'same-origin'});if(r.ok){const d=await r.json();unlock=Math.max(1,Math.min(8,Number(d.unlockedThrough)||1));contextReady=true;if(state==='menu')select(tracks.find(t=>t.id===d.preferredUnit)||track);return;}}
    catch{}
    contextReady=!embedded;unlock=1;if(state==='menu')select(track);
    if(embedded)$('status').textContent='Course connection unavailable. Free practice is ready; reload to retry ranked play.';
  }
  async function start(ranked) {
    if(state==='pending'){if(ranked)requestCoin();return;}
    if(state!=='menu')return;
    if(ranked&&(!embedded||!contextReady||Number(track.id.slice(-1))>unlock))return;
    mode=ranked?'ranked':'practice';playId=null;staff=false;finalMessage=null;saved=true;screen('loading');busy(true);$('status').textContent='Warming up the beat and vocals…';
    try {await sound.load(track);} catch {screen('menu');busy(false);$('status').textContent='The vocals could not load. Check your connection, then take the mic again.';return;}
    if(ranked){coinId=uid();screen('pending');$('status').textContent='Checking your credit…';requestCoin();} else begin();
  }
  function requestCoin() {
    $('ranked').disabled=true;post({type:'arcade:coinRequest',requestId:coinId});clearTimeout(timer);
    timer=setTimeout(()=>{if(state!=='pending')return;$('status').textContent='Still checking your credit. Retry checks the same request; it will not spend a second credit.';$('ranked').textContent='Check credit status';$('ranked').disabled=false;},11000);
  }
  function begin() {
    clearTimeout(timer);run=new E.Run();lastSection='';down.clear();pressedPointers.clear();pads.forEach(p=>p.classList.remove('pressed'));
    $('ranked').textContent='Play ranked · 10 XP';$('sessionUnit').textContent='UNIT '+track.id.slice(-1)+' / '+track.unit.toUpperCase();$('sessionTitle').textContent=track.title;
    $('modeBadge').textContent=mode==='practice'?'FREE PRACTICE':staff?'STAFF · UNRANKED':'RANKED RUN';$('score').textContent='0';$('judgement').textContent='';$('energy').style.width='34%';$('crowdText').textContent='READY FOR YOU';
    sound.start();screen('playing');$('coachSpeech').textContent='Listen. Then make it yours.';$('playerSpeech').textContent='Ready when you are.';
    if(document.hidden)pause();
  }
  function speak(who,text,duration=700) {
    $(who+'Speech').textContent=text;$(who).classList.add('speaking');window.MicCheckAvatar.render(who,true);clearTimeout(avatarTimer[who]);avatarTimer[who]=setTimeout(()=>{ $(who).classList.remove('speaking');window.MicCheckAvatar.render(who,false);},Math.min(1000,duration));
  }
  function resetPerformers() {for(const who of ['coach','player']){clearTimeout(avatarTimer[who]);$(who).classList.remove('speaking');window.MicCheckAvatar.render(who,false);}}
  function feedback(text) {$('judgement').textContent=text;feedbackAt=performance.now();}
  function hit(lane) {
    if(state!=='playing')return;
    const result=run.hit(lane,time());
    if(result.note){const n=result.note;const max=((E.rhythms[n.verse][n.chunk+1]??8)-E.rhythms[n.verse][n.chunk])*E.BEAT-.15;sound.respond(n.verse,n.chunk,max);speak('player',track.verses[n.verse].chunks[n.chunk],max*1000);feedback(result.kind==='perfect'?'PERFECT!':'NICE!');}
    else if(result.kind==='jam'){sound.respond(result.verse,result.chunk,.6);speak('player',track.verses[result.verse].chunks[result.chunk],400);feedback('FREESTYLE!');}
    else if(result.kind==='wrong')feedback('CATCH THE NEXT ONE');
  }
  function pause() {if(state!=='playing')return;screen('paused');sound.pause();down.clear();pressedPointers.clear();pads.forEach(p=>p.classList.remove('pressed'));resetPerformers();$('resume').focus();}
  async function resume() {if(state!=='paused')return;$('resume').disabled=true;try{await sound.resume();screen('playing');}catch{$('timingTip').textContent='Tap Resume again to restart audio.';}finally{$('resume').disabled=false;}}
  function menu() {
    if(!saved)return;sound.stop();resetPerformers();screen('menu');$('coachSpeech').textContent='I drop the science.';$('playerSpeech').textContent='You bring the flow.';$('modeBadge').textContent='FREE PRACTICE';select(track);
  }
  function finish(complete=true) {
    if(!run||state==='result')return;sound.stop();resetPerformers();screen('result');
    const score=run.score(),accuracy=run.accuracy();$('resultScore').textContent=score.toLocaleString('en-US');$('resultAccuracy').textContent=accuracy+'%';$('resultStreak').textContent=run.best;$('resultPerfect').textContent=run.perfect+'/'+run.notes.length;
    $('resultLabel').textContent=complete?'SET COMPLETE':'SET ENDED EARLY';$('resultTitle').textContent=accuracy>=90?'You owned the stage.':accuracy>=65?'That flow is growing.':'Keep finding the beat.';
    $('resultDetail').textContent=run.perfect+' perfect · '+run.good+' good · '+(run.notes.length-run.perfect-run.good)+' missed'+(run.freestyle?' · '+run.freestyle+' freestyle hits':'');
    const weakest=run.notes.find(n=>n.state!=='perfect');$('resultFact').textContent=track.verses[weakest?.verse??5].fact;
    const old=Number(storage.get('best-'+track.id,0))||0;storage.set('best-'+track.id,Math.max(old,score));
    $('again').disabled=false;$('back').disabled=false;$('retrySave').hidden=true;
    if(mode==='ranked'&&playId){saved=false;finalMessage={type:'arcade:score',requestId:uid(),playId,score,act:Number(track.id.slice(-1)),final:true,stats:{right:run.perfect+run.good,wrong:run.misses+run.wrong,bestStreak:run.best,mode:'mic-check'}};saveFinal();}
    else{$('saveStatus').textContent='Free practice · device best: '+Math.max(old,score).toLocaleString('en-US');}
    $('again').focus();
  }
  function saveFinal() {
    if(!finalMessage)return;$('saveStatus').textContent='Saving your score…';$('retrySave').hidden=true;$('again').disabled=true;$('back').disabled=true;post(finalMessage);clearTimeout(timer);
    timer=setTimeout(()=>{$('saveStatus').textContent='Save not confirmed. Your score is still here; retry to finish.';$('retrySave').hidden=false;},11000);
  }
  function lyrics(s) {
    $('lyrics').replaceChildren();
    track.verses[s.verse].chunks.forEach((chunk,c)=>{const el=document.createElement('div');el.className='lyric';el.dataset.chunk=c;const lane=E.lanes[s.verse][c];el.style.setProperty('--lane-color',colors[lane]);const key=document.createElement('kbd');key.textContent=labels[lane];const text=document.createElement('span');text.textContent=chunk;el.append(key,text);$('lyrics').append(el);});
    $('formula').textContent=track.verses[s.verse].formula;$('fact').textContent=track.verses[s.verse].fact;const verse=track.verses[s.verse];$('videoSource').textContent='Video connection: '+verse.source+' · '+verse.cue;
  }
  function updateUI(t,now) {
    const s=E.section(t),id=s.phase+'-'+s.verse;
    if(id!==lastSection){lastSection=id;lyrics(s);$('verseNumber').textContent=s.phase==='freestyle'?'BONUS / FREESTYLE':'VERSE '+(s.verse+1)+' / 6';$('turnLabel').textContent={intro:'Get ready · '+Math.max(1,4-Math.floor(t/E.BEAT)),coach:'Listen to MC Vector',echo:'Your turn. Drop the line.',freestyle:'Freestyle! Remix the words.',outro:'One last beat…'}[s.phase];$('stageLabel').textContent=s.phase==='echo'?'YOU HAVE THE MIC':s.phase==='freestyle'?'OPEN MIC':'MC VECTOR HAS THE MIC';$('timingTip').textContent=s.phase==='freestyle'?'Any pad on the beat. A bonus jam — no score pressure.':s.phase==='coach'?'Listen first. Watch the rhythm.':'Press the matching key as its note reaches the line.';}
    if(s.phase==='intro')$('turnLabel').textContent=t<0?'Get ready…':'Count in · '+Math.max(1,4-Math.floor(t/E.BEAT));
    let active=-1;
    if(['coach','echo'].includes(s.phase))for(let c=0;c<4;c++)if(s.local>=E.rhythms[s.verse][c]&&s.local<E.rhythms[s.verse][c]+1.4)active=c;
    const liveKey=s.phase==='coach'&&active>=0?s.verse+'-'+active:null;
    if(liveKey&&liveKey!==updateUI.lastSpoken){updateUI.lastSpoken=liveKey;speak('coach',track.verses[s.verse].chunks[active],700);}
    if(s.phase!=='coach')updateUI.lastSpoken=null;
    document.querySelectorAll('.lyric').forEach((el,c)=>{el.classList.toggle('active',c===active);const note=run.notes[s.verse*4+c];el.classList.toggle('hit',s.phase==='echo'&&['perfect','good'].includes(note.state));el.classList.toggle('missed',s.phase==='echo'&&note.state==='miss');});
    $('score').textContent=run.score().toLocaleString('en-US');$('combo').textContent=run.combo+' STREAK';$('energy').style.width=Math.min(100,25+run.combo*7)+'%';$('crowdText').textContent=run.combo>=12?'HOUSE IS JUMPING':run.combo>=4?'FEELING THE FLOW':'CATCH THE BEAT';
    const sec=Math.floor(Math.max(0,t));$('time').textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')+' / 1:30';$('progress').value=Math.max(0,t);$('judgement').style.opacity=now-feedbackAt<850?'1':'0';
  }
  function resize() {const r=canvas.getBoundingClientRect();if(!r.width)return;width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  new ResizeObserver(resize).observe(canvas);
  function draw(t) {
    if(!width)return;ctx.clearRect(0,0,width,height);const hitX=width*.16,y=35,scale=(width-hitX)/5.2;
    ctx.strokeStyle='#ffffff13';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();
    for(let beat=Math.floor(t/E.BEAT)-1;beat<Math.ceil((t+6)/E.BEAT);beat++){const x=hitX+(beat*E.BEAT-t)*scale;if(x<0||x>width)continue;ctx.strokeStyle=beat%4===0?'#ffffff25':'#ffffff10';ctx.beginPath();ctx.moveTo(x,20);ctx.lineTo(x,50);ctx.stroke();}
    ctx.strokeStyle='#f3f3dd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hitX,7);ctx.lineTo(hitX,64);ctx.stroke();
    const s=E.section(t);let notes;
    if(s.phase==='coach'){notes=E.rhythms[s.verse].map((b,c)=>({time:(4+s.verse*16+b)*E.BEAT,lane:E.lanes[s.verse][c],state:'pending'}));}
    else notes=run.notes;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 15px Arial';
    for(const n of notes){const dt=n.time-t;if(dt<-.3||dt>5.4||['perfect','good','miss'].includes(n.state))continue;const x=hitX+dt*scale;ctx.fillStyle=colors[n.lane];ctx.globalAlpha=s.phase==='coach'?.65:1;ctx.beginPath();ctx.roundRect(x-15,y-16,30,32,6);ctx.fill();ctx.fillStyle='#1b242b';ctx.fillText(labels[n.lane],x,y+1);}
    ctx.globalAlpha=1;
    if(s.phase==='freestyle'){ctx.fillStyle='#c5f45b';ctx.font='bold 12px Arial';ctx.fillText('D  ·  F  ·  J  ·  K     /     MAKE IT YOURS',width*.6,y);}
  }
  function frame(now) {
    if(['playing','paused','result'].includes(state)&&run){const t=state==='result'?E.DURATION:time();if(state==='playing'){const misses=run.update(t);if(misses.length)feedback('NEXT PHRASE');if(now-lastUI>35){updateUI(t,now);lastUI=now;}if(run.finished)finish();}draw(t);}
    requestAnimationFrame(frame);
  }
  $('practice').addEventListener('click',()=>start(false));$('ranked').addEventListener('click',()=>start(true));$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('endRun').addEventListener('click',()=>finish(false));
  $('back').addEventListener('click',menu);$('again').addEventListener('click',()=>{const ranked=mode==='ranked';menu();start(ranked);});$('retrySave').addEventListener('click',saveFinal);
  $('settingsOpen').addEventListener('click',()=>{pause();$('settings').showModal();});
  $('volume').addEventListener('input',()=>{volume=Number($('volume').value);storage.set('volume',volume);settings();});$('offset').addEventListener('input',()=>{offset=Number($('offset').value);storage.set('offset',offset);settings();});$('motion').addEventListener('change',()=>{reduced=$('motion').checked;storage.set('reduced',reduced);settings();});
  document.addEventListener('keydown',event=>{if($('settings').open)return;if(event.code==='Escape'){if(state==='playing'||state==='paused'){event.preventDefault();state==='paused'?resume():pause();}return;}const lane=keys.indexOf(event.code);if(lane<0||state!=='playing')return;event.preventDefault();if(event.repeat||down.has(lane))return;down.add(lane);pads[lane].classList.add('pressed');hit(lane);});
  document.addEventListener('keyup',event=>{const lane=keys.indexOf(event.code);if(lane>=0){down.delete(lane);pads[lane].classList.remove('pressed');}});
  pads.forEach((pad,lane)=>{pad.addEventListener('pointerdown',event=>{event.preventDefault();if(state!=='playing')return;pad.setPointerCapture(event.pointerId);if(pressedPointers.has(event.pointerId))return;pressedPointers.set(event.pointerId,lane);pad.classList.add('pressed');hit(lane);});for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,event=>{pressedPointers.delete(event.pointerId);if(![...pressedPointers.values()].includes(lane))pad.classList.remove('pressed');});pad.addEventListener('contextmenu',e=>e.preventDefault());});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('pagehide',()=>sound.stop());
  window.addEventListener('message',event=>{
    if(!embedded||event.source!==window.parent||event.origin!==location.origin)return;const d=event.data;if(!d||d.protocol!==2)return;
    if(d.requestId===coinId&&state==='pending'){
      if(d.type==='arcade:coinAccepted'&&typeof d.playId==='string'&&d.playId){playId=d.playId;staff=!!d.staff;coinId=null;begin();}
      else if(d.type==='arcade:coinDenied'){clearTimeout(timer);coinId=null;screen('menu');busy(false);$('ranked').textContent='Play ranked · 10 XP';$('status').textContent=d.reason||'Credit unavailable. Free practice is ready.';}
    }
    if(finalMessage&&d.requestId===finalMessage.requestId&&d.playId===playId){
      if(d.type==='arcade:scoreSaved'&&d.final===true){clearTimeout(timer);saved=true;$('saveStatus').textContent=staff?'Staff run saved · excluded from student rankings.':'Score saved to the Midway leaderboard.';$('retrySave').hidden=true;$('again').disabled=false;$('back').disabled=false;}
      else if(d.type==='arcade:saveFailed'){clearTimeout(timer);$('saveStatus').textContent=d.reason||'Could not save. Your score is still here.';$('retrySave').hidden=false;}
    }
  });
  $('ranked').hidden=!embedded;settings();screen('menu');select(track);loadContext();
  window.MicCheckAvatar.load().then(result=>{if(result.personal){$('playerName').textContent=result.alias||'YOU';$('avatarStatus').textContent='YOUR EQUIPPED AVATAR';$('stageCaptionText').textContent='Your avatar is ready. Pick a track and take the mic.';}});
  requestAnimationFrame(frame);
})();
