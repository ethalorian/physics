const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const catalog = require('../src/data/pulse-catalog.json');
const output = '/* Generated from src/data/pulse-catalog.json by scripts/build-pulse-catalog.cjs. */\n' +
  '(function(root){const catalog=' + JSON.stringify(catalog) + ';if(typeof module==="object"&&module.exports)module.exports=catalog;else root.PulseCatalog=catalog;})(globalThis);\n';
const dest = path.join(root, 'public/games/pulse/catalog.js');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(dest, 'utf8') !== output) throw new Error('Pulse catalog is out of date');
} else fs.writeFileSync(dest, output);
