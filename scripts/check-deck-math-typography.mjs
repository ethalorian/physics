import fs from 'node:fs';
import assert from 'node:assert/strict';
import {mathText,formatDeckMath,normalizeNotation} from '../src/data/deck-sources/worksheet-guided/math-typography.mjs';

for(const [source,want] of [
 ['g_Earth','g<sub>Earth</sub>'],['g_Moon','g<sub>Moon</sub>'],['Rₓ','R<sub>x</sub>'],['R_y','R<sub>y</sub>'],['vf','v<sub>f</sub>'],['Fnet','F<sub>net</sub>'],
 ['Fɢ','F<sub>g</sub>'],['aᶜ','a<sub>c</sub>'],['vᵧ₀','v<sub>y0</sub>'],['v_y0','v<sub>y0</sub>'],
 ['R1','R<sub>1</sub>'],['ΣFinward','ΣF<sub>inward</sub>'],['x_initial','x<sub>initial</sub>'],
 ['v_f²','v<sub>f</sub><sup>2</sup>'],['10⁻⁵','10<sup>-5</sup>'],['r^(-1/2)','r<sup>-1/2</sup>'],
 ['m₁v₁ᵢ','m<sub>1</sub>v<sub>1i</sub>'],['v₁f','v<sub>1f</sub>'],
]){assert.equal(mathText(source),'<span class="math-quantity">'+want+'</span>',source);assert.equal(normalizeNotation(normalizeNotation(source)),normalizeNotation(source),source+' normalization must be stable');}
assert.equal(mathText('A student waits at the origin for a cart.'),'A student waits at the origin for a cart.');
assert.equal(mathText('I think a student can explain this.'),'I think a student can explain this.');
assert.equal(mathText('W = Fd'),'<span class="math-quantity">W = Fd</span>');
assert.equal(mathText('Fr/m'),'<span class="math-quantity">Fr/m</span>');
assert.equal(mathText('P = Fv'),'<span class="math-quantity">P = Fv</span>');
assert.equal(mathText('mgΔh = GMm/r'),'<span class="math-quantity">mgΔh = GMm/r</span>');
assert.equal(mathText('F = mg sinθ'),'<span class="math-quantity">F = mg sinθ</span>');
assert.equal(mathText('position vs time'),'position vs time');
assert.equal(mathText('Fill in ____ and explain.'),'Fill in ____ and explain.');
assert.match(mathText('The acceleration a is constant.'),/acceleration <span class="math-quantity">a<\/span> is/);
assert.equal(mathText('Δy = vᵧ₀ t − ½gt²'),'<span class="math-quantity">Δy = v<sub>y0</sub> t − ½gt<sup>2</sup></span>');
assert.match(mathText('√[(3)² + (4)^2]'),/3\)<sup>2<\/sup> \+ \(4\)<sup>2<\/sup>/);
assert.equal(formatDeckMath('<p>Use v<sub>f</sub><super>2</super> = v_i² + 2aΔx.</p>'),'<p>Use <span class="math-quantity">v<sub>f</sub><sup>2</sup> = v<sub>i</sub><sup>2</sup> + 2aΔx</span>.</p>');
const figure='<svg aria-label="v_x"><path d="M1 2L3 4" data-motion="draw"/><text x="10">vₓ = 3 m/s</text></svg>';
const output=formatDeckMath(figure);assert.ok(output.includes('<path d="M1 2L3 4" data-motion="draw"/>'));assert.ok(output.includes('aria-label="v_x"'));assert.match(output,/<tspan class="math-quantity">v<tspan baseline-shift="sub" font-size="70%">x<\/tspan> = 3 m\/s<\/tspan>/);assert.ok(!output.includes('<span'));
const files=[...fs.readdirSync('resources/worksheet-decks/generated').map(f=>'resources/worksheet-decks/generated/'+f),...JSON.parse(fs.readFileSync('src/data/trades-etf-decks.json')).map(d=>'public'+d.src)];
let math=0,sub=0,sup=0;
for(const file of files){const html=fs.readFileSync(file,'utf8');assert.match(html,/class="math-quantity"/,file);const visible=html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,'');assert.ok(!/[\p{L}]_[\p{L}\d]|[_^]\{|[₀-₉ₓᵧᵢɢ]/u.test(visible),file+' raw source notation');math+=(html.match(/class="math-quantity"/g)||[]).length;sub+=(html.match(/<sub>|baseline-shift="sub"/g)||[]).length;sup+=(html.match(/<sup>|baseline-shift="super"/g)||[]).length;}
assert.equal(files.length,298);assert.ok(sub>0&&sup>0,'Semantic notation must remain present; counts change with the teaching sequence.');
console.log(`PASS ${files.length} decks: ${math} math runs, ${sub} subscripts, ${sup} superscripts; prose, blanks, geometry and animation hooks preserved.`);
