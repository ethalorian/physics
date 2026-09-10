/* Acknowledged ranked starts/saves for the math cabinets. */
function createMathCabinet({slug,read,onReceipt}) {
  let finalMessage=null,timer=null,startTimer=null;
  const bar=document.createElement('div');bar.id='mathConnection';bar.setAttribute('role','status');bar.hidden=true;
  bar.style.cssText='position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:1000;max-width:90vw;padding:12px;background:#10182a;color:#fff;border:1px solid #ffc83d;border-radius:10px;font:14px system-ui;text-align:center';document.body.append(bar);
  const api={embedded:parent!==window,playId:null,pendingCoin:null,savedText:'',
    canStart(){return !this.pendingCoin&&!finalMessage&&!this.playId;},
    emit(type,data){if(this.embedded)parent.postMessage({protocol:2,source:slug+'-arcade',type,...data},location.origin);},
    requestCoin(cb,practice){
      this.savedText='';
      if(!this.embedded||practice){bar.hidden=true;cb({ok:true,practice:true});return;}
      if(this.pendingCoin)return;
      this.pendingCoin={cb,requestId:crypto.randomUUID()};status('Starting ranked run…');
      const failStart=()=>{if(!this.pendingCoin)return;const {cb}=this.pendingCoin;this.pendingCoin=null;clearTimeout(startTimer);status('Start not confirmed. Try again or choose practice.');bar.style.top='8px';bar.style.bottom='auto';cb({ok:false});};
      startTimer=setTimeout(failStart,10000);
      try{this.emit('arcade:coinRequest',{requestId:this.pendingCoin.requestId});}catch{failStart();}
    },
    reportScore(final){
      if(!this.playId||finalMessage)return;
      const run=read();const msg={requestId:crypto.randomUUID(),playId:this.playId,score:run.score,act:run.level,final:!!final,
        stats:{solved:run.solved,right:run.right,wrong:run.wrong,bestStreak:run.bestStreak,startLv:run.startLvNum,mode:run.mode}};
      if(final){finalMessage=msg;lock(true);status('Saving score and XP…');arm();}
      this.emit('arcade:score',msg);
    },
    retry(){if(!finalMessage)return;status('Retrying save…');this.emit('arcade:score',finalMessage);arm();}
  };
  function lock(value){for(const id of ['againBtn','menuBtn'])document.getElementById(id).disabled=value;}
  function status(text,retry=false){bar.hidden=false;bar.style.pointerEvents=retry?"auto":"none";bar.style.top="auto";bar.style.bottom="8px";bar.textContent=text;if(retry){const b=document.createElement('button');b.textContent='Retry save';b.style.cssText='padding:10px;margin-left:10px;cursor:pointer';b.onclick=()=>api.retry();bar.append(b);}}
  function failed(){clearTimeout(timer);status('Save not confirmed. Keep this page open; your run is retained.',true);}
  function arm(){clearTimeout(timer);timer=setTimeout(()=>{if(finalMessage)failed()},10000);}
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin)return;
    const m=event.data||{};if(m.protocol!==2)return;
    if(api.pendingCoin&&m.requestId===api.pendingCoin.requestId){
      if(m.type==='arcade:coinAccepted'||m.type==='arcade:coinDenied')clearTimeout(startTimer);
      if(m.type==='arcade:coinAccepted'&&typeof m.playId==='string'){
        const {cb}=api.pendingCoin;api.pendingCoin=null;api.playId=m.playId;bar.hidden=true;cb({ok:true});
      }else if(m.type==='arcade:coinDenied'){
        const {cb}=api.pendingCoin;api.pendingCoin=null;status(typeof m.reason==='string'?m.reason:'Could not start a ranked run. Try again or select practice.');bar.style.top="8px";bar.style.bottom="auto";cb({ok:false});
      }
    }
    if(!finalMessage||m.requestId!==finalMessage.requestId||m.playId!==api.playId)return;
    if(m.type==='arcade:saveFailed')failed();
    if(m.type==='arcade:scoreSaved'&&m.final){
      clearTimeout(timer);finalMessage=null;api.playId=null;lock(false);bar.hidden=true;
      api.savedText=`Saved · ${Number(m.xp)||0} XP banked${m.capped?' · daily cap reached':''}.`;onReceipt(api.savedText);
    }
  });
  return api;
}
