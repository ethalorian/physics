"use client"
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { VocabularyTerm } from '@/types/assignment'
import { 
  Heart, 
  Trophy, 
  RotateCcw, 
  Lightbulb, 
  CheckCircle, 
  XCircle,
  Skull,
  Target,
  Clock
} from 'lucide-react'

interface VocabularyHangmanGameProps {
  vocabularyTerms: VocabularyTerm[]
  onGameComplete?: (score: number, totalWords: number, timeSpent: number) => void
  difficulty?: 'easy' | 'medium' | 'hard'
  showDefinitions?: boolean
  maxWrongGuesses?: number
}

interface GameState {
  currentTerm: VocabularyTerm | null
  guessedLetters: Set<string>
  wrongGuesses: number
  gameStatus: 'playing' | 'won' | 'lost'
  score: number
  currentWordIndex: number
  startTime: number
  hintsUsed: number
}

const HANGMAN_STAGES = [
  '', // 0 wrong guesses
  '  ╭─────╮\n  │     │\n  │\n  │\n  │\n  │\n╶─┴─╴', // 1
  '  ╭─────╮\n  │     │\n  │     ●\n  │\n  │\n  │\n╶─┴─╴', // 2
  '  ╭─────╮\n  │     │\n  │     ●\n  │     │\n  │\n  │\n╶─┴─╴', // 3
  '  ╭─────╮\n  │     │\n  │     ●\n  │    ╱│\n  │\n  │\n╶─┴─╴', // 4
  '  ╭─────╮\n  │     │\n  │     ●\n  │    ╱│╲\n  │\n  │\n╶─┴─╴', // 5
  '  ╭─────╮\n  │     │\n  │     ●\n  │    ╱│╲\n  │    ╱\n  │\n╶─┴─╴', // 6
  '  ╭─────╮\n  │     │\n  │     ●\n  │    ╱│╲\n  │    ╱ ╲\n  │\n╶─┴─╴'  // 7 (game over)
]

export default function VocabularyHangmanGame({
  vocabularyTerms,
  onGameComplete,
  difficulty = 'medium',
  showDefinitions = true,
  maxWrongGuesses = 6
}: VocabularyHangmanGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    currentTerm: null,
    guessedLetters: new Set(),
    wrongGuesses: 0,
    gameStatus: 'playing',
    score: 0,
    currentWordIndex: 0,
    startTime: Date.now(),
    hintsUsed: 0
  })
  
  const [currentGuess, setCurrentGuess] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [gameWords, setGameWords] = useState<VocabularyTerm[]>([])

  // Initialize game with filtered vocabulary terms
  useEffect(() => {
    if (vocabularyTerms.length > 0) {
      // Filter by difficulty if specified
      let filteredTerms = vocabularyTerms
      
      // Only filter if difficulty is not medium, and include terms without difficulty
      if (difficulty === 'easy') {
        filteredTerms = vocabularyTerms.filter(term => 
          term.difficulty === 'easy' || !term.difficulty
        )
      } else if (difficulty === 'hard') {
        filteredTerms = vocabularyTerms.filter(term => 
          term.difficulty === 'hard' || !term.difficulty
        )
      }
      // For medium difficulty, use all terms (no filtering)
      
      // Shuffle and select terms for the game
      const shuffled = [...filteredTerms].sort(() => Math.random() - 0.5)
      const gameTerms = shuffled.slice(0, Math.min(10, shuffled.length)) // Max 10 words per game
      
      setGameWords(gameTerms)
      setGameState(prev => ({
        ...prev,
        currentTerm: gameTerms[0] || null,
        startTime: Date.now()
      }))
    }
  }, [vocabularyTerms, difficulty])

  const resetGame = useCallback(() => {
    // Apply same difficulty filtering as initialization
    let filteredTerms = vocabularyTerms
    
    if (difficulty === 'easy') {
      filteredTerms = vocabularyTerms.filter(term => 
        term.difficulty === 'easy' || !term.difficulty
      )
    } else if (difficulty === 'hard') {
      filteredTerms = vocabularyTerms.filter(term => 
        term.difficulty === 'hard' || !term.difficulty
      )
    }
    
    const shuffled = [...filteredTerms].sort(() => Math.random() - 0.5)
    const gameTerms = shuffled.slice(0, Math.min(10, shuffled.length))
    
    setGameWords(gameTerms)
    setGameState({
      currentTerm: gameTerms[0] || null,
      guessedLetters: new Set(),
      wrongGuesses: 0,
      gameStatus: 'playing',
      score: 0,
      currentWordIndex: 0,
      startTime: Date.now(),
      hintsUsed: 0
    })
    setCurrentGuess('')
    setShowHint(false)
  }, [vocabularyTerms, difficulty])

  // Get a helpful letter hint
  const getLetterHint = useCallback(() => {
    if (!gameState.currentTerm) return 'A'
    
    const word = gameState.currentTerm.term.toUpperCase()
    const unguessedLetters = word
      .split('')
      .filter(letter => letter.match(/[A-Z]/) && !gameState.guessedLetters.has(letter))
    
    if (unguessedLetters.length === 0) return 'A'
    
    // Prioritize vowels first, then common consonants
    const vowels = unguessedLetters.filter(letter => 'AEIOU'.includes(letter))
    const commonConsonants = unguessedLetters.filter(letter => 'RSTLNM'.includes(letter))
    
    if (vowels.length > 0) {
      return vowels[0]
    } else if (commonConsonants.length > 0) {
      return commonConsonants[0]
    } else {
      return unguessedLetters[0]
    }
  }, [gameState.currentTerm, gameState.guessedLetters])

  const makeGuess = useCallback((letter: string) => {
    if (!gameState.currentTerm || gameState.gameStatus !== 'playing') return
    
    const normalizedLetter = letter.toLowerCase()
    if (gameState.guessedLetters.has(normalizedLetter)) return

    const newGuessedLetters = new Set(gameState.guessedLetters)
    newGuessedLetters.add(normalizedLetter)

    const termLetters = gameState.currentTerm.term.toLowerCase().replace(/[^a-z]/g, '')
    const isCorrectGuess = termLetters.includes(normalizedLetter)
    
    setGameState(prev => {
      const newWrongGuesses = isCorrectGuess ? prev.wrongGuesses : prev.wrongGuesses + 1
      
      // Check if word is complete
      const wordComplete = termLetters.split('').every(letter => 
        newGuessedLetters.has(letter)
      )
      
      // Check if game is over
      const gameOver = newWrongGuesses >= maxWrongGuesses
      
      let newGameStatus = prev.gameStatus
      let newScore = prev.score
      let newWordIndex = prev.currentWordIndex
      let newCurrentTerm = prev.currentTerm
      
      if (wordComplete) {
        // Calculate score based on difficulty and hints used
        const baseScore = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10
        const hintPenalty = prev.hintsUsed * 5
        const wrongGuessPenalty = newWrongGuesses * 2
        const wordScore = Math.max(1, baseScore - hintPenalty - wrongGuessPenalty)
        
        newScore = prev.score + wordScore
        newWordIndex = prev.currentWordIndex + 1
        
        // Move to next word or end game
        if (newWordIndex >= gameWords.length) {
          newGameStatus = 'won'
        } else {
          newCurrentTerm = gameWords[newWordIndex]
          // Reset for next word but keep score
          return {
            ...prev,
            currentTerm: newCurrentTerm,
            guessedLetters: new Set(),
            wrongGuesses: 0,
            score: newScore,
            currentWordIndex: newWordIndex,
            hintsUsed: 0
          }
        }
      } else if (gameOver) {
        newGameStatus = 'lost'
      }
      
      return {
        ...prev,
        guessedLetters: newGuessedLetters,
        wrongGuesses: newWrongGuesses,
        gameStatus: newGameStatus,
        score: newScore,
        currentWordIndex: newWordIndex
      }
    })
  }, [gameState.currentTerm, gameState.guessedLetters, gameState.gameStatus, maxWrongGuesses, difficulty, gameWords])

  const nextWord = useCallback(() => {
    if (gameState.currentWordIndex + 1 >= gameWords.length) {
      setGameState(prev => ({ ...prev, gameStatus: 'won' }))
      return
    }
    
    setGameState(prev => ({
      ...prev,
      currentTerm: gameWords[prev.currentWordIndex + 1],
      guessedLetters: new Set(),
      wrongGuesses: 0,
      currentWordIndex: prev.currentWordIndex + 1,
      hintsUsed: 0
    }))
    setShowHint(false)
  }, [gameState.currentWordIndex, gameWords])

  const useHint = useCallback(() => {
    if (!gameState.currentTerm || showHint) return
    
    setShowHint(true)
    setGameState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }))
  }, [gameState.currentTerm, showHint])

  // Handle game completion
  useEffect(() => {
    if (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
      const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000)
      onGameComplete?.(gameState.score, gameWords.length, timeSpent)
    }
  }, [gameState.gameStatus, gameState.score, gameState.startTime, gameWords.length, onGameComplete])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState.gameStatus !== 'playing') return
      
      const letter = event.key.toLowerCase()
      if (letter.match(/[a-z]/) && letter.length === 1) {
        makeGuess(letter)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [makeGuess, gameState.gameStatus])

  const renderWord = () => {
    if (!gameState.currentTerm) return ''
    
    return gameState.currentTerm.term
      .split('')
      .map(char => {
        if (char === ' ') return ' '
        if (!/[a-zA-Z]/.test(char)) return char
        
        const letter = char.toLowerCase()
        return gameState.guessedLetters.has(letter) ? char : '_'
      })
      .join(' ')
  }

  const renderAlphabet = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')
    
    return (
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-13 gap-2">
        {alphabet.map(letter => {
          const isGuessed = gameState.guessedLetters.has(letter)
          const isCorrect = gameState.currentTerm?.term.toLowerCase().includes(letter)
          
          return (
            <Button
              key={letter}
              onClick={() => makeGuess(letter)}
              disabled={isGuessed || gameState.gameStatus !== 'playing'}
              variant={isGuessed ? (isCorrect ? "default" : "destructive") : "outline"}
              size="sm"
              className="h-10 w-10 p-0 font-mono font-bold text-sm"
            >
              {letter.toUpperCase()}
            </Button>
          )
        })}
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-300'
    if (score >= 60) return 'text-blue-600 dark:text-blue-300'
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-300'
    return 'text-red-600 dark:text-red-300'
  }

  if (gameWords.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Vocabulary Available</h3>
          <p className="text-muted-foreground text-center">
            Please select a vocabulary set with terms to play Hangman.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Physics Hangman
              </CardTitle>
              <CardDescription>
                Guess the physics terms - {gameWords.length} words total
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{gameState.score}</div>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{gameState.currentWordIndex + 1}/{gameWords.length}</div>
                <p className="text-xs text-muted-foreground">Progress</p>
              </div>
            </div>
          </div>
          <Progress value={(gameState.currentWordIndex / gameWords.length) * 100} className="h-2" />
        </CardHeader>
      </Card>

      {/* Game Status */}
      {gameState.gameStatus === 'won' && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-800 mb-2">Congratulations!</h3>
              <p className="text-green-700">
                You completed all {gameWords.length} words with a score of {gameState.score}!
              </p>
              <p className="text-sm text-green-600 mt-2">
                Time: {Math.floor((Date.now() - gameState.startTime) / 1000)}s
              </p>
              <Button onClick={resetGame} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {gameState.gameStatus === 'lost' && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Skull className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-800 mb-2">Game Over!</h3>
              <p className="text-red-700 mb-2">
                The word was: <span className="font-bold">{gameState.currentTerm?.term}</span>
              </p>
              <p className="text-sm text-red-600">
                Final Score: {gameState.score} • Words Completed: {gameState.currentWordIndex}/{gameWords.length}
              </p>
              <Button onClick={resetGame} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Game Area */}
      {gameState.gameStatus === 'playing' && gameState.currentTerm && (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Hangman Drawing & Word */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                <span>Guess the Word</span>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="font-bold">
                    {maxWrongGuesses - gameState.wrongGuesses}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Hangman Drawing */}
              <div className="flex justify-center">
                <pre className="text-xs sm:text-sm font-mono text-muted-foreground leading-tight overflow-hidden">
                  {HANGMAN_STAGES[gameState.wrongGuesses]}
                </pre>
              </div>

              {/* Word Display */}
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold tracking-wider text-primary mb-4 break-all">
                  {renderWord()}
                </div>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {gameState.currentTerm.category || 'Physics Term'}
                </Badge>
              </div>

              {/* Definition - Always Visible */}
              {showDefinitions && gameState.currentTerm?.definition && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm sm:text-base">Definition:</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 break-words">
                    {gameState.currentTerm.definition}
                  </p>
                </div>
              )}

              {/* Letter Hint */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Need help with letters?</h4>
                  {!showHint && (
                    <Button 
                      onClick={useHint} 
                      size="sm" 
                      variant="outline"
                      className="text-blue-600 border-blue-600"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Letter Hint (-5 pts)
                    </Button>
                  )}
                </div>
                {showHint ? (
                  <p className="text-sm text-muted-foreground p-3 bg-green-50 rounded-lg border border-green-200">
                    💡 Try the letter: <strong className="text-green-700">{getLetterHint()}</strong>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    Click &quot;Letter Hint&quot; to reveal a helpful letter
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Make Your Guess</CardTitle>
              <CardDescription>
                Click letters or use your keyboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Alphabet Grid */}
              {renderAlphabet()}

              {/* Letter Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Or type a letter:</label>
                <div className="flex gap-2">
                  <Input
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value.slice(-1).toLowerCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && currentGuess) {
                        makeGuess(currentGuess)
                        setCurrentGuess('')
                      }
                    }}
                    placeholder="Type a letter..."
                    className="flex-1"
                    maxLength={1}
                  />
                  <Button 
                    onClick={() => {
                      if (currentGuess) {
                        makeGuess(currentGuess)
                        setCurrentGuess('')
                      }
                    }}
                    disabled={!currentGuess || gameState.guessedLetters.has(currentGuess)}
                  >
                    Guess
                  </Button>
                </div>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {Array.from(gameState.guessedLetters).filter(letter =>
                      gameState.currentTerm?.term.toLowerCase().includes(letter)
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {gameState.wrongGuesses}
                  </div>
                  <p className="text-xs text-muted-foreground">Wrong</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={resetGame} variant="outline" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Game
                </Button>
                {gameState.currentWordIndex > 0 && (
                  <Button onClick={nextWord} variant="outline">
                    Skip Word
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wrong Guesses Display */}
      {gameState.wrongGuesses > 0 && gameState.gameStatus === 'playing' && (
        <Card className="border-red-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Wrong guesses:</span>
              <div className="flex gap-1">
                {Array.from(gameState.guessedLetters)
                  .filter(letter => !gameState.currentTerm?.term.toLowerCase().includes(letter))
                  .map(letter => (
                    <Badge key={letter} variant="destructive" className="text-xs">
                      {letter.toUpperCase()}
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-sm mb-2">How to Play:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Guess letters to reveal the physics term</li>
                <li>• Use hints to see the definition (-5 points)</li>
                <li>• You have {maxWrongGuesses} wrong guesses per word</li>
                <li>• Complete all words to win!</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Scoring:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Easy: 10 points per word</li>
                <li>• Medium: 20 points per word</li>
                <li>• Hard: 30 points per word</li>
                <li>• Hints and wrong guesses reduce score</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


