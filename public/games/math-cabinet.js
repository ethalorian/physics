/* Acknowledged saves plus a tab-local recovery envelope; no student identity is cached.
 * A reload can bank the latest captured progress, never mint a new ranked credit. */
function createMathCabinet({slug,read,onReceipt}) {
  let finalMessage=null,timer=null,startTimer=null,recovering=false;
  const storageKey='math-run-v1:'+slug;
  const bar=document.createElement('div');bar.id='mathConnection';bar.setAttribute('role','status');bar.hidden=true;
  bar.style.cssText='position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:1000;max-width:94vw;padding:12px 16px;background:#102331;color:#fff;border:1px solid #ffd183;border-radius:12px;font:14px/1.5 system-ui;text-align:center';document.body.append(bar);
  function remember(message){try{sessionStorage.setItem(storageKey,JSON.stringify(message));}catch{/* In-memory retries still work when storage is unavailable. */}}
  function forget(){try{sessionStorage.removeItem(storageKey);}catch{}}
  function snapshot(final){
    const run=read();if(!run)return null;
    return {requestId:crypto.randomUUID(),playId:api.playId,score:run.score,act:run.level,final:!!final,
      stats:{solved:run.solved,right:run.right,wrong:run.wrong,bestStreak:run.bestStreak,startLv:run.startLvNum,mode:run.mode}};
  }
  const api={embedded:parent!==window,playId:null,pendingCoin:null,savedText:'',
    canStart(){return !this.pendingCoin&&!finalMessage&&!this.playId;},
    emit(type,data){if(this.embedded)parent.postMessage({protocol:2,source:slug+'-arcade',type,...data},location.origin);},
    requestCoin(cb,practice){
      this.savedText='';
      if(!this.embedded||practice){bar.hidden=true;cb({ok:true,practice:true});return;}
      if(!this.canStart())return;
      this.pendingCoin={cb,requestId:crypto.randomUUID()};status('Starting ranked run…');
      const failStart=()=>{if(!this.pendingCoin)return;const {cb}=this.pendingCoin;this.pendingCoin=null;clearTimeout(startTimer);status('Start not confirmed. Try again or choose practice.');bar.style.top='8px';bar.style.bottom='auto';cb({ok:false});};
      startTimer=setTimeout(failStart,10000);
      try{this.emit('arcade:coinRequest',{requestId:this.pendingCoin.requestId});}catch{failStart();}
    },
    // Local capture includes mistakes and unfinished work, not only successful clears.
    checkpoint(){if(this.playId&&!finalMessage){const msg=snapshot(false);if(msg)remember(msg);}},
    reportScore(final){
      if(!this.playId||finalMessage)return;
      const msg=snapshot(final);if(!msg)return;
      remember(msg);
      if(final){finalMessage=msg;lock(true);status('Saving score and XP…');arm();}
      this.emit('arcade:score',msg);
    },
    retry(){if(!finalMessage)return;status('Retrying save…');this.emit(recovering?'arcade:recover':'arcade:score',finalMessage);arm();}
  };
  function lock(value){for(const id of ['againBtn','menuBtn']){const b=document.getElementById(id);if(b)b.disabled=value;}}
  function status(text,retry=false){bar.hidden=false;bar.style.pointerEvents=retry?'auto':'none';bar.style.top='auto';bar.style.bottom='8px';bar.textContent=text;if(retry){const b=document.createElement('button');b.textContent='Retry save';b.className='studioContinue';b.style.marginLeft='12px';b.onclick=()=>api.retry();bar.append(b);}}
  function failed(reason){clearTimeout(timer);status(reason||'Save not confirmed. Your run is retained in this tab; retry when connected.',true);}
  function arm(){clearTimeout(timer);timer=setTimeout(()=>{if(finalMessage)failed()},10000);}
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin)return;
    const m=event.data||{};if(m.protocol!==2)return;
    if(api.pendingCoin&&m.requestId===api.pendingCoin.requestId){
      if(m.type==='arcade:coinAccepted'||m.type==='arcade:coinDenied')clearTimeout(startTimer);
      if(m.type==='arcade:coinAccepted'&&typeof m.playId==='string'){
        const {cb}=api.pendingCoin;api.pendingCoin=null;api.playId=m.playId;bar.hidden=true;cb({ok:true});api.checkpoint();
      }else if(m.type==='arcade:coinDenied'){
        const {cb}=api.pendingCoin;api.pendingCoin=null;status(typeof m.reason==='string'?m.reason:'Could not start a ranked run. Try again or select practice.');bar.style.top='8px';bar.style.bottom='auto';cb({ok:false});
      }
    }
    if(!finalMessage||m.requestId!==finalMessage.requestId||m.playId!==api.playId)return;
    if(m.type==='arcade:saveFailed'){
      failed(m.reason);
      if(recovering&&m.permanent){
        const b=document.createElement('button');b.textContent='Dismiss unavailable run';b.className='studioContinue';
        b.onclick=()=>{clearTimeout(timer);finalMessage=null;api.playId=null;recovering=false;forget();lock(false);bar.hidden=true;};bar.append(b);
      }
    }
    if(m.type==='arcade:scoreSaved'&&m.final){
      clearTimeout(timer);finalMessage=null;api.playId=null;lock(false);forget();
      api.savedText=`Saved · ${Number(m.xp)||0} XP banked${m.capped?' · daily cap reached':''}.`;onReceipt(api.savedText);
      if(recovering){status('Interrupted run '+api.savedText.toLowerCase()+' You can start a new run.');recovering=false;}else bar.hidden=true;
    }
  });
  // pagehide handles navigation, visibilitychange handles a Chromebook lid/tab switch.
  window.addEventListener('pagehide',()=>api.checkpoint());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)api.checkpoint();});
  for(const event of ['keydown','click','pointerup'])document.addEventListener(event,()=>queueMicrotask(()=>api.checkpoint()));
  if(api.embedded){try{
    const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');
    if(saved&&typeof saved.playId==='string'&&typeof saved.requestId==='string'&&Number.isFinite(saved.score)&&saved.stats&&typeof saved.stats==='object'){
      api.playId=saved.playId;finalMessage={...saved,final:true};recovering=true;remember(finalMessage);lock(true);
      status('An interrupted run is ready to bank. Retry save before starting another run.',true);
    }else if(saved)forget();
  }catch{forget();}}
  return api;
}
