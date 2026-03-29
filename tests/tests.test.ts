import { describe, it, expect } from 'vitest'
import { ArabicNormalizer, AnswerMatcher, checkArabicAnswer } from '@/lib/answer_matcher'
import {
  calculateNextReview,
  boolToQuality,
  SM2_DEFAULTS,
  type SM2Card,
} from '@/lib/sm2'

// ─────────────────────────────────────────────────────────────────────────────
// ArabicNormalizer
// ─────────────────────────────────────────────────────────────────────────────
describe('ArabicNormalizer', () => {
  const n = new ArabicNormalizer()

  it('يزيل التشكيل', () => {
    expect(n.normalize('كَتَبَ')).toBe('كتب')
  })

  it('يوحّد الألف بأشكالها', () => {
    expect(n.normalize('أحمد')).toBe('احمد')
    expect(n.normalize('إبراهيم')).toBe('ابراهيم')
    expect(n.normalize('آمن')).toBe('امن')
  })

  it('يحوّل ة إلى ه', () => {
    expect(n.normalize('مدرسة')).toBe('مدرسه')
  })

  it('يحوّل ؤ إلى و', () => {
    expect(n.normalize('يؤدي')).toBe('يودي')
  })

  it('يحوّل ئ إلى ي', () => {
    // ئ→ي AND ة→ه both apply
    expect(n.normalize('هيئة')).toBe('هييه')
  })

  it('يزيل المسافات الزائدة', () => {
    expect(n.normalize('كلمة   جميلة')).toBe('كلمه جميله')
  })

  it('يُرجع نصاً فارغاً للمدخل الفارغ', () => {
    expect(n.normalize('')).toBe('')
  })

  it('normalizeLight يزيل المسافات فقط', () => {
    expect(n.normalizeLight('  كلمة  ')).toBe('كلمة')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AnswerMatcher — extractVariants
// ─────────────────────────────────────────────────────────────────────────────
describe('AnswerMatcher.extractVariants', () => {
  const m = new AnswerMatcher()

  it('يفصل المتغيرات بـ |', () => {
    expect(m.extractVariants('كبير|ضخم|عملاق')).toEqual(['كبير', 'ضخم', 'عملاق'])
  })

  it('يفصل المتغيرات بـ ;', () => {
    expect(m.extractVariants('الميسرة;المناسبة;المهيئة')).toEqual(['الميسرة', 'المناسبة', 'المهيئة'])
  })

  it('يفصل المتغيرات بالفاصلة العربية ،', () => {
    expect(m.extractVariants('سريع،خفيف')).toEqual(['سريع', 'خفيف'])
  })

  it('يُرجع مصفوفة فارغة للنص الفارغ', () => {
    expect(m.extractVariants('')).toEqual([])
  })

  it('يُرجع متغيراً واحداً بدون فاصل', () => {
    expect(m.extractVariants('كلمة')).toEqual(['كلمة'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AnswerMatcher — fuzzySimilarity
// ─────────────────────────────────────────────────────────────────────────────
describe('AnswerMatcher.fuzzySimilarity', () => {
  const m = new AnswerMatcher()

  it('تطابق تام = 1.0', () => {
    expect(m.fuzzySimilarity('كتب', 'كتب')).toBe(1)
  })

  it('نصان مختلفان تماماً = أقل من 0.5', () => {
    expect(m.fuzzySimilarity('كتب', 'خضر')).toBeLessThan(0.5)
  })

  it('خطأ إملائي بسيط = تشابه عالٍ', () => {
    expect(m.fuzzySimilarity('مدرسة', 'مدرسه')).toBeGreaterThanOrEqual(0.8)
  })

  it('نص فارغ = 0', () => {
    expect(m.fuzzySimilarity('', 'كلمة')).toBe(0)
    expect(m.fuzzySimilarity('كلمة', '')).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AnswerMatcher — checkAnswer
// ─────────────────────────────────────────────────────────────────────────────
describe('AnswerMatcher.checkAnswer', () => {
  const m = new AnswerMatcher()

  it('إجابة صحيحة تماماً', () => {
    const r = m.checkAnswer('كبير', 'كبير')
    expect(r.correct).toBe(true)
    expect(r.type).toBe('exact')
  })

  it('إجابة خاطئة', () => {
    const r = m.checkAnswer('صغير', 'كبير')
    expect(r.correct).toBe(false)
  })

  it('يقبل أي متغير من المتغيرات المتعددة', () => {
    expect(m.checkAnswer('ضخم', 'كبير|ضخم|عملاق').correct).toBe(true)
    expect(m.checkAnswer('عملاق', 'كبير|ضخم|عملاق').correct).toBe(true)
    expect(m.checkAnswer('صغير', 'كبير|ضخم|عملاق').correct).toBe(false)
  })

  it('يتسامح مع ة/ه', () => {
    const r = m.checkAnswer('مدرسه', 'مدرسة')
    expect(r.correct).toBe(true)
  })

  it('يتسامح مع أ/ا', () => {
    const r = m.checkAnswer('احمد', 'أحمد')
    expect(r.correct).toBe(true)
  })

  it('يتسامح مع التشكيل', () => {
    const r = m.checkAnswer('كتب', 'كَتَبَ')
    expect(r.correct).toBe(true)
  })

  it('يُرجع قائمة المتغيرات الكاملة', () => {
    const r = m.checkAnswer('كبير', 'كبير|ضخم')
    expect(r.variants).toContain('كبير')
    expect(r.variants).toContain('ضخم')
  })

  it('تطابق مجموعة بترتيب مختلف', () => {
    const r = m.checkAnswer('جميل وكبير', 'كبير وجميل')
    expect(r.correct).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// checkArabicAnswer (public API)
// ─────────────────────────────────────────────────────────────────────────────
describe('checkArabicAnswer', () => {
  it('يُرجع correct: true للإجابة الصحيحة', () => {
    const { correct } = checkArabicAnswer('كبير', 'كبير')
    expect(correct).toBe(true)
  })

  it('يُرجع correct: false للإجابة الخاطئة', () => {
    const { correct } = checkArabicAnswer('صغير', 'كبير')
    expect(correct).toBe(false)
  })

  it('يُرجع feedback نصياً غير فارغ', () => {
    const { feedback } = checkArabicAnswer('كبير', 'كبير')
    expect(typeof feedback).toBe('string')
    expect(feedback.length).toBeGreaterThan(0)
  })

  it('feedback يحتوي على ✓ للإجابة الصحيحة', () => {
    const { feedback } = checkArabicAnswer('كبير', 'كبير')
    expect(feedback).toContain('✓')
  })

  it('feedback يحتوي على ✗ للإجابة الخاطئة', () => {
    const { feedback } = checkArabicAnswer('صغير', 'كبير')
    expect(feedback).toContain('✗')
  })

  it('يُرجع variants كمصفوفة', () => {
    const { variants } = checkArabicAnswer('كبير', 'كبير|ضخم')
    expect(Array.isArray(variants)).toBe(true)
    expect(variants.length).toBe(2)
  })

  it('يقبل المتغير الثاني من ; كإجابة صحيحة', () => {
    const { correct } = checkArabicAnswer('المناسبة', 'الميسرة;المناسبة;المهيئة')
    expect(correct).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SM-2: boolToQuality
// ─────────────────────────────────────────────────────────────────────────────
describe('boolToQuality', () => {
  it('إجابة صحيحة سهلة = 5', () => {
    expect(boolToQuality(true, false)).toBe(5)
  })

  it('إجابة صحيحة صعبة = 3', () => {
    expect(boolToQuality(true, true)).toBe(3)
  })

  it('إجابة خاطئة = 1', () => {
    expect(boolToQuality(false)).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SM-2: calculateNextReview
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateNextReview', () => {
  const freshCard: SM2Card = {
    easeFactor: SM2_DEFAULTS.ease,
    interval: SM2_DEFAULTS.initialInterval,
    repetitions: 0,
  }

  it('الإجابة الخاطئة تُعيد التكرارات إلى صفر', () => {
    const result = calculateNextReview(1, freshCard)
    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(SM2_DEFAULTS.initialInterval)
  })

  it('الإجابة الصحيحة الأولى تُعطي interval=1', () => {
    const result = calculateNextReview(5, freshCard)
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(1)
  })

  it('الإجابة الصحيحة الثانية تُعطي interval=6', () => {
    const card: SM2Card = { ...freshCard, repetitions: 1, interval: 1 }
    const result = calculateNextReview(5, card)
    expect(result.repetitions).toBe(2)
    expect(result.interval).toBe(6)
  })

  it('الإجابة الصحيحة الثالثة تُعطي interval أكبر من 6', () => {
    const card: SM2Card = { easeFactor: 2.5, interval: 6, repetitions: 2 }
    const result = calculateNextReview(5, card)
    expect(result.interval).toBeGreaterThan(6)
  })

  it('ease لا تنخفض أقل من minEase', () => {
    const result = calculateNextReview(0, freshCard)
    expect(result.ease).toBeGreaterThanOrEqual(SM2_DEFAULTS.minEase)
  })

  it('ease ترتفع عند الإجابة الممتازة', () => {
    const result = calculateNextReview(5, freshCard)
    expect(result.ease).toBeGreaterThanOrEqual(freshCard.easeFactor)
  })

  it('nextReview تاريخ مستقبلي', () => {
    const result = calculateNextReview(5, freshCard)
    expect(result.nextReview.getTime()).toBeGreaterThan(Date.now())
  })

  it('message نص غير فارغ', () => {
    const result = calculateNextReview(5, freshCard)
    expect(typeof result.message).toBe('string')
    expect(result.message.length).toBeGreaterThan(0)
  })

  it('quality=2 (فشل) يُعيد reset', () => {
    const result = calculateNextReview(2, { easeFactor: 2.5, interval: 10, repetitions: 5 })
    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(1)
  })

  it('quality=3 (نجاح بالحد الأدنى) لا يُعيد reset', () => {
    const result = calculateNextReview(3, freshCard)
    expect(result.repetitions).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Role Access Logic
// ─────────────────────────────────────────────────────────────────────────────
describe('نظام الصلاحيات', () => {
  function canAccessAdmin(role: string) { return role === 'admin' }
  function canAccessQuiz(role: string)  { return role === 'student' || role === 'admin' }
  function canManageWords(role: string) { return role === 'admin' }

  it('الطالب لا يدخل لوحة التحكم', () => {
    expect(canAccessAdmin('student')).toBe(false)
  })

  it('المدير يدخل لوحة التحكم', () => {
    expect(canAccessAdmin('admin')).toBe(true)
  })

  it('الطالب يدخل الاختبار', () => {
    expect(canAccessQuiz('student')).toBe(true)
  })

  it('المدير يدخل الاختبار', () => {
    expect(canAccessQuiz('admin')).toBe(true)
  })

  it('دور غير معروف لا يدخل أي صفحة محمية', () => {
    expect(canAccessAdmin('guest')).toBe(false)
    expect(canManageWords('guest')).toBe(false)
  })

  it('المدير فقط يدير الكلمات', () => {
    expect(canManageWords('admin')).toBe(true)
    expect(canManageWords('student')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// XP Calculation
// ─────────────────────────────────────────────────────────────────────────────
describe('حساب XP', () => {
  function calcXP(score: number) { return score * 10 }
  function calcLevel(xp: number) { return Math.floor(xp / 100) + 1 }

  it('10 إجابات صحيحة = 100 XP', () => {
    expect(calcXP(10)).toBe(100)
  })

  it('صفر إجابات صحيحة = صفر XP', () => {
    expect(calcXP(0)).toBe(0)
  })

  it('XP صحيح لعدد عشوائي', () => {
    expect(calcXP(7)).toBe(70)
  })

  it('المستوى 1 عند XP = 0', () => {
    expect(calcLevel(0)).toBe(1)
  })

  it('المستوى 2 عند XP = 100', () => {
    expect(calcLevel(100)).toBe(2)
  })

  it('المستوى 2 عند XP = 199', () => {
    expect(calcLevel(199)).toBe(2)
  })

  it('المستوى 3 عند XP = 200', () => {
    expect(calcLevel(200)).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard Sorting
// ─────────────────────────────────────────────────────────────────────────────
describe('ترتيب لوحة الأبطال', () => {
  const users = [
    { username: 'يوسف', xp: 50 },
    { username: 'h',    xp: 200 },
    { username: '11',   xp: 130 },
  ]

  const sorted = [...users].sort((a, b) => b.xp - a.xp)

  it('المستخدم ذو أعلى XP يكون أولاً', () => {
    expect(sorted[0].username).toBe('h')
  })

  it('الترتيب تنازلي', () => {
    expect(sorted[0].xp).toBeGreaterThanOrEqual(sorted[1].xp)
    expect(sorted[1].xp).toBeGreaterThanOrEqual(sorted[2].xp)
  })

  it('عدد المستخدمين لا يتغير بعد الترتيب', () => {
    expect(sorted.length).toBe(users.length)
  })

  it('المستوى يُحسب بشكل صحيح لكل مستخدم', () => {
    const withLevels = sorted.map(u => ({
      ...u,
      level: Math.floor(u.xp / 100) + 1,
    }))
    expect(withLevels[0].level).toBe(3) // 200 XP → مستوى 3
    expect(withLevels[1].level).toBe(2) // 130 XP → مستوى 2
    expect(withLevels[2].level).toBe(1) // 50 XP  → مستوى 1
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Quiz Score Calculations
// ─────────────────────────────────────────────────────────────────────────────
describe('حساب نتائج الاختبار', () => {
  function calcPercentage(score: number, total: number) {
    return Math.round((score / total) * 100)
  }

  function getEmoji(pct: number) {
    return pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'
  }

  it('10/10 = 100%', () => {
    expect(calcPercentage(10, 10)).toBe(100)
  })

  it('0/10 = 0%', () => {
    expect(calcPercentage(0, 10)).toBe(0)
  })

  it('7/10 = 70%', () => {
    expect(calcPercentage(7, 10)).toBe(70)
  })

  it('النتيجة 80%+ تُعطي 🏆', () => {
    expect(getEmoji(80)).toBe('🏆')
    expect(getEmoji(100)).toBe('🏆')
  })

  it('النتيجة 50-79% تُعطي 💪', () => {
    expect(getEmoji(50)).toBe('💪')
    expect(getEmoji(79)).toBe('💪')
  })

  it('النتيجة أقل من 50% تُعطي 📚', () => {
    expect(getEmoji(49)).toBe('📚')
    expect(getEmoji(0)).toBe('📚')
  })
})
