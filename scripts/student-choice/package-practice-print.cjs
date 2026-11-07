// Store only faithful print wrappers and original sections. The server combines a saved subset.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const root = path.resolve(__dirname, '../..'), catalog = JSON.parse(fs.readFileSync(root + '/src/data/student-choice-binder.json'));
const pages = {}, packets = {};
for (const packet of catalog) {
  let head;
  for (const option of packet.options) {
    const html = fs.readFileSync(root + '/public' + option.path, 'utf8');
    const section = html.match(/<section\b[\s\S]*?<\/section>/)?.[0];
    assert(section, option.path);
    pages[option.path] = section;
    if (!head) {
      head = html.slice(0, html.indexOf('<section'));
      if (!/<base\b/i.test(head)) head = head.replace('<head>', `<head><base href="${path.posix.dirname(option.path)}/">`);
    }
  }
  packets[packet.key + '@' + packet.version] = { head, paths: packet.options.map(o => o.path) };
}
fs.writeFileSync(root + '/src/data/student-choice-practice-print.json', JSON.stringify({ pages, packets }) + '\n');
console.log(`Packaged ${Object.keys(pages).length} original pages across ${Object.keys(packets).length} pinned day editions.`);
