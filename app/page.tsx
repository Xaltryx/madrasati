'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [word, setWord] = useState<any>(null)

  useEffect(() => {
    const seed = Math.floor(Date.now() / 86400000)
    fetch(`/api/vocabulary/random?seed=${seed}`)
      .then(r => r.json())
      .then(d => { if (d?.word) setWord(d) })
      .catch(() => {})
  }, [])

  const cards = [
    { href: '/quiz', label: 'الاختبار الذكي', sub: 'نظام كويز متطور', icon: '📝', color: '#00ff41' },
    { href: '/sm2', label: 'المراجعة (SM2)', sub: 'تكرار متباعد للحفظ', icon: '🔁', color: '#00ffe1' },
    { href: '/analytics', label: 'إحصائياتي', sub: 'تحليل الأداء البياني', icon: '📊', color: '#ffb300' },
    { href: '/leaderboard', label: 'قائمة الصدارة', sub: 'ترتيب الطلاب العالمي', icon: '🏆', color: '#ff003c' },
  ]

  return (
    <div style={{ direction: 'rtl' }}>
      {/* بطاقة كلمة اليوم */}
      {word && (
        <div className="wod-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>كلمة اليوم</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0a0a0a' }}>{word.word}</div>
            <div style={{ fontSize: '1.2rem', color: '#374151', marginTop: '0.5rem' }}>{word.meaning}</div>
          </div>
        </div>
      )}

      {/* شبكة الأزرار الرئيسية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              padding: '2rem',
              transition: 'transform 0.2s'
            }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>{card.icon}</span>
              <h3 style={{ color: '#0a0a0a', fontWeight: 900 }}>{card.label}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem' }}>{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <footer style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
        مدرستي v2.0 // جميع الحقوق محفوظة
      </footer>
    </div>
  )
}