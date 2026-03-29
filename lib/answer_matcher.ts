/**
 * Arabic Answer Matcher — supports | and ; as variant separators
 */

export class ArabicNormalizer {
  normalize(text: string): string {
    if (!text) return ''
    text = text.replace(/[\u0617-\u061A\u064B-\u0652]/g, '')
    text = text.replace(/[أإآ]/g, 'ا')
    text = text.replace(/ؤ/g, 'و')
    text = text.replace(/ئ/g, 'ي')
    text = text.replace(/ة/g, 'ه')
    text = text.split(/\s+/).join(' ').trim().toLowerCase()
    return text
  }

  normalizeLight(text: string): string {
    if (!text) return ''
    return text.split(/\s+/).join(' ').trim().toLowerCase()
  }
}

export class AnswerMatcher {
  private fuzzyThreshold: number
  private normalizer: ArabicNormalizer

  constructor(fuzzyThreshold = 0.85) {
    this.fuzzyThreshold = fuzzyThreshold
    this.normalizer = new ArabicNormalizer()
  }

  /**
   * Extract variants — supports both | and ; separators
   * e.g. "الميسرة;المناسبة;المهيئة" → ["الميسرة", "المناسبة", "المهيئة"]
   */
  extractVariants(answerText: string): string[] {
    if (!answerText) return []
    return answerText
      .split(/[|;،,]/)          // split on pipe, semicolon, Arabic comma, comma
      .map(v => v.trim())
      .filter(Boolean)
  }

  splitCompound(text: string): string[] {
    if (!text) return []
    return text.split('و').map(p => p.trim()).filter(Boolean)
  }

  fuzzySimilarity(a: string, b: string): number {
    if (!a || !b) return 0
    const m = a.length, n = b.length
    if (m === 0 || n === 0) return 0
    const dp: number[][] = []
    for (let i = 0; i <= m; i++) {
      dp[i] = []
      for (let j = 0; j <= n; j++) {
        if (i === 0) dp[i][j] = j
        else if (j === 0) dp[i][j] = i
        else dp[i][j] = 0
      }
    }
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
    return 1 - dp[m][n] / Math.max(m, n)
  }

  checkSetMatch(userAnswer: string, correctAnswer: string): { match: boolean; type: string } {
    const un = this.normalizer.normalize(userAnswer)
    const cn = this.normalizer.normalize(correctAnswer)

    if (un === cn) return { match: true, type: 'exact' }

    const uParts = this.splitCompound(un)
    const cParts = this.splitCompound(cn)

    if (uParts.length > 1 || cParts.length > 1) {
      const uSorted = uParts.slice().sort().join('|')
      const cSorted = cParts.slice().sort().join('|')
      if (uSorted === cSorted) return { match: true, type: 'set_match' }
    }

    if (this.fuzzySimilarity(un, cn) >= this.fuzzyThreshold)
      return { match: true, type: 'fuzzy' }

    if (uParts.length === cParts.length && uParts.length > 1) {
      const allMatch = uParts.every(up =>
        cParts.some(cp => this.fuzzySimilarity(up, cp) >= this.fuzzyThreshold)
      )
      if (allMatch) return { match: true, type: 'fuzzy_set' }
    }

    return { match: false, type: 'no_match' }
  }

  /**
   * Check answer against all variants — any single match = correct
   * Returns which variant matched and the full list of variants
   */
  checkAnswer(userAnswer: string, correctAnswer: string): {
    correct: boolean
    type: string
    variant: string
    variants: string[]
    bestSimilarity: number
  } {
    const variants = this.extractVariants(correctAnswer)

    // Track best partial match for helpful feedback
    let bestSim = 0
    let bestVariant = variants[0] ?? correctAnswer

    for (const variant of variants) {
      const { match, type } = this.checkSetMatch(userAnswer, variant)
      if (match) return { correct: true, type, variant, variants, bestSimilarity: 1 }

      // Track closest miss
      const un = this.normalizer.normalize(userAnswer)
      const cn = this.normalizer.normalize(variant)
      const sim = this.fuzzySimilarity(un, cn)
      if (sim > bestSim) { bestSim = sim; bestVariant = variant }
    }

    return { correct: false, type: 'no_match', variant: bestVariant, variants, bestSimilarity: bestSim }
  }

  /**
   * Rich feedback:
   * - On correct: show which variant matched + other accepted answers
   * - On wrong: show closest variant + all accepted answers
   */
  getFeedback(
    correct: boolean,
    type: string,
    userAnswer: string,
    correctAnswer: string,
    matchedVariant?: string,
    allVariants?: string[]
  ): string {
    const variants = allVariants ?? this.extractVariants(correctAnswer)
    const others = matchedVariant
      ? variants.filter(v => v !== matchedVariant)
      : variants

    if (correct) {
      const msgs: Record<string, string> = {
        exact:     '✓ صحيح تماماً',
        set_match: '✓ صحيح (ترتيب مختلف)',
        fuzzy:     '✓ صحيح (خطأ إملائي بسيط)',
        fuzzy_set: '✓ صحيح (ترتيب مختلف + خطأ بسيط)',
      }
      const base = msgs[type] ?? '✓ صحيح'
      if (others.length > 0) {
        return `${base}\nإجابات مقبولة أيضاً: ${others.join(' ، ')}`
      }
      return base
    }

    // Wrong answer feedback
    const un  = this.normalizer.normalize(userAnswer)
    const cn  = this.normalizer.normalize(matchedVariant ?? variants[0] ?? correctAnswer)
    const sim = this.fuzzySimilarity(un, cn)

    const acceptedList = variants.length > 1
      ? `\nجميع الإجابات المقبولة: ${variants.join(' ، ')}`
      : `\nالإجابة الصحيحة: ${variants[0] ?? correctAnswer}`

    if (sim >= 0.7)
      return `✗ قريب جداً! (${Math.round(sim * 100)}% مطابقة)${acceptedList}`

    return `✗ خطأ${acceptedList}`
  }
}

export function checkArabicAnswer(user: string, correct: string, threshold = 0.85) {
  const matcher = new AnswerMatcher(threshold)
  const result  = matcher.checkAnswer(user, correct)
  const feedback = matcher.getFeedback(
    result.correct, result.type, user, correct,
    result.variant, result.variants
  )
  return { correct: result.correct, feedback, variants: result.variants }
}
