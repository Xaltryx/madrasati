'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, username, xp, role')
          .order('xp', { ascending: false })
          .limit(10)

        if (error) throw error
        setLeaders(data || [])
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaders()
  }, [supabase])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', direction: 'rtl', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontWeight: 900 }}>جاري جلب قائمة الأبطال... 🏆</h2>
      </div>
    )
  }

  return (
    <div style={{ direction: 'rtl', maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontWeight: 900, fontSize: '2.5rem', marginBottom: '10px' }}>🏆 لوحة الأبطال</h1>
        <p style={{ color: '#666' }}>أفضل 10 طلاب مجتهدين في المنصة</p>
      </header>

      <div style={{
        background: '#fff',
        border: '3px solid #000',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '8px 8px 0 #000'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '3px solid #000' }}>
            <tr>
              <th style={{ padding: '15px' }}>المركز</th>
              <th style={{ padding: '15px' }}>المستخدم</th>
              <th style={{ padding: '15px' }}>النقاط (XP)</th>
              <th style={{ padding: '15px' }}>المستوى</th>
            </tr>
          </thead>
          <tbody>
            {leaders.length > 0 ? (
              leaders.map((user, index) => (
                <tr key={user.id} style={{
                  borderBottom: '1px solid #eee',
                  background: index === 0 ? '#fffbeb' : 'none'
                }}>
                  <td style={{ padding: '15px', fontWeight: 900, fontSize: '1.2rem' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 800 }}>{user.username || 'طالب مجهول'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {user.role === 'admin' ? '⭐ مشرف' : '📖 طالب'}
                    </div>
                  </td>
                  <td style={{ padding: '15px', color: '#2563eb', fontWeight: 900 }}>
                    {user.xp?.toLocaleString() || 0}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      background: '#0f172a', color: '#fff', padding: '4px 10px',
                      borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700
                    }}>
                      مستوى {Math.floor((user.xp || 0) / 100) + 1}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', fontWeight: 700 }}>
                  لا يوجد متنافسون حالياً. كن الأول! 🚀
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
