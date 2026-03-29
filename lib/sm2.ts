/**
 * SM-2 Spaced Repetition Algorithm
 * TypeScript port of sm2_algorithm.py
 */

export const SM2_DEFAULTS = {
  ease: 2.5,
  minEase: 1.3,
  initialInterval: 1,
}

export interface SM2Card {
  easeFactor: number
  interval: number
  repetitions: number
}

export interface SM2Result {
  ease: number
  interval: number
  repetitions: number
  nextReview: Date
  message: string
}

/**
 * quality: 0–5
 * 0-2 = fail, 3-5 = pass
 */
export function calculateNextReview(quality: number, card: SM2Card): SM2Result {
  let { easeFactor, interval, repetitions } = card

  // Update ease factor
  let newEase = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEase < SM2_DEFAULTS.minEase) newEase = SM2_DEFAULTS.minEase

  let newInterval: number
  let newReps: number

  if (quality < 3) {
    newReps = 0
    newInterval = SM2_DEFAULTS.initialInterval
  } else {
    newReps = repetitions + 1
    if (newReps === 1) newInterval = 1
    else if (newReps === 2) newInterval = 6
    else newInterval = Math.round(interval * newEase)
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  let message: string
  if (quality < 3) message = `💔 Reset — next review in ${newInterval} day(s)`
  else if (newInterval === 1) message = '📚 Good! Review tomorrow'
  else if (newInterval <= 7) message = `✅ Nice! Review in ${newInterval} days`
  else message = `🎉 Excellent! Review in ${newInterval} days`

  return { ease: newEase, interval: newInterval, repetitions: newReps, nextReview, message }
}

/** Map boolean correct/incorrect to SM-2 quality */
export function boolToQuality(correct: boolean, wasHard = false): number {
  if (!correct) return 1
  if (wasHard) return 3
  return 5
}
