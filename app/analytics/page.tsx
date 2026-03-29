'use client'
import { useState, useEffect } from 'react'

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>جاري تحليل بياناتك... 📊</div>

  return (
    <div className="container" style={{ direction: 'rtl' }}>
      <h1 style={{ fontWeight: 900, marginBottom: '1.5rem' }}>📈 تقرير الأداء الدراسي</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ textAlign: 'center', border: '3px solid #000' }}>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>السلسلة الحالية</div>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>🔥 {data.currentStreak} يوم</div>
        </div>
        <div className="card" style={{ textAlign: 'center', border: '3px solid #000' }}>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>إجمالي الإجابات</div>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>✅ {data.totalAnswered}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', border: '3px solid #000' }}>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>دقة الإجابة</div>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>🎯 {data.overallAccuracy}%</div>
        </div>
      </div>

      <div className="card" style={{ border: '3px solid #000' }}>
        <h3 style={{ marginBottom: '15px' }}>⚠️ كلمات تحتاج لمراجعة (الأقل دقة)</h3>
        <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ padding: '10px' }}>الكلمة</th>
              <th style={{ padding: '10px' }}>المعنى</th>
              <th style={{ padding: '10px' }}>الدقة</th>
            </tr>
          </thead>
          <tbody>
            {data.weakestWords.map((w: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', fontWeight: 700 }}>{w.word}</td>
                <td style={{ padding: '10px' }}>{w.meaning}</td>
                <td style={{ padding: '10px', color: w.accuracy < 50 ? 'red' : 'orange' }}>{w.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}