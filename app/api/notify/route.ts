import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'y.newoten@gmail.com'
const RESEND_KEY  = process.env.RESEND_API_KEY // add to .env.local

export async function POST(req: NextRequest) {
  try {
    const { type, username } = await req.json()
    if (!username) return NextResponse.json({ ok: false })

    const isRegister = type === 'register'
    const subject    = isRegister
      ? `✨ مستخدم جديد سجّل في مدرستي: ${username}`
      : `🔑 دخول جديد في مدرستي: ${username}`
    const html = `
      <div dir="rtl" style="font-family:Cairo,sans-serif;max-width:480px;margin:auto;background:#fffef7;border:3px solid #0a0a0a;border-radius:4px;padding:2rem;box-shadow:6px 6px 0 #0a0a0a">
        <h2 style="color:#2563eb;font-size:1.5rem;margin-bottom:1rem">${isRegister ? '✨ تسجيل مستخدم جديد' : '🔑 تسجيل دخول'}</h2>
        <p style="color:#374151;font-size:1rem;line-height:1.8">
          اسم المستخدم: <strong>${username}</strong><br/>
          الوقت: <strong>${new Date().toLocaleString('ar-EG')}</strong><br/>
          النوع: <strong>${isRegister ? 'تسجيل جديد' : 'دخول'}</strong>
        </p>
        <hr style="border:1px solid #e5e7eb;margin:1rem 0"/>
        <p style="color:#9ca3af;font-size:.8rem">مدرستي — منصة تعلم المفردات العربية</p>
      </div>
    `

    // Using Resend (https://resend.com — free tier: 100 emails/day)
    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'مدرستي <onboarding@resend.dev>', to: ADMIN_EMAIL, subject, html }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Notify error:', e.message)
    return NextResponse.json({ ok: false })
  }
}
