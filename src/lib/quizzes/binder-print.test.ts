import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { PDFDocument } from 'pdf-lib'
import { BINDER_READINGS } from '@/data/binder-reading-syllabus'
import { binderMaterials, binderSource, type BinderLesson } from '@/lib/binder-reading'
import { buildSyllabusDrafts } from '@/lib/reading-syllabus'
import { buildBinderQuizPdf, binderQuizFileName, quizPrintFont, quizPrintHeadingFont } from './binder-print'
import { studentQuiz } from './types'
import targets from '../../../scripts/fixtures/reading-syllabus-targets.json'

test('all 88 quiz packets contain the original duplex reference and Letter response sheets', async () => {
  const font = readFileSync('public' + quizPrintFont)
  const heading = readFileSync('public' + quizPrintHeadingFont)
  const files = new Set<string>()
  for (const step of BINDER_READINGS) {
    const source = binderSource(step.passage)!
    const course = { id: randomUUID(), name: 'Fixture', section: null, program: 'physics', track: source.edition }
    const drafts = buildSyllabusDrafts(step, [], course, targets, randomUUID)
    const lesson: BinderLesson = JSON.parse(readFileSync('public' + binderMaterials(source) + '.json', 'utf8'))
    const reference = readFileSync('public' + lesson.packet)
    const original = await PDFDocument.load(reference)
    for (const quiz of [drafts.readingQuiz, drafts.vocabularyQuiz]) {
      const name = binderQuizFileName(source, quiz)
      const bytes = await buildBinderQuizPdf(source, studentQuiz(quiz), reference, font, heading)
      assert.equal(Buffer.from(bytes.subarray(0, 5)).toString(), '%PDF-')
      const doc = await PDFDocument.load(bytes)
      assert.equal(doc.getPageCount(), quiz.kind === 'vocabulary' ? 4 : 3, name)
      assert(doc.getTitle()?.includes(quiz.title))
      doc.getPages().forEach((page, i) => {
        assert.deepEqual(page.getSize(), { width: 612, height: 792 }, name)
        if (i < 2) {
          // Compare the actual page drawing instructions in the two documents.
          const orig = original.getPage(i)
          assert.equal(String(page.node.Contents()), String(orig.node.Contents()))
          assert.equal(String(page.node.Resources()), String(orig.node.Resources()))
          assert.equal(String(doc.context.lookup(page.node.Contents())), String(original.context.lookup(orig.node.Contents())))
        }
      })
      files.add(name)
    }
  }
  assert.equal(files.size, 88)
})
