'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور')
      return
    }

    setError('')
    setLoading(true)

    const encodedName = btoa(encodeURIComponent(username.trim())).replace(/=/g, '')
    const internalEmail = `${encodedName}@madrasti.com`

    try {
      if (mode === 'register') {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: internalEmail,
          password: password,
          options: { 
            data: { 
              username: username.trim(), 
              role: 'student' 
            } 
          }
        })
        if (signUpErr) throw signUpErr
        
        alert('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول بحسابك.')
        setMode('login')
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password: password
        })
        if (signInErr) throw signInErr
        
        window.location.href = '/'
      }
    } catch (err: any) {
      let msg = err.message
      if (msg.includes('Invalid login credentials')) msg = 'خطأ في اسم المستخدم أو كلمة المرور'
      if (msg.includes('User already registered')) msg = 'هذا المستخدم مسجل مسبقاً'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', direction: 'rtl' }}>
      <div className="card" style={{ padding: '2rem', background: '#fffef7', border: '3px solid #000', boxShadow: '8px 8px 0 #000', borderRadius: '12px' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontWeight: 900 }}>
          {mode === 'login' ? '🔑 دخول الطلاب' : '✨ حساب جديد'}
        </h2>
        
        {error && (
          <div style={{ color: '#be123c', background: '#fff1f2', padding: '10px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #be123c' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 700 }}>اسم المستخدم</label>
          <input 
            type="text" 
            placeholder="مثال: أحمد محمد" 
            style={{ width: '100%', padding: '12px', border: '2px solid #000', borderRadius: '8px', outline: 'none' }}
            onChange={e => setUsername(e.target.value)} 
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 700 }}>كلمة المرور</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            style={{ width: '100%', padding: '12px', border: '2px solid #000', borderRadius: '8px', outline: 'none' }}
            onChange={e => setPassword(e.target.value)} 
          />
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={loading} 
          className="btn btn-blue" 
          style={{ width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'جاري التحميل...' : (mode === 'login' ? 'دخول' : 'إنشاء حساب')}
        </button>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
          <span 
            style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 800, textDecoration: 'underline' }}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'سجل هنا' : 'سجل دخولك'}
          </span>
        </p>
      </div>
    </div>
  )
}