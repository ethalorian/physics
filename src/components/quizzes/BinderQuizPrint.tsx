'use client'

import { useEffect, useRef, useState } from 'react'
import { binderMaterials, type BinderLesson, type BinderSource } from '@/lib/binder-reading'
import type { Quiz } from '@/lib/quizzes/types'
import s from './Quiz.module.css'

async function readFile(path: string) {
  const res = await fetch(path)
  if (!res.ok) throw Error('The print file could not be loaded.')
  return res
}

export default function BinderQuizPrint({ source, quiz }: { source: BinderSource; quiz: Quiz }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<{ url: string; name: string } | null>(null)
  const request = useRef(0)
  const previousUrl = useRef('')
  useEffect(() => () => {
    request.current++
    URL.revokeObjectURL(previousUrl.current)
  }, [])

  async function download() {
    const id = ++request.current
    setBusy(true)
    setError('')
    try {
      const [print, lesson] = await Promise.all([
        import('@/lib/quizzes/binder-print'),
        readFile(binderMaterials(source) + '.json').then(r => r.json() as Promise<BinderLesson>),
      ])
      const [packet, font, heading] = await Promise.all([lesson.packet, print.quizPrintFont, print.quizPrintHeadingFont].map(async path =>
        new Uint8Array(await (await readFile(path)).arrayBuffer())))
      const bytes = await print.buildBinderQuizPdf(source, quiz, packet, font, heading)
      if (request.current !== id) return
      const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' }))
      const name = print.binderQuizFileName(source, quiz)
      URL.revokeObjectURL(previousUrl.current)
      previousUrl.current = url
      setFile({ url, name })
      const link = document.createElement('a')
      link.href = url
      link.download = name
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      if (request.current === id) setError('Could not prepare the quiz PDF. Please try again.')
    } finally {
      if (request.current === id) setBusy(false)
    }
  }

  return <div className={s.paperQuiz}>
    <button type="button" className={s.secondary} onClick={download} disabled={busy}>
      {busy ? 'Preparing PDF…' : 'Print quiz PDF'}
    </button>
    {file && <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${file.name}`}>Open PDF</a>}
    {error && <span role="alert">{error}</span>}
  </div>
}
