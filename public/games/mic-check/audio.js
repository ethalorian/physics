(function() {
  'use strict';
  const E=window.MicCheckEngine;
  class Sound {
    constructor() {this.ctx=null;this.volume=.7;this.loaded=new Map();this.sources=new Set();this.timer=null;this.running=false;this.track=null;this.startAt=0;this.playerVoice=null;}
    async init() {
      if(!this.ctx) {
        this.ctx=new (window.AudioContext||window.webkitAudioContext)();
        this.master=this.ctx.createGain();this.master.gain.value=this.volume;
        const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-8;limiter.ratio.value=8;this.master.connect(limiter);limiter.connect(this.ctx.destination);
        this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*.3,this.ctx.sampleRate);const data=this.noise.getChannelData(0);let seed=413;
        for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/2147483647)*2-1;}
      }
      await this.ctx.resume();
    }
    async load(track) {
      await this.init();
      if(this.loaded.has(track.id)) {this.track=track;return;}
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
      try {
        const buffers=await Promise.all(track.verses.flatMap((v,i)=>v.chunks.map(async (_,c)=>{
          const response=await fetch('/games/mic-check/vocals/'+track.id+'-'+i+'-'+c+'.wav',{signal:controller.signal});
          if(!response.ok)throw Error('Could not load the vocals. Check your connection and try again.');
          return this.ctx.decodeAudioData(await response.arrayBuffer());
        })));
        this.loaded.set(track.id,buffers);this.track=track;
      } finally {clearTimeout(timeout);}
    }
    volumeTo(value) {this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value,this.ctx.currentTime,.03);}
    remember(source) {this.sources.add(source);source.onended=()=>this.sources.delete(source);return source;}
    tone(freq,start,duration,level,type='sine') {
      const osc=this.remember(this.ctx.createOscillator()),gain=this.ctx.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(level,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+duration);osc.connect(gain);gain.connect(this.master);osc.start(start);osc.stop(start+duration+.01);
    }
    kick(start) {const osc=this.remember(this.ctx.createOscillator()),gain=this.ctx.createGain();osc.frequency.setValueAtTime(130,start);osc.frequency.exponentialRampToValueAtTime(42,start+.17);gain.gain.setValueAtTime(.48,start);gain.gain.exponentialRampToValueAtTime(.001,start+.32);osc.connect(gain);gain.connect(this.master);osc.start(start);osc.stop(start+.34);}
    hiss(start,snare=false) {
      const src=this.remember(this.ctx.createBufferSource()),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();src.buffer=this.noise;filter.type='highpass';filter.frequency.value=snare?1000:7000;gain.gain.setValueAtTime(snare?.16:.045,start);gain.gain.exponentialRampToValueAtTime(.001,start+(snare?.15:.045));src.connect(filter);filter.connect(gain);gain.connect(this.master);src.start(start);src.stop(start+(snare?.18:.07));
      if(snare)this.tone(180,start,.1,.08,'triangle');
    }
    voice(verse,chunk,when,maxDuration=1.35,player=false) {
      const buffer=this.loaded.get(this.track.id)?.[verse*4+chunk];if(!buffer)return;
      if(player && this.playerVoice){try{this.playerVoice.stop();}catch{}}
      const src=this.remember(this.ctx.createBufferSource()),gain=this.ctx.createGain();src.buffer=buffer;
      src.playbackRate.value=Math.max(player?1.02:.95,buffer.duration/maxDuration);
      gain.gain.value=player?.90:.8;src.connect(gain);gain.connect(this.master);src.start(Math.max(this.ctx.currentTime,when));if(player)this.playerVoice=src;
    }
    start() {
      this.stop();this.running=true;this.startAt=this.ctx.currentTime+.35;this.next=0;
      this.calls=this.track.verses.flatMap((v,verse)=>v.chunks.map((_,chunk)=>({verse,chunk,time:(4+verse*16+E.rhythms[verse][chunk])*E.BEAT,max:((E.rhythms[verse][chunk+1]??8)-E.rhythms[verse][chunk])*E.BEAT-.10})));this.callIndex=0;
      this.schedule();this.timer=setInterval(()=>this.schedule(),25);
    }
    schedule() {
      if(!this.running || this.ctx.state!=='running')return;
      const until=this.ctx.currentTime+.16;
      while(this.next<240 && this.startAt+this.next*E.BEAT/2<until) {
        const step=this.next++,at=this.startAt+step*E.BEAT/2,bar=Math.floor(step/8);
        if(at<this.ctx.currentTime-.02)continue;
        if(step%8===0 || step%8===3 || step%8===6)this.kick(at);
        if(step%8===2 || step%8===6)this.hiss(at,true);
        this.hiss(at, false);
        const root=[65.406,65.406,77.782,58.27][Math.floor(bar/2)%4];
        if(step%4===0)this.tone(root,at,.48,.16,'triangle');
        if(step%16===0){for(const ratio of [2,2.3784,2.9966])this.tone(root*ratio,at,1.2,.025,'triangle');}
      }
      while(this.callIndex<this.calls.length && this.startAt+this.calls[this.callIndex].time<until) {const c=this.calls[this.callIndex++];if(this.startAt+c.time>=this.ctx.currentTime-.05)this.voice(c.verse,c.chunk,this.startAt+c.time,c.max);}
    }
    time() {return this.ctx?this.ctx.currentTime-this.startAt-(this.ctx.outputLatency||this.ctx.baseLatency||0):0;}
    pause() {return this.ctx?.suspend();}
    resume() {return this.ctx?.resume();}
    stop() {clearInterval(this.timer);this.timer=null;this.running=false;for(const s of this.sources){try{s.stop();}catch{}}this.sources.clear();this.playerVoice=null;}
    respond(verse,chunk,maxDuration) {this.voice(verse,chunk,this.ctx.currentTime,maxDuration,true);}
  }
  window.MicCheckSound=Sound;
})();
