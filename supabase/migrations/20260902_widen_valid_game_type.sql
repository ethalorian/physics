-- letter-catch, balderdash, and duel scores were rejected by the CHECK
-- constraint (23514). Widen it to cover every game the app ships.
alter table public.vocabulary_game_scores drop constraint if exists valid_game_type;
alter table public.vocabulary_game_scores add constraint valid_game_type
  check (game_type = any (array[
    'hangman','crossword','matching','concentration','quiz-bowl',
    'word-shoot','equation-visualizer','letter-catch','balderdash','duel'
  ]::text[]));
