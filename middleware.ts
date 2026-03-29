import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // 1. التأكد من تسجيل الدخول للصفحات المحمية
  const protectedPaths = ['/quiz', '/sm2', '/manage', '/analytics', '/admin', '/leaderboard']
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // 2. الحماية الصارمة لصفحات الإدارة (للمدير فقط)
  const adminPaths = ['/manage', '/admin']
  const isAdminPath = adminPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (session && isAdminPath) {
    const role = session.user.user_metadata?.role
    // إذا لم يكن المدير، اطرده للصفحة الرئيسية
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons).*)'],
}