'use client'
import type { ContentBlock } from '@/data/content-blocks'
import { useAssignedTrade } from '@/components/lessons/TradeContext'
import { TRADE_LABELS } from '@/lib/vocational'
export default function BlockGuidance({ block }: { block: ContentBlock }) {
  const trade = useAssignedTrade()
  const connection = trade ? block.vocational?.[trade] : null
  if (!block.studentDirections?.length && !connection) return null
  return <div className="mb-4 space-y-3">
    {!!block.studentDirections?.length && <ol aria-label="What to do" className="list-decimal pl-6 space-y-2 text-base">{block.studentDirections.map((step,i)=><li key={i}>{step}</li>)}</ol>}
    {connection && trade && <aside className="rounded-xl border bg-muted/30 p-4" aria-label={TRADE_LABELS[trade] + ' connection'}><p className="font-semibold mb-2">{TRADE_LABELS[trade]} · Use this in your trade</p>{connection.visual && <img src={connection.visual.src} alt={connection.visual.alt} className="w-full max-w-2xl rounded-lg mb-3" />}<ul className="list-disc pl-5 space-y-2">{connection.directions.map((step,i)=><li key={i}>{step}</li>)}</ul></aside>}
  </div>
}
