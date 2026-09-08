/* Shared run lifecycle for Push and Cascade. No game physics lives here. */
function createPhysicsCabinet(options) {
  let finalMessage = null, saveTimer = null, resumeState = null;
  const button = (label, action, attrs = '') => `<button class="btn alt" ${attrs} onclick="${action}">${label}</button>`;
  const api = {
    embedded: window.parent !== window, playId: null, pendingCoin: null, runOpen: false,
    emit(type, data) {
      if (this.embedded) window.parent.postMessage({ protocol: 2, source: `${options.slug}-arcade`, type, ...data }, window.location.origin);
    },
    requestCoin(cb) {
      if (!this.embedded) { cb({ ok: true, practice: true }); return; }
      if (this.pendingCoin) return;
      this.pendingCoin = { cb, requestId: crypto.randomUUID() };
      this.emit('arcade:coinRequest', { requestId: this.pendingCoin.requestId });
    },
    canStart() { return !this.runOpen && !this.pendingCoin && !finalMessage; },
    reportScore(final) {
      if (!this.playId) return;
      const run = options.read();
      const message = { requestId: crypto.randomUUID(), playId: this.playId, score: run.score, act: run.act, final: !!final,
        stats: { ...run.stats, bestStreak: 0, startLv: run.act, mode: 'physics' } };
      if (final) finalMessage = message;
      this.emit('arcade:score', message);
    },
    pause() {
      const current = options.read().state;
      if (!this.runOpen || !['play', 'aim', 'charge'].includes(current)) return;
      resumeState = current; options.stop(); options.setState('paused');
      options.overlay(`<div class="card"><h2>RUN PAUSED</h2><div class="sub">Resume when you are ready, or bank your completed mission checks.</div>
        ${button('RESUME', 'ARCADE.resume()')}${button('FINISH &amp; BANK', 'ARCADE.finish()')}</div>`);
      options.primary(() => this.resume());
    },
    resume() {
      if (options.read().state !== 'paused' || !resumeState) return;
      options.hide(); options.resetClock(); options.setState(resumeState); resumeState = null; options.primary(null);
    },
    finish() {
      if (!this.runOpen) return;
      this.runOpen = false; options.stop(); options.setState('finished'); options.primary(null);
      const run = options.read();
      options.overlay(`<div class="card"><div class="tag">SHIFT COMPLETE</div><h2>MISSION LOG</h2>
        <div class="stat"><span>Act score</span><b>${run.score.toLocaleString()}</b></div>
        <div class="stat"><span>Completed mission checks</span><b>${run.stats.solved}</b></div>
        <div class="stat"><span>Correct / answered</span><b>${run.stats.right} / ${run.stats.right + run.stats.wrong}</b></div>
        <div class="sub" id="saveStatus" role="status">${this.playId ? 'Saving score and XP…' : 'Practice complete — no score or XP saved.'}</div>
        ${button('RETRY SAVE', 'ARCADE.retrySave()', 'id="retrySave" hidden')}
        ${button('BACK TO ACTS', 'ARCADE.menu()', `id="runMenu" ${this.playId ? 'disabled' : ''}`)}</div>`);
      if (this.playId) { this.reportScore(true); armTimer(); } else options.primary(() => this.menu());
    },
    retrySave() {
      if (!finalMessage) return;
      document.getElementById('retrySave').hidden = true;
      document.getElementById('saveStatus').textContent = 'Retrying save…';
      this.emit('arcade:score', finalMessage); armTimer();
    },
    menu() { if (!finalMessage) options.menu(); },
  };
  function armTimer() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { if (finalMessage) saveStatus(false); }, 10000);
  }
  function saveStatus(ok, xp) {
    clearTimeout(saveTimer);
    document.getElementById('saveStatus').textContent = ok ? `Saved · ${Number(xp) || 0} XP banked. Choose your next act.` : 'Save not confirmed. Keep this page open and retry; your run is retained.';
    document.getElementById('retrySave').hidden = ok;
    document.getElementById('runMenu').disabled = !ok;
    if (ok) options.primary(() => api.menu());
  }
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    const message = event.data || {};
    if (message.protocol !== 2) return;
    if (api.pendingCoin && message.requestId === api.pendingCoin.requestId) {
      if (message.type === 'arcade:coinAccepted' && typeof message.playId === 'string') {
        const { cb } = api.pendingCoin; api.pendingCoin = null; api.playId = message.playId; cb({ ok: true });
      } else if (message.type === 'arcade:coinDenied') {
        const { cb } = api.pendingCoin; api.pendingCoin = null; cb({ ok: false });
      }
    }
    if (!finalMessage || message.requestId !== finalMessage.requestId || message.playId !== api.playId) return;
    if (message.type === 'arcade:saveFailed') saveStatus(false);
    if (message.type === 'arcade:scoreSaved' && message.final) {
      api.playId = null; finalMessage = null; saveStatus(true, message.xp);
    }
  });
  window.addEventListener('keydown', event => {
    if (event.code !== 'KeyP' || event.repeat) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (options.read().state === 'paused') api.resume(); else api.pause();
  }, true);
  window.addEventListener('blur', () => api.pause());
  document.addEventListener('visibilitychange', () => { if (document.hidden) api.pause(); });
  return api;
}
