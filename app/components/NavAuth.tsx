'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function NavAuth() {
  const [username, setUsername] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUsername(session.user.user_metadata?.username ?? 'طالب')
        setIsAdmin(session.user.user_metadata?.role === 'admin')
      }
    }
    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      setUsername(user?.user_metadata?.username ?? null)
      setIsAdmin(user?.user_metadata?.role === 'admin')
    })

    return () => listener.subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (!username) {
    return (
      <a href="/auth" style={{ background: '#2563eb', color: '#fff', padding: '0.4rem 1rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 700, fontSize: '.85rem', border: '2px solid #000' }}>
        🔑 دخول
      </a>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
      {isAdmin && (
        <a href="/admin" style={{ background: '#fb7185', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 700, fontSize: '.8rem', border: '2px solid #000' }}>
          👑 لوحة المدير
        </a>
      )}
      <div style={{ fontWeight: 800, background: '#f5f5f0', padding: '.4rem .8rem', borderRadius: '4px', border: '2px solid #0a0a0a', fontSize: '0.85rem' }}>
        👤 {username}
      </div>
      <button 
        onClick={handleLogout}
        style={{ background: '#be123c', color: '#fff', border: '2px solid #000', borderRadius: '4px', padding: '.4rem .8rem', cursor: 'pointer', fontWeight: 700, fontSize: '.8rem' }}
      >
        خروج
      </button>
    </div>
  )
}