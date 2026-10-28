// Navigation only: this bridge cannot submit answers or award grades/mastery.
(() => {
  const channel = 'physics-day-one-slides-v1';
  const parentOrigin = document.referrer ? new URL(document.referrer).origin : null;
  const publish = (type, detail = {}) => {
    if (parentOrigin && window.parent !== window) window.parent.postMessage({channel, type, ...detail}, parentOrigin);
  };
  const report = () => {
    const stage = document.querySelector('deck-stage');
    if (stage?.length) publish('slide', {index: stage.index, total: stage.length});
  };
  document.addEventListener('slidechange', report);
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== parentOrigin || event.data?.channel !== channel) return;
    if (event.data.type === 'status') report();
    if (event.data.type === 'navigate' && Number.isInteger(event.data.index)) {
      const stage = document.querySelector('deck-stage');
      if (stage && event.data.index >= 0 && event.data.index < stage.length) stage.goTo(event.data.index);
    }
  });
  window.addEventListener('error', () => publish('error'));
  window.addEventListener('unhandledrejection', () => publish('error'));
})();
