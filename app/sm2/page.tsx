'use client'
import { useState, useEffect, useCallback } from 'react'

interface VocabCard {
  id: string | number
  word: string
  meaning: string
  [key: string]: any
}

type RatingOption = {
  quality: number
  label: string
  emoji: string
  bg: string
  color: string
}

const RATINGS: RatingOption[] = [
  { quality: 5, label: 'سهل جداً', emoji: '⭐', bg: '#d1fae5', color: '#065f46' },
  { quality: 3, label: 'جيد',      emoji: '👍', bg: '#fef9c3', color: '#713f12' },
  { quality: 2, label: 'بصعوبة',   emoji: '🤨', bg: '#ffedd5', color: '#9a3412' },
  { quality: 0, label: 'نسيتها',   emoji: '❌', bg: '#fee2e2', color: '#991b1b' },
]

export default function SmartReviewPage() {
  const [cards, setCards]           = useState<VocabCard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [rating, setRating]         = useState(false)   // submitting guard
  const [done, setDone]             = useState(false)

  // ─── Fetch due cards ────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('/api/sm2/due')
        const data = await res.json()

        if (!res.ok) {
          // Surface the real server error rather than getting stuck
          setError(data?.error ?? `خطأ ${res.status}: تعذّر تحميل البطاقات`)
          return
        }

        setCards(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Fetch /api/sm2/due failed:', err)
        setError('تعذّر الاتصال بالسيرفر. تحقق من الإنترنت وحاول مجدداً.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ─── Rate a card ─────────────────────────────────────────────────────────────
  const handleRate = useCallback(async (quality: number) => {
    if (rating) return        // prevent double-tap
    setRating(true)

    const card = cards[currentIdx]

    try {
      const res = await fetch('/api/sm2/update', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },   // ← was missing
        body:    JSON.stringify({ vocabId: card.id, quality }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('Update failed:', data?.error)
        // Non-blocking — we still advance so the session isn't broken
      }
    } catch (err) {
      console.error('Failed to update SM-2 card:', err)
    }

    setShowAnswer(false)
    setRating(false)

    const next = currentIdx + 1
    if (next < cards.length) {
      setCurrentIdx(next)
    } else {
      setDone(true)
    }
  }, [rating, cards, currentIdx])

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!showAnswer) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          setShowAnswer(true)
        }
        return
      }
      const map: Record<string, number> = { Digit1: 5, Digit2: 3, Digit3: 2, Digit4: 0 }
      if (map[e.code] !== undefined) handleRate(map[e.code])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showAnswer, handleRate])

  // ─── States ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={{ marginTop: 20, fontFamily: 'serif', color: '#555', direction: 'rtl' }}>
        جاري تحضير مراجعتك اليومية… 🧠
      </p>
    </div>
  )

  if (error) return (
    <div style={{ ...styles.center, direction: 'rtl' }}>
      <div style={styles.errorBox}>
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <h2 style={{ margin: '10px 0 6px', fontWeight: 900 }}>حدث خطأ</h2>
        <p style={{ color: '#555', marginBottom: 20 }}>{error}</p>
        <button style={styles.retryBtn} onClick={() => { setError(null); setLoading(true); window.location.reload() }}>
          إعادة المحاولة
        </button>
      </div>
    </div>
  )

  if (done || cards.length === 0) return (
    <div style={{ ...styles.center, direction: 'rtl' }}>
      <div style={styles.doneCard}>
        <div style={{ fontSize: '4rem', marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontWeight: 900, fontSize: '1.8rem', margin: '0 0 10px' }}>أحسنت!</h2>
        <p style={{ color: '#555', marginBottom: 28, lineHeight: 1.7 }}>
          {cards.length === 0
            ? 'لا توجد كلمات مستحقة للمراجعة اليوم. عد غداً!'
            : 'لقد أنهيت جميع مراجعات اليوم. عد غداً لمواصلة التحدي.'}
        </p>
        <a href="/" style={styles.homeBtn}>العودة للرئيسية →</a>
      </div>
    </div>
  )

  const currentCard = cards[currentIdx]
  const progress    = ((currentIdx) / cards.length) * 100

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🔄 المراجعة الذكية</h1>
        <span style={styles.counter}>{currentIdx + 1} / {cards.length}</span>
      </div>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Card */}
      <div style={styles.card}>
        <p style={styles.cardHint}>ما معنى الكلمة؟</p>
        <h2 style={styles.word}>{currentCard.word}</h2>

        {showAnswer ? (
          <div style={styles.answerSection}>
            <div style={styles.divider} />
            <p style={styles.meaning}>
              {currentCard.meaning || currentCard.synonym || '—'}
            </p>
            {currentCard.meaning && currentCard.synonym && (
              <p style={{ color: '#888', fontSize: '0.95rem', marginTop: -16, marginBottom: 20 }}>
                مرادف: {currentCard.synonym}
              </p>
            )}

            <p style={styles.rateLabel}>كيف كان مستوى تذكرك؟</p>
            <div style={styles.ratingGrid}>
              {RATINGS.map((r, i) => (
                <button
                  key={r.quality}
                  disabled={rating}
                  onClick={() => handleRate(r.quality)}
                  style={{
                    ...styles.ratingBtn,
                    background: r.bg,
                    color:      r.color,
                    opacity:    rating ? 0.6 : 1,
                  }}
                  title={`اختصار: ${i + 1}`}
                >
                  <span style={{ fontSize: '1.3rem' }}>{r.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.label}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>[{i + 1}]</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button style={styles.showBtn} onClick={() => setShowAnswer(true)}>
            إظهار الإجابة 👀
            <span style={styles.shortcutHint}>Space / Enter</span>
          </button>
        )}
      </div>

      <p style={styles.footer}>
        * نظام SM-2 للتكرار المتباعد — يضمن حفظ الكلمات في ذاكرتك طويلة المدى
      </p>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth:   600,
    margin:     '0 auto',
    padding:    '32px 16px 60px',
    direction:  'rtl',
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  center: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      '80vh',
    padding:        16,
  },
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   16,
  },
  title: {
    fontSize:   '1.5rem',
    fontWeight: 900,
    margin:     0,
  },
  counter: {
    fontWeight:  700,
    fontSize:    '0.95rem',
    color:       '#555',
    background:  '#f3f3f3',
    padding:     '4px 12px',
    borderRadius: 99,
    border:      '1.5px solid #ddd',
  },
  progressTrack: {
    height:       8,
    background:   '#eee',
    borderRadius: 99,
    overflow:     'hidden',
    marginBottom: 28,
  },
  progressFill: {
    height:           '100%',
    background:       'linear-gradient(90deg, #2563eb, #7c3aed)',
    borderRadius:     99,
    transition:       'width 0.4s ease',
  },
  card: {
    background:   '#fff',
    border:       '3px solid #111',
    borderRadius: 16,
    boxShadow:    '8px 8px 0 #111',
    padding:      '2.5rem 2rem',
    textAlign:    'center',
  },
  cardHint: {
    color:        '#999',
    fontSize:     '0.85rem',
    marginBottom: 8,
    margin:       '0 0 8px',
  },
  word: {
    fontSize:     '2.6rem',
    fontWeight:   900,
    margin:       '0 0 24px',
    letterSpacing: '-0.5px',
  },
  showBtn: {
    width:        '100%',
    padding:      '14px 0',
    fontSize:     '1.1rem',
    fontWeight:   700,
    background:   '#fbbf24',
    border:       '2.5px solid #111',
    borderRadius: 10,
    cursor:       'pointer',
    boxShadow:    '4px 4px 0 #111',
    display:      'flex',
    flexDirection: 'column',
    alignItems:   'center',
    gap:          4,
    transition:   'transform 0.1s, box-shadow 0.1s',
    fontFamily:   'inherit',
  },
  shortcutHint: {
    fontSize:  '0.7rem',
    opacity:   0.5,
    fontWeight: 400,
  },
  answerSection: {
    marginTop: 0,
  },
  divider: {
    borderTop:    '2px dashed #e5e7eb',
    marginBottom: 20,
  },
  meaning: {
    fontSize:     '1.5rem',
    fontWeight:   700,
    color:        '#2563eb',
    marginBottom: 28,
    margin:       '0 0 28px',
  },
  rateLabel: {
    fontWeight:   700,
    marginBottom: 14,
    margin:       '0 0 14px',
  },
  ratingGrid: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 10,
  },
  ratingBtn: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            4,
    padding:        '12px 8px',
    border:         '2px solid #111',
    borderRadius:   10,
    cursor:         'pointer',
    boxShadow:      '3px 3px 0 #111',
    transition:     'transform 0.1s, box-shadow 0.1s',
    fontFamily:     'inherit',
  },
  footer: {
    marginTop:  28,
    fontSize:   '0.75rem',
    color:      '#aaa',
    textAlign:  'center',
    lineHeight: 1.6,
  },
  spinner: {
    width:        44,
    height:       44,
    border:       '4px solid #e5e7eb',
    borderTop:    '4px solid #2563eb',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite',
  },
  errorBox: {
    background:   '#fff',
    border:       '3px solid #111',
    borderRadius: 16,
    boxShadow:    '8px 8px 0 #111',
    padding:      '2.5rem 2rem',
    textAlign:    'center',
    maxWidth:     400,
  },
  retryBtn: {
    padding:      '10px 24px',
    fontWeight:   700,
    background:   '#fee2e2',
    border:       '2px solid #111',
    borderRadius: 8,
    cursor:       'pointer',
    fontFamily:   'inherit',
  },
  doneCard: {
    background:   '#fff',
    border:       '3px solid #111',
    borderRadius: 16,
    boxShadow:    '8px 8px 0 #111',
    padding:      '3rem 2rem',
    textAlign:    'center',
    maxWidth:     400,
  },
  homeBtn: {
    display:        'inline-block',
    padding:        '12px 28px',
    fontWeight:     700,
    background:     '#2563eb',
    color:          '#fff',
    border:         '2px solid #111',
    borderRadius:   10,
    textDecoration: 'none',
    boxShadow:      '4px 4px 0 #111',
    fontFamily:     'inherit',
  },
}
