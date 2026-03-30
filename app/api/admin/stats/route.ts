import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

export async function GET() {
  const supabase = createClient()
  try {
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: totalLessons },
      { count: totalVocab },
      { count: totalSessions },
      { data: userProfiles },
    ] = await Promise.all([
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase.from('vocabulary').select('*', { count: 'exact', head: true }),
      supabase.from('quiz_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('user_id, username, role, created_at').order('created_at', { ascending: false }).limit(20),
    ])

    const { count: todayLogins } = await supabase
      .from('study_streaks').select('*', { count: 'exact', head: true }).eq('study_date', today)

    const newToday = (userProfiles ?? []).filter(u =>
      u.created_at?.startsWith(today)
    ).length

    return NextResponse.json({
      totalLessons:  totalLessons ?? 0,
      totalVocab:    totalVocab   ?? 0,
      totalUsers:    userProfiles?.length ?? 0,
      totalSessions: totalSessions ?? 0,
      todayLogins:   todayLogins  ?? 0,
      newToday,
      recentUsers:   userProfiles ?? [],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
