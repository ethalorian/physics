import test from 'node:test'
import assert from 'node:assert/strict'
import {renderToStaticMarkup} from 'react-dom/server'
import QuizContent from './QuizContent'
const render=(content:string,inline=false)=>renderToStaticMarkup(<QuizContent content={content} inline={inline}/>)
test('answer-guide Markdown and equations render as accessible math',()=>{
 const html=render(String.raw`**Displacement** is $x_f-x_i=5\text{ m}-3\text{ m}=2\text{ m}$.`)
 assert.match(html,/<strong>Displacement<\/strong>/)
 assert.match(html,/class="katex"/);assert.match(html,/<math /)
 assert.doesNotMatch(html,/katex-error/)
})
test('inline choices and display equations both typeset fractions and vectors',()=>{
 assert.match(render(String.raw`\(\frac{\Delta x}{\Delta t}\)`,true),/class="katex"/)
 assert.match(render(String.raw`\[\vec F = m\vec a\]`),/katex-display/)
})
test('tables, lists and literal code preserve their intended structure',()=>{
 const html=render('| t (s) | x (m) |\n| --- | --- |\n| 1 | 2 |\n\n- First\n- Second\n\n`$literal$`')
 assert.match(html,/<table>/);assert.match(html,/<ul>/);assert.match(html,/<code>\$literal\$<\/code>/)
})
test('rendering responses does not allow raw HTML or remote image requests',()=>{
 const html=render('<script>alert(1)</script>\n\n<img src="https://example.test/track">\n\n![image](https://example.test/image)\n\n[bad](javascript:alert%281%29)')
 assert.doesNotMatch(html,/<script|<img|src="https:|href="javascript:/)
})
test('unsupported math does not crash the quiz',()=>{
 assert.doesNotThrow(()=>render(String.raw`$\notARealCommand{x}$`))
})

test('supplied assignment figures render only with explicit permission',()=>{
 const content='![A supplied graph](/assignment-figures/robot-velocity-time.svg)';
 assert.doesNotMatch(render(content),/<img/);
 const allowed=renderToStaticMarkup(<QuizContent content={content} allowFigures/>);
 assert.match(allowed,/Open diagram at full size/);
 assert.match(allowed,/<a[^>]*href="\/assignment-figures\/robot-velocity-time.svg"/);
 assert.match(allowed,/<img[^>]*src="\/assignment-figures\/robot-velocity-time.svg"/);
 for(const src of ['https://example.test/x.svg','/private/x.svg','/assignment-figures/../x.svg']){
  assert.doesNotMatch(renderToStaticMarkup(<QuizContent content={`![x](${src})`} allowFigures/>),/<img/);
 }
})

test('authored questions emphasize complete givens and the requested task',()=>{
 const text='A car travels at 4 m/s for 6 s. How far west does it move? Calculate the change in velocity, then the acceleration.'
 const html=renderToStaticMarkup(<QuizContent content={text} questionEmphasis/>);
 for(const phrase of ['4 m/s','6 s','How far <em><u>west</u></em>','Calculate the change in velocity','the acceleration'])assert(html.includes(`<strong>${phrase}</strong>`),phrase);
 assert(!render(text).includes('<strong>'),'student responses stay in their authored format');
})

test('emphasis retains signs, powers and compound units without changing equations or links',()=>{
 const text=String.raw`−2 m/s²; 6.67 × 10^-11 N m²/kg². **How long**? $v_i = 3$; \`4 m/s\`; [Figure 2](/figures/2.svg).`;
 const html=renderToStaticMarkup(<QuizContent content={text} questionEmphasis/>);
 assert.match(html,/<strong>−2 m\/s²<\/strong>/);
 assert.match(html,/<strong>6.67 × 10\^-11 N m²\/kg²<\/strong>/);
 assert.match(html,/<strong>How long<\/strong>/);
 assert.doesNotMatch(html,/<strong><strong>|katex-error/);
 assert.match(html,/class="katex"/);
 assert.match(html,/<a href="\/figures\/2.svg">Figure 2<\/a>/);
})


test('compass words are italic and underlined inside prose and bold asks, with protected notation intact',()=>{
 const text='Move north at 4 m/s, then southwest and eastward. **How far west**? Use 5 N; eastbound. `north 4 m/s`; [west](/west). $F_{north}=5$';
 const html=renderToStaticMarkup(<QuizContent content={text} questionEmphasis/>);
 for(const word of ['north','southwest','eastward','eastbound'])assert(html.includes(`<em><u>${word}</u></em>`),word);
 assert.match(html,/<strong>How far <em><u>west<\/u><\/em><\/strong>/);
 assert.match(html,/<strong>5 N<\/strong>/);
 assert.match(html,/<code>north 4 m\/s<\/code>/);
 assert.match(html,/<a href="\/west">west<\/a>/);
 assert.doesNotMatch(html,/katex-error/);
 assert.doesNotMatch(render(text),/<u>/);
})
