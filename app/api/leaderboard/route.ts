import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

const AVATAR_COLORS = ['#dbeafe', '#fde047', '#86efac', '#fce7f3', '#e0e7ff', '#ffedd5']

export async function GET(req: NextRequest) {
  const supabase = createClient()
  try {
    const { data: progressData, error } = await supabase
      .from('word_progress')
      .select('user_id, times_correct, times_incorrect')
    if (error) throw error

    const userMap: Record<number, { correct: number; total: number }> = {}
    for (const row of progressData ?? []) {
      if (!userMap[row.user_id]) userMap[row.user_id] = { correct: 0, total: 0 }
      userMap[row.user_id].correct += row.times_correct ?? 0
      userMap[row.user_id].total   += (row.times_correct ?? 0) + (row.times_incorrect ?? 0)
    }

    const { data: streakData } = await supabase.from('study_streaks').select('user_id, study_date')
    const streakMap: Record<number, number> = {}
    for (const row of streakData ?? []) {
      streakMap[row.user_id] = (streakMap[row.user_id] ?? 0) + 1
    }

    let profiles: any[] = []
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, username, avatar_color')
      profiles = data ?? []
    } catch (_) {}

    const profileMap: Record<number, { username: string; avatar_color: string }> = {}
    for (const p of profiles) {
      profileMap[p.user_id] = { username: p.username, avatar_color: p.avatar_color }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const leaders = Object.entries(userMap)
      .map(([uid, data], i) => {
        const userId  = Number(uid)
        const profile = profileMap[userId]
        const streak  = streakMap[userId] ?? 0
        const xp      = data.correct * 10 + streak * 5
        return {
          username:     profile?.username     ?? `طالب_${userId}`,
          avatar_color: profile?.avatar_color ?? AVATAR_COLORS[i % AVATAR_COLORS.length],
          xp,
          correct:      data.correct,
          streak,
        }
      })
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 20)

    let myRank: number | null = null
    if (user) {
      const { data: myProfile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      if (myProfile?.username) {
        const idx = leaders.findIndex(l => l.username === myProfile.username)
        myRank = idx >= 0 ? idx + 1 : null
      }
    }

    return NextResponse.json({ leaders, myRank })
  } catch (e: any) {
    return NextResponse.json({ leaders: [], myRank: null })
  }
}
