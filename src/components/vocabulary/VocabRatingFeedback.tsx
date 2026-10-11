export type VocabularyRating = { level: number; created_at: string }

export default function VocabRatingFeedback({ rating }: { rating?: VocabularyRating | null }) {
  if (!rating) return null
  return <p className="my-2 rounded-lg bg-secondary p-3 text-sm font-medium">Teacher vocabulary rating: {rating.level} · {['Not yet', 'Almost', 'Got it'][rating.level - 1]}<span className="block text-xs font-normal text-muted-foreground">Knowledge evidence · {new Date(rating.created_at).toLocaleDateString()}</span></p>
}
