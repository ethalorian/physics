/* One countdown per deck document, shared by its slide controls. */
(() => {
  if (customElements.get('classroom-timer')) return;
  const clock = {state:'idle', duration:60000, remaining:60000, deadline:0, interval:null, sound:true};
  let audio = null;
  const notes = new Set();
  const listeners = new Set();
  function notify() { for (const listener of listeners) listener(); }
  function silence() {
    for (const tone of notes) { try { tone.stop(); } catch { /* Tone already ended. */ } }
    notes.clear();
  }
  function chime(delay = 0) {
    if (!audio || !clock.sound) return;
    const start = audio.currentTime + Math.max(0, delay) + .015;
    for (const [i, frequency] of [523.25, 659.25, 783.99].entries()) {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      const onset = start + i * .21;
      tone.type = 'sine';
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(.0001,onset);
      volume.gain.exponentialRampToValueAtTime(.085,onset+.045);
      volume.gain.exponentialRampToValueAtTime(.0001,onset+1.05);
      tone.connect(volume);
      volume.connect(audio.destination);
      notes.add(tone);
      tone.onended = () => { notes.delete(tone); tone.disconnect(); volume.disconnect(); };
      tone.start(onset);
      tone.stop(onset+1.09);
    }
  }
  async function armSound() {
    if (!clock.sound) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      if (!audio) audio = new Audio();
      if (audio.state !== 'running') await audio.resume();
      // Schedule inside the unlocked audio context, independently of repaint frequency.
      if (clock.state === 'running' && clock.sound && !notes.size) chime((clock.deadline-Date.now())/1000);
    } catch { /* The visual countdown still runs if the device disables audio. */ }
  }
  function tick() {
    if (clock.state !== 'running') return;
    clock.remaining = Math.max(0,clock.deadline-Date.now());
    if (!clock.remaining) {
      clock.state='finished';
      clearInterval(clock.interval);
      clock.interval=null;
    }
    notify();
  }
  function run(milliseconds) {
    silence();
    clearInterval(clock.interval);
    clock.remaining=milliseconds;
    clock.deadline=Date.now()+milliseconds;
    clock.state='running';
    armSound();
    clock.interval=setInterval(tick,200);
    notify();
  }
  function reset() {
    silence();
    clearInterval(clock.interval);
    clock.interval=null;
    clock.state='idle';
    clock.remaining=clock.duration;
    notify();
  }
  const format = ms => {
    const seconds = Math.ceil(ms/1000);
    return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  };

  class ClassroomTimer extends HTMLElement {
    constructor() {
      super();
      const root=this.attachShadow({mode:'open'});
      root.innerHTML=`
        <style>
          :host{display:inline-block;vertical-align:middle;color:#22233a;font:400 14px/1.4 "IBM Plex Mono",Menlo,monospace}
          [hidden]{display:none!important}
          button,input{font:inherit}
          button{cursor:pointer;padding:.45em .7em;border:1px solid #77788d;border-radius:4px;background:#fff;color:#22233a}
          #toggle{color:#fafaff;border-color:#88889e;background:#292940;min-height:2.45em;white-space:nowrap}
          #toggle[data-state=running],#toggle[data-state=paused]{background:#efedf9;color:#282541;font-weight:600}
          #toggle[data-state=finished]{color:#173f29;background:#e0f3e6}
          dialog{width:min(19rem,calc(100vw - 3rem));border:1px solid #b6b7c8;border-radius:8px;background:#fcfcff;color:#25243a;padding:1.15rem;box-shadow:0 8px 40px #17182e44}
          dialog::backdrop{background:#17182e44}
          header,.inputs,.actions{display:flex;align-items:center;gap:.65rem}header{justify-content:space-between}
          h2{margin:0;font-size:1.05rem}button:focus-visible,input:focus-visible{outline:3px solid #6660b6;outline-offset:2px}
          output{display:block;font-size:2.8rem;font-variant-numeric:tabular-nums;color:#444184;margin:.4rem 0;font-weight:600}
          .inputs label{display:grid;gap:.22rem;flex:1}.inputs input{box-sizing:border-box;width:100%;padding:.35rem;border:1px solid #838496;border-radius:4px}
          .sound{display:flex;align-items:center;gap:.4rem;margin:.75rem 0}.actions{margin-top:.85rem}
          #primary{background:#4b4ba8;color:#fff;border-color:#4b4ba8}.error{color:#8a2e25}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
        </style>
        <button type="button" id="toggle" aria-haspopup="dialog" aria-expanded="false">Timer</button>
        <dialog aria-labelledby="title">
          <header><h2 id="title">Class timer</h2><button type="button" id="close" aria-label="Close timer settings">Close</button></header>
          <output aria-label="Time remaining" aria-live="off"></output>
          <form>
            <div class="inputs">
              <label>Minutes<input name="minutes" type="number" inputmode="numeric" min="0" max="999" step="1" required value="1"></label>
              <label>Seconds<input name="seconds" type="number" inputmode="numeric" min="0" max="59" step="1" required value="0"></label>
            </div>
            <label class="sound"><input type="checkbox" checked>Chime when time is up</label>
            <div class="error" role="alert"></div>
            <div class="actions"><button id="primary" type="submit">Start</button><button type="button" id="reset">Reset</button></div>
          </form>
        </dialog><span class="sr" role="status"></span>`;
      const element = selector => root.querySelector(selector);
      const dialog=element('dialog'),toggle=element('#toggle'), form=element('form');
      const mins=form.elements.minutes, secs=form.elements.seconds, sound=element('[type=checkbox]');
      let previous=null;
      this.renderState=()=>{
        const editable=clock.state==='idle'||clock.state==='finished';
        const time=format(clock.state==='running'?Math.max(0,clock.deadline-Date.now()):clock.remaining);
        toggle.textContent={idle:'Timer',running:'Timer '+time,paused:'Paused '+time,finished:'Time is up'}[clock.state];
        toggle.dataset.state=clock.state; element('output').textContent=time;
        mins.disabled=secs.disabled=!editable;
        sound.checked=clock.sound;
        element('#primary').textContent={idle:'Start',running:'Pause',paused:'Resume',finished:'Start again'}[clock.state];
        if(previous!==clock.state){
          mins.value=Math.floor(clock.duration/60000);secs.value=(clock.duration/1000)%60;
          element('.sr').textContent=clock.state==='finished'?'Time is up.':'';
          previous=clock.state;
        }
      };
      toggle.onclick=()=>{element('.error').textContent='';dialog.showModal();toggle.setAttribute('aria-expanded','true');(mins.disabled?element('#primary'):mins).focus();};
      element('#close').onclick=()=>dialog.close();
      dialog.onclose=()=>{toggle.setAttribute('aria-expanded','false');toggle.focus();};
      dialog.addEventListener('keydown',e=>{e.stopPropagation();});
      form.onsubmit=e=>{
        e.preventDefault();
        if(clock.state==='running'){
          tick();
          if(clock.state==='finished')return;
          clearInterval(clock.interval);clock.interval=null;clock.state='paused';silence();notify();
          return;
        }
        if(clock.state==='paused')run(clock.remaining);
        else{
          const duration=(mins.valueAsNumber*60+secs.valueAsNumber)*1000;
          if(!Number.isFinite(duration)||duration<=0){element('.error').textContent='Enter at least one second.';return;}
          clock.duration=duration;run(duration);
        }
        element('.error').textContent='';dialog.close();
      };
      element('#reset').onclick=()=>{reset();element('.error').textContent='';mins.value=Math.floor(clock.duration/60000);secs.value=(clock.duration/1000)%60;};
      sound.onchange=()=>{clock.sound=sound.checked;if(!clock.sound)silence();else armSound();notify();};
    }
    connectedCallback(){listeners.add(this.renderState);this.renderState();}
    disconnectedCallback(){listeners.delete(this.renderState);}
  }
  customElements.define('classroom-timer',ClassroomTimer);
  window.addEventListener('pagehide',event=>{if(!event.persisted)reset();});
})();
