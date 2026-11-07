const deck = document.querySelector('deck-stage');
const slides = [...deck.querySelectorAll('section')];
deck.length = slides.length;
deck.goTo = function (index) {
  if (!Number.isInteger(index) || !slides[index]) return;
  this.index = index;
  slides.forEach((slide, i) => { slide.hidden = i !== index; });
  document.dispatchEvent(new Event('slidechange'));
};
deck.goTo(0);
document.addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    deck.goTo(deck.index + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});
for (const button of deck.querySelectorAll('[data-reveal]')) {
  button.onclick = () => {
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    answer.hidden = !answer.hidden;
    button.setAttribute('aria-expanded', String(!answer.hidden));
    button.textContent = answer.hidden ? 'Show answer' : 'Hide answer';
  };
}
for (const controls of deck.querySelectorAll('[data-minutes]')) {
const clock = controls.querySelector('output');
const duration = Number(controls.dataset.minutes) * 60000;
let remaining = duration, end = null, tick = null;
function draw() {
  const seconds = Math.ceil(remaining / 1000);
  clock.value = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}
function pause() {
  if (end !== null) remaining = Math.max(0, end - Date.now());
  end = null;
  clearInterval(tick);
  tick = null;
  draw();
}
controls.querySelector('[data-start]').onclick = event => {
  if (end !== null) { pause(); event.target.textContent = 'Resume'; return; }
  if (!remaining) remaining = duration;
  end = Date.now() + remaining;
  event.target.textContent = 'Pause';
  tick = setInterval(() => {
    remaining = Math.max(0, end - Date.now());
    draw();
    if (!remaining) { pause(); controls.querySelector('[data-start]').textContent = 'Restart'; }
  }, 200);
};
controls.querySelector('[data-reset]').onclick = () => { pause(); remaining = duration; draw(); controls.querySelector('[data-start]').textContent = 'Start'; };
controls.querySelector('[data-add]').onclick = () => { remaining += 60000; if (end !== null) end += 60000; draw(); };
}
