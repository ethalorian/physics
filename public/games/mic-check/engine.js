(function(root, factory) { const api = factory(); if (typeof module === 'object') module.exports = api; else root.MicCheckEngine = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const BPM = 80, BEAT = 60/BPM, DURATION = 120*BEAT, WINDOW = .20;
  const rhythms = [[0,2,4,6],[0,2,4,6],[0,1.5,4,6],[0,2,3.5,6],[0,1.5,4,5.5],[0,2,4.5,6]];
  const lanes = [[0,1,2,3],[0,2,1,3],[1,0,3,2],[2,0,1,3],[0,3,2,1],[3,1,0,2]];
  function chart() { return rhythms.flatMap((beats,verse) => beats.map((beat,chunk) => ({id:verse*4+chunk,verse,chunk,lane:lanes[verse][chunk],beat:12+verse*16+beat,time:(12+verse*16+beat)*BEAT,state:'pending'}))); }
  function section(t) {
    const beat=t/BEAT;
    if(beat<4) return {phase:'intro',verse:0,local:Math.max(0,beat)};
    if(beat<100) {const verse=Math.floor((beat-4)/16), local=(beat-4)%16;return {phase:local<8?'coach':'echo',verse,local:local%8};}
    return {phase:beat<116?'freestyle':'outro',verse:5,local:beat-100};
  }
  class Run {
    constructor() { this.notes=chart();this.points=0;this.combo=0;this.best=0;this.perfect=0;this.good=0;this.misses=0;this.wrong=0;this.freestyle=0;this.lastJam=-1;this.finished=false; }
    update(t) { const missed=[]; for(const note of this.notes) if(note.state==='pending' && t>note.time+WINDOW) {note.state='miss';this.misses++;this.combo=0;missed.push(note);} this.finished=t>=DURATION;return missed; }
    hit(lane,t) {
      if(!Number.isFinite(t)||!Number.isInteger(lane)||lane<0||lane>3||this.finished) return {kind:'ignore'};
      this.update(t);
      const n=this.notes.find(n=>n.state==='pending' && n.lane===lane && Math.abs(n.time-t)<=WINDOW);
      if(n) {const perfect=Math.abs(n.time-t)<=.10; n.state=perfect?'perfect':'good';this.points+=perfect?100:65;this[perfect?'perfect':'good']++;this.combo++;this.best=Math.max(this.best,this.combo);return {kind:n.state,note:n};}
      const s=section(t);
      if(s.phase==='freestyle') {const slot=Math.round(t/BEAT*2);if(Math.abs(t/BEAT*2-slot)<.28 && slot!==this.lastJam) {this.lastJam=slot;this.freestyle++;return {kind:'jam',chunk:lane,verse:Math.floor((s.local)/4)%6};}return {kind:'ignore'};}
      // The coach is a listening window; stray keys there never cost points.
      if(s.phase!=='echo') return {kind:'ignore'};
      this.combo=0;this.wrong++;this.points=Math.max(0,this.points-25);return {kind:'wrong'};
    }
    score() { return Math.round(this.points/(this.notes.length*100)*1000000); }
    accuracy() { return Math.round((this.perfect+this.good*.65)/this.notes.length*100); }
  }
  return {BPM,BEAT,DURATION,WINDOW,rhythms,lanes,chart,section,Run};
});
