(() => {
  'use strict';
  const $ = id => document.getElementById(id), M = window.TapeMath;
  const materials = [
    ['Pine shelf blank', 'wood'], ['Copper pipe', 'copper'], ['Steel bracket stock', 'steel'],
    ['Door casing', 'trim'], ['Threaded rod', 'rod'], ['Plywood panel strip', 'wood'],
    ['Conduit offcut', 'steel'], ['Oak flooring sample', 'wood'],
  ];
  const colors = { 1: '#34434c', 2: '#be5130', 4: '#17735f', 8: '#345cba', 10: '#345cba', 16: '#854bae', 32: '#805a37' };
  let queue = [], index = 0, q, stage = 'active', score = 0, helped = false, mistakes = 0, hintLevel = 0;
  let results = [], zeroShift = 0, zeroLocked = true, extension = 0, pointer = 0, activity = 'jobs', family = 'all';
  const unitName = unit => unit === 'in' ? 'inches' : unit === 'cm' ? 'centimeters' : 'millimeters';
  const display = (ticks, d) => M.mixed(ticks, d);
  const close = (a, b) => Math.abs(a - b) < 1e-7;
  const x = value => 100 + value * 100;
  const isRule = () => q && (q.family !== 'fraction' || q.toolKey === 'inch-32');
  const isPointJob = () => ['locate', 'mark'].includes(q.type);
  const isScaleJob = () => ['scale', 'locate', 'equivalent'].includes(q.type);
  const base = () => q.type === 'mark' ? q.whole : isScaleJob() ? 0 : Math.floor(q.endTicks / q.d);
  function feedback(text, good = false) { $('feedback').textContent = text; $('feedback').className = good ? 'good' : ''; }
  function markHelp() { helped = true; $('helpState').textContent = 'Coached work order · 5 points when completed'; }
  function miss(text) { mistakes++; markHelp(); feedback(text); }
  function moveFocus(id) { $(id).focus({ preventScroll: true }); }
  function bar(n, d, label) {
    return `<div class="fraction-row"><span>${label || `${n}/${d}`}</span><div class="bar" role="img" aria-label="${n} of ${d} equal spaces shaded">${Array.from({ length: d }, (_, i) => `<i class="${i < n ? 'filled' : ''}"></i>`).join('')}</div></div>`;
  }
  function equivalence(n, d, unit) {
    const g = M.gcd(n, d), simple = M.fraction(n, d);
    const names = g > 1 ? `${n}/${d} = ${simple}` : `${n * 2}/${d * 2} = ${simple}`;
    return `<div class="equation">${names} = ${n / d}${unit === 'cm' ? ` cm = ${n * 10 / d} mm` : ' in'}</div>${bar(n, d)}${g > 1 ? bar(n / g, d / g) : bar(n * 2, d * 2)}<p>Each full bar is one ${unit === 'cm' ? 'centimeter' : 'inch'}. ${g > 1 ? `Group ${g} small spaces together. Divide both the top and bottom by ${g}; the shaded length stays the same.` : 'Split each space in two. There are twice as many pieces, but the shaded length stays the same.'} ${unit === 'cm' ? 'There are 10 millimeters in a centimeter.' : `For the decimal, divide ${n} by ${d}.`}</p>`;
  }
  function scaleSvg(d, start, options = {}) {
    const { selected = null, highlight = 'none', endTick = null, startTick = null, interval = false, color = false } = options;
    let svg = '<rect x="25" y="28" width="710" height="100" rx="8" fill="#f9d46c"/>';
    if (selected !== null && color) svg += `<rect x="40" y="30" width="${selected / d * 680}" height="94" fill="#5b9e82" opacity=".27"/>`;
    for (let i = 0; i <= d; i++) {
      const pos = 40 + i * 680 / d, level = M.tickLevel(i, d), active = highlight === 'all' || Number(highlight) === level;
      svg += `<path d="M${pos} 29v${M.tickHeight(i, d)}" stroke="${color && active ? colors[level] : '#37352b'}" stroke-width="${active ? 3 : 1.8}" opacity="${color && !active ? .25 : 1}"/>`;
      if (i === 0 || i === d) svg += `<text x="${pos}" y="111" text-anchor="middle" fill="#38352a" font-size="21" font-weight="600">${start + i / d}</text>`;
    }
    function marker(tick, color, label) {
      const pos = 40 + (tick / d - start) * 680;
      if (pos < 39 || pos > 721) return;
      svg += `<path d="M${pos} 18V94" stroke="${color}" stroke-width="2.5"/><path d="M${pos - 7} 12h14l-7 12z" fill="${color}"/>${label ? `<text x="${pos}" y="10" text-anchor="middle" fill="#d7e8ed" font-size="11">${label}</text>` : ''}`;
    }
    if (endTick !== null) marker(endTick, '#ad422f', 'EDGE');
    if (startTick !== null) marker(startTick, '#238876', 'START');
    if (selected !== null) marker((start * d) + selected, '#ab3e2d', '');
    if (interval) {
      const a = 40 + 680 / d, b = 40 + 1360 / d;
      svg += `<path d="M${a} 87v9h${b - a}v-9" stroke="#ae432b" stroke-width="3"/>`;
    }
    return svg;
  }
  function drawMaterial() {
    const [name, kind] = materials[index % materials.length];
    const start = q.startTicks / q.d, length = q.type === 'mark' ? 6.5 : q.value;
    const left = x(start), width = length * 100;
    let shape = '';
    if (kind === 'wood') shape = `<rect x="${left}" y="89" width="${width}" height="62" fill="url(#wood)" stroke="#d5a879"/><path d="M${left} 143h${width}" stroke="#68472f" stroke-width="5"/>`;
    if (kind === 'copper') shape = `<rect x="${left}" y="100" width="${width}" height="40" fill="#b8714a"/><path d="M${left} 110h${width}" stroke="#efb281" stroke-width="8"/><ellipse cx="${left + width - 4}" cy="120" rx="4" ry="19" fill="#784b35"/>`;
    if (kind === 'steel' || kind === 'rod') shape = `<rect x="${left}" y="100" width="${width}" height="40" fill="url(#metal)" stroke="#acbec7"/>` + (kind === 'rod' ? Array.from({ length: Math.floor(width / 9) }, (_, i) => `<path d="M${left + 4 + i * 9} 101l-4 38" stroke="#516d7a"/>`).join('') : '');
    if (kind === 'trim') shape = `<rect x="${left}" y="89" width="${width}" height="62" fill="#d9ddd3"/><path d="M${left} 99h${width}M${left} 141h${width}" stroke="#8d9a95" stroke-width="5"/>`;
    $('material').innerHTML = shape;
    $('objectGuides').innerHTML = `<path d="M${left} 69V261" stroke="#83d8c1" stroke-dasharray="4 5"/><text x="${left}" y="55" text-anchor="middle" fill="#a3d8ce" font-size="14">START</text>` + (q.type === 'mark' ? '' : `<path id="edge" d="M${left + width} 78V258" stroke="#efb64e" stroke-dasharray="4 5"/>`);
    $('objectName').textContent = isScaleJob() ? q.type === 'equivalent' ? 'Same length, different names' : 'Read the graduation pattern' : name;
  }
  function drawTape() {
    let ticks = '';
    for (let i = 0; i <= 8 * q.d; i++) {
      const pos = i * 100 / q.d;
      ticks += `<path d="M${pos} 167v${M.tickHeight(i, q.d)}" stroke="#363324" stroke-width="${i % q.d ? 1.1 : 2}"/>`;
      if (i % q.d === 0) ticks += `<text x="${pos + 4}" y="240" fill="#343025" font-size="18" font-weight="bold">${i / q.d}</text>`;
    }
    $('ticks').innerHTML = ticks;
    $('tapeSurface').setAttribute('fill', isRule() ? 'url(#metal)' : '#f9d46c');
    $('tapeSurface').setAttribute('x', isRule() ? '-12' : '0');
    $('tapeSurface').setAttribute('width', isRule() ? '824' : '800');
    $('clipWidth').setAttribute('x', isRule() ? '-12' : '0');
    $('case').style.display = isRule() ? 'none' : '';
    $('hookMetal').style.display = isRule() ? 'none' : '';
    $('tapeControls').hidden = isRule();
    $('unitsCaption').textContent = q.unit === 'cm' ? 'CENTIMETERS · each small space is 1 mm' : 'INCHES · long ticks are landmarks';
    $('divisionLabel').textContent = q.unit === 'cm' ? 'METRIC / cm' : 'IMPERIAL / in';
    $('tapeAssembly').setAttribute('transform', `translate(${x(zeroShift)} 0)`);
  }
  function updateZoom() {
    $('zoom').hidden = !isScaleJob() && (extension + zeroShift < q.endTicks / q.d || !zeroLocked);
    $('zoomTitle').textContent = isPointJob() ? 'PLACE YOUR MARK' : q.type === 'scale' ? 'ONE UNIT · COUNT THE SPACES' : q.type === 'offset' ? 'END READING · SUBTRACT THE START' : 'READING WINDOW';
    $('zoomUnit').textContent = q.unit === 'cm' ? 'cm · 10 mm = 1 cm' : 'inches';
    let details = scaleSvg(q.d, base(), {
      selected: isPointJob() ? pointer : null,
      endTick: ['read', 'setup', 'offset'].includes(q.type) ? q.endTicks : null,
      interval: q.type === 'scale',
    });
    if (q.type === 'offset') {
      const startBase = Math.floor(q.startTicks / q.d);
      $('detail').setAttribute('viewBox', '0 0 760 290');
      details = `<g>${scaleSvg(q.d, startBase, { startTick: q.startTicks })}</g><g transform="translate(0 150)">${details}</g>`;
      $('zoomTitle').textContent = 'START & END · READ BOTH EDGES';
    } else $('detail').setAttribute('viewBox', '0 0 760 140');
    $('detail').innerHTML = details;
    $('pointerControls').hidden = !isPointJob() || stage !== 'active';
    $('pointer').max = q.d;
    $('pointer').value = pointer;
    // Give keyboard users the same mark index visible on the scale, without naming the answer.
    $('pointer').setAttribute('aria-valuetext', `${pointer} spaces after ${base()} ${q.unit}`);
    drawPencil();
  }
  function drawPencil() {
    const pos = x(base() + pointer / q.d);
    $('pencil').innerHTML = q.type === 'mark' ? `<path d="M${pos} 88V151" stroke="#ed6c43" stroke-width="3"/><g transform="translate(${pos} 88) rotate(24)"><path d="M-7 -70h14v50l-7 20-7-20z" fill="#f1b549"/><path d="M-3 -9h6L0 0z" fill="#182c36"/></g>` : '';
  }
  function setExtension(value) {
    extension = isRule() ? 8 : Math.max(0, Math.min(8, Number(value)));
    $('extension').value = extension;
    $('clipWidth').style.width = `${extension * 100 + (isRule() ? 24 : 0)}px`;
    $('case').setAttribute('transform', `translate(${extension * 100} 153)`);
    updateZoom();
  }
  function setZero(value) {
    if (stage !== 'active' || zeroLocked) return;
    zeroShift = Math.max(-.5, Math.min(.5, value));
    $('alignment').value = Math.round(zeroShift * q.d * 2);
    $('tapeAssembly').setAttribute('transform', `translate(${x(zeroShift)} 0)`);
    updateZoom();
  }
  function readNotation() {
    if (q.unit === 'cm' || q.family === 'decimal') return 'decimal';
    return $('format').value === 'mixed' ? (index % 2 ? 'decimal' : 'fraction') : $('format').value;
  }
  function setupPrompt() {
    const notation = readNotation(), unit = unitName(q.unitOut);
    $('answerLabel').textContent = `Length in ${unit}`;
    $('answer').placeholder = notation === 'fraction' ? 'e.g. 2 3/4 or 11/4' : 'e.g. 2.75';
    $('answerHint').textContent = `Read the whole units, then the small spaces. Answer in ${unit}${notation === 'fraction' ? ' using a fraction or mixed number' : ' using a decimal or whole number'}.`;
    $('prompt').textContent = `How long is this ${materials[index % materials.length][0].toLowerCase()}?`;
    $('stepLabel').textContent = 'MEASURE THE MATERIAL';
    $('benchTip').textContent = isRule() ? 'Use the zero graduation on the rule. The enlarged reading window shows the small graduations.' : 'Extend the tape beyond the far edge. Use the enlarged reading window for small graduations.';
    if (q.type === 'scale') {
      $('prompt').textContent = 'How much does one small space represent?';
      $('answerHint').textContent = `Between 0 and 1, count the spaces, not the lines. Give the size of one space in ${unit}.`;
      $('answerLabel').textContent = `Smallest division in ${unit}`;
      $('stepLabel').textContent = 'CALIBRATION CHECK';
      $('benchTip').textContent = 'The bracket spans one small space. Every space between adjacent graduations has the same value.';
    } else if (q.type === 'locate' || q.type === 'mark') {
      const target = q.unitOut === 'mm' ? `${q.value * 10} mm` : notation === 'decimal' ? `${q.value} ${q.unit}` : `${display(q.lengthTicks, q.d)} ${q.unit}`;
      $('prompt').textContent = q.type === 'mark' ? `Mark the material at ${target}.` : `Find ${target} on this scale.`;
      $('answerHint').textContent = 'Tap the enlarged scale or move the pointer one graduation at a time. Then check your mark.';
      $('stepLabel').textContent = q.type === 'mark' ? 'LAY OUT A CUT' : 'FIND THE GRADUATION';
      $('benchTip').textContent = q.type === 'mark' ? (isRule() ? 'The pencil marks a cut location, not the end of the material. Use the enlarged marking window.' : 'The pencil marks a cut location, not the end of the material. Extend the tape to reveal the marking window.') : 'Use the long ticks as landmarks, then count smaller spaces to the requested value.';
      $('checkPointer').textContent = q.type === 'mark' ? 'Check pencil mark' : 'Check this graduation';
    } else if (q.type === 'setup') {
      $('prompt').textContent = 'Set up the instrument, then measure.';
      $('answerHint').textContent = 'The zero is misplaced. Slide the instrument until its zero meets the left edge of the material, then lock it.';
      $('stepLabel').textContent = 'ZERO BEFORE YOU READ';
      $('benchTip').textContent = isRule() ? 'Drag the green zero indicator or use the zero-position slider. Align the zero graduation, not the physical end of a rule.' : 'Drag the silver hook or use the zero-position slider. The green START line belongs to the material.';
    } else if (q.type === 'equivalent') {
      $('prompt').textContent = q.unit === 'cm' ? `${q.n}/${q.d} cm is how many millimeters?` : `Write ${q.n}/${q.d} inch as a simpler fraction and a decimal.`;
      $('answerHint').textContent = q.unit === 'cm' ? 'One centimeter contains 10 millimeters.' : 'Both numbers must name the same length. Group the small spaces without changing the shaded amount.';
      $('stepLabel').textContent = 'SAME LENGTH, NEW NAME';
      $('answerLabel').textContent = q.unit === 'cm' ? 'Equivalent length in millimeters' : 'Equivalent decimal in inches';
      $('answer').placeholder = 'e.g. 0.5';
      if (q.unit !== 'cm') { $('offsetFields').hidden = false; $('startLabel').textContent = 'Fraction in simplest form'; $('endReading').hidden = true; $('endLabel').hidden = true; }
      $('benchTip').textContent = 'The shaded part of one unit stays the same when the fraction is renamed.';
    } else if (q.type === 'offset') {
      $('prompt').textContent = isRule() ? 'The zero end is worn. Measure from another mark.' : 'The hook is damaged. Measure from another mark.';
      $('answerHint').textContent = `Read both edges in ${unitName(q.unit)}. Subtract start from end, then give the length in ${unit}.`;
      $('stepLabel').textContent = 'MEASURE FROM A NONZERO START';
      if (q.unit === 'cm') $('stepLabel').textContent = 'OFFSET MEASUREMENT';
      $('benchTip').textContent = 'A zero start is convenient, but any clear graduation works: length = end reading − start reading.';
      $('offsetFields').hidden = false;
      $('startLabel').textContent = `Start reading (${q.unit})`;
      $('endLabel').textContent = `End reading (${q.unit})`;
    }
  }
  function loadJob() {
    q = queue[index]; stage = 'active'; helped = false; mistakes = 0; hintLevel = 0; pointer = 0;
    zeroLocked = q.type !== 'setup'; zeroShift = zeroLocked ? 0 : .5;
    document.querySelector('.workspace').hidden = false;
    $('summary').hidden = true;
    document.querySelector('.bench').classList.toggle('scale-only', isScaleJob());
    $('alignmentControls').hidden = q.type !== 'setup';
    $('alignment').min = -q.d; $('alignment').max = q.d; $('alignment').value = q.d; $('alignment').disabled = false;
    $('lockAlignment').disabled = false; $('lockAlignment').textContent = 'Lock zero';
    $('round').textContent = `ORDER ${index + 1} / ${queue.length}`;
    $('orderNumber').textContent = String(index + 1).padStart(2, '0');
    $('progress').style.width = `${index / queue.length * 100}%`;
    $('score').textContent = `${score} pts`;
    $('skillName').textContent = M.skills[q.skill];
    $('answerForm').hidden = isPointJob(); $('checkPointer').hidden = !isPointJob();
    $('answerForm').querySelectorAll('input').forEach(input => { input.value = ''; input.disabled = false; });
    $('offsetFields').hidden = true; $('endReading').hidden = false; $('endLabel').hidden = false;
    $('check').disabled = false; $('checkPointer').disabled = false;
    $('next').hidden = true; $('explanation').hidden = true; $('hint').disabled = false;
    $('helpState').textContent = '10 points independently · 5 with help';
    $('fieldGuide').open = false;
    feedback(''); setupPrompt(); $('mobileBrief').hidden = false; $('mobileBrief').textContent = $('prompt').textContent; drawMaterial(); drawTape(); setExtension(isScaleJob() ? 8 : 0);
    if (q.type === 'equivalent') $('detail').innerHTML = scaleSvg(q.d, 0, { selected: q.n, color: true, highlight: 'all' });
  }
  function startSet(types = M.sequence) {
    const key = $('tool').value;
    queue = types.map((type, i) => M.makeJob(key, type, i));
    index = 0; score = 0; results = []; activity = 'jobs'; setActivity('jobs'); loadJob();
  }
  function finishJob(explanation) {
    if (stage !== 'active') return;
    stage = 'review'; const points = helped ? 5 : 10; score += points;
    results.push({ type: q.type, skill: q.skill, independent: !helped, mistakes, points });
    $('score').textContent = `${score} pts`;
    $('progress').style.width = `${(index + 1) / queue.length * 100}%`;
    feedback(helped ? 'You worked it out. Now try the same skill with less help.' : 'Accurate work. You completed this independently.', true);
    $('explanation').innerHTML = explanation;
    $('explanation').hidden = false; $('next').hidden = false;
    $('next').textContent = index + 1 === queue.length ? 'See workshop report →' : 'Next work order →';
    $('answerForm').querySelectorAll('input').forEach(input => input.disabled = true);
    $('check').disabled = true; $('checkPointer').disabled = true; $('hint').disabled = true;
    $('pointerControls').hidden = true;
    moveFocus('next');
  }
  function measurementExplanation() {
    const length = `${display(q.lengthTicks, q.d)} ${q.unit} = ${q.value} ${q.unit}`;
    return `<div class="equation">${q.type === 'offset' ? `${display(q.endTicks, q.d)} − ${display(q.startTicks, q.d)} = ${display(q.lengthTicks, q.d)} ${q.unit}` : length}${q.unit === 'cm' ? ` = ${q.value * 10} mm` : ''}</div><p>${q.type === 'offset' ? 'The far-edge reading is a position on the scale. Subtract the near-edge reading to find the length between the edges.' : `There are ${q.whole} whole ${unitName(q.unit)}, then ${q.n} more spaces. Each small space is 1/${q.d} ${q.unit}.`}</p>${equivalence(q.n, q.d, q.unit)}`;
  }
  function readyToRead() {
    if (!zeroLocked) { feedback('Align the instrument’s zero with the starting edge and select Lock zero first.'); return false; }
    const reach = q.type === 'mark' ? q.whole + 1 : q.endTicks / q.d;
    if (!isScaleJob() && extension < reach) { feedback('Extend the tape past the reading window before checking.'); return false; }
    return true;
  }
  function diagnose(value) {
    const target = M.expected(q), step = q.unitOut === 'mm' ? 10 / q.d : 1 / q.d;
    if (q.type === 'offset' && close(value, q.endTicks / q.d * (q.unitOut === 'mm' ? 10 : 1))) return 'That is the end reading, not the length. Subtract the start reading: end − start.';
    if (close(Math.abs(value - target), step)) return 'You are one graduation away. Count the spaces traveled from the whole-number mark; do not count that starting line as a space.';
    if (q.unitOut === 'mm' && close(value, q.value)) return 'You read centimeters correctly. The answer asks for millimeters: multiply centimeters by 10.';
    if (q.type === 'scale' && close(value, 1 / (q.d + 1))) return 'You counted the lines, including both ends. There is one fewer space than boundary lines.';
    if (close(value, Number(`${q.whole}.${q.n}`))) return 'A tick count is not a decimal digit. Divide the number of small spaces by the spaces per unit, then add the whole units.';
    return 'Not quite. Use the long whole-unit ticks first, then count the small spaces. Check the requested unit as well.';
  }
  function hint() {
    if (stage !== 'active') return;
    markHelp(); hintLevel++;
    const first = {
      scale: 'Count spaces between 0 and 1. One space is 1 divided by the number of spaces in that unit.',
      locate: 'Find the nearest long landmark tick first. Count the smaller spaces from that landmark.',
      mark: 'Locate the whole unit in the requested length, then move through the remaining fraction of a unit.',
      setup: 'Align the instrument’s zero graduation with the material’s START line. The physical end of a ruler is not always zero.',
      read: 'Find the whole number before the edge. The extra fraction is spaces counted ÷ spaces per unit.',
      equivalent: 'Divide the numerator and denominator by the same factor. Divide the numerator by the denominator for a decimal.',
      offset: 'Record both edge positions. The object did not start at zero, so its length is the difference, not the end reading.',
    };
    let message = first[q.type];
    if (q.unit === 'cm' && q.type === 'equivalent') message = 'Each tenth of a centimeter is one millimeter. Multiply the length in centimeters by 10.';
    if (hintLevel >= 2) {
      if (q.type === 'scale') message = `There are ${q.d} spaces in one ${q.unit}. One small space is 1/${q.d} ${q.unit}${q.unitOut === 'mm' ? ', which is 1 mm' : ''}.`;
      else if (q.type === 'setup' && !zeroLocked) message = 'Move the zero-position slider to its center. The tape zero and material START should be directly above one another.';
      else if (q.type === 'equivalent') message = q.unit === 'cm' ? `${q.n}/${q.d} cm = ${q.value} cm. Multiply by 10 to get millimeters.` : `${q.n}/${q.d}: divide both numbers by ${M.gcd(q.n, q.d)}. The decimal is ${q.n} ÷ ${q.d}.`;
      else if (q.type === 'offset') message = `Start = ${display(q.startTicks, q.d)} ${q.unit}; end = ${display(q.endTicks, q.d)} ${q.unit}. Subtract those positions${q.unitOut === 'mm' ? ', then multiply by 10 for millimeters' : ''}.`;
      else message = `Use ${q.whole} whole ${q.unit}, then ${q.n} spaces of 1/${q.d} ${q.unit}${q.unitOut === 'mm' ? '. Multiply the centimeter reading by 10 for millimeters' : ''}.`;
    }
    feedback(message);
  }
  $('answerForm').addEventListener('submit', event => {
    event.preventDefault(); if (stage !== 'active' || !readyToRead()) return;
    const raw = $('answer').value.trim(), value = M.parse(raw);
    if (!Number.isFinite(value)) { feedback('Enter a number, decimal, or fraction with a nonzero denominator, such as 2.5 or 2 1/2.'); return; }
    if (q.type === 'equivalent' && q.unit !== 'cm') {
      const f = $('startReading').value.trim(), parts = f.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (!parts || !close(M.parse(f), q.value)) { miss('The fraction must name the same shaded length. Divide its numerator and denominator by the same number.'); return; }
      if (M.gcd(+parts[1], +parts[2]) !== 1) { miss('That fraction is equivalent. Now simplify it by dividing both numbers by their greatest common factor.'); return; }
      if (raw.includes('/')) { feedback('The second answer asks for decimal notation. Divide the numerator by the denominator.'); return; }
    } else if (q.type === 'offset') {
      const startValue = M.parse($('startReading').value), endValue = M.parse($('endReading').value);
      if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) { feedback('Record both the start and end readings before checking the length.'); return; }
      if (!close(startValue, q.startTicks / q.d)) { miss('Recheck the START edge in the upper magnified scale. Enter its position, not zero by default.'); return; }
      if (!close(endValue, q.endTicks / q.d)) { miss('Recheck the far EDGE in the lower magnified scale. Count its whole units and remaining spaces.'); return; }
    }
    if (q.type !== 'equivalent' && q.type !== 'scale') {
      if (readNotation() === 'decimal' && raw.includes('/')) { feedback('Your answer is in fraction notation. Write it as a decimal for this work order.'); return; }
      if (readNotation() === 'fraction' && !raw.includes('/') && value % 1 !== 0) { feedback('Write this reading as a fraction or mixed number, such as 2 3/4.'); return; }
    }
    if (!close(value, M.expected(q))) { miss(diagnose(value)); return; }
    if (q.type === 'scale') finishJob(`<div class="equation">1 ${q.unit} ÷ ${q.d} spaces = ${1 / q.d} ${q.unit}${q.unit === 'cm' ? ' = 1 mm' : ''}</div><p>${q.d + 1} boundary lines enclose ${q.d} equal spaces. Count the spaces. The short ticks divide the unit; taller ticks make halves and other landmarks easier to find.</p>`);
    else if (q.type === 'equivalent') finishJob(equivalence(q.n, q.d, q.unit));
    else finishJob(measurementExplanation());
  });
  $('checkPointer').addEventListener('click', () => {
    if (stage !== 'active' || !readyToRead()) return;
    if (pointer !== q.n) {
      const difference = Math.abs(pointer - q.n);
      miss(difference === 1 ? 'One graduation off. Count the spaces from the whole-unit mark, not the starting line.' : `Your mark is too ${pointer < q.n ? 'low' : 'high'}. Use the long landmark ticks, then count the smaller spaces.`);
      return;
    }
    finishJob(`<div class="equation">${display(q.lengthTicks, q.d)} ${q.unit} = ${q.value} ${q.unit}${q.unit === 'cm' ? ` = ${q.value * 10} mm` : ''}</div><p>${q.type === 'mark' ? 'Your pencil is on the requested cut line.' : 'You found the requested graduation.'} Move ${q.n} spaces past ${q.whole}; each space is 1/${q.d} ${q.unit}.</p>${equivalence(q.n, q.d, q.unit)}`);
  });
  $('lockAlignment').addEventListener('click', () => {
    if (stage !== 'active' || zeroLocked) return;
    if (!close(zeroShift, 0)) { miss('The instrument’s zero is not aligned with the material’s START line yet. Slide it left or right before locking.'); return; }
    zeroLocked = true; $('alignment').disabled = true; $('lockAlignment').disabled = true; $('lockAlignment').textContent = 'Zero locked ✓';
    $('prompt').textContent = 'Zero is aligned. What is the length?';
    $('mobileBrief').textContent = $('prompt').textContent;
    $('answerHint').textContent = `${isRule() ? 'Read' : 'Extend the tape, then read'} the far edge in ${unitName(q.unitOut)}${readNotation() === 'fraction' ? ' as a fraction or mixed number' : ' as a decimal'}.`;
    feedback('Good setup. The zero mark and starting edge agree.', true); updateZoom(); moveFocus(isRule() ? 'answer' : 'extend');
  });
  function showReport() {
    stage = 'done'; $('mobileBrief').hidden = true; document.querySelector('.workspace').hidden = true; $('summary').hidden = false;
    const independent = results.filter(r => r.independent).length;
    $('summaryText').textContent = `${score} / ${queue.length * 10} points · ${independent} independent · ${results.length - independent} completed with help`;
    $('skillReport').innerHTML = Object.entries(M.skills).map(([key, name]) => {
      const entries = results.filter(r => r.skill === key), count = entries.filter(r => r.independent).length;
      return `<div class="skill-result"><strong>${name}</strong><span>${entries.length ? `${count}/${entries.length} independent` : 'Not practiced this set'}</span><div class="skill-dots">${entries.map(r => `<i class="${r.independent ? 'independent' : 'coached'}" title="${r.independent ? 'Independent' : 'With help'}"></i>`).join('')}</div></div>`;
    }).join('');
    $('practiceWeak').hidden = independent === results.length;
    moveFocus('summaryTitle');
  }
  $('next').addEventListener('click', () => {
    if (stage !== 'review') return;
    if (++index < queue.length) { loadJob(); moveFocus('prompt'); if (window.matchMedia('(max-width:900px)').matches) $('mobileBrief').scrollIntoView({ block: 'start' }); }
    else showReport();
  });
  function setActivity(next) {
    activity = next; $('explorer').hidden = next !== 'explore'; $('workArea').hidden = next !== 'jobs';
    $('jobsTab').setAttribute('aria-pressed', String(next === 'jobs')); $('exploreTab').setAttribute('aria-pressed', String(next === 'explore'));
    if (next === 'explore') { if (q && stage === 'active') markHelp(); renderExplorer(); }
  }
  function renderExplorer() {
    const tool = M.tools[$('tool').value], d = tool.d;
    $('explorePointer').max = d;
    const n = Math.min(d, Number($('explorePointer').value)); $('explorePointer').value = n;
    const levels = tool.family === 'fraction' ? [1, 2, 4, 8, 16, 32].filter(l => l <= d) : [1, 2, 10];
    if (family !== 'all' && !levels.includes(Number(family))) family = 'all';
    $('families').innerHTML = '';
    for (const level of ['all', ...levels]) {
      const button = document.createElement('button');
      button.textContent = level === 'all' ? 'All marks' : level === 1 ? 'Whole units' : tool.family === 'fraction' ? `1/${level} marks` : level === 2 ? 'Half-unit marks' : 'Tenth-unit marks';
      button.className = 'family'; button.setAttribute('aria-pressed', String(family === String(level)));
      button.style.setProperty('--family-color', colors[level] || '#e0b95b');
      button.addEventListener('click', () => { family = String(level); renderExplorer(); }); $('families').appendChild(button);
    }
    $('explorerSvg').innerHTML = scaleSvg(d, 0, { selected: n, color: true, highlight: family });
    $('exploreValue').textContent = `${display(n, d)} ${tool.unit}`;
    $('explorePointer').setAttribute('aria-valuetext', `${display(n, d)} ${tool.unit}, ${n / d} ${tool.unit}`);
    $('exploreExplanation').innerHTML = equivalence(n, d, tool.unit);
    const landmark = family === 'all' ? 'Every tick is visible. The taller marks are landmarks, not larger gaps.' : `Highlighted: ${family === '1' ? 'whole-unit' : `1/${family}`} marks in their tick-height family. Other marks stay faintly visible.`;
    $('spacesLesson').textContent = `${d + 1} boundary lines enclose ${d} spaces. One small space = 1/${d} ${tool.unit}${tool.unit === 'cm' ? ' = 1 mm' : ''}. ${landmark}`;
  }
  function setPointer(value) {
    if (stage !== 'active' || !isPointJob()) return;
    pointer = Math.max(0, Math.min(q.d, Math.round(value))); updateZoom();
  }
  function bindScalePointer(element, svg, callback) {
    let dragging = false;
    function move(event) {
      const box = svg.getBoundingClientRect();
      callback(Math.max(0, Math.min(1, ((event.clientX - box.left) * 760 / box.width - 40) / 680)));
    }
    element.addEventListener('pointerdown', event => { dragging = true; element.setPointerCapture(event.pointerId); move(event); });
    element.addEventListener('pointermove', event => { if (dragging) move(event); });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(name, () => { dragging = false; });
  }
  bindScalePointer($('detailInteraction'), $('detail'), value => setPointer(value * q.d));
  bindScalePointer($('exploreScale'), $('explorerSvg'), value => { $('explorePointer').value = Math.round(value * M.tools[$('tool').value].d); renderExplorer(); });
  $('pointer').addEventListener('input', event => setPointer(+event.target.value));
  $('pointerBack').addEventListener('click', () => setPointer(pointer - 1));
  $('pointerForward').addEventListener('click', () => setPointer(pointer + 1));
  $('explorePointer').addEventListener('input', renderExplorer);
  $('extension').addEventListener('input', event => setExtension(event.target.value));
  $('extend').addEventListener('click', () => setExtension(8));
  $('retract').addEventListener('click', () => setExtension(0));
  $('alignment').addEventListener('input', event => setZero(+event.target.value / (q.d * 2)));
  function dragPart(id, readValue, update) {
    let dragging = false, initial = 0, from = 0;
    $(id).addEventListener('pointerdown', event => { dragging = true; initial = event.clientX; from = readValue(); $(id).setPointerCapture(event.pointerId); $('scene').classList.add('dragging'); });
    $(id).addEventListener('pointermove', event => { if (dragging) update(from + (event.clientX - initial) * 1040 / $('scene').getBoundingClientRect().width / 100); });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) $(id).addEventListener(name, () => { dragging = false; $('scene').classList.remove('dragging'); });
  }
  dragPart('case', () => extension, setExtension);
  dragPart('hook', () => zeroShift, value => setZero(Math.round(value * q.d * 2) / (q.d * 2)));
  $('hint').addEventListener('click', hint);
  $('fieldGuide').addEventListener('toggle', () => { if ($('fieldGuide').open && stage === 'active') markHelp(); });
  $('jobsTab').addEventListener('click', () => setActivity('jobs'));
  $('exploreTab').addEventListener('click', () => setActivity('explore'));
  $('practiceFromExplorer').addEventListener('click', () => { setActivity('jobs'); moveFocus('prompt'); });
  $('restart').addEventListener('click', () => startSet());
  $('fullSet').addEventListener('click', () => startSet());
  $('practiceWeak').addEventListener('click', () => {
    const weak = [...new Set(results.filter(r => !r.independent).map(r => r.type))];
    if (weak.length) startSet(weak.flatMap(type => [type, type]));
  });
  function settingsChanged() {
    const wasExploring = activity === 'explore';
    $('formatLabel').hidden = M.tools[$('tool').value].family !== 'fraction';
    $('explorePointer').value = M.tools[$('tool').value].d / 2;
    startSet(); if (wasExploring) setActivity('explore');
  }
  $('tool').addEventListener('change', settingsChanged);
  $('format').addEventListener('change', settingsChanged);
  startSet();
})();
