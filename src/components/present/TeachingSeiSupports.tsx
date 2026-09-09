'use client'
import type { ContentBlock } from '@/data/content-blocks'
import MathMarkdown from '@/components/MathMarkdown'
import { pickFrame } from '@/lib/sei'

/** Only authored language assistance, never generated answers or answer keys. */
export default function TeachingSeiSupports({ block, enabled }: { block?: ContentBlock; enabled: boolean }) {
  if (!enabled || !block) return null
  const frame = pickFrame(block.sei?.frames ?? ('frames' in block ? block.frames : undefined), 1)?.text ?? ('patternFrame' in block ? block.patternFrame : undefined) ?? ('frame' in block ? block.frame : undefined)
  const words = block.sei?.wordBank ?? ('wordBank' in block ? block.wordBank : undefined) ?? ('comparatives' in block ? block.comparatives : undefined) ?? []
  const translations = Object.entries(block.sei?.prompt_l1 ?? {}).filter(([, text]) => text?.trim())
  if (!frame && !words.length && !translations.length) return null
  return <aside className="teach-sei-supports" aria-label="SEI supports">
    <strong>Language support</strong>
    {frame && <div><span>Sentence starter</span><MathMarkdown content={frame} /></div>}
    {words.length > 0 && <div><span>Word bank</span><p>{words.join(' · ')}</p></div>}
    {translations.map(([language, text]) => <div key={language} lang={language}><MathMarkdown content={text!} /></div>)}
  </aside>
}
