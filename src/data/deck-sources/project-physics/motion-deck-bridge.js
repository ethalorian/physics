/** The motion tools' tabs expose the existing classroom deck contract. */
class MotionLessonStage extends HTMLElement {
  index = 0;
  get length() { return this.querySelectorAll(':scope > section').length; }
  connect(selectTab) {
    this.selectTab = selectTab;
    const hash = location.hash.match(/^#(\d+)$/);
    const index = hash ? Number(hash[1]) - 1 : this.index;
    this.goTo(index >= 0 && index < this.length ? index : 0);
  }
  goTo(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.length) return;
    this.index = index;
    this.selectTab?.(index);
    history.replaceState(null, '', `#${index + 1}`);
    this.dispatchEvent(new CustomEvent('slidechange', { bubbles: true, composed: true, detail: { index, total: this.length } }));
  }
  navigate(index) {
    if (this.hasAttribute('data-session-controlled')) {
      this.dispatchEvent(new CustomEvent('classroomnavigate', { bubbles: true, detail: { index } }));
    } else this.goTo(index);
  }
  next() { this.navigate(Math.min(this.length - 1, this.index + 1)); }
  prev() { this.navigate(Math.max(0, this.index - 1)); }
}
customElements.define('deck-stage', MotionLessonStage);
document.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea,select,button,a,[contenteditable="true"]')) return;
  const stage = document.querySelector('deck-stage');
  if (!stage || stage.hasAttribute('data-session-controlled')) return;
  if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); stage.next(); }
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); stage.prev(); }
});
window.addEventListener('hashchange', () => {
  const match = location.hash.match(/^#(\d+)$/);
  const stage = document.querySelector('deck-stage');
  if (match && stage && !stage.hasAttribute('data-session-controlled')) stage.goTo(Number(match[1]) - 1);
});
