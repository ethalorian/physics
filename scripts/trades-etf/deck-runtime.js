(() => {
  const stage = document.querySelector('deck-stage');
  const slides = Array.from(document.querySelectorAll('.slide'));
  if (!stage || !slides.length) return;
  let current = -1, notesWindow = null;
  const byId = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function resize() {
    const shell = document.querySelector('.stage-shell');
    stage.style.transform = `scale(${Math.min(shell.clientWidth / 1280, shell.clientHeight / 720)})`;
  }
  function notes() {
    if (!notesWindow || notesWindow.closed) return;
    notesWindow.document.body.innerHTML = `<main style="max-width:900px;margin:36px auto;padding:24px;font:22px/1.5 Arial"><p>ETF Unit ${escape(document.body.dataset.unit)} / Day ${escape(document.body.dataset.day)} / Slide ${current + 1}</p><h1>${escape(slides[current].dataset.title)}</h1><p>${escape(slides[current].dataset.speakerNotes || '')}</p><hr><p>Next: ${escape(slides[current + 1]?.dataset.title || 'End of lesson')}</p></main>`;
  }
  function show(index) {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    if (target === current) return;
    current = target;
    slides.forEach((slide, i) => { slide.classList.toggle('active', i === current); slide.setAttribute('aria-hidden', String(i !== current)); });
    const active=slides[current];
    active.querySelectorAll('.animated-drawing > g > *').forEach((part,i)=>{
      part.style.setProperty('--drawing-step',Math.min(i,24));
      part.classList.add('drawing-part');
    });
    active.classList.remove('draw-in');
    void active.offsetWidth;
    active.classList.add('draw-in');
    window.WorksheetMotion?.play(active);
    byId('slideSelect').value = String(current);
    byId('count').textContent = `${current + 1} / ${slides.length}`;
    byId('prev').disabled = current === 0;
    byId('next').disabled = current === slides.length - 1;
    history.replaceState(null, '', '#' + (current + 1));
    stage.dispatchEvent(new CustomEvent('slidechange', {bubbles:true, composed:true, detail:{index:current, total:slides.length}}));
    notes();
  }
  function navigate(index) {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    if (stage.hasAttribute('data-session-controlled')) stage.dispatchEvent(new CustomEvent('classroomnavigate', {bubbles:true, detail:{index:next}}));
    else show(next);
  }
  Object.defineProperties(stage, {index:{get:() => current}, length:{get:() => slides.length}});
  stage.goTo = index => { if (Number.isInteger(index) && index >= 0 && index < slides.length) show(index); };
  stage.next = () => navigate(current + 1);
  stage.prev = () => navigate(current - 1);
  byId('prev').onclick = stage.prev;
  byId('next').onclick = stage.next;
  byId('reset').onclick = () => navigate(0);
  byId('replay').onclick = () => { const active=slides[current];active.classList.remove('draw-in');void active.offsetWidth;active.classList.add('draw-in');window.WorksheetMotion?.play(active); };
  byId('slideSelect').onchange = event => navigate(Number(event.target.value));
  byId('notes').onclick = () => {
    notesWindow = window.open('', 'etfTeacherNotes', 'width=1000,height=720');
    if (notesWindow) { notesWindow.document.title = 'ETF teacher notes'; notes(); }
  };
  byId('fullscreen').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  document.addEventListener('keydown', event => {
    if (stage.hasAttribute('data-session-controlled') || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(event.target.tagName)) return;
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {event.preventDefault(); navigate(current + 1);}
    if (['ArrowLeft', 'PageUp'].includes(event.key)) {event.preventDefault(); navigate(current - 1);}
    if (event.key === 'Home') navigate(0);
    if (event.key === 'End') navigate(slides.length - 1);
  });
  window.addEventListener('hashchange', () => { if (!stage.hasAttribute('data-session-controlled')) show((parseInt(location.hash.slice(1)) || 1) - 1); });
  window.addEventListener('resize', resize);
  new MutationObserver(resize).observe(stage, {attributes:true, attributeFilter:['data-session-controlled']});
  resize(); show((parseInt(location.hash.slice(1)) || 1) - 1);
  window.deckAPI = {show, get current() { return current; }, count:slides.length};
})();
