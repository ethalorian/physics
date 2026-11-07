const {parseFragment} = require('parse5');
const {splitForceLabels} = require('../../src/lib/force-notation.cjs');

// Keep the original text node available to the deck's translation bridge.
// The shadow presents its current translation without changing React's children.
function registerForceNotation(split) {
  class FoundationForceText extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.observer = new MutationObserver(() => this.render());
    }
    connectedCallback() {
      this.observer.observe(this, {childList: true, characterData: true, subtree: true});
      this.render();
    }
    disconnectedCallback() {
      this.observer.disconnect();
    }
    render() {
      const output = document.createDocumentFragment();
      split(this.textContent).forEach((part, index) => {
        if (index % 2 === 0) output.append(part);
        else {
          const sub = document.createElement('sub');
          sub.textContent = part;
          output.append('F', sub);
        }
      });
      this.shadowRoot.replaceChildren(output);
    }
  }
  customElements.define('foundation-force-text', FoundationForceText);
}

module.exports = function formatDeckForces(html) {
  let used = false;
  const deck = html.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g, section => {
    if (!section.includes('F_')) return section;
    const offsets = [];
    function visit(node) {
      if (['svg', 'math', 'code', 'pre', 'script', 'style', 'textarea'].includes(node.tagName)) return;
      if (node.nodeName === '#text' && splitForceLabels(node.value).length > 1) {
        offsets.push(node.sourceCodeLocation);
      }
      for (const child of node.childNodes || []) visit(child);
    }
    visit(parseFragment(section, {sourceCodeLocationInfo: true}));
    for (const {startOffset, endOffset} of offsets.reverse()) {
      used = true;
      section = section.slice(0, startOffset) + '<foundation-force-text>' +
        section.slice(startOffset, endOffset) + '</foundation-force-text>' + section.slice(endOffset);
    }
    return section;
  });
  if (!used) return deck;
  const script = '<script>(' + registerForceNotation.toString() + ')(' + splitForceLabels.toString() + ');</script>';
  return deck.replace('</head>', () => script + '</head>');
};
