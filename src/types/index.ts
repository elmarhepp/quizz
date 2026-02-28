export interface Player {
  id: number
  name: string
  score: number
  answers: boolean[]
  jokers: number
}

export interface Question {
  category: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  correct_answer: string
  incorrect_answers: string[]
  shuffledAnswers?: string[]
}

export interface QuizSettings {
  players: Player[]
  category: string
  categoryName: string
  difficulty: 'easy' | 'medium' | 'hard' | 'any'
  questionCount: number
}

export type GamePhase = 'setup' | 'playing' | 'result'
