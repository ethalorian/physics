export const VOCAB_BOUNTY_GAMES = [
  { slug: 'matching', name: 'Matching' },
  { slug: 'concentration', name: 'Concentration' },
  { slug: 'hangman', name: 'Hangman' },
  { slug: 'crossword', name: 'Crossword' },
  { slug: 'quiz-bowl', name: 'Quiz Bowl' },
  { slug: 'word-shoot', name: 'Word Shoot' },
  { slug: 'letter-catch', name: 'Letter Catch' },
  { slug: 'balderdash', name: 'Balderdash' },
  { slug: 'duel', name: 'Vocabulary Duel' },
]

export const BOUNTY_KIND_LABELS: Record<string, string> = {
  'arcade-game': 'Specific arcade game', 'arcade-any': 'Any arcade game',
  'vocab-games': 'Vocabulary games', math: 'Math practice',
}

export function bountyPlayHref(kind: string, slug: string | null): string {
  if (kind === 'vocab-games') return slug ? `/vocabulary/${encodeURIComponent(slug)}` : '/vocabulary'
  if (kind === 'math') return '/dashboard/math-spine'
  return kind === 'arcade-game' && slug ? `/arcade/${encodeURIComponent(slug)}` : '/arcade'
}
