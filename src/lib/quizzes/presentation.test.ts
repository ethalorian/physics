import test from 'node:test'
import assert from 'node:assert/strict'
import {quizMathContent,quizQuestionStem} from './presentation'
test('renders TeX delimiters while leaving ordinary Markdown and dollar math intact',()=>{
 assert.equal(quizMathContent(String.raw`**Velocity** is \(v = \frac{\Delta x}{\Delta t}\).`),String.raw`**Velocity** is $v = \frac{\Delta x}{\Delta t}$.`)
 assert.equal(quizMathContent(String.raw`\[\vec F = m\vec a\]`),'\n\n$$\n\\vec F = m\\vec a\n$$\n\n')
 assert.equal(quizMathContent('$x=2$ and **bold**'), '$x=2$ and **bold**')
})
test('code examples stay literal',()=>{
 const value='`\\(literal\\)`\n\n```tex\n\\[literal\\]\n```\n\nActual: \\(x=2\\)'
 assert.equal(quizMathContent(value),'`\\(literal\\)`\n\n```tex\n\\[literal\\]\n```\n\nActual: $x=2$')
})
test('removes only an exact complete trailing copy of structured answer choices',()=>{
 const options=['$2 \\text{ m}$','**8 m**','0 m']
 const q={kind:'choice' as const,options,prompt:'Find displacement.\n\nA) $2 \\text{ m}$ B) **8 m** C) 0 m'}
 assert.equal(quizQuestionStem(q),'Find displacement.')
 assert.equal(quizQuestionStem({...q,prompt:q.prompt+' Explain why.'}),q.prompt+' Explain why.')
 assert.equal(quizQuestionStem({...q,options:['2 m','8 m','0 m']}),q.prompt)
 assert.equal(quizQuestionStem({...q,kind:'written'}),q.prompt)
 assert.equal(q.prompt,'Find displacement.\n\nA) $2 \\text{ m}$ B) **8 m** C) 0 m')
})
