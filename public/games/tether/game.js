/* Canvas is presentation only. SI physics lives in physics.js. No external assets. */
'use strict';
(() => {
  const P = TetherPhysics, LEVELS = TetherLevels, $ = id => document.getElementById(id);
  const cv = $('canvas'), ctx = cv.getContext('2d'), embedded = parent !== window;
  const colors = { mint: '#78ffcf', gold: '#ffd27c', pink: '#ff8baa', ghost: '#7794b6' };
  const actNames = ['THE TANGENT', 'RADIUS & INERTIA', 'TORQUE CREW'];
  let phase = 'title', previousPhase = '', index = 0, score = 0, attempts = 0, sim, flight, time = 0;
  let stats = freshStats(), points = [], ghost = [], releasedAt = null, lastLanding = null;
  let motor = 0, motorTorque = 0, fuel = 0, lever = 1, rope = 5, accumulator = 0, releaseQueued = false;
  let playId = null, pendingCoin = null, finalPacket = null, saving = false, saveTimer, lastAck = 0, messageSeq = 0;
  let sound = false, audioCtx, last = performance.now(), hudTime = 0, width = 900, height = 520, scale = 1, ox = 0, oy = 0;
  let lostReason = '', offline = !embedded;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function freshStats() { return { solved: 0, right: 0, wrong: 0, bestStreak: 0, startLv: 1, mode: 'physics' }; }
  function level() { return LEVELS[index]; }
  function pose() { return flight || P.position(sim); }
  function emit(type, data = {}) { if (embedded) parent.postMessage({ type, protocol: 2, source: 'tether-arcade', ...data }, location.origin); }
  function announce(text) { $('announcement').textContent = text; }
  function beep(freq, success = false) {
    if (!sound) return;
    try { audioCtx ||= new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine'; o.frequency.setValueAtTime(freq, audioCtx.currentTime); if (success) o.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + .15);
      g.gain.setValueAtTime(.05, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + .22); o.start(); o.stop(audioCtx.currentTime + .23);
    } catch { /* Audio is optional. */ }
  }
  function modal(html) {
    $('dialog').innerHTML = html; $('overlay').hidden = false;
    for (const container of [document.querySelector('header'), document.querySelector('.controls')]) container.inert = true;
    $('dialog').focus();
  }
  function hideModal() { $('overlay').hidden = true; document.querySelector('header').inert = false; document.querySelector('.controls').inert = false; }
  function button(id, action) { $(id).addEventListener('click', action); }
  function title() {
    phase = 'title'; setup();
    modal(`<div class="eyebrow">Nine rescues. One law of motion at a time.</div><h2 id="dialogTitle" class="hero">Catch the<br><span>right moment.</span></h2><p>The station is breaking apart. Swing your rescue pod, <strong>release along the tangent</strong>, and catch the next net.</p><div class="chips"><span class="chip">01 · Release</span><span class="chip">02 · Radius</span><span class="chip">03 · Torque</span></div><p><span class="kbd">Space</span> hold to swing, let go to fly. <span class="kbd">P</span> pause. Touch controls below the scene.</p><div class="actions"><button class="primary" id="start">${embedded ? 'Start ranked rescue' : 'Start practice rescue'} ↗</button>${embedded ? '<button id="practice">Practice · no XP</button>' : ''}</div><p class="small">No lives to run out of. Finish whenever class ends. Ranked XP comes from rescues × rotation-check accuracy²; 18 XP maximum for a perfect campaign before the shared daily cap.</p>`);
    button('start', () => start(!embedded)); if (embedded) button('practice', () => start(true));
  }
  function start(practice) {
    if (pendingCoin || saving) return;
    offline = practice;
    if (practice) { playId = null; begin(); return; }
    phase = 'connecting'; pendingCoin = crypto.randomUUID();
    modal('<div class="eyebrow">Connecting to the arcade</div><h2 id="dialogTitle">Securing your run…</h2><p>Waiting for ranked-play confirmation. Your rescue starts when the cabinet is ready.</p><p class="small" id="connectionNote">No automatic switch to practice.</p>');
    emit('arcade:coinRequest', { requestId: pendingCoin });
    setTimeout(() => { if (pendingCoin && $('connectionNote')) $('connectionNote').textContent = 'Still waiting. If your connection has gone offline, reload to reconnect. No run has started here.'; }, 8000);
  }
  function begin() {
    index = 0; score = 0; stats = freshStats(); attempts = 0; ghost = []; finalPacket = null; lastAck = 0;
    $('receipt').textContent = ''; $('mode').textContent = offline ? 'Practice · no XP' : 'Ranked rescue'; briefing();
  }
  function setup() {
    const L = level(); rope = L.r; lever = 1; resetAttempt();
    $('chapter').textContent = `0${L.act} / ${actNames[L.act - 1]}`; $('mission').textContent = `${index + 1}/9 · ${L.name}`;
    $('hint').textContent = L.hint;
    $('progress').innerHTML = LEVELS.map((_, i) => `<span class="${i < index ? 'done' : i === index ? 'now' : ''}"></span>`).join('');
    updateHud();
  }
  function resetAttempt() {
    sim = { ax: 8, ay: 12, r: rope, mass: level().mass, theta: level().angle * Math.PI / 180, omega: 0, work: 0 };
    flight = null; time = 0; fuel = level().fuel; motor = motorTorque = accumulator = 0; points = []; releasedAt = null; releaseQueued = false; lastLanding = null;
  }
  function briefing() {
    phase = 'briefing'; setup();
    const L = level();
    modal(`<div class="eyebrow">Mission ${index + 1} · ${actNames[L.act - 1]}</div><h2 id="dialogTitle">${L.name}</h2><p>${L.hint}</p><div class="concept">${L.concept}</div><div class="config">${L.radii ? `<label>Rope length<select id="ropeSelect">${L.radii.map(r => `<option value="${r}" ${r === L.r ? 'selected' : ''}>${r} m</option>`).join('')}</select></label>` : ''}${L.levers ? '<label>Thrust angle to tether<select id="leverSelect"><option value="1">90° · full moment arm</option><option value="0.5">30° · half moment arm</option></select></label>' : ''}<div class="small">POD ${L.mass} kg · GRAVITY 9.81 m/s²<br>${L.motor ? '4 N thruster · 6 seconds of fuel' : 'Gravity-powered · no motor'}</div></div><div class="actions"><button class="primary" id="ready">Ready at the anchor →</button><button id="bankBrief">Finish & bank</button></div>`);
    button('ready', () => {
      rope = Number($('ropeSelect')?.value || L.r); lever = Number($('leverSelect')?.value || 1); resetAttempt(); phase = 'ready'; hideModal(); updateControls(); $('hold').focus();
    }); button('bankBrief', finish);
  }
  function updateControls() {
    const active = ['ready', 'swing', 'flight'].includes(phase);
    $('hold').disabled = !['ready', 'swing'].includes(phase);
    $('hold').textContent = phase === 'swing' ? 'Release to fly ↗' : phase === 'flight' ? 'Trust the tangent…' : 'Hold to swing · release to fly';
    $('pause').disabled = !active; $('retry').disabled = !active; $('finish').disabled = !active;
    $('left').disabled = $('right').disabled = !(level().motor && ['ready', 'swing'].includes(phase));
  }
  function hold() {
    if (phase !== 'ready') return;
    phase = 'swing'; attempts++; beep(320); updateControls();
  }
  function release() {
    if (['paused', 'help'].includes(phase) && previousPhase === 'swing') { releaseQueued = true; return; }
    if (phase !== 'swing') return;
    flight = P.release(sim); releasedAt = { ...flight, torque: P.torque(sim) + motorTorque }; phase = 'flight'; motor = motorTorque = 0; beep(620); updateControls();
    announce('Tether released. The pod now follows a projectile path.');
  }
  function retry() { if (!['ready', 'swing', 'flight', 'miss'].includes(phase)) return; if (points.length) ghost = points.slice(); resetAttempt(); phase = 'ready'; hideModal(); updateControls(); $('hold').focus(); }
  function pause() {
    if (!['ready', 'swing', 'flight'].includes(phase)) return;
    previousPhase = phase; phase = 'paused'; motor = motorTorque = 0;
    modal('<div class="eyebrow">Rescue on hold</div><h2 id="dialogTitle">Take a breath.</h2><p>The physics clock is paused. Resume the swing, or bank the rescues you have completed.</p><div class="actions"><button id="resume" class="primary">Resume</button><button id="bankPaused">Finish & bank</button></div>');
    button('resume', resume); button('bankPaused', finish);
  }
  function resume() { phase = previousPhase; hideModal(); accumulator = 0; if (releaseQueued && phase === 'swing') { releaseQueued = false; release(); } updateControls(); $('hold').focus(); }
  function targetX(at = time) { return level().target + (level().moving || 0) * Math.sin(at * .75); }
  function tick(dt) {
    time += dt;
    if (phase === 'swing') {
      const active = level().motor && fuel > 0 ? motor : 0;
      motorTorque = active * level().force * sim.r * lever;
      if (active) fuel = Math.max(0, fuel - dt);
      P.advance(sim, dt, motorTorque);
      // A flexible tether cannot push. Lose the constraint if required tension
      // is negative. Angled thruster has an outward radial component.
      const radial = active ? level().force * Math.sqrt(1 - lever ** 2) : 0;
      if (P.tension(sim) + radial < 0) { lostReason = 'The tether went slack; your pod continued along its tangent.'; release(); }
      if (time > 35) miss('The rescue window closed. Release during a swing toward the net.');
    } else if (phase === 'flight') {
      const before = { ...flight }; P.fly(flight, dt);
      if (before.y >= level().padY && flight.y <= level().padY && flight.vy < 0) {
        const hit = P.landing(before, level().padY), at = time - dt + hit.time;
        const missBy = before.x + before.vx * hit.time - targetX(at);
        flight.x = before.x + before.vx * hit.time; flight.y = level().padY; flight.vy = hit.vy;
        lastLanding = { missBy, speed: Math.hypot(before.vx, hit.vy), x: flight.x };
        if (Math.abs(missBy) <= level().width / 2) rescue(); else miss(`${Math.abs(missBy).toFixed(1)} m ${missBy < 0 ? 'short of' : 'past'} the net. ${missBy < 0 ? 'Try a little more speed or a different release angle.' : 'Try a different release angle or less motor work.'}`);
      } else if (flight.y < -2 || flight.x < -5 || flight.x > 55 || time > 40) miss(lostReason || 'Outside the rescue corridor. Release while your velocity arrow points toward the net.');
    }
    if (points.length < 2000) { const p = pose(); if (!points.length || time - points[points.length - 1].t > .045) points.push({ x: p.x, y: p.y, t: time }); }
  }
  function miss(text) {
    phase = 'miss'; motor = 0; beep(140); announce(text);
    modal(`<div class="eyebrow">A miss is a measurement</div><h2 id="dialogTitle">Adjust. Swing again.</h2><p>${text}</p><div class="concept">Your faded trail stays for the next attempt. Cyan is the velocity you carried into free flight.</div><div class="actions"><button id="tryAgain" class="primary">Retry rescue ↗</button><button id="change">Change setup</button><button id="bankMiss">Finish & bank</button></div>`);
    button('tryAgain', retry); button('change', () => { ghost = points.slice(); briefing(); }); button('bankMiss', finish); updateControls();
  }
  function rescue() {
    phase = 'question'; motor = 0; stats.solved++;
    const precision = Math.max(0, 1 - Math.abs(lastLanding.missBy) / (level().width / 2));
    const earned = 1000 + Math.round(precision * 400) + Math.max(0, 200 - (attempts - 1) * 40);
    score += earned; beep(700, true); updateHud(); checkpoint();
    const L = level();
    modal(`<div class="eyebrow">Pod secured · +${earned.toLocaleString()} points</div><h2 id="dialogTitle">Rescue complete.</h2><p>${Math.abs(lastLanding.missBy).toFixed(2)} m from net center. The net absorbed your landing energy.</p><div class="concept">${L.q}</div><div class="choices">${L.answers.map((a, i) => `<button id="answer${i}">${a}</button>`).join('')}</div><p class="small">One rotation check per rescue. Your first answer counts toward XP; every answer gets an explanation.</p><div id="feedback" aria-live="polite"></div>`);
    L.answers.forEach((_, i) => button(`answer${i}`, () => answer(i))); updateControls();
  }
  function answer(choice) {
    if (phase !== 'question') return;
    phase = 'result'; const L = level(), correct = choice === L.correct;
    stats[correct ? 'right' : 'wrong']++; if (correct) score += 250;
    L.answers.forEach((_, i) => { $(`answer${i}`).disabled = true; if (i === L.correct) $(`answer${i}`).classList.add('right'); else if (i === choice) $(`answer${i}`).classList.add('wrong'); });
    $('feedback').innerHTML = `<p><strong>${correct ? 'Exactly.' : 'Here is the connection.'}</strong> ${L.explain}</p><div class="actions"><button class="primary" id="next">${index === 8 ? 'Finish campaign & bank' : 'Next rescue →'}</button>${index < 8 ? '<button id="bankResult">Finish & bank</button>' : ''}</div>`;
    button('next', () => { if (index === 8) finish(); else { index++; attempts = 0; ghost = []; briefing(); } });
    if (index < 8) button('bankResult', finish);
    $('next').focus(); checkpoint(); updateHud();
  }
  function packet(final) { return { playId, score, act: level().act, final, stats: { ...stats }, requestId: `${playId}:${++messageSeq}` }; }
  function checkpoint() { if (playId && !offline) emit('arcade:score', packet(false)); }
  function finish() {
    if (['title', 'connecting', 'finished'].includes(phase)) return;
    phase = 'finished'; motor = motorTorque = 0;
    modal(`<div class="eyebrow">${stats.solved === 9 ? 'All nine pods home' : 'Flight log closed'}</div><h2 id="dialogTitle">${stats.solved === 9 ? 'You turned it around.' : 'Every rescue counts.'}</h2><p><strong>${score.toLocaleString()} points · ${stats.solved}/9 rescues</strong><br>${stats.right} correct out of ${stats.right + stats.wrong} rotation checks.</p><div class="concept" id="bankExplanation">${offline ? 'Practice run complete. No ranked score or XP was submitted.' : 'Saving your score and banking eligible XP…'}</div><p id="saveStatus" role="status"></p><div class="actions"><button id="saveAgain" hidden>Retry save</button><button id="again" class="primary" ${offline ? '' : 'disabled'}>New rescue campaign ↗</button></div>`);
    button('again', title); button('saveAgain', submitFinal);
    if (!offline && playId) { finalPacket = packet(true); submitFinal(); }
    updateControls(); updateHud();
  }
  function submitFinal() {
    if (!finalPacket || saving) return;
    saving = true; $('saveAgain').hidden = true; $('saveStatus').textContent = 'Saving…';
    emit('arcade:score', finalPacket);
    clearTimeout(saveTimer); saveTimer = setTimeout(() => { saving = false; if ($('saveStatus')) { $('saveStatus').textContent = 'No confirmation yet. Your result is kept here; retry when connected.'; $('saveAgain').hidden = false; } }, 12000);
  }
  window.addEventListener('message', e => {
    if (e.source !== parent || e.origin !== location.origin || !e.data || e.data.protocol !== 2) return;
    const m = e.data;
    if (m.type === 'arcade:coinAccepted' && pendingCoin && m.requestId === pendingCoin) { pendingCoin = null; playId = m.playId; begin(); if (m.staff) $('mode').textContent = 'Staff · unranked / no XP'; }
    if (m.type === 'arcade:coinDenied' && pendingCoin && m.requestId === pendingCoin) {
      pendingCoin = null; phase = 'title'; modal('<h2 id="dialogTitle">Connection not ready.</h2><p id="coinError"></p><div class="actions"><button id="back" class="primary">Back to rescue desk</button></div>'); $('coinError').textContent = m.reason || 'Unable to start ranked play.'; button('back', title);
    }
    if (m.type === 'arcade:scoreSaved' && m.playId === playId) {
      lastAck = Math.max(lastAck, m.score || 0);
      if (m.final && finalPacket && m.requestId === finalPacket.requestId) {
        saving = false; clearTimeout(saveTimer); const text = m.staff ? 'Staff run saved · unranked · no XP.' : `Score saved · ${m.xp} XP banked.${m.capped ? ' Shared daily XP limit reached.' : ''}`;
        $('saveStatus').textContent = text; $('bankExplanation').textContent = 'Flight log saved. Every completed rescue and rotation check is included.'; $('receipt').textContent = text; $('saveAgain').hidden = true; $('again').disabled = false; finalPacket = null; playId = null;
      } else if (!finalPacket) $('receipt').textContent = `Checkpoint saved · ${lastAck.toLocaleString()} points`;
    }
    if (m.type === 'arcade:saveFailed' && m.playId === playId) {
      $('receipt').textContent = 'Save pending. Your result is still held in this tab.';
      if (finalPacket && m.requestId === finalPacket.requestId) { saving = false; clearTimeout(saveTimer); $('saveStatus').textContent = m.reason || 'Could not bank this run. Retry save.'; $('saveAgain').hidden = false; }
    }
  });
  function updateHud() {
    const v = P.velocity(sim), speed = Math.hypot(v.x, v.y), tau = releasedAt ? releasedAt.torque : P.torque(sim) + motorTorque;
    const metric = (id, value, units, digits = 2) => { $(id).innerHTML = `${value.toFixed(digits)} <em>${units}</em>`; };
    metric('angle', sim.theta, 'rad'); metric('speed', speed, 'm/s'); metric('omega', Math.abs(sim.omega), 'rad/s'); metric('radius', sim.r, 'm', 1);
    metric('centripetal', speed * speed / sim.r, 'm/s²'); metric('torque', tau, 'N m', 1); metric('alpha', tau / P.inertia(sim), 'rad/s²'); metric('inertia', P.inertia(sim), 'kg m²', 1); metric('work', sim.work, 'J', 1);
    $('score').textContent = String(score).padStart(5, '0'); $('stats').textContent = `${stats.solved} rescued · ${stats.right}/${stats.right + stats.wrong} rotation checks correct`;
    if (['ready', 'swing', 'flight'].includes(phase)) $('hint').textContent = phase === 'flight' ? 'Tether released: gravity now curves your flight. Rotation readouts show the release state.' : level().motor ? `${level().hint} Fuel: ${fuel.toFixed(1)} s · effective moment arm ${(sim.r * lever).toFixed(1)} m.` : level().hint;
  }
  function fit() { const rect = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); width = rect.width; height = rect.height; cv.width = width * dpr; cv.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  new ResizeObserver(fit).observe(cv);
  const X = x => ox + x * scale, Y = y => oy - y * scale;
  function line(x1, y1, x2, y2, color, weight = 2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.stroke(); }
  function arrow(x, y, dx, dy, color) {
    const len = Math.hypot(dx, dy); if (len < 3) return; const a = Math.atan2(dy, dx);
    line(x, y, x + dx, y + dy, color, 2.5); line(x + dx, y + dy, x + dx - 8 * Math.cos(a - .5), y + dy - 8 * Math.sin(a - .5), color, 2.5); line(x + dx, y + dy, x + dx - 8 * Math.cos(a + .5), y + dy - 8 * Math.sin(a + .5), color, 2.5);
  }
  function trail(path, color, dashed) { if (path.length < 2) return; ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))); ctx.setLineDash(dashed ? [5, 7] : []); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
  function render(now) {
    const span = Math.max(29, level().target + 6); scale = Math.min(width / span, height / 17); ox = (width - span * scale) / 2; oy = height - (height - 17 * scale) / 2;
    ctx.clearRect(0, 0, width, height); const bg = ctx.createLinearGradient(0, 0, width, height); bg.addColorStop(0, '#0c2637'); bg.addColorStop(1, '#071320'); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    // Deterministic starfield; no flicker or screen shake.
    for (let i = 0; i < 60; i++) { ctx.fillStyle = i % 4 ? '#809da646' : '#bfe9dc88'; ctx.fillRect(((i * 137.51) % 997) / 997 * width, ((i * 67.39) % 401) / 401 * height, i % 4 ? 1 : 2, i % 4 ? 1 : 2); }
    for (let x = 0; x < span; x += 2) line(X(x), Y(0), X(x), Y(16), '#31536322', 1);
    for (let y = 0; y < 17; y += 2) line(X(0), Y(y), X(span), Y(y), '#31536322', 1);
    // Far station gantries frame the physical world.
    ctx.fillStyle = '#142e3c'; ctx.fillRect(X(0), Y(15), 10 * scale, .6 * scale); ctx.fillRect(X(6.8), Y(14.4), 2.4 * scale, 2.4 * scale);
    line(X(8), Y(14), X(8), Y(12), '#708e98', 3);
    const px = X(8), py = Y(12), radius = sim.r * scale;
    ctx.beginPath(); ctx.arc(px, py, radius, .1, Math.PI - .1); ctx.setLineDash([4, 7]); ctx.strokeStyle = '#40606d'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    line(px, py, px, py + radius + 12, '#48697777', 1);
    trail(ghost, '#7794b680', true); trail(points, '#78ffcf66', false);
    const tx = X(targetX()), ty = Y(level().padY), tw = level().width * scale;
    ctx.fillStyle = '#78ffcf11'; ctx.fillRect(tx - tw / 2, ty - 32, tw, 35);
    line(tx - tw / 2, ty, tx + tw / 2, ty, colors.mint, 4);
    for (let i = 0; i <= 6; i++) line(tx - tw / 2 + tw * i / 6, ty + 1, tx - tw / 2 + tw * Math.min(i + 1, 6) / 6, ty + 14, '#78ffcf77', 1);
    
    ctx.fillStyle = '#23414e'; ctx.fillRect(tx - tw / 2 - 6, ty, 5, 50); ctx.fillRect(tx + tw / 2 + 1, ty, 5, 50);
    ctx.fillStyle = colors.mint; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('RESCUE NET', tx, ty + 32);
    const p = pose(), x = X(p.x), y = Y(p.y), attached = !flight;
    if (attached) { line(px, py, x, y, '#8ee1d1', 2); ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fillStyle = colors.gold; ctx.fill();
      ctx.fillStyle = '#b5d9df'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'; ctx.fillText(`${sim.r} m`, (px + x) / 2 + 8, (py + y) / 2);
      const v = P.velocity(sim); arrow(x, y, v.x * scale * .45, -v.y * scale * .45, colors.mint);
      const accel = sim.r * sim.omega ** 2, length = Math.min(75, accel * 4); arrow(x, y, -Math.sin(sim.theta) * length, -Math.cos(sim.theta) * length, colors.gold);
    } else { arrow(x, y, flight.vx * scale * .3, -flight.vy * scale * .3, colors.mint); }
    if (releasedAt) { const r = releasedAt; ctx.beginPath(); ctx.arc(X(r.x), Y(r.y), 5, 0, Math.PI * 2); ctx.strokeStyle = colors.mint; ctx.stroke(); arrow(X(r.x), Y(r.y), r.vx * scale * .45, -r.vy * scale * .45, '#78ffcf88'); }
    if (motor && attached && fuel > 0 && phase === 'swing') { const flame = reduceMotion ? 16 : 15 + 3 * Math.sin(now / 65); line(x, y, x - motor * Math.cos(sim.theta) * flame, y + motor * Math.sin(sim.theta) * flame, colors.gold, 6); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(attached ? -sim.theta * .15 : 0);
    ctx.shadowColor = colors.mint; ctx.shadowBlur = 14; ctx.fillStyle = '#b7f9e8'; ctx.beginPath(); ctx.roundRect(-10, -12, 20, 25, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#163e4f'; ctx.beginPath(); ctx.roundRect(-6, -8, 12, 9, 3); ctx.fill(); ctx.fillStyle = colors.mint; ctx.fillRect(-15, -1, 5, 12); ctx.fillRect(10, -1, 5, 12); ctx.restore();
    ctx.textAlign = 'left'; ctx.font = '11px ui-monospace,monospace'; ctx.fillStyle = '#91b7c3'; ctx.fillText(`${level().mass} kg POD  /  g = 9.81 m/s²`, 16, 23);
    if (phase === 'ready') { ctx.textAlign = 'center'; ctx.fillStyle = colors.mint; ctx.font = 'bold 13px system-ui'; ctx.fillText('HOLD SPACE OR THE SWING BUTTON', width / 2, height - 20); }
  }
  function frame(now) {
    const elapsed = Math.min(.05, (now - last) / 1000); last = now;
    if (['swing', 'flight'].includes(phase)) { accumulator += elapsed; while (accumulator >= P.DT && ['swing', 'flight'].includes(phase)) { tick(P.DT); accumulator -= P.DT; } }
    else accumulator = 0;
    if (now - hudTime > 100) { updateHud(); hudTime = now; }
    render(now); requestAnimationFrame(frame);
  }
  $('hold').addEventListener('pointerdown', e => { e.preventDefault(); $('hold').setPointerCapture(e.pointerId); hold(); });
  $('hold').addEventListener('pointerup', e => { e.preventDefault(); release(); });
  $('hold').addEventListener('pointercancel', pause);
  // Non-pointer activation (assistive technology) toggles hold/release.
  $('hold').addEventListener('click', e => { if (e.detail === 0) { if (phase === 'ready') hold(); else release(); } });
  for (const [id, direction] of [['left', -1], ['right', 1]]) {
    $(id).addEventListener('pointerdown', e => { e.preventDefault(); $(id).setPointerCapture(e.pointerId); motor = direction; });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) $(id).addEventListener(event, () => { motor = 0; });
  }
  button('pause', pause); button('retry', retry); button('finish', finish);
  button('sound', () => { sound = !sound; $('sound').textContent = sound ? 'Sound on' : 'Sound off'; $('sound').setAttribute('aria-pressed', String(sound)); $('sound').setAttribute('aria-label', sound ? 'Disable sound' : 'Enable sound'); beep(550); });
  button('help', () => {
    previousPhase = phase; phase = 'help'; motor = 0;
    modal('<div class="eyebrow">Rescue field guide</div><h2 id="dialogTitle">Swing. Release. Learn.</h2><p>Hold <strong>Space</strong> or the green swing button to start the pendulum. Release while moving toward the net. Your cyan velocity arrow is tangent to the circle.</p><p>In Act III, hold <strong>← / →</strong> to apply negative / positive torque. Positive torque speeds a positive swing and slows a negative swing. Thrust consumes fuel and can add or remove energy.</p><p><strong>P</strong> pauses. <strong>R</strong> retries. Leaving the tab pauses automatically. After a rescue, answer one rotation check. “Finish & bank” saves eligible ranked XP.</p><div class="actions"><button id="closeHelp" class="primary">Back to rescue</button></div>');
    button('closeHelp', () => { phase = previousPhase; hideModal(); if (releaseQueued && phase === 'swing') { releaseQueued = false; release(); } updateControls(); });
  });
  window.addEventListener('keydown', e => {
    if (!$('overlay').hidden) {
      if (e.key === 'Tab') { const items = [...$('dialog').querySelectorAll('button:not(:disabled):not([hidden]),select')]; if (!items.length) { e.preventDefault(); return; } const first = items[0], end = items[items.length - 1]; if (e.shiftKey && (document.activeElement === first || document.activeElement === $('dialog'))) { end.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === end) { first.focus(); e.preventDefault(); } }
      if (e.code === 'KeyP' && phase === 'paused') { e.preventDefault(); resume(); } return;
    }
    if (e.code === 'Space' && ['ready', 'swing'].includes(phase)) { e.preventDefault(); if (!e.repeat) hold(); }
    if (['ArrowLeft', 'ArrowRight'].includes(e.code) && level().motor && ['ready', 'swing'].includes(phase)) { e.preventDefault(); motor = e.code === 'ArrowRight' ? 1 : -1; }
    if (e.code === 'KeyP' && !e.repeat) pause(); if (e.code === 'KeyR' && !e.repeat) retry();
  });
  window.addEventListener('keyup', e => { if (e.code === 'Space') { e.preventDefault(); release(); } if (['ArrowLeft', 'ArrowRight'].includes(e.code)) motor = 0; });
  window.addEventListener('blur', () => { motor = 0; pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { motor = 0; pause(); } });
  window.addEventListener('beforeunload', e => { if (saving || finalPacket) { e.preventDefault(); e.returnValue = ''; } });
  title(); fit(); requestAnimationFrame(frame);
})();
