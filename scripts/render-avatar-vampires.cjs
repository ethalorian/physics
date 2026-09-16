// Focused art review using the production composer and catalog.
// Run from the project root: node scripts/render-avatar-vampires.cjs
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const esbuild = require('esbuild'), React = require('react'), { renderToStaticMarkup } = require('react-dom/server'), sharp = require('sharp');
process.env.NODE_PATH = path.join(process.cwd(), 'node_modules');
require('node:module').Module._initPaths();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vampire-art-'));
const output = path.resolve('docs/avatar-vampire-verification');
fs.mkdirSync(output, { recursive: true });
esbuild.buildSync({ entryPoints: ['src/components/avatar/Avatar.tsx'], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(temp, 'avatar.cjs'), jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
const Avatar = require(path.join(temp, 'avatar.cjs')).default;
const items = JSON.parse(fs.readFileSync('src/data/avatar-catalog.json'));
const accessories = { ears: 'vampire-ears', mouth: 'vampire-fangs' };
const looks = [
  { label: 'Midnight vampire dress', traits: { skin: 'pale', face: 'heart', hair_style: 'bob', hair_color: 'black', eyes: 'big', eye_color: 'blue', brows: 'thin' }, equipped: { ...accessories, body: 'midnight-vampire-dress', pin: 'ruby-bat-pendant' } },
  { label: 'Dracula cape & waistcoat', traits: { skin: 'light', face: 'egg', hair_style: 'side_part', hair_color: 'black', brows: 'arched', eye_color: 'violet' }, equipped: { ...accessories, body: 'dracula-cape' } },
  { label: 'Night bat hoodie', traits: { skin: 'brown', face: 'round', hair_style: 'short', hair_color: 'purple', eyes: 'big', eye_color: 'hazel' }, equipped: { ...accessories, body: 'night-bat-hoodie' } },
];
let sequence = 0;
const render = (look, size, crop = 'full') => renderToStaticMarkup(React.createElement(Avatar, { ...look, items, size, crop }), { identifierPrefix: 'vampire-' + sequence++ });
const content = looks.map((look, index) => `<g transform="translate(${24 + index * 312} 78)"><rect width="296" height="356" rx="20" fill="#FFFFFF"/><g transform="translate(48 0)">${render(look, 200)}</g><text x="148" y="310" text-anchor="middle" font-family="Arial" font-size="17" font-weight="bold" fill="#30283F">${look.label.replaceAll('&', '&amp;')}</text><text x="148" y="335" text-anchor="middle" font-family="Arial" font-size="13" fill="#75687C">Fangs + pointed ears</text></g>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="462"><rect width="960" height="462" fill="#F0EAF3"/><text x="28" y="45" font-family="Arial" font-size="25" font-weight="bold" fill="#30283F">Vampire wardrobe</text><text x="932" y="44" text-anchor="end" font-family="Arial" font-size="14" fill="#75687C">Six new avatar items</text>${content}</svg>`;
const featureCases = [];
for (const skin of ['pale', 'light', 'tan', 'olive', 'brown', 'deep', 'dark']) for (const face of ['round', 'egg', 'square', 'heart']) featureCases.push({ traits: { skin, face, hair_style: 'bob', hair_color: 'black', mouth_width: 'wide' }, equipped: accessories });
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vampire avatar preview</title><style>body{margin:24px;background:#f0eaf3;color:#30283f;font:15px system-ui}h1{font-size:28px}.looks,.faces{display:flex;flex-wrap:wrap;gap:16px}article{padding:20px;border-radius:16px;background:white;text-align:center}h2{font-size:17px}.faces article{padding:12px}p{color:#75687c}</style><h1>Vampire wardrobe</h1><p>Fangs, pointed ears, three outfits, and a ruby bat pendant. Rendered with the classroom avatar composer.</p><div class="looks">${looks.map(look => `<article>${render(look, 200)}<h2>${look.label.replaceAll('&', '&amp;')}</h2></article>`).join('')}</div><h2>Face and skin fit</h2><div class="faces">${featureCases.map(look => `<article>${render(look, 110, 'head')}<p>${look.traits.skin} · ${look.traits.face}</p>${render(look, 40, 'head')}</article>`).join('')}</div></html>`;
(async () => {
  await sharp(Buffer.from(svg)).png().toFile(path.join(output, 'vampire-collection.png'));
  fs.writeFileSync(path.join(output, 'index.html'), html);
  console.log('Vampire preview:', output);
})().catch(error => { console.error(error); process.exitCode = 1; });
