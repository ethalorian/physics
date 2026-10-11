/* PULSE: deterministic charts and scoring. No browser, audio, or wall-clock dependencies. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./catalog.js'));
  else root.PulseEngine = factory(root.PulseCatalog);
})(typeof globalThis === 'object' ? globalThis : this, function (catalog) {
  'use strict';
  const BPM = 120, BEAT = 60 / BPM, BARS = 36, LEAD = 4 * BEAT;
  const DURATION = LEAD + BARS * 4 * BEAT + 1;
  const WINDOW = 0.16, HOLD_GRACE = 0.07;
  const SECTIONS = ['FIND THE BEAT', 'BASSLINE', 'LIFT OFF', 'AFTERGLOW', 'THE DROP', 'ONE LAST PULSE'];
  const PATTERNS = [[0,1,2,3], [0,2,1,3], [3,2,0,1], [1,0,3,2], [0,3,1,2], [2,1,3,0]];
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const getSong = id => catalog.songs.find(s => s.id === id) || catalog.songs[0];
  const getLevel = id => catalog.levels.find(l => l.id === id) || catalog.levels[1];
  function timing(songId) {
    const song = getSong(songId), beat = 60 / song.bpm, lead = beat * 4;
    return { beat, lead, bars: song.bars, duration: lead + song.bars * beat * 4 + 1 };
  }
  function sectionAt(time, songId) { const t = timing(songId); return clamp(Math.floor((time - t.lead) / (t.bars / 6 * 4 * t.beat)), 0, 5); }
  function makeChart(difficulty = 'arcade', songId = 'neon-current') {
    const level = getLevel(difficulty), song = getSong(songId), t = timing(song.id);
    difficulty = level.id;
    const notes = [];
    for (let bar = 0; bar < t.bars; bar++) {
      const section = Math.floor(bar / (t.bars / 6)), pattern = PATTERNS[(bar + section + song.seed) % PATTERNS.length];
      const add = (beat, lane, hold = 0) => notes.push({ time: t.lead + (bar * 4 + beat) * t.beat, lane, duration: hold * t.beat });
      if (difficulty === 'master' || difficulty === 'overdrive') {
        const six = level.keys.length === 6;
        // Alternate hands while rotating fingers. Bursts never become impossible
        // same-key jacks, and sustained notes reserve their lane below.
        const sequence = six ? [0,3,1,4,2,5,1,3,2,4,0,5] : [0,2,1,3,0,3,1,2];
        for (let sub = 0; sub < 16; sub++) {
          const burst = six || section >= 4 || (bar % 2 === 1 && sub >= 8);
          if (!burst && sub % 2) continue;
          const lane = sequence[(sub + (bar + song.seed) * 2) % sequence.length];
          const hold = section === 3 && bar % 2 === 0 && sub === 0 ? 1.5 : 0;
          add(sub / 4, lane, hold);
          if (sub === 0 || (section >= 2 && sub === 12)) add(sub / 4, (lane + (six ? 3 : 2)) % level.keys.length);
          if (six && section >= 4 && sub === 8) {
            add(sub / 4, (lane + 2) % 6); add(sub / 4, (lane + 4) % 6);
          }
        }
        continue;
      }
      for (let beat = 0; beat < 4; beat++) {
        if (difficulty === 'easy' && beat % 2) continue;
        const hold = section >= 2 && bar % 3 === 1 && beat === 0 ? (difficulty === 'easy' ? 1 : 1.5) : 0;
        add(beat, pattern[beat], hold);
        if (difficulty !== 'easy' && section >= 2 && bar % 2 === 0 && beat === 3) add(beat, pattern[0]);
        if (difficulty !== 'easy' && (section === 2 || section >= 4) && beat === 2) add(beat + 0.5, pattern[3]);
        if (difficulty === 'expert' && beat !== 3 && !(hold > 0)) add(beat + 0.5, pattern[(beat + 2) % 4]);
      }
    }
    // Keep a clean release interval on each lane, even when motifs overlap.
    notes.sort((a,b) => a.time - b.time || a.lane - b.lane);
    const last = Array(level.keys.length).fill(-Infinity);
    return notes.filter(n => {
      if (n.time - last[n.lane] < (['master','overdrive'].includes(difficulty) ? 0.12 : 0.21)) return false;
      last[n.lane] = n.time + n.duration;
      return true;
    }).map((n,id) => ({ ...n, id }));
  }
  class Run {
    constructor(difficulty = 'arcade', songId = 'neon-current') {
      this.difficulty = getLevel(difficulty).id;
      this.songId = getSong(songId).id;
      this.timing = timing(this.songId);
      this.notes = makeChart(this.difficulty,this.songId).map(n => ({ ...n, state: 'pending', tail: n.duration ? 'pending' : null }));
      this.total = this.notes.reduce((sum,n) => sum + (n.duration ? 2 : 1), 0);
      this.down = Array(getLevel(difficulty).keys.length).fill(false);
      this.counts = { perfect: 0, great: 0, good: 0, miss: 0, stray: 0 };
      this.combo = 0; this.bestCombo = 0; this.earned = 0; this.judged = 0; this.events = []; this.finished = false;
    }
    judge(kind, lane, error = 0) {
      this.counts[kind]++;
      if (kind === 'stray') this.combo = 0;
      else {
        this.judged++;
        this.earned += { perfect: 1, great: 0.8, good: 0.5, miss: 0 }[kind];
        this.combo = kind === 'miss' ? 0 : this.combo + 1;
        this.bestCombo = Math.max(this.bestCombo, this.combo);
      }
      this.events.push({ kind, lane, error });
    }
    update(time) {
      if (this.finished) return;
      for (const n of this.notes) {
        if (n.state === 'pending' && time > n.time + WINDOW) {
          n.state = 'miss'; this.judge('miss', n.lane);
          if (n.tail) { n.tail = 'miss'; this.judge('miss', n.lane); }
        }
        if (n.state === 'holding' && time >= n.time + n.duration - HOLD_GRACE) {
          n.state = 'hit'; n.tail = 'hit'; this.judge('perfect', n.lane);
        }
      }
      if (time >= this.timing.duration) this.finished = true;
    }
    press(lane, time) {
      if (this.finished || !Number.isInteger(lane) || lane < 0 || lane >= this.down.length || this.down[lane]) return;
      this.update(time); this.down[lane] = true;
      const n = this.notes.filter(n => n.lane === lane && n.state === 'pending' && Math.abs(n.time - time) <= WINDOW)
        .reduce((best, note) => !best || Math.abs(note.time-time) < Math.abs(best.time-time) ? note : best, null);
      if (!n) {
        if (time >= this.timing.lead - WINDOW && time <= this.timing.duration - 1) this.judge('stray', lane);
        return;
      }
      const error = time - n.time, delta = Math.abs(error);
      n.state = n.duration ? 'holding' : 'hit';
      this.judge(delta <= 0.05 ? 'perfect' : delta <= 0.10 ? 'great' : 'good', lane, error);
    }
    release(lane, time) {
      if (!Number.isInteger(lane) || lane < 0 || lane >= this.down.length) return;
      this.update(time); this.down[lane] = false;
      for (const n of this.notes) if (n.lane === lane && n.state === 'holding') {
        n.state = 'hit'; n.tail = 'miss'; this.judge('miss', lane);
      }
    }
    // Pausing gives back held notes; the player re-presses their lit pads on resume.
    clearKeys() { this.down.fill(false); }
    dropUnheld(time) {
      for (const n of this.notes) if (n.state === 'holding' && !this.down[n.lane] && time < n.time + n.duration - HOLD_GRACE) {
        n.state = 'hit'; n.tail = 'miss'; this.judge('miss', n.lane);
      }
    }
    drain() { return this.events.splice(0); }
    summary() {
      const accuracy = this.judged ? this.earned / (this.judged + this.counts.stray) : 0;
      const score = Math.round(Math.max(0, 900000 * this.earned / this.total + 100000 * this.bestCombo / this.total - 1000 * this.counts.stray));
      return { score, accuracy, combo: this.combo, bestCombo: this.bestCombo, total: this.total,
        counts: { ...this.counts }, fullCombo: this.judged === this.total && !this.counts.miss && !this.counts.stray,
        grade: accuracy >= 0.98 ? 'S' : accuracy >= 0.90 ? 'A' : accuracy >= 0.80 ? 'B' : accuracy >= 0.65 ? 'C' : 'D' };
    }
  }
  return { BPM, BEAT, BARS, LEAD, DURATION, WINDOW, SECTIONS, songs:catalog.songs, levels:catalog.levels, getSong, getLevel, timing, sectionAt, makeChart, Run };
});
