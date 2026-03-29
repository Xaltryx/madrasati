import './globals.css'
import NavAuth from './components/NavAuth'
import Link from 'next/link'

export const metadata = { title: 'مدرستي v2' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <nav style={{
          background: '#fffef7', borderBottom: '3px solid #000',
          padding: '10px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', sticky: 'top', zIndex: 100
        }}>
          <Link href="/" style={{ fontWeight: 900, textDecoration: 'none', color: '#000', fontSize: '1.2rem' }}>
            📖 مدرستي
          </Link>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/quiz" className="nav-link">📝 الاختبار</Link>
            <Link href="/sm2" className="nav-link">🔁 المراجعة</Link>
            <Link href="/manage" className="nav-link">⚙️ الإدارة</Link>
          </div>

          <NavAuth />
        </nav>
        <main style={{ padding: '20px' }}>{children}</main>
      </body>
    </html>
  )
}