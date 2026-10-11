(() => {
  'use strict';
  const M = window.CutFitMath, $ = id => document.getElementById(id);
  const inch = ticks => `${M.format(ticks)} in`;
  let trade = 'all', variation = 0, queue = [], index = 0, results = [], state;
  const job = () => queue[index];
  const available = () => state.trimming ? state.piece : state.remaining;
  const planning = () => state.phase === 'plan';
  function notice(title, text, good = false) {
    $('feedback').hidden = false;
    $('feedback').className = 'feedback' + (good ? ' good' : '');
    $('feedback').replaceChildren();
    const heading = document.createElement('strong'), body = document.createElement('p');
    heading.textContent = title; body.textContent = text;
    $('feedback').append(heading, body);
  }
  function clearNotice() { $('feedback').hidden = true; }
  function setStep(step) {
    for (const name of ['plan', 'cut', 'fit']) {
      if (name === step) $(name + 'Step').setAttribute('aria-current', 'step');
      else $(name + 'Step').removeAttribute('aria-current');
    }
  }
  function updateScore() {
    $('score').textContent = `${results.reduce((sum, r) => sum + r.points, 0)} points`;
    $('progress').style.width = `${results.length / queue.length * 100}%`;
    $('orderCount').textContent = `ORDER ${Math.min(index + 1, queue.length)} / ${queue.length}`;
  }
  function begin(selectedQueue) {
    queue = selectedQueue || M.makeSet(trade, variation);
    index = 0; results = [];
    $('game').hidden = false; $('report').hidden = true;
    loadJob();
  }
  function loadJob() {
    const j = job(), t = M.trades[j.trade];
    state = { phase: 'plan', remaining: j.stock, piece: null, mark: null, trimming: false, fitted: 0, helped: false, hints: 0, attempts: 0, stockUsed: 1 };
    document.documentElement.style.setProperty('--accent', t.color);
    $('tradeLabel').textContent = `${t.name.toUpperCase()} / ${j.quantity === 2 ? 'TWO-PIECE JOB' : 'ONE-PIECE JOB'}`;
    $('jobTitle').textContent = j.title;
    $('level').textContent = ['','01 / Quarters','02 / Eighths','03 / Sixteenths','04 / Repeat cuts'][j.level];
    $('brief').textContent = j.brief;
    $('dimensions').innerHTML = `<div><dt>${j.reference}</dt><dd>${inch(j.span)}</dd></div><div><dt>Left ${j.allowance.toLowerCase()}</dt><dd>${inch(j.left)}</dd></div><div><dt>Right ${j.allowance.toLowerCase()}</dt><dd>${inch(j.right)}</dd></div>`;
    $('drawingNote').textContent = j.trade === 'carpentry' ? 'Use these job dimensions. Drawing is not actual size.' : 'Dimensions apply to these training fittings only. Use the supplied seats and reference points. Drawing is not actual size.';
    $('hintText').hidden = true; $('hint').textContent = 'Need a hint?';
    resetMark(); render(); updateScore();
  }
  function resetMark() { state.mark = null; $('length').value = ''; clearNotice(); }
  function render() {
    const j = job(), isPlanning = planning(), done = state.phase === 'done';
    $('pieceCount').textContent = `${state.fitted} / ${j.quantity} fitted`;
    $('stockTitle').textContent = state.trimming ? 'Your cut piece' : M.trades[j.trade].material;
    $('stockMode').textContent = state.trimming ? 'TRIM FROM THE SAME REFERENCE END' : 'ON THE CUTTING BENCH';
    $('available').textContent = `${inch(available())} available`;
    $('remaining').textContent = inch(state.remaining);
    $('stockUsed').textContent = state.stockUsed;
    $('cuttingNote').textContent = j.kerf ? `Saw width: ${inch(j.kerf)}. Keep the finished piece to the LEFT of your mark; the blade cuts on the waste side.` : 'Tube-cutter model: cutting loss is 0 in. Keep the finished piece to the LEFT of your mark.';
    $('planForm').hidden = !isPlanning;
    $('cutButton').hidden = !isPlanning;
    $('cutButton').disabled = state.mark === null;
    $('cutButton').innerHTML = state.trimming ? 'Trim &amp; test fit <span aria-hidden="true">→</span>' : 'Cut &amp; test fit <span aria-hidden="true">→</span>';
    $('pointer').max = Math.max(1, available());
    $('pointer').value = state.mark || 1;
    $('pointer').disabled = !isPlanning || state.mark === null;
    $('pointer').setAttribute('aria-valuetext', state.mark === null ? 'No mark yet' : inch(state.mark));
    $('back').disabled = !isPlanning || state.mark === null || state.mark <= 1;
    $('forward').disabled = !isPlanning || state.mark === null || state.mark >= available();
    $('markValue').textContent = state.mark === null ? 'No mark yet' : inch(state.mark);
    $('trim').hidden = state.phase !== 'long';
    $('replace').hidden = !['long', 'short'].includes(state.phase);
    $('nextPiece').hidden = state.phase !== 'fit';
    $('next').hidden = !done;
    $('next').textContent = index === queue.length - 1 ? 'See your workshop report →' : 'Next work order →';
    $('newStock').disabled = !isPlanning;
    $('hint').disabled = done;
    $('earning').textContent = state.helped ? 'With help or rework · 5 points when the job is complete' : '10 points independently · 5 with help or rework';
    $('actionTitle').textContent = done ? 'Job complete.' : state.phase === 'fit' ? 'One fitted. One to go.' : state.phase === 'long' ? 'A little too long.' : state.phase === 'short' ? 'This one falls short.' : state.trimming ? 'Keep what you need.' : 'What length will fit?';
    $('actionDescription').textContent = state.trimming ? 'Mark the new TOTAL finished length from the left end, not the amount to remove.' : isPlanning ? 'Use the drawing to find the finished length of one piece.' : done ? 'The finished parts meet every dimension on this work order.' : 'Compare the finished piece with the drawing, then choose your next move.';
    setStep(isPlanning ? state.mark === null ? 'plan' : 'cut' : 'fit');
    renderDrawing(); renderStock();
  }
  let drawingKey = '';
  function renderDrawing() {
    const j = job(), key = [j.id,j.span,j.left,j.right].join(':');
    if (key !== drawingKey) {
      $('blueprintSheet').innerHTML = window.CutFitBlueprint.sheet(j, 'inline');
      drawingKey = key;
    }
    $('fitInspection').hidden = state.piece === null;
    $('fitInspection').innerHTML = state.piece === null ? '' : window.CutFitBlueprint.inspection(j,state.piece);
  }
  function renderStock() {
    const length = available(), mark = state.mark, color = M.trades[job().trade].color;
    const x = ticks => 55 + ticks / Math.max(1,length) * 770;
    let ticks = '';
    const interval = length > 512 ? 16 : 8;
    for (let i = 0; i <= length; i += interval) {
      const whole = i % 16 === 0;
      ticks += `<path d="M${x(i)} 92v${whole ? 16 : 8}" stroke="#a6bfba"/>`;
      if (i % (length > 512 ? 64 : 32) === 0) ticks += `<text x="${x(i)}" y="128" text-anchor="middle" fill="#a6bfba" font-size="12">${i/16}</text>`;
    }
    $('stock').innerHTML = `<rect x="55" y="52" width="${length ? 770 : 0}" height="34" rx="3" fill="${color}" opacity=".6"/>${length ? ticks : '<text x="440" y="80" text-anchor="middle" fill="#a6bfba" font-size="17">No stock left. Get a fresh length.</text>'}${mark !== null ? `<rect x="55" y="52" width="${x(mark)-55}" height="34" rx="3" fill="${color}"/><path d="M${x(mark)} 35v72" stroke="#e5faf0" stroke-width="2"/><path d="M${x(mark)-6} 30h12l-6 9z" fill="#e5faf0"/><text x="${Math.max(105,Math.min(775,x(mark)))}" y="21" text-anchor="middle" fill="#e5faf0" font-size="16">KEEP ${inch(mark)}</text>` : '<text x="440" y="31" text-anchor="middle" fill="#a6bfba" font-size="13">PLACE YOUR MARK TO START</text>'}`;
    $('stock').setAttribute('aria-label', `${inch(length)} available.${mark === null ? ' No mark placed.' : ` Keep ${inch(mark)} to the left of the mark.`}`);
  }
  function markFromInput(event) {
    event.preventDefault();
    if (!planning()) return;
    const parsed = M.parse($('length').value);
    if (parsed.error) { notice('Check your entry', parsed.error); return; }
    if (parsed.ticks > available()) { notice('That mark is off the stock', `You have ${inch(available())}. ${state.trimming ? 'A trim cannot make this piece longer.' : 'Use the remaining length or get fresh stock.'}`); return; }
    state.mark = parsed.ticks; clearNotice(); render();
    $('cutButton').focus({ preventScroll:true });
  }
  function moveMark(value) {
    if (!planning() || state.mark === null) return;
    state.mark = Math.max(1,Math.min(available(),value));
    $('length').value = M.format(state.mark);
    clearNotice(); render();
  }
  function testCut() {
    if (!planning() || state.mark === null) return;
    const j = job(), cut = M.cut(available(), state.mark, j.kerf);
    if (cut.error) { notice('Check the cutting space', cut.error); return; }
    if (!state.trimming) state.remaining = cut.remainder;
    state.piece = cut.piece; state.trimming = false; state.mark = null; state.attempts++;
    const result = M.inspect(j, state.piece);
    state.phase = result.fit;
    if (result.fit === 'fit') {
      state.fitted++;
      if (state.fitted === j.quantity) {
        state.phase = 'done';
        results.push({ job:j, points:state.helped ? 5 : 10, helped:state.helped, attempts:state.attempts, stockUsed:state.stockUsed, remaining:state.remaining });
        notice('A clean fit.', `${M.equation(j)}. ${state.helped ? 'You checked and revised the job. +5 practice points.' : 'Completed independently. +10 practice points.'}`, true);
        updateScore();
      } else notice('The first piece fits.', `${inch(state.piece)} is seated correctly. Make the second matching piece from the ${inch(state.remaining)} remainder.`, true);
    } else {
      state.helped = true;
      notice(result.fit === 'long' ? `Too long by ${inch(result.difference)}.` : `Too short by ${inch(-result.difference)}.`, result.fit === 'long' ? 'The piece passes the required end position. You can trim it: mark the new total length from the same left end.' : 'The piece does not reach the required end position. Set it aside and make a replacement from the remaining stock.');
    }
    render(); $('feedback').focus({ preventScroll:true });
  }
  function resume(mode) {
    if (mode === 'trim' && state.phase !== 'long') return;
    if (mode === 'replace' && !['long','short'].includes(state.phase)) return;
    if (mode === 'next' && state.phase !== 'fit') return;
    state.trimming = mode === 'trim';
    if (!state.trimming) state.piece = null;
    state.phase = 'plan'; resetMark(); render(); $('length').focus({ preventScroll:true });
  }
  function hint() {
    if (state.phase === 'done') return;
    state.helped = true; state.hints++;
    const j = job();
    $('hintText').hidden = false;
    $('hintText').textContent = state.hints > 1 ? `Work it through: ${M.equation(j)}. ${j.quantity === 2 ? 'Each piece has this length. The cutting loss comes from the remaining stock, not from the finished piece.' : 'Use that finished length for your mark.'}` : j.kind === 'insertion' ? 'Some of the finished piece hides inside each fitting. Add the left insertion and the right insertion to the visible gap.' : j.kind === 'clearance' ? 'The part needs room at both ends. Subtract BOTH clearances from the opening.' : 'The overall span includes space the finished piece cannot occupy. Subtract the left and right dimensions to find the distance between the seats.';
    $('hint').textContent = state.hints > 1 ? 'Worked example shown' : 'Show the calculation';
    render();
  }
  function showReport() {
    $('game').hidden = true; $('report').hidden = false;
    const independent = results.filter(r => !r.helped).length;
    const pieces = results.reduce((sum,r) => sum + r.job.quantity,0);
    $('reportIntro').textContent = `You fitted ${pieces} pieces across ${results.length} work orders. Every finished piece meets its drawing.`;
    $('reportStats').innerHTML = `<div><strong>${results.reduce((sum,r)=>sum+r.points,0)} / ${results.length*10}</strong><span>practice points</span></div><div><strong>${independent}</strong><span>jobs completed independently</span></div><div><strong>${results.length-independent}</strong><span>jobs with help or rework</span></div>`;
    $('reportJobs').innerHTML = results.map(r => `<article><span class="result-label${r.helped ? ' helped' : ''}">${r.helped ? '↻ WITH HELP OR REWORK' : '✓ INDEPENDENT'} · ${M.trades[r.job.trade].name}</span><h3>${r.job.title}</h3><p>${r.job.skill} · ${M.equation(r.job)}</p><p>${r.attempts} cut/fit ${r.attempts === 1 ? 'attempt' : 'attempts'} · ${r.stockUsed} stock ${r.stockUsed === 1 ? 'length' : 'lengths'} · ${inch(r.remaining)} left on current stock</p></article>`).join('');
    $('retryHelped').hidden = independent === results.length;
    $('reportTitle').focus();
  }
  $('expandDrawing').addEventListener('click', () => {
    $('expandedDrawing').innerHTML = window.CutFitBlueprint.sheet(job(), 'expanded');
    $('drawingDialogTitle').textContent = job().title + ' — drawing';
    $('drawingDialog').showModal();
  });
  $('closeDrawing').addEventListener('click', () => $('drawingDialog').close());
  $('planForm').addEventListener('submit', markFromInput);
  // Editing a previously placed length must invalidate the old cutting mark.
  $('length').addEventListener('input', () => { if (planning()) { state.mark = null; clearNotice(); render(); } });
  $('cutButton').addEventListener('click', testCut);
  $('pointer').addEventListener('input', e => moveMark(Number(e.target.value)));
  $('back').addEventListener('click', () => moveMark(state.mark - 1));
  $('forward').addEventListener('click', () => moveMark(state.mark + 1));
  $('stock').addEventListener('pointerdown', e => {
    if (!planning() || state.mark === null) return;
    const box = $('stock').getBoundingClientRect();
    moveMark(Math.round(((e.clientX-box.left) / box.width * 880 - 55) / 770 * available()));
  });
  $('trim').addEventListener('click', () => resume('trim'));
  $('replace').addEventListener('click', () => resume('replace'));
  $('nextPiece').addEventListener('click', () => resume('next'));
  $('newStock').addEventListener('click', () => {
    if (!planning()) return;
    state.remaining = job().stock; state.piece = null; state.trimming = false; state.stockUsed++;
    resetMark(); render(); notice('Fresh stock is ready.', 'The previous remainder and any cut piece have been set aside. Plan your next cut from this new length.');
  });
  $('hint').addEventListener('click', hint);
  $('next').addEventListener('click', () => {
    if (state.phase !== 'done') return;
    if (index === queue.length-1) { showReport(); return; }
    index++; loadJob(); $('jobTitle').focus();
  });
  document.querySelectorAll('[data-trade]').forEach(button => button.addEventListener('click', () => {
    if (trade === button.dataset.trade) return;
    trade = button.dataset.trade; variation = 0;
    document.querySelectorAll('[data-trade]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
    begin();
  }));
  for (const id of ['restart','another']) $(id).addEventListener('click', () => { variation++; begin(); $('jobTitle').focus(); });
  $('retryHelped').addEventListener('click', () => { const review = results.filter(r=>r.helped).map(r=>r.job); if (review.length) { begin(review); $('jobTitle').focus(); } });
  begin();
})();
