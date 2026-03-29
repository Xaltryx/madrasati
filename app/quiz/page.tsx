'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { checkArabicAnswer } from '@/lib/answer_matcher'

// ─── Types ────────────────────────────────────────────────────────────────────
interface VocabWord {
  id: number
  word: string
  meaning: string
  synonym: string
  antonym: string
  plural: string
  singular: string
  lesson_id: number
}

interface Question {
  vocabId: number
  word: string
  correct: string
  prompt: string
  type: QuestionType
}

interface FeedbackState {
  isCorrect: boolean
  msg: string
  correctAnswer: string
  variants: string[]
}

type QuizCount    = 10 | 20 | 'full' | 'custom'
type QuestionType = 'meaning' | 'synonym' | 'antonym' | 'plural' | 'singular'

// ─── Question type config ─────────────────────────────────────────────────────
const Q_CONFIG: Record<QuestionType, { prompt: (w: string) => string; badge: string; color: string }> = {
  meaning:  { prompt: w => `ما المراد بكلمة "${w}"؟`,       badge: '📖 المعنى',   color: '#2563eb' },
  synonym:  { prompt: w => `ما مرادف كلمة "${w}"؟`,         badge: '🔄 المرادف',  color: '#7c3aed' },
  antonym:  { prompt: w => `ما ضد كلمة "${w}"؟`,            badge: '⚡ المضاد',   color: '#be123c' },
  plural:   { prompt: w => `ما جمع كلمة "${w}"؟`,           badge: '📚 الجمع',    color: '#b45309' },
  singular: { prompt: w => `ما مفرد كلمة "${w}"؟`,          badge: '🔍 المفرد',   color: '#065f46' },
}

// ─── Build questions from vocab words ────────────────────────────────────────
function buildQuestions(words: VocabWord[], limit: number): Question[] {
  const all: Question[] = []
  for (const v of words) {
    const fields: { type: QuestionType; value: string }[] = [
      { type: 'meaning',  value: v.meaning?.trim()  || v.synonym?.trim() || '' },
      { type: 'synonym',  value: v.synonym?.trim()  || '' },
      { type: 'antonym',  value: v.antonym?.trim()  || '' },
      { type: 'plural',   value: v.plural?.trim()   || '' },
      { type: 'singular', value: v.singular?.trim() || '' },
    ]
    for (const f of fields) {
      if (!f.value) continue
      all.push({ vocabId: v.id, word: v.word, correct: f.value, prompt: Q_CONFIG[f.type].prompt(v.word), type: f.type })
    }
  }
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all.slice(0, limit)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuizPage() {
  const [phase, setPhase]                   = useState<'setup' | 'quiz' | 'results'>('setup')
  const [lessons, setLessons]               = useState<any[]>([])
  const [selectedLesson, setSelectedLesson] = useState<string>('all')
  const [questions, setQuestions]           = useState<Question[]>([])
  const [currentIdx, setCurrentIdx]         = useState(0)
  const [userAnswer, setUserAnswer]         = useState('')
  const [feedback, setFeedback]             = useState<FeedbackState | null>(null)
  const [loading, setLoading]               = useState(true)
  const [earnedXp, setEarnedXp]             = useState(0)
  const [correctCount, setCorrectCount]     = useState(0)
  const [startTime, setStartTime]           = useState<number>(0)
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([])
  const [isRedoMode, setIsRedoMode]         = useState(false)

  const [countMode, setCountMode]       = useState<QuizCount>(10)
  const [customCount, setCustomCount]   = useState<string>('15')
  const [maxAvailable, setMaxAvailable] = useState<number>(0)
  const [countError, setCountError]     = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Load lessons ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/lessons')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setLessons(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Available word count ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchCount = async () => {
      let url = '/api/vocabulary/random?limit=999'
      if (selectedLesson !== 'all') url += `&lesson_id=${selectedLesson}`
      try {
        const res  = await fetch(url)
        const data = await res.json()
        if (Array.isArray(data)) {
          let count = 0
          for (const v of data as VocabWord[]) {
            if (v.meaning?.trim() || v.synonym?.trim()) count++
            if (v.synonym?.trim())  count++
            if (v.antonym?.trim())  count++
            if (v.plural?.trim())   count++
            if (v.singular?.trim()) count++
          }
          setMaxAvailable(count)
        } else {
          setMaxAvailable(0)
        }
      } catch { setMaxAvailable(0) }
    }
    fetchCount()
  }, [selectedLesson])

  // ── Resolve limit ─────────────────────────────────────────────────────────
  const resolveLimit = useCallback((): number | null => {
    if (countMode === 'full') return maxAvailable
    if (countMode === 10)     return 10
    if (countMode === 20)     return 20
    const n = parseInt(customCount, 10)
    if (isNaN(n) || n < 1) { setCountError('أدخل عدداً صحيحاً أكبر من صفر'); return null }
    if (n > maxAvailable)   { setCountError(`أقصى عدد متاح هو ${maxAvailable} سؤال`); return null }
    setCountError('')
    return n
  }, [countMode, customCount, maxAvailable])

  // ── Start quiz ────────────────────────────────────────────────────────────
  const startQuiz = async () => {
    const limit = resolveLimit()
    if (!limit || maxAvailable === 0) { setCountError('لا توجد كلمات متاحة'); return }
    setLoading(true)
    try {
      let url = '/api/vocabulary/random?limit=999'
      if (selectedLesson !== 'all') url += `&lesson_id=${selectedLesson}`
      const res  = await fetch(url)
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        setCountError('لا توجد كلمات كافية. جرّب درساً آخر.')
        setLoading(false)
        return
      }
      const qs = buildQuestions(data as VocabWord[], limit)
      if (qs.length === 0) {
        setCountError('لا توجد حقول مكتملة لبناء أسئلة. أضف بيانات للكلمات أولاً.')
        setLoading(false)
        return
      }
      setQuestions(qs)
      setCurrentIdx(0)
      setEarnedXp(0)
      setCorrectCount(0)
      setWrongQuestions([])
      setIsRedoMode(false)
      setUserAnswer('')
      setFeedback(null)
      setStartTime(Date.now())
      setPhase('quiz')
    } catch {
      setCountError('فشل الاتصال بالسيرفر.')
    } finally {
      setLoading(false)
    }
  }

  // ── Redo wrong answers ────────────────────────────────────────────────────
  const startRedo = () => {
    // Shuffle wrong questions before redoing
    const shuffled = [...wrongQuestions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setQuestions(shuffled)
    setCurrentIdx(0)
    setEarnedXp(0)
    setCorrectCount(0)
    setWrongQuestions([])
    setIsRedoMode(true)
    setUserAnswer('')
    setFeedback(null)
    setStartTime(Date.now())
    setPhase('quiz')
  }

  // ── Check answer ──────────────────────────────────────────────────────────
  const handleAnswer = useCallback(async () => {
    if (!userAnswer.trim()) return
    const q = questions[currentIdx]
    const { correct, feedback: feedbackMsg, variants } = checkArabicAnswer(userAnswer, q.correct)
    if (correct) {
      setEarnedXp(prev => prev + 10)
      setCorrectCount(prev => prev + 1)
    } else {
      // Collect wrong questions for redo
      setWrongQuestions(prev => {
        const alreadyAdded = prev.some(wq => wq.vocabId === q.vocabId && wq.type === q.type)
        return alreadyAdded ? prev : [...prev, q]
      })
    }
    setFeedback({ isCorrect: correct, msg: feedbackMsg, correctAnswer: q.correct, variants })
  }, [userAnswer, questions, currentIdx])

  // ── Next question ─────────────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    setFeedback(null)
    setUserAnswer('')
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1)
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      // Save to DB — XP written via /api/quiz
      fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson !== 'all' ? Number(selectedLesson) : null,
          score: correctCount,
          total: questions.length,
          duration: Math.round((Date.now() - startTime) / 1000),
        }),
      }).catch(() => {})
      setPhase('results')
    }
  }, [currentIdx, questions.length, correctCount, startTime, selectedLesson])

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'quiz') return
      if (e.key === 'Enter') { e.preventDefault(); feedback ? nextQuestion() : handleAnswer() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, feedback, handleAnswer, nextQuestion])

  useEffect(() => {
    if (phase === 'quiz') setTimeout(() => inputRef.current?.focus(), 50)
  }, [phase, currentIdx])

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <p style={{ marginTop: 16, color: '#666', fontFamily: 'serif', direction: 'rtl' }}>جاري التحميل… 🚀</p>
    </div>
  )

  // ─── SETUP ────────────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div style={s.page}>
      <h1 style={s.pageTitle}>📝 اختبار الكلمات</h1>
      <div style={s.card}>
        <label style={s.label}>اختر الدرس</label>
        <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)} style={s.select}>
          <option value="all">كل الكلمات المتاحة</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        {maxAvailable > 0 && (
          <p style={s.availableHint}>✦ {maxAvailable} سؤال محتمل من هذا الدرس</p>
        )}

        <label style={{ ...s.label, marginTop: 22 }}>عدد الأسئلة</label>
        <div style={s.countGrid}>
          {([10, 20, 'full', 'custom'] as QuizCount[]).map(mode => (
            <button
              key={String(mode)}
              onClick={() => { setCountMode(mode); setCountError('') }}
              style={{ ...s.countBtn, ...(countMode === mode ? s.countBtnActive : {}) }}
            >
              {mode === 'full'   ? `الكل (${maxAvailable})` :
               mode === 'custom' ? 'مخصص ✏️' : `${mode} أسئلة`}
            </button>
          ))}
        </div>

        {countMode === 'custom' && (
          <input
            type="number" min={1} max={maxAvailable || 999}
            value={customCount}
            onChange={e => { setCustomCount(e.target.value); setCountError('') }}
            placeholder={`1 – ${maxAvailable}`}
            style={{ ...s.select, marginTop: 10 }}
          />
        )}

        {countError && <p style={s.errorText}>{countError}</p>}

        <div style={s.legendBox}>
          <p style={s.legendTitle}>أنواع الأسئلة في الاختبار:</p>
          <div style={s.legendGrid}>
            {(Object.entries(Q_CONFIG) as [QuestionType, typeof Q_CONFIG[QuestionType]][]).map(([type, cfg]) => (
              <span key={type} style={{ ...s.legendBadge, color: cfg.color, borderColor: cfg.color }}>
                {cfg.badge}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={maxAvailable === 0}
          style={{ ...s.primaryBtn, marginTop: 24, opacity: maxAvailable === 0 ? 0.5 : 1 }}
        >
          ابدأ التحدي ⚡
        </button>
      </div>
    </div>
  )

  // ─── QUIZ ─────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q        = questions[currentIdx]
    const cfg      = Q_CONFIG[q.type]
    const progress = (currentIdx / questions.length) * 100

    return (
      <div style={s.page}>
        <div style={s.quizHeader}>
          <span style={s.counter}>
            {isRedoMode && <span style={{ color: '#be123c', marginLeft: 4 }}>🔁 إعادة — </span>}
            السؤال {currentIdx + 1} / {questions.length}
          </span>
          <span style={s.xpBadge}>+{earnedXp} XP 🌟</span>
        </div>

        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progress}%`, background: isRedoMode ? 'linear-gradient(90deg, #be123c, #f97316)' : 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
        </div>

        <div style={s.card}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{ ...s.typeBadge, color: cfg.color, borderColor: cfg.color }}>
              {cfg.badge}
            </span>
          </div>

          <p style={s.prompt}>{q.prompt}</p>

          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            disabled={!!feedback}
            placeholder="اكتب إجابتك هنا…"
            style={{
              ...s.input,
              borderColor: feedback ? (feedback.isCorrect ? '#16a34a' : '#be123c') : '#111',
              background:  feedback ? (feedback.isCorrect ? '#f0fdf4' : '#fff1f2') : '#fff',
            }}
          />

          {feedback && (
            <div style={{
              ...s.feedbackBox,
              borderColor: feedback.isCorrect ? '#16a34a' : '#be123c',
              background:  feedback.isCorrect ? '#f0fdf4' : '#fff1f2',
            }}>
              <p style={{ ...s.feedbackMsg, color: feedback.isCorrect ? '#15803d' : '#be123c' }}>
                {feedback.msg.split('\n')[0]}
              </p>

              {!feedback.isCorrect && (
                <div style={s.correctAnswerBox}>
                  <span style={s.correctAnswerLabel}>الإجابة الصحيحة:</span>
                  {feedback.variants.length > 1 ? (
                    <ul style={s.variantList}>
                      {feedback.variants.map((v, i) => <li key={i} style={s.variantItem}>{v}</li>)}
                    </ul>
                  ) : (
                    <span style={s.correctAnswerText}>{feedback.correctAnswer}</span>
                  )}
                </div>
              )}

              {feedback.isCorrect && feedback.msg.includes('\n') && (
                <p style={s.extraAccepted}>{feedback.msg.split('\n').slice(1).join('\n')}</p>
              )}

              <button onClick={nextQuestion} style={s.nextBtn}>
                {currentIdx + 1 < questions.length ? 'السؤال التالي ⮕' : 'عرض النتائج 🏆'}
              </button>
            </div>
          )}

          {!feedback && (
            <button
              onClick={handleAnswer}
              disabled={!userAnswer.trim()}
              style={{ ...s.primaryBtn, marginTop: 20, opacity: userAnswer.trim() ? 1 : 0.5 }}
            >
              تحقق من الإجابة ✅
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#aaa', marginTop: 14 }}>
          اضغط Enter للتحقق أو الانتقال للسؤال التالي
        </p>
      </div>
    )
  }

  // ─── RESULTS ──────────────────────────────────────────────────────────────
  const pct        = Math.round((correctCount / questions.length) * 100)
  const emoji      = pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'
  const wrongCount = questions.length - correctCount

  return (
    <div style={s.page}>
      <div style={{ ...s.card, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 8 }}>{emoji}</div>
        <h2 style={{ fontWeight: 900, fontSize: '1.8rem', margin: '0 0 6px' }}>
          {isRedoMode ? 'انتهت جولة الإعادة!' : 'انتهى الاختبار!'}
        </h2>
        <p style={{ color: '#666', marginBottom: 20 }}>
          أجبت بشكل صحيح على {correctCount} من {questions.length} سؤال
        </p>

        <div style={s.scoreRing}>
          <span style={s.scoreRingText}>{pct}%</span>
        </div>

        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16a34a', margin: '20px 0 16px' }}>
          {earnedXp} XP مكتسبة 🌟
        </div>

        {/* Wrong answers summary */}
        {wrongCount > 0 && (
          <div style={s.wrongSummary}>
            <p style={s.wrongSummaryText}>
              ❌ {wrongCount} إجابة خاطئة
            </p>
            <button onClick={startRedo} style={s.redoBtn}>
              🔁 أعد تدريب الإجابات الخاطئة ({wrongCount})
            </button>
          </div>
        )}

        {wrongCount === 0 && (
          <p style={{ color: '#15803d', fontWeight: 700, marginBottom: 16 }}>
            🎉 لا توجد أخطاء! أداء مثالي!
          </p>
        )}

        <button onClick={() => window.location.href = '/leaderboard'} style={s.primaryBtn}>
          عرض ترتيبك 🏆
        </button>
        <button onClick={() => { setPhase('setup'); setCountError(''); setIsRedoMode(false) }} style={{ ...s.ghostBtn, marginTop: 12 }}>
          محاولة أخرى 🔄
        </button>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:        { maxWidth: 620, margin: '0 auto', padding: '32px 16px 60px', direction: 'rtl', fontFamily: 'Georgia, "Times New Roman", serif' },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' },
  pageTitle:   { fontWeight: 900, fontSize: '1.8rem', textAlign: 'center', marginBottom: 24 },
  card:        { background: '#fff', border: '3px solid #111', borderRadius: 16, boxShadow: '8px 8px 0 #111', padding: '2rem 1.75rem' },
  label:       { display: 'block', fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' },
  select:      { width: '100%', padding: '11px 14px', border: '2px solid #111', borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit', background: '#fafafa', cursor: 'pointer', boxSizing: 'border-box' },
  availableHint: { marginTop: 6, fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 },
  countGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  countBtn:    { padding: '10px 8px', border: '2px solid #ccc', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', background: '#f9f9f9' },
  countBtnActive: { border: '2.5px solid #2563eb', background: '#eff6ff', color: '#1d4ed8', boxShadow: '3px 3px 0 #2563eb' },
  errorText:   { color: '#be123c', fontSize: '0.85rem', fontWeight: 700, marginTop: 8 },
  legendBox:   { marginTop: 20, padding: '12px 14px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10 },
  legendTitle: { fontSize: '0.8rem', fontWeight: 700, color: '#555', marginBottom: 8, margin: '0 0 8px' },
  legendGrid:  { display: 'flex', flexWrap: 'wrap', gap: 6 },
  legendBadge: { fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1.5px solid', background: '#fff' },
  primaryBtn:  { display: 'block', width: '100%', padding: '14px', fontWeight: 800, fontSize: '1.05rem', background: '#2563eb', color: '#fff', border: '2.5px solid #111', borderRadius: 10, cursor: 'pointer', boxShadow: '4px 4px 0 #111', fontFamily: 'inherit', textAlign: 'center' },
  ghostBtn:    { display: 'block', width: '100%', padding: '12px', fontWeight: 700, fontSize: '1rem', background: 'transparent', border: '2px solid #ccc', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' },
  quizHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  counter:     { fontWeight: 700, color: '#555', background: '#f3f3f3', padding: '4px 12px', borderRadius: 99, border: '1.5px solid #ddd', fontSize: '0.9rem' },
  xpBadge:     { fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '4px 12px', borderRadius: 99, border: '1.5px solid #86efac', fontSize: '0.9rem' },
  progressTrack: { height: 8, background: '#eee', borderRadius: 99, overflow: 'hidden', marginBottom: 20 },
  progressFill:  { height: '100%', borderRadius: 99, transition: 'width 0.4s ease' },
  typeBadge:   { display: 'inline-block', fontSize: '0.85rem', fontWeight: 800, padding: '4px 14px', borderRadius: 99, border: '2px solid', background: '#fff' },
  prompt:      { fontSize: '1.35rem', fontWeight: 900, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 },
  input:       { width: '100%', padding: '14px', fontSize: '1.15rem', border: '2.5px solid #111', borderRadius: 10, textAlign: 'center', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s, background 0.2s', outline: 'none' },
  feedbackBox: { marginTop: 16, border: '2px solid', borderRadius: 12, padding: '16px' },
  feedbackMsg: { fontWeight: 900, fontSize: '1.1rem', marginBottom: 12, whiteSpace: 'pre-line' },
  correctAnswerBox:   { background: '#fff', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, textAlign: 'right' },
  correctAnswerLabel: { fontWeight: 700, fontSize: '0.85rem', color: '#be123c', display: 'block', marginBottom: 4 },
  correctAnswerText:  { fontWeight: 800, fontSize: '1.1rem', color: '#111' },
  variantList: { margin: '4px 0 0', padding: '0 16px', listStyle: 'disc' },
  variantItem: { fontWeight: 700, fontSize: '1rem', color: '#111', marginBottom: 2 },
  extraAccepted: { fontSize: '0.85rem', color: '#15803d', marginBottom: 12, whiteSpace: 'pre-line' },
  nextBtn:     { display: 'block', width: '100%', padding: '12px', fontWeight: 800, fontSize: '1rem', background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  spinner:     { width: 44, height: 44, border: '4px solid #e5e7eb', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  scoreRing:   { width: 110, height: 110, borderRadius: '50%', border: '6px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: '4px 4px 0 #111' },
  scoreRingText: { fontSize: '1.8rem', fontWeight: 900, color: '#2563eb' },
  wrongSummary: { background: '#fff1f2', border: '2px solid #fca5a5', borderRadius: 12, padding: '16px', marginBottom: 20 },
  wrongSummaryText: { fontWeight: 700, color: '#be123c', marginBottom: 10, fontSize: '1rem' },
  redoBtn:     { display: 'block', width: '100%', padding: '12px', fontWeight: 800, fontSize: '1rem', background: '#be123c', color: '#fff', border: '2.5px solid #111', borderRadius: 10, cursor: 'pointer', boxShadow: '4px 4px 0 #111', fontFamily: 'inherit', textAlign: 'center' },
}
