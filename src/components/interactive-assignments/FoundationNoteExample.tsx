'use client'

import examples from '@/data/foundations/binder-examples.json'
import { binderPreview } from '@/lib/binder-reading'
import { useFoundationLanguage } from './FoundationLanguage'

const labels = {
  en: { compare: 'Compare with your notes', section: 'Section', evidence: 'Use a sentence from the reading or a labeled feature in the notes to support your explanation.', open: 'Open the note section in the reading', day: 'Day' },
  es: { compare: 'Compara con tus apuntes', section: 'Sección', evidence: 'Apoya tu explicación con una frase de la lectura o un detalle rotulado de los apuntes.', open: 'Abrir la sección de apuntes en la lectura', day: 'Día' },
  'pt-BR': { compare: 'Compare com suas notas', section: 'Seção', evidence: 'Apoie sua explicação com uma frase da leitura ou um detalhe identificado nas notas.', open: 'Abrir a seção das notas na leitura', day: 'Dia' },
}

export default function FoundationNoteExample({ at, number }: { at: 'slide' | 'stop'; number: number }) {
  const { foundationKey, edition, locale } = useFoundationLanguage()
  if (!foundationKey || !edition) return null
  const example = examples[foundationKey]
  if (example[at] !== number) return null

  const label = labels[locale]
  const href = binderPreview({ edition, day: example.day }) + '?section=' + example.section
  return <details key={foundationKey + edition} className="mt-3">
    <summary className="cursor-pointer font-semibold">{label.compare} · {label.section} {example.section}</summary>
    <p className="my-2">{example[edition][locale]}</p>
    <p className="mb-2">{label.evidence}</p>
    <a className="underline" href={href} target="_blank" rel="noreferrer">{label.open} · {edition === 'cpa' ? 'CPA' : 'Honors'} · {label.day} {example.day} ↗</a>
  </details>
}
