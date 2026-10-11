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
