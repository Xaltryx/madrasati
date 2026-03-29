'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Stats {
  totalLessons: number
  totalVocab: number
  totalUsers: number
  totalSessions: number
  todayLogins: number
  newToday: number
  recentUsers: { username: string; created_at: string; role: string }[]
}

interface Lesson {
  id: number; name: string; unit: number; lesson_number: number
  subject_name: string; word_count: number
}

type Tab = 'overview' | 'lessons' | 'vocab' | 'users'

export default function AdminDashboard() {
  const [user, setUser]         = useState<any>(null)
  const [isAdmin, setIsAdmin]   = useState(false)
  const [stats, setStats]       = useState<Stats | null>(null)
  const [lessons, setLessons]   = useState<Lesson[]>([])
  const [tab, setTab]           = useState<Tab>('overview')
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState('')

  // Quick-add lesson state
  const [addLesson, setAddLesson] = useState({ name: '', unit: '1', lesson_number: '1', subject_id: '' })
  const [subjects, setSubjects]   = useState<any[]>([])
  const [saving, setSaving]       = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/auth'; return }
      const role = data.user.user_metadata?.role
      if (role !== 'admin') { window.location.href = '/'; return }
      setUser(data.user); setIsAdmin(true)
      loadAll()
    })
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const [adminRes, lessonsRes, subjectsRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/lessons'),
      fetch('/api/subjects'),
    ])
    const [statsData, lessonsData, subjectsData] = await Promise.all([
      adminRes.json(), lessonsRes.json(), subjectsRes.json(),
    ])
    if (!statsData.error) setStats(statsData)
    if (Array.isArray(lessonsData)) setLessons(lessonsData)
    if (Array.isArray(subjectsData)) setSubjects(subjectsData)
    setLoading(false)
  }

  const handleAddLesson = async () => {
    if (!addLesson.name || !addLesson.subject_id) { showToast('⚠️ يرجى تعبئة جميع الحقول'); return }
    setSaving(true)
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: addLesson.name, unit: +addLesson.unit, lesson_number: +addLesson.lesson_number, subject_id: +addLesson.subject_id }),
    })
    if (res.ok) {
      showToast('✅ تمت إضافة الدرس بنجاح!')
      setAddLesson({ name: '', unit: '1', lesson_number: '1', subject_id: '' })
      loadAll()
    } else showToast('❌ حدث خطأ أثناء الإضافة')
    setSaving(false)
  }

  const handleDeleteLesson = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return
    const res = await fetch(`/api/lessons?id=${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('🗑️ تم حذف الدرس'); loadAll() }
    else showToast('❌ خطأ في الحذف')
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '6rem', direction: 'rtl' }}>
      <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</div>
      <p style={{ fontWeight: 700, marginTop: '1rem' }}>جارٍ تحميل لوحة التحكم...</p>
    </div>
  )

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: '📊' },
    { id: 'lessons',  label: 'الدروس',    icon: '📚' },
    { id: 'users',    label: 'الطلاب',    icon: '👥' },
  ]

  return (
    <div style={{ direction: 'rtl' }}>
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="badge badge-coral" style={{ marginBottom: '.5rem' }}>🔐 لوحة المدير</div>
          <h1 className="page-title">لوحة التحكم</h1>
          <p style={{ color: '#6b7280', fontWeight: 600, fontSize: '.88rem', marginTop: '.25rem' }}>
            مرحباً، {user?.user_metadata?.username || 'المدير'}
          </p>
        </div>
        <button className="btn btn-white" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/auth' }}>
          🚪 تسجيل الخروج
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-blue' : 'btn-white'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────── */}
      {tab === 'overview' && stats && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { icon: '📚', label: 'إجمالي الدروس',    val: stats.totalLessons,                color: '#dbeafe'  },
              { icon: '📝', label: 'إجمالي المفردات',  val: stats.totalVocab,                  color: '#fde047'  },
              { icon: '👥', label: 'إجمالي الطلاب',    val: stats.totalUsers,                  color: '#86efac'  },
              { icon: '🎯', label: 'جلسات الاختبار',   val: stats.totalSessions,               color: '#fce7f3'  },
              { icon: '🔥', label: 'دخول اليوم',       val: stats.todayLogins,                 color: '#ffedd5'  },
              { icon: '✨', label: 'مسجلون اليوم',     val: stats.newToday,                    color: '#e0e7ff'  },
            ].map(({ icon, label, val, color }, i) => (
              <div key={label} className="card" style={{ background: color, textAlign: 'center', animationDelay: `${i * .05}s` }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '.25rem' }}>{icon}</div>
                <div className="stat-val" style={{ fontSize: '1.8rem', marginBottom: '.2rem' }}>{val}</div>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Today's activity */}
          {stats.recentUsers?.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-header">🕐 آخر التسجيلات</div>
              {stats.recentUsers.map((u, i) => (
                <div key={i} className="table-row" style={{ gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '.8rem', background: '#dbeafe' }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 700 }}>{u.username}</span>
                  </div>
                  <div className={`badge ${u.role === 'admin' ? 'badge-coral' : 'badge-mint'}`}>{u.role === 'admin' ? '👑 مدير' : '📚 طالب'}</div>
                  <span style={{ fontSize: '.78rem', color: '#9ca3af' }}>
                    {new Date(u.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Lessons Tab ──────────────────────────────────────────── */}
      {tab === 'lessons' && (
        <>
          {/* Add lesson form */}
          <div className="card" style={{ marginBottom: '1.5rem', background: '#f0fdf4' }}>
            <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: '1rem' }}>➕ إضافة درس جديد</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '.75rem' }}>
              <div>
                <label className="label">اسم الدرس</label>
                <input className="input" placeholder="مثال: الوحدة الأولى" value={addLesson.name}
                  onChange={e => setAddLesson(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">المادة</label>
                <select className="input" value={addLesson.subject_id}
                  onChange={e => setAddLesson(p => ({ ...p, subject_id: e.target.value }))}>
                  <option value="">-- اختر المادة --</option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">الوحدة</label>
                <input className="input" type="number" min="1" value={addLesson.unit}
                  onChange={e => setAddLesson(p => ({ ...p, unit: e.target.value }))} />
              </div>
              <div>
                <label className="label">رقم الدرس</label>
                <input className="input" type="number" min="1" value={addLesson.lesson_number}
                  onChange={e => setAddLesson(p => ({ ...p, lesson_number: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-mint" style={{ marginTop: '1rem' }} onClick={handleAddLesson} disabled={saving}>
              {saving ? '⏳ جارٍ الحفظ...' : '✅ حفظ الدرس'}
            </button>
          </div>

          {/* Lessons list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header">
              📚 جميع الدروس ({lessons.length})
            </div>
            {lessons.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontWeight: 600 }}>
                لا توجد دروس بعد. أضف أول درس!
              </div>
            ) : lessons.map((l) => (
              <div key={l.id} className="table-row" style={{ gridTemplateColumns: '1fr auto auto auto', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{l.name}</div>
                  <div style={{ fontSize: '.75rem', color: '#6b7280' }}>{l.subject_name} · وحدة {l.unit}</div>
                </div>
                <div className="badge badge-blue">{l.word_count ?? 0} كلمة</div>
                <a href={`/manage?lesson=${l.id}`} className="btn btn-white" style={{ padding: '.35rem .7rem', fontSize: '.8rem' }}>✏️ تعديل</a>
                <button className="btn btn-coral" style={{ padding: '.35rem .7rem', fontSize: '.8rem' }}
                  onClick={() => handleDeleteLesson(l.id)}>🗑️</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Users Tab ────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header">👥 قائمة الطلاب</div>
          {stats?.recentUsers?.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontWeight: 600 }}>
              لا يوجد مستخدمون مسجلون بعد.
            </div>
          ) : stats?.recentUsers?.map((u, i) => (
            <div key={i} className="table-row" style={{ gridTemplateColumns: 'auto 1fr auto auto', gap: '1rem', alignItems: 'center' }}>
              <div className="avatar" style={{ background: '#dbeafe', width: '36px', height: '36px', fontSize: '.8rem' }}>
                {u.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{u.username}</div>
                <div style={{ fontSize: '.73rem', color: '#9ca3af' }}>
                  انضم: {new Date(u.created_at).toLocaleDateString('ar-EG')}
                </div>
              </div>
              <div className={`badge ${u.role === 'admin' ? 'badge-coral' : 'badge-mint'}`}>
                {u.role === 'admin' ? '👑 مدير' : '📚 طالب'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
