// Navigation and authored display text only; no answers, grades or mastery writes.
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

// Translate authored text nodes in place. Never rebuild React-owned markup,
// touch input values, replace media, or reset the original slide/timer state.
(() => {
  const channel = 'physics-day-one-slides-v1';
  const parentOrigin = document.referrer ? new URL(document.referrer).origin : null;
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  let dictionary = Object.create(null);
  const original = new WeakMap();
  const attributes = new WeakMap();
  const allowedAttributes = ['alt', 'title', 'aria-label'];
  const observe = () => observer.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: allowedAttributes});
  function translate(value, record) {
    // A React update (e.g. Start → Pause) becomes the new English source.
    const source = record && value === record.rendered ? record.source : value;
    const key = normalize(source);
    const target = Object.hasOwn(dictionary, key) ? dictionary[key] : source.trim();
    const rendered = key ? source.replace(source.trim(), target) : source;
    return {source, rendered};
  }
  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement?.closest('section') || node.parentElement.closest('script,style,code,pre,math,textarea,input,[contenteditable]')) return;
      const value = translate(node.nodeValue, original.get(node));
      original.set(node, value);
      if (node.nodeValue !== value.rendered) node.nodeValue = value.rendered;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches('script,style,code,pre,math,textarea,input,[contenteditable]')) return;
    if (node.closest('section')) {
      const records = attributes.get(node) || {};
      for (const name of allowedAttributes) if (node.hasAttribute(name)) {
        const value = translate(node.getAttribute(name), records[name]);
        records[name] = value;
        if (node.getAttribute(name) !== value.rendered) node.setAttribute(name, value.rendered);
      }
      attributes.set(node, records);
    }
    for (const child of node.childNodes) visit(child);
  }
  const observer = new MutationObserver(records => {
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'childList') for (const node of record.addedNodes) visit(node);
      else visit(record.target);
    }
    observe();
  });
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== parentOrigin || event.data?.channel !== channel || event.data.type !== 'language') return;
    const {locale, map} = event.data;
    if (!['en', 'es', 'pt-BR'].includes(locale) || !map || typeof map !== 'object' || Array.isArray(map)) return;
    const entries = Object.entries(map);
    if (entries.length > 5000 || entries.some(([key, value]) => key.length > 30000 || typeof value !== 'string' || value.length > 30000)) return;
    dictionary = Object.assign(Object.create(null), locale === 'en' ? {} : map);
    document.documentElement.lang = locale;
    if (document.body) {
      observer.disconnect();
      visit(document.body);
      observe();
    }
  });
})();
