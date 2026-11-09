import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { BINDER_READINGS } from '@/data/binder-reading-syllabus'
import { buildSyllabusDrafts } from './reading-syllabus'
import { validateReading } from './textbook-assignments'
import { validateQuiz } from './quizzes/validation'
import { binderMaterials, binderSource, type BinderLesson } from './binder-reading'
import { isInteractiveReading, isInteractiveSyllabusStep } from './reading-availability'
import targets from '../../scripts/fixtures/reading-syllabus-targets.json'
import cpa from '../../resources/student-choice/unit-1-readings/cpa.json'
import honors from '../../resources/student-choice/unit-1-readings/honors.json'
import checks from '../../resources/student-choice/daily-reader/checks.json'

test('every day prepares the correct source, two comprehension items, a new application, and its vocabulary quiz',()=>{
  assert.equal(BINDER_READINGS.length,44)
  const uniquePrompts=new Set<string>()
  const practicePrompts=new Set<string>()
  for(const step of BINDER_READINGS) {
    const source=binderSource(step.passage)!
    const course={id:randomUUID(),name:'Test class',section:null,program:'physics',track:source.edition}
    assert(isInteractiveSyllabusStep(step,course.track))
    assert(!isInteractiveSyllabusStep(step,course.track==='cpa'?'honors':'cpa'))
    const drafts=buildSyllabusDrafts(step,[],course,targets,randomUUID)
    assert(isInteractiveReading(validateReading(drafts.reading)))
    const reading=validateQuiz(drafts.readingQuiz), vocabulary=validateQuiz(drafts.vocabularyQuiz)
    const authored=checks.find(item=>item.edition===source.edition && item.day===source.day)!.practice
    assert.deepEqual(drafts.reading.questions.map(q=>[q.reference,q.prompt]),[
      ['Section C · Diagram',authored.diagram],
      ['Section D · Worked example',authored.workedExample],
    ])
    for(const {prompt} of drafts.reading.questions) {
      assert.doesNotMatch(prompt,/first physics decision|describe one labeled feature/i)
      assert(!practicePrompts.has(prompt))
      assert(!reading.questions.some(q=>q.prompt.endsWith(prompt)))
      practicePrompts.add(prompt)
    }
    assert.deepEqual(reading.questions.map(q=>q.prompt.split(' — ')[0]),['Daily reading','Section C · Diagram','Apply the daily reading'])
    for(const q of reading.questions){assert(q.guide && q.guide.length>30);assert(!uniquePrompts.has(q.prompt));uniquePrompts.add(q.prompt)}
    assert.equal(vocabulary.questions.length,step.words.length+1)
    assert.deepEqual(vocabulary.questions.slice(0,-1).map(q=>q.vocabulary?.[0]),step.words.map(w=>w.term))
    const path='public'+binderMaterials(source)
    const content:BinderLesson=JSON.parse(readFileSync(path+'.json','utf8'))
    const title = `Unit 1 Day ${source.day} · ${content.title}`
    assert.equal(step.title, title)
    assert.equal(drafts.reading.title, title)
    assert.equal(reading.title, title + ' · Reading check')
    assert.equal(vocabulary.title, title + ' · Vocabulary check')
    assert.deepEqual(content.paragraphs,(source.edition==='cpa'?cpa:honors)[source.day-1].paragraphs)
    assert.deepEqual(content.words,step.words)
    assert.equal(Object.keys(content.sections).join(''),'ABCDE')
    assert(existsSync('public'+content.packet)&&existsSync(path+'.webp'))
    assert.equal(drafts.reading.status,'draft')
    for(const q of reading.questions){assert(q.guide);assert(!JSON.stringify(content).includes(q.guide))}
  }
  assert.equal(practicePrompts.size,88)
})
