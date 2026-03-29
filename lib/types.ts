export interface Subject {
  id: number
  name: string
}

export interface Lesson {
  id: number
  name: string
  unit: number
  lesson_number: number
  subject_id: number
  subject_name?: string
  word_count?: number
}

export interface Vocabulary {
  id: number
  word: string
  synonym: string
  meaning: string
  antonym: string
  plural: string
  singular: string
  lesson_id: number
}

export interface QuizQuestion {
  vocabId: number
  word: string
  questionType: 'synonym' | 'meaning' | 'antonym' | 'plural' | 'singular'
  questionText: string
  answer: string
  allChoices?: string[] // for MCQ mode
}

export type QuizMode = 'normal' | 'reverse' | 'mcq' | 'timed'

export interface QuizResult {
  question: QuizQuestion
  userAnswer: string
  correct: boolean
  feedback: string
}

export interface WordProgress {
  vocabulary_id: number
  times_correct: number
  times_incorrect: number
  mastery_level: number
}

export interface AnalyticsSummary {
  currentStreak: number
  longestStreak: number
  totalAnswered: number
  overallAccuracy: number
  weakestWords: WeakWord[]
  scoreTrend: ScoreTrendPoint[]
}

export interface WeakWord {
  word: string
  meaning: string
  accuracy: number
  total_attempts: number
  lesson: string
}

export interface ScoreTrendPoint {
  date: string
  accuracy: number
  total: number
}
