/* Five original procedural compositions. All music is synthesized locally. */
(function () {
  'use strict';
  const E = window.PulseEngine;
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const roots = [45, 41, 48, 43];
  const melody = [12, 7, 10, 7, 14, 12, 7, 3, 12, 15, 14, 7, 10, 7, 3, 7];
  const arrangements = {
    'chrome-circuit': { roots:[40,43,38,45], tune:[12,12,7,10,14,10,7,3,12,19,15,14,10,7,3,7], bass:[0,3,6,8,11,14], kick:[0,4,8,12], chord:[0,3,7,10], wave:'triangle' },
    'midnight-drive': { roots:[42,38,45,40], tune:[7,10,14,12,7,3,5,7,10,14,17,14,12,10,7,5], bass:[0,2,7,10,14], kick:[0,6,10], chord:[0,3,7,14], wave:'sine' },
    'solar-flare': { roots:[45,48,43,41], tune:[0,7,12,15,19,15,12,7,2,7,14,17,21,17,14,7], bass:[0,2,4,6,8,10,12,14], kick:[0,4,8,12], chord:[0,3,7,12], wave:'triangle' },
    'terminal-velocity': { roots:[38,41,36,43], tune:[12,7,12,15,14,7,10,7,19,15,12,10,14,12,7,3], bass:[0,3,6,9,10,14], kick:[0,6,9,14], chord:[0,3,7,10], wave:'triangle' },
  };
  class Sound {
    constructor() { this.ctx = null; this.master = null; this.startAt = 0; this.step = 0; this.timer = null; this.volume = 0.65; this.active = false; this.sources = new Set(); this.songId = 'neon-current'; }
    async ensure() {
      if (!this.ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('This browser cannot play the soundtrack. Try a current Chrome or Safari browser.');
        this.ctx = new Audio({ latencyHint: 'interactive' });
        this.master = this.ctx.createGain();
        const limiter = this.ctx.createDynamicsCompressor();
        limiter.threshold.value = -12; limiter.knee.value = 15; limiter.ratio.value = 6;
        this.master.connect(limiter); limiter.connect(this.ctx.destination);
        this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        let seed = 137;
        for (let i = 0; i < data.length; i++) { seed = (seed * 16807) % 2147483647; data[i] = seed / 1073741823.5 - 1; }
      }
      await this.ctx.resume(); this.setVolume(this.volume);
    }
    setVolume(value) { this.volume = value; if (this.master) this.master.gain.setTargetAtTime(value * 0.65, this.ctx.currentTime, 0.02); }
    source(node, gain, at, duration) {
      node.connect(gain); gain.connect(this.master); this.sources.add(node);
      node.onended = () => { this.sources.delete(node); node.disconnect(); gain.disconnect(); };
      node.start(at); node.stop(at + duration + 0.02);
    }
    tone(note, at, duration, volume, type = 'triangle', slide) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(midi(note), at);
      if (slide !== undefined) o.frequency.exponentialRampToValueAtTime(midi(slide), at + duration);
      g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(volume, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      this.source(o, g, at, duration);
    }
    hat(at, open = false, snare = false) {
      const c = this.ctx, src = c.createBufferSource(), filter = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.noise; filter.type = 'highpass'; filter.frequency.value = snare ? 1400 : 7200;
      const duration = snare ? 0.16 : open ? 0.15 : 0.045;
      g.gain.setValueAtTime(snare ? 0.17 : 0.075, at); g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      src.connect(filter); filter.connect(g); g.connect(this.master); this.sources.add(src);
      src.onended = () => { this.sources.delete(src); src.disconnect(); filter.disconnect(); g.disconnect(); };
      src.start(at); src.stop(at + duration);
    }
    schedule(step, at) {
      // Four count-in beats; the first note lands exactly with the song's downbeat.
      if (step < 16) { if (step % 4 === 0) this.tone(step === 12 ? 84 : 72, at, 0.06, 0.12, 'sine'); return; }
      const s = step - 16, bar = Math.floor(s / 16), sub = s % 16;
      if (bar >= E.timing(this.songId).bars) return;
      if (arrangements[this.songId]) { this.arrange(bar, sub, at); return; }
      const section = Math.floor(bar / 6), root = roots[Math.floor(bar / 2) % 4];
      if (sub % 4 === 0) this.tone(43, at, 0.18, 0.65, 'sine', 23);
      if (sub === 4 || sub === 12) { this.hat(at, false, true); this.tone(49, at, 0.1, 0.13, 'triangle'); }
      if (sub % (section >= 4 ? 1 : 2) === 0) this.hat(at, sub === 14);
      if (section >= 1 && [0,3,6,8,10,14].includes(sub)) this.tone(root + (sub === 14 ? 7 : 0), at, 0.20, 0.23, 'triangle');
      if (sub === 0) for (const interval of [0,3,7,14]) this.tone(root + 12 + interval, at, 1.8, section === 3 ? 0.045 : 0.025, 'sine');
      if (section >= 2 && sub % 2 === 0) {
        const note = root + 12 + melody[(bar % 2) * 8 + sub / 2];
        this.tone(note, at, 0.24, section === 3 ? 0.065 : 0.11, 'triangle');
        this.tone(note, at + 0.1875, 0.2, 0.024, 'sine');
      }
      if (section >= 4 && sub % 4 === 2) this.tone(root + 36 + melody[(sub + bar) % 16] % 12, at, 0.13, 0.045, 'sine');
    }
    arrange(bar, sub, at) {
      const song = E.getSong(this.songId), a = arrangements[this.songId], beat = 60 / song.bpm;
      const section = Math.floor(bar / (song.bars / 6)), root = a.roots[Math.floor(bar / 2) % 4];
      const breakdown = section === 3, drop = section >= 4, trance = song.id === 'solar-flare';
      if (a.kick.includes(sub) && (!breakdown || sub === 0)) this.tone(44,at,beat*.42,.62,'sine',22);
      if ((sub === 4 || sub === 12) && (!breakdown || sub === 12)) {
        this.hat(at,false,true); this.tone(50,at,.09,.12,'triangle');
      }
      if (sub % (drop ? 1 : 2) === 0 && (!breakdown || sub % 4 === 2)) this.hat(at,sub === 14 || (trance && sub % 4 === 2));
      if (song.id === 'terminal-velocity' && drop && [3,11,15].includes(sub)) this.hat(at,false,true);
      if (section >= 1 && a.bass.includes(sub) && (!breakdown || sub % 4 === 0)) {
        const note = root + (sub === 14 ? 7 : sub === 10 ? 12 : 0);
        this.tone(note,at,beat*.65,.25,'triangle'); this.tone(note-12,at,beat*.55,.15,'sine');
      }
      if (sub === 0) for (const interval of a.chord) this.tone(root+12+interval,at,beat*3.8,breakdown?.045:.023,'sine');
      const stride = trance && drop ? 1 : 2;
      if (section >= 2 && sub % stride === 0) {
        const index = trance ? (sub + (bar % 2)*8) % 16 : ((bar % 2)*8 + sub/2) % 16;
        const note = root + 12 + a.tune[index];
        this.tone(note,at,beat*(trance?.45:.65),breakdown?.065:.105,a.wave);
        this.tone(note,at+beat*.75,beat*.4,.023,'sine');
        if (drop && sub % 4 === 0) this.tone(note+12,at,beat*.3,.04,'sine');
      }
      // A different phrase ending every fourth bar keeps the loop moving.
      if (section !== 0 && bar % 4 === 3 && sub >= 12 && sub % 2 === 0) this.tone(root+24+(sub===12?7:10),at,beat*.28,.055,'triangle');
    }
    begin(songId = 'neon-current') {
      this.stop(); this.songId = E.getSong(songId).id; this.active = true; this.startAt = this.ctx.currentTime + 0.12; this.step = 0;
      this.timer = setInterval(() => this.tick(), 25); this.tick();
    }
    tick() {
      if (!this.active || this.ctx.state !== 'running') return;
      const timing = E.timing(this.songId), stepLength = timing.beat / 4;
      while (this.startAt + this.step * stepLength < this.ctx.currentTime + 0.15) {
        const at = this.startAt + this.step * stepLength;
        if (at >= this.ctx.currentTime - 0.005 && this.step < (timing.bars + 1) * 16) this.schedule(this.step, Math.max(at, this.ctx.currentTime));
        this.step++;
      }
    }
    time() {
      // Account for output buffering; use the same clock for judgement and animation.
      const latency = this.ctx.outputLatency || this.ctx.baseLatency || 0;
      return this.ctx.currentTime - this.startAt - latency;
    }
    async pause() { if (this.ctx?.state === 'running') await this.ctx.suspend(); }
    async resume() { if (this.ctx) await this.ctx.resume(); }
    stop() { this.active = false; clearInterval(this.timer); for (const s of this.sources) { try { s.stop(); } catch {} } this.sources.clear(); }
  }
  window.PulseSound = Sound;
})();
