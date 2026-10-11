import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import vm from 'node:vm'
import { createUnitsNotebook } from './interactive-notebook-authoring'
import { notebookAnswers, notebookAnswerChanges, notebookQuestions, UNITS_NOTEBOOK_SOURCE } from './interactive-notebook'
import { validateBlockDocument } from '@/data/block-registry'
import { isBlockComplete, paginateBlocks, type BlockDocument, type InlineQuestion } from '@/data/content-blocks'
import { filterDocumentForViewer } from './track-visibility'
import { checkedLessonResponse } from './lesson-response-validation'
import { editLessonDocument } from './lesson-editing'
import { evidenceContext } from './mastery-evidence'
import { connectNotebookFrame } from './notebook-frame'

test('notebook questions, choices and keys match the unchanged original export', () => {
  const source = fs.readFileSync('src/data/explainers/claude-source/' + UNITS_NOTEBOOK_SOURCE.file, 'utf8')
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'), UNITS_NOTEBOOK_SOURCE.sha256)
  assert.equal(fs.readFileSync('public' + UNITS_NOTEBOOK_SOURCE.src, 'utf8'), source)
  const original = vm.runInNewContext('(' + source.match(/const quizDefs = (\[[\s\S]*?\n    \]);/)![1] + ')', {}, { timeout: 1000 })
  const document = createUnitsNotebook('units-target'), questions = notebookQuestions(document)!
  assert.equal(questions.length, 5)
  questions.forEach((block, index) => {
    const q = block.question as InlineQuestion
    assert.equal(q.prompt, original[index].text)
    assert.equal(JSON.stringify(q.options?.map(option => option.text)), JSON.stringify(original[index].options))
    assert.equal(q.correctOptionId, 'ABCD'[original[index].correct])
  })
  assert.deepEqual(validateBlockDocument(document, true), [])
})
test('saving uses ordinary evidence questions and the server owns correctness', () => {
  const document = createUnitsNotebook('units-target'), questions = notebookQuestions(document)!
  const changes = notebookAnswerChanges(questions, {}, { 0: 0, 1: 2, 2: 12, 3: -1, 4: 'C', 999: 2 })
  assert.equal(changes.length, 2)
  const checked = checkedLessonResponse(questions[0], { ...changes[0].response, autoCheck: 'match' })
  assert.equal(checked.ok, true)
  if (checked.ok) assert.equal((checked.response as { autoCheck: string }).autoCheck, 'mismatch')
  assert.equal(isBlockComplete(questions[0], changes[0].response), true)
  assert.equal(isBlockComplete(questions[0], { optionId: 'unknown' }), false)
  assert.ok(evidenceContext(questions[0]).targets.includes('units-target'))
  assert.equal(paginateBlocks(document.blocks).filter(page => page.hasCapture).length, 6)
})
test('restore reads valid saved responses and newer drafts without inventing answers', () => {
  const questions = notebookQuestions(createUnitsNotebook())!
  const responses = { 'units-check-1': { response: { optionId: 'B' }, created_at: 'now' }, 'units-check-2': { response: { optionId: 'C' }, draft: true, created_at: 'later' }, 'units-check-3': { response: { optionId: 'AB' }, created_at: 'now' } }
  assert.deepEqual(notebookAnswers(questions, responses), { 0: 1, 1: 2 })
  assert.deepEqual(notebookAnswerChanges(questions, responses, { 0: 1, 1: 2 }), [])
})
test('filtered reader keeps ordinary answer-key stripping and fails closed on partial notebook mappings', () => {
  const document = createUnitsNotebook('units-target')
  const visible = filterDocumentForViewer(document, { role: 'student', track: 'cpa' })
  assert.ok(notebookQuestions(visible))
  assert.ok(!JSON.stringify(visible).includes('correctOptionId'))
  document.blocks[1].visibilityTrack = 'honors'
  assert.equal(notebookQuestions(filterDocumentForViewer(document, { role: 'student', track: 'cpa' })), null)
  assert.ok(validateBlockDocument(document).some(issue => /whole notebook/.test(issue.message)))
})
test('authoring cannot silently diverge from displayed prompts or source', () => {
  for (const mutate of [
    (d: BlockDocument) => { (d.blocks[1] as { question: InlineQuestion }).question.prompt = 'Different question' },
    (d: BlockDocument) => { d.interactiveNotebook!.questionBlockIds[0] = 'missing' },
    (d: BlockDocument) => { d.interactiveNotebook!.sourceHash = 'different' },
    (d: BlockDocument) => { d.blocks[1].gate = true },
  ]) {
    const document = createUnitsNotebook('units-target'); mutate(document)
    assert.ok(validateBlockDocument(document, true).length > 0)
    assert.equal(notebookQuestions(document), null)
  }
  assert.ok(validateBlockDocument({ ...createUnitsNotebook(), blocks: [null] }).length > 0)
  assert.ok(validateBlockDocument(createUnitsNotebook(), true).some(issue => /target/.test(issue.message)))
})
test('metadata survives editing and standard layout retains every evidence ID', () => {
  const document = createUnitsNotebook('units-target')
  const edited = editLessonDocument(document, { blocks: document.blocks, dayType: 'STANDARD' })
  assert.deepEqual(edited.interactiveNotebook, document.interactiveNotebook)
  delete edited.interactiveNotebook
  assert.deepEqual(edited.blocks.map(block => block.id), document.blocks.map(block => block.id))
  assert.deepEqual(validateBlockDocument(edited, true), [])
})

test('notebook bridge captures answers synchronously and allows revision after runtime prop refresh', () => {
  let tick = () => {}, answers: Record<string, number> = { 0: 0 }, writable = true, changed = 0
  class Logic {
    state: Record<string, unknown> = { answers: {} }
    props: Record<string, unknown> = { allowRetry: false }
    setState(patch: Record<string, unknown>) { this.state = { ...this.state, ...patch }; this.props = { allowRetry: false }; this.renderVals(); this.props = { allowRetry: false } }
    renderVals(): unknown { return this.props.allowRetry }
  }
  const logic = new Logic(), originalRender = Logic.prototype.renderVals, originalState = logic.setState
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { setInterval: (fn: () => void) => { tick = fn; return 1 }, clearInterval: () => {} } })
  const control = { disabled: false }
  const frame = { contentWindow: { __dcRootName: () => 'Notebook', __dcRegistry: { Notebook: { Logic, subs: new Set([() => logic.renderVals()]) } } }, contentDocument: { addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [control] } } as unknown as HTMLIFrameElement
  try {
    const dispose = connectNotebookFrame(frame, { read: () => answers, writable: () => writable, changed: value => { changed++; answers = value as Record<string, number> }, ready() {}, link() {} })
    tick(); tick()
    assert.deepEqual(logic.state.answers, { 0: 0 })
    assert.equal(changed, 0, 'restoring a saved answer must not write new work')
    logic.setState({ answers: { 0: 1 } })
    assert.equal(changed, 1, 'the outer Save/Submit action can immediately see this draft')
    assert.deepEqual(answers, { 0: 1 })
    assert.equal(logic.renderVals(), true, 'the runtime cannot reset revision permission')
    writable = false
    tick()
    assert.equal(control.disabled, true)
    logic.setState({ answers: { 0: 2 } })
    assert.deepEqual(logic.state.answers, { 0: 1 })
    assert.equal(changed, 1, 'locked and read-only snapshots cannot save')
    dispose()
    assert.equal(Logic.prototype.renderVals, originalRender)
    assert.equal(logic.setState, originalState)
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
