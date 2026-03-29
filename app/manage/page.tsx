'use client'
import { useState, useEffect } from 'react'

type Tab = 'lessons' | 'vocabulary'

export default function ManagePage() {
  const [tab, setTab]               = useState<Tab>('lessons')
  const [subjects, setSubjects]     = useState<any[]>([])
  const [lessons, setLessons]       = useState<any[]>([])
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null)
  const [vocab, setVocab]           = useState<any[]>([])
  const [loading, setLoading]       = useState(false)
  const [message, setMessage]       = useState<{ text: string; ok: boolean } | null>(null)
  
  const [newLesson, setNewLesson]   = useState({ name: '', unit: '1', lesson_number: '1', subject_id: '' })
  const [newVocab, setNewVocab]     = useState({ word: '', synonym: '', meaning: '', antonym: '', plural: '', singular: '' })

  const flash = (text: string, ok = true) => { 
    setMessage({ text, ok }); 
    setTimeout(() => setMessage(null), 3000) 
  }

  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(setSubjects)
    fetch('/api/lessons').then(r => r.json()).then(setLessons)
  }, [])

  const addLesson = async () => {
    const res = await fetch('/api/lessons', {
      method: 'POST',
      body: JSON.stringify(newLesson)
    })
    if (res.ok) {
      flash('✅ تم إضافة الدرس بنجاح')
      setNewLesson({ name: '', unit: '1', lesson_number: '1', subject_id: '' })
      fetch('/api/lessons').then(r => r.json()).then(setLessons)
    }
  }

  const deleteVocab = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الكلمة؟')) return
    await fetch(`/api/vocabulary?id=${id}`, { method: 'DELETE' })
    setVocab(v => v.filter(i => i.id !== id))
    flash('🗑️ تم حذف الكلمة')
  }

  return (
    <div className="container" style={{ direction: 'rtl' }}>
      <h1 style={{ fontWeight: 900, marginBottom: '1.5rem' }}>📚 إدارة المحتوى التعليمي</h1>

      {/* التبويبات */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setTab('lessons')} 
          className={`btn ${tab === 'lessons' ? 'btn-blue' : 'btn-ghost'}`}
        >
          📖 الدروس
        </button>
        <button 
          onClick={() => setTab('vocabulary')} 
          className={`btn ${tab === 'vocabulary' ? 'btn-blue' : 'btn-ghost'}`}
        >
          🔤 الكلمات
        </button>
      </div>

      {message && (
        <div style={{ padding: '10px', background: message.ok ? '#dcfce7' : '#fee2e2', border: '2px solid #000', marginBottom: '15px' }}>
          {message.text}
        </div>
      )}

      {tab === 'lessons' ? (
        <div className="card" style={{ border: '3px solid #000' }}>
          <h3 style={{ marginBottom: '15px' }}>➕ إضافة درس جديد</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
            <input 
              placeholder="اسم الدرس" 
              value={newLesson.name} 
              onChange={e => setNewLesson({...newLesson, name: e.target.value})}
              style={{ padding: '10px', border: '2px solid #000' }}
            />
            <select 
              value={newLesson.subject_id} 
              onChange={e => setNewLesson({...newLesson, subject_id: e.target.value})}
              style={{ padding: '10px', border: '2px solid #000' }}
            >
              <option value="">اختر المادة...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={addLesson} className="btn btn-yellow">إضافة</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ border: '3px solid #000' }}>
          <h3 style={{ marginBottom: '15px' }}>🔍 إدارة الكلمات</h3>
          <select 
            onChange={(e) => {
              const id = Number(e.target.value)
              setSelectedLesson(id)
              fetch(`/api/vocabulary?lesson_id=${id}`).then(r => r.json()).then(setVocab)
            }}
            style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '2px solid #000' }}
          >
            <option>اختر درساً لعرض كلماته...</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.name} (وحدة {l.unit})</option>)}
          </select>

          <div className="vocab-list">
            {vocab.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                <div>
                  <strong>{v.word}</strong>: {v.meaning}
                </div>
                <button onClick={() => deleteVocab(v.id)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}>حذف 🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}