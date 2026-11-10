import { PDFDocument, grayscale, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { BinderSource } from '../binder-reading'
import { quizQuestionStem } from './presentation'
import type { Quiz } from './types'

type PaperQuiz = Pick<Quiz, 'title' | 'kind' | 'instructions' | 'questions'>
export const quizPrintHeadingFont = '/student-choice-pages/unit-1/original-1805385887d1/fonts/news600.ttf'
export const quizPrintFont = '/fonts/dejavu/DejaVuSans.ttf'

export function binderQuizFileName(source: BinderSource, quiz: Pick<Quiz, 'kind'>) {
  const kind = quiz.kind === 'vocabulary' ? 'vocabulary-quiz' : 'reading-check'
  return `unit-1-day-${String(source.day).padStart(2, '0')}-${source.edition}-${kind}.pdf`
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const measure = (s: string) => font.widthOfTextAtSize(s, size)
  return text.trim().split(/\r?\n+/).flatMap(paragraph => {
    const lines: string[] = []
    let line = ''
    for (const word of paragraph.trim().split(/\s+/)) {
      const combined = line ? line + ' ' + word : word
      if (measure(combined) <= width) { line = combined; continue }
      if (line) lines.push(line)
      line = ''
      for (const letter of word) {
        if (line && measure(line + letter) > width) { lines.push(line); line = '' }
        line += letter
      }
    }
    if (line) lines.push(line)
    return lines
  })
}

// Load the published pages directly to retain the original equations, diagrams,
// embedded fonts and punch margins. Only the response sheets are typeset here.
export async function buildBinderQuizPdf(source: BinderSource, quiz: PaperQuiz, packet: Uint8Array, fontBytes: Uint8Array, headingBytes: Uint8Array) {
  const pdf = await PDFDocument.load(packet)
  if (pdf.getPageCount() !== 2) throw Error('The daily notes and reading PDF must contain two pages.')
  pdf.registerFontkit(fontkit)
  const body = await pdf.embedFont(fontBytes, { subset: true })
  const bold = await pdf.embedFont(headingBytes, { subset: true })
  const kind = quiz.kind === 'vocabulary' ? 'Vocabulary quiz' : 'Reading check'
  const courseDay = `Unit 1 Day ${source.day}  ·  ${source.edition === 'cpa' ? 'CPA' : 'Honors'} Physics`
  const width = 510, bottom = 55, lineHeight = 16
  const sheets: PDFPage[] = []
  let page: PDFPage, x = 0, y = 0
  function nextSheet() {
    page = pdf.addPage([612, 792])
    sheets.push(page)
    x = sheets.length % 2 ? 66 : 36
    page.drawText(courseDay.toUpperCase(), { x, y: 747, font: bold, size: 10 })
    page.drawText(kind, { x, y: 714, font: bold, size: 28 })
    page.drawLine({ start: { x, y: 700 }, end: { x: x + width, y: 700 }, thickness: 1.3 })
    y = 677
  }
  function write(lines: string[], font: PDFFont, size: number, leading: number) {
    for (const line of lines) {
      if (y < bottom) nextSheet()
      page.drawText(line, { x, y, font, size })
      y -= leading
    }
  }

  nextSheet()
  // The standard title already prints the unit, day and quiz type in the header.
  // Preserve custom titles from teachers and avoid repeating a standard title.
  const topic = quiz.title.replace(/^Unit 1 Day \d+ · /, '').replace(/ · (Vocabulary check|Reading check)$/, '')
  write(wrap(topic, body, 13, width), body, 13, 18)
  y -= 10
  write(['Name ____________________________________     Date __________________'], body, 11, 23)
  write(wrap(quiz.instructions, body, 10.5, width), body, 10.5, 15)
  y -= 15

  for (const [i, question] of quiz.questions.entries()) {
    const stem = quizQuestionStem(question)
    const reference = /^((?:Section [A-E]|Daily reading|Apply the daily reading)[^\n]*?)(?: — |\n\s*\n)([\s\S]+)$/.exec(stem)
    const prompt = wrap(reference?.[2] ?? stem, body, 11.5, width)
    const options = question.kind === 'choice' ? (question.options ?? []).flatMap((value, n) =>
      wrap(`${String.fromCharCode(65 + n)}.  ${value}`, body, 11.5, width)) : []
    const heading = `Question ${i + 1}   ·   ${question.points} ${question.points === 1 ? 'point' : 'points'}`
    const label = reference ? wrap(reference[1], body, 10, width) : []
    const rules = question.kind === 'choice' ? 0 : 4
    const height = 19 + label.length * 15 + (prompt.length + options.length) * lineHeight + rules * 18
    if (y - height < bottom && y < 677) nextSheet()
    write([heading], bold, 11, 18)
    write(label, body, 10, 15)
    write(prompt, body, 11.5, lineHeight)
    write(options, body, 11.5, lineHeight)
    for (let n = 0; n < rules; n++) {
      if (y < bottom + 8) nextSheet()
      y -= 6
      page!.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.45, color: grayscale(.65) })
      y -= 12
    }
    y -= 17
  }

  sheets.forEach((sheet, i) => {
    const left = i % 2 ? 36 : 66
    sheet.drawText(`${kind}   ·   Response sheet ${i + 1} of ${sheets.length}`, {
      x: left, y: 30, font: bold, size: 9, color: grayscale(.32),
    })
  })
  pdf.setTitle(`${courseDay} · ${quiz.title}`)
  pdf.setSubject('Daily notes, reading and quiz response sheets')
  return pdf.save()
}
